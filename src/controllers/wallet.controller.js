const { default: axios } = require('axios');
const { Withdrawal, Wallet, Transaction } = require('../models');
const { flw } = require('../utils/flutterwave');

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
          payment_method: payment_method || "unknown",
          tx_ref: tx_ref || "unknown",
          currency: currency || "NGN",
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

      // Ensure amount and transaction_fee are numbers
      const withdrawalAmount = Number(amount);
      const fee = Number(transaction_fee) || 0;
      const currentBalance = Number(wallet.balance);

      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: 'Withdrawal amount must be a positive number' });
      }
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ message: 'Transaction fee must be a non-negative number' });
      }
      if (currentBalance < (withdrawalAmount + fee)) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }

      // Prepare payout data for Flutterwave
      const payoutData = {
        account_bank,
        account_number,
        amount: withdrawalAmount,
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
      if (!fwData || fwData.status !== 'success' || !fwData.data) {
        return res.status(500).json({
          success: false,
          error: fwData?.message || 'Payout failed',
          err: fwData
        });
      }

      // Deduct from wallet and record withdrawal if payout is successful
      // Use toFixed to avoid floating point issues, but store as string for DB decimal
      const newBalance = (currentBalance - (withdrawalAmount + fee)).toFixed(2);
      wallet.balance = newBalance;
      await wallet.save();

      // Use the transfer id and status from Flutterwave for record
      // Normalize transferData to match the expected structure from Flutterwave
      const transferData = fwData.data || {};
      await Withdrawal.create({
        userId: req.user.id,
        amount: withdrawalAmount,
        currency: wallet.currency || 'NGN',
        status: transferData.status == "success" ? "completed" : 'pending',
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
        amount: withdrawalAmount,
        status: transferData.status == "success" ? "completed" : 'pending',
        description: narration || 'Wallet withdrawal',
        reference: transferData.reference || reference,
        transaction_fee: fee,
        metadata: {
          flutterwaveTransferId: transferData.id || null,
          bank_name: transferData.bank_name || null,
          account_number: transferData.account_number || null,
          currency: wallet.currency || 'NGN'
        },
        userId: req.user.id
      });

      return res.json({
        success: true,
        message: fwData.data.message || 'Transfer Queued Successfully',
        data: transferData
      });

    } catch (error) {
      console.error('Payout error:', error.response?.data || error.message);
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Payout failed',
        errorbody:error.response?.data
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

  // Legacy webhook handler - now redirects to new webhook system
  async payoutWebhook(req, res) {
    console.log('Legacy webhook endpoint called. Please use /api/webhooks/flutterwave instead.');
    res.status(410).json({ 
      error: 'This endpoint is deprecated. Please use /api/webhooks/flutterwave instead.',
      newEndpoint: '/api/webhooks/flutterwave'
    });
  },

  // Get all withdrawals for the authenticated user
  async getWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const withdrawals = await Withdrawal.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      return res.json({ success: true, withdrawals });
    } catch (error) {
      console.error('Get withdrawals error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch withdrawals' });
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

      return res.json({ success: true, transactions });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
  },

  async validateTransactionFlutterwave(req, res){
    const {transactionId} = req.body;
    try{
      const transactionInfo = await Withdrawal.findOne({ where: { id: transactionId } });
      if (!transactionInfo) {
        return res.status(404).json({ success: false, error: "Withdrawals not found." });
      }
      const payload = {
        id: transactionInfo.flutterwaveTransferId
      };

      // Fetch transfer status from Flutterwave
      const response = await flw.Transfer.get_a_transfer(payload);

      // Check if response is valid and contains data
      if (
        !response ||
        response.status !== "success" ||
        !response.data ||
        !response.data.status
      ) {
        return res.status(500).json({
          success: false,
          error: response?.message || "Failed to fetch transfer status",
          data: response
        });
      }

      // Map Flutterwave status to our status
      let newStatus;
      switch (response.data.status.toLowerCase()) {
        case "success":
        case "completed":
          newStatus = "completed";
          break;
        case "failed":
        case "reversed":
          newStatus = "failed";
          break;
        case "pending":
        default:
          newStatus = "pending";
      }

      // Update Withdrawal status
      await Withdrawal.update(
        { status: newStatus, adminSynced:true },
        { where: { id: transactionId } }
      );

      // Update Transaction status where reference matches withdrawal reference
      await Transaction.update(
        { status: newStatus },
        { where: { reference: transactionInfo.reference } }
      );

      return res.json({ success: true, data: {
        message: "Transaction completed successfully"
      } });

    }catch (error){
      console.error('Get transactions error:', error);
      return res.status(500).json({ success: false, error: 'Failed to process validation' });
    }
  }
};
