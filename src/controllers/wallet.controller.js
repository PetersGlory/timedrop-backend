const { default: axios } = require('axios');
const { Withdrawal, Wallet } = require('../models');

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
    const { amount } = req.body;
    try {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Deposit amount must be a positive number' });
      }
      wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
      await wallet.save();
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
        reference,
        callback_url,
        debit_currency = 'NGN'
      } = req.body;

      // Validate required fields
      if (!account_bank || !account_number || !amount || !reference) {
        return res.status(400).json({
          error: 'Missing required fields: account_bank, account_number, amount, reference'
        });
      }

      // Check wallet and balance
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      const currentBalance = parseFloat(wallet.balance);
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Withdrawal amount must be a positive number' });
      }
      if (currentBalance < amount) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }

      // Prepare payout data for Flutterwave
      const payoutData = {
        account_bank,
        account_number,
        amount,
        narration: narration || 'Payout from your app',
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

      // Deduct from wallet and record withdrawal if payout is successful
      wallet.balance = currentBalance - parseFloat(amount);
      await wallet.save();

      await Withdrawal.create({
        userId: req.user.id,
        amount: parseFloat(amount),
        currency: wallet.currency || 'NGN',
        status: 'pending',
        processedAt: new Date(),
        reason: narration || null,
        reference: reference
      });

      res.json({
        success: true,
        data: response.data
      });

    } catch (error) {
      console.error('Payout error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || 'Payout failed'
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
};
