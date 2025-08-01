const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Wallet } = require('../models');

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = {
  // Register a new user
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, phone, gender } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      const user = await User.create({ email, password, firstName, lastName, phone, gender });
      const token = generateToken(user);
      // Create wallet for the user based on wallet.js model
      await Wallet.create({
        userId: user.id,
        balance: 0,
        currency: 'NGN'
      });
      res.status(201).json({ user, token });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },

  // Login a user
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
      }
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = generateToken(user);
      res.json({ user, token });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get the current authenticated user
  async getCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Email verification (not implemented)
  async verifyEmail(req, res) {
    res.status(501).json({ message: 'verifyEmail not implemented' });
  },

  // Forgot password (not implemented)
  async forgotPassword(req, res) {
    res.status(501).json({ message: 'forgotPassword not implemented' });
  },

  // Reset password (not implemented)
  async resetPassword(req, res) {
    res.status(501).json({ message: 'resetPassword not implemented' });
  },

  // Verify reset email (not implemented)
  async verifyResetEmail(req, res) {
    res.status(501).json({ message: 'verifyResetEmail not implemented' });
  }
}; 