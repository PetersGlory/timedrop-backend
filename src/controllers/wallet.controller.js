const Wallet = require('../models/wallet');

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
  }
};
