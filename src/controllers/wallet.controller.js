const { default: axios } = require('axios');
const { Withdrawal, Wallet, Transaction } = require('../models');

// Flutterwave configuration
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

module.exports = {
  // Get the wallet for the authenticated user
  async getWallet(req, res) {
    let wallet;
    try {
      wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        wallet = await Wallet.create({
            userId: req.user.id,
            balance: 0,
            currency: 'NGN'
        });
      }
      res.json({ wallet });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a wallet for the authenticated user
  async createWallet(req, res) {
    try {
      // Check if wallet already exists
      const existing = await Wallet.findOne({ where: { userId: req.user.id } });
      if (existing) {
        return res.status(400).json({ message: 'Wallet already exists' });
      }
      const { currency, balance } = req.body;
      const wallet = await Wallet.create({
        userId: req.user.id,
        currency: currency || 'NGN',
        balance: balance || 0
      });
      res.status(201).json({ wallet });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update wallet balance (e.g., deposit or withdraw)
  async updateWallet(req, res) {
    try {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      const { amount } = req.body;
      if (typeof amount !== 'number') {
        return res.status(400).json({ message: 'Amount must be a number' });
      }
      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
      if (newBalance < 0) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }
      wallet.balance = newBalance;
      await wallet.save();
      res.json({ wallet });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Deposit funds into the authenticated user's wallet
  async deposit(req, res) {
    // Expecting the frontend to send the following structure:
    // {
    //   amount: (numericAmount - updatedAmount),
    //   narration: 'Wallet deposit via Flutterwave',
    //   currency: 'NGN',
    //   reference: response.transaction_id,
    //   payment_method: response.meta.payment_method,
    //   tx_ref: response.tx_ref,
    //   status: response.status,
    // }
    const {
      amount,
      narration,
      currency = 'NGN',
      reference,
      payment_method,
      tx_ref,
      status
    } = req.body;

    try {
      // Validate amount
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Deposit amount must be a positive number' });
      }

      // Find wallet
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      // Update wallet balance
      wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
      await wallet.save();

      // Create a transaction record
      await Transaction.create({
        type: 'deposit',
        amount,
        status: status || 'completed',
        description: narration || 'Wallet deposit',
        reference: reference || tx_ref,
        metadata: {
          payment_method,
          tx_ref,
          currency,
        },
        userId: req.user.id
      });

      res.json({ wallet });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Withdraw funds from the authenticated user's wallet
  async withdraw(req, res) {
    try {
      const {
        account_bank,
        account_number,
        amount,
        narration,
        currency = 'NGN',
        callback_url,
        transaction_fee,
        debit_currency = 'NGN'
      } = req.body;

      // Validate required fields
      if (!account_bank || !account_number || !amount) {
        return res.status(400).json({
          error: 'Missing required fields: account_bank, account_number, amount'
        });
      }

      // Generate a unique reference for the withdrawal (e.g., using timestamp and user id)
      const reference = `TD-${req.user.id}-${Date.now()}-WD`;

      // Check wallet and balance
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      const currentBalance = parseFloat(wallet.balance);
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Withdrawal amount must be a positive number' });
      }
      if (currentBalance < (parseFloat(amount) + parseFloat(transaction_fee))) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }

      // Prepare payout data for Flutterwave
      const payoutData = {
        account_bank,
        account_number,
        amount,
        narration: narration || 'Wallet withdrawal',
        currency,
        reference,
        callback_url,
        debit_currency
      };

      // Initiate payout via Flutterwave
      const response = await axios.post(
        `${FLUTTERWAVE_BASE_URL}/transfers`,
        payoutData,
        {
          headers: {
            'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check Flutterwave response for success and status
      const fwData = response.data;
      if (!fwData || !fwData.success || !fwData.data || fwData.data.status !== 'success') {
        return res.status(500).json({
          success: false,
          error: fwData?.data?.message || fwData?.message || 'Payout failed',
          err:fwData
        });
      }

      // Deduct from wallet and record withdrawal if payout is successful
      wallet.balance = currentBalance - (parseFloat(amount) + parseFloat(transaction_fee));
      await wallet.save();

      // Use the transfer id and status from Flutterwave for record
      // Normalize transferData to match the expected structure from Flutterwave
      const transferData = fwData.data || {};
      await Withdrawal.create({
        userId: req.user.id,
        amount: parseFloat(amount),
        currency: wallet.currency || 'NGN',
        status: transferData.status || 'pending',
        processedAt: new Date(),
        reason: narration || null,
        reference: transferData.reference || reference,
        flutterwaveTransferId: transferData.id || null,
        bank_name: transferData.bank_name || null,
        account_number: transferData.account_number || null
      });

      // Add transaction section after withdrawal is created
      await Transaction.create({
        type: 'withdrawal',
        amount: parseFloat(amount),
        status: transferData.status || 'pending',
        description: narration || 'Wallet withdrawal',
        reference: transferData.reference || reference,
        transaction_fee: transaction_fee,
        metadata: {
          flutterwaveTransferId: transferData.id || null,
          bank_name: transferData.bank_name || null,
          account_number: transferData.account_number || null,
          currency: wallet.currency || 'NGN'
        },
        userId: req.user.id
      });

      res.json({
        success: true,
        message: fwData.data.message || 'Transfer Queued Successfully',
        data: transferData
      });

    } catch (error) {
      console.error('Payout error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Payout failed'
      });
    }
  },

  // getting all banks from flutterwave
  async getAllBanks(req, res){
    try{
      const userId = req.user.id;
      if(!userId){
        return res.status(404).json({ message: 'user not found' });
      }
      const { country } = req.params; // e.g., 'NG' for Nigeria

      const response = await axios.get(
        `${FLUTTERWAVE_BASE_URL}/banks/${country}`,
        {
          headers: {
            'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
          }
        }
      );

      res.json({
        success: true,
        data: response.data
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Verify bank account details using Paystack (not Flutterwave)
  async verifyBankAccount(req, res) {
    try {
      const { account_number, account_bank } = req.body;

      if (!account_number || !account_bank) {
        return res.status(400).json({
          error: 'account_number and account_bank are required'
        });
      }

      // Flutterwave account resolve endpoint expects params as query string
      const response = await axios.post(
        `${FLUTTERWAVE_BASE_URL}/accounts/resolve`,
        {
          account_number,
          account_bank
        },
        {
          headers: {
            'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
          }
        }
      );

      res.json({
        success: true,
        data: response.data
      });

    } catch (error) {
      console.error('Account verification error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || 'Account verification failed'
      });
    }
  },

  // Webhook handler for payout notifications
  async payoutWebhook(req, res) {
    try {
      const hash = req.headers['verif-hash'];

      if (!hash) {
        return res.status(401).json({ error: 'No hash provided' });
      }

      const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
      if (hash !== secretHash) {
        return res.status(401).json({ error: 'Invalid hash' });
      }

      const payload = req.body;

      // Handle the webhook payload
      console.log('Payout webhook received:', payload);

      // TODO: Process the payout status update here
      // For example: update your database, send notifications, etc.

      res.status(200).json({ status: 'success' });

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  // Get all withdrawals for the authenticated user
  async getWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const withdrawals = await Withdrawal.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, withdrawals });
    } catch (error) {
      console.error('Get withdrawals error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch withdrawals' });
    }
  },

  // Get all transactions for the authenticated user
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;

      // Fetch all transactions for this userId
      const transactions = await Transaction.findAll({
        where: { userId },
        order: [['created_at', 'DESC']]
      });

      res.json({ success: true, transactions });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
  },
};
