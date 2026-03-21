const { Agent } = require('../models');
const ReferralTracking = require('../models/referral-tracking');
const { Op } = require('sequelize');

// Helper function to generate unique referral code
function generateReferralCode(email) {
  const emailPrefix = email.split('@')[0].substring(0, 4).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${emailPrefix}${randomSuffix}`;
}

// Helper function to check if referral code is unique
async function ensureUniqueReferralCode(email) {
  let referralCode = generateReferralCode(email);
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await Agent.findOne({ where: { referralCode } });
    if (!existing) {
      return referralCode;
    }
    referralCode = generateReferralCode(email);
    attempts++;
  }

  // Fallback: use UUID-based code if collision persists
  return `AGT${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
}

// Bank account fields that are required together
const BANK_FIELDS = ['accountNumber', 'accountName', 'bankName'];

module.exports = {
  // Register a new agent
  async register(req, res) {
    try {
      const { name, phone, email, accountNumber, accountName, bankName } = req.body;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({ message: 'Invalid phone number format' });
        }
      }

      // If any bank field is provided, all three must be present
      const providedBankFields = BANK_FIELDS.filter(f => req.body[f]);
      if (providedBankFields.length > 0 && providedBankFields.length < BANK_FIELDS.length) {
        const missing = BANK_FIELDS.filter(f => !req.body[f]);
        return res.status(400).json({
          message: `Incomplete bank details. Missing: ${missing.join(', ')}`
        });
      }

      // Validate account number format (digits only, 6–20 chars)
      if (accountNumber) {
        const accountNumberRegex = /^\d{6,20}$/;
        if (!accountNumberRegex.test(accountNumber)) {
          return res.status(400).json({
            message: 'Account number must be 6–20 digits with no spaces or special characters'
          });
        }
      }

      // Check if email already exists
      const existingAgent = await Agent.findOne({ where: { email } });
      if (existingAgent) {
        return res.status(409).json({
          message: 'Email already registered as agent',
          referralCode: existingAgent.referralCode
        });
      }

      // Generate unique referral code
      const referralCode = await ensureUniqueReferralCode(email);

      // Create agent
      const agent = await Agent.create({
        name,
        phone,
        email,
        referralCode,
        accountNumber: accountNumber || null,
        accountName: accountName || null,
        bankName: bankName || null,
        totalReferrals: 0,
        totalReferralVolume: 0,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Agent registered successfully',
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          referralCode: agent.referralCode,
          bankDetails: agent.accountNumber
            ? {
                accountNumber: agent.accountNumber,
                accountName: agent.accountName,
                bankName: agent.bankName
              }
            : null,
          createdAt: agent.createdAt
        }
      });
    } catch (error) {
      console.error('Agent registration error:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Get agent details by email or referral code
  async getAgent(req, res) {
    try {
      const { email, referralCode } = req.query;

      if (!email && !referralCode) {
        return res.status(400).json({
          message: 'Email or referral code required'
        });
      }

      const whereClause = email ? { email } : { referralCode };

      const agent = await Agent.findOne({
        where: whereClause,
        attributes: [
          'id', 'name', 'email', 'referralCode',
          'accountNumber', 'accountName', 'bankName',
          'totalReferrals', 'totalReferralVolume', 'isActive', 'createdAt'
        ]
      });

      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      return res.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          referralCode: agent.referralCode,
          bankDetails: agent.accountNumber
            ? {
                accountNumber: agent.accountNumber,
                accountName: agent.accountName,
                bankName: agent.bankName
              }
            : null,
          totalReferrals: agent.totalReferrals,
          totalReferralVolume: agent.totalReferralVolume,
          isActive: agent.isActive,
          createdAt: agent.createdAt
        }
      });
    } catch (error) {
      console.error('Agent fetch error:', error);
      return res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Get all agents (admin only)
  async getAllAgents(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: agents } = await Agent.findAndCountAll({
        attributes: [
          'id', 'name', 'email', 'referralCode',
          'accountNumber', 'accountName', 'bankName',
          'totalReferrals', 'totalReferralVolume', 'isActive', 'createdAt'
        ],
        order: [['totalReferralVolume', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        agents: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          email: agent.email,
          referralCode: agent.referralCode,
          bankDetails: agent.accountNumber
            ? {
                accountNumber: agent.accountNumber,
                accountName: agent.accountName,
                bankName: agent.bankName
              }
            : null,
          totalReferrals: agent.totalReferrals,
          totalReferralVolume: agent.totalReferralVolume,
          isActive: agent.isActive,
          createdAt: agent.createdAt
        })),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get all agents error:', error);
      return res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Update agent status (admin only)
  async updateAgentStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const agent = await Agent.findByPk(id);
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      agent.isActive = isActive;
      await agent.save();

      return res.json({
        success: true,
        message: 'Agent status updated',
        agent: {
          id: agent.id,
          email: agent.email,
          isActive: agent.isActive
        }
      });
    } catch (error) {
      console.error('Update agent status error:', error);
      return res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  },

  // Update agent bank details
  async updateBankDetails(req, res) {
    try {
      const { id } = req.params;
      const { accountNumber, accountName, bankName } = req.body;

      // All three bank fields must be provided together
      if (!accountNumber || !accountName || !bankName) {
        return res.status(400).json({
          message: 'accountNumber, accountName, and bankName are all required'
        });
      }

      const accountNumberRegex = /^\d{6,20}$/;
      if (!accountNumberRegex.test(accountNumber)) {
        return res.status(400).json({
          message: 'Account number must be 6–20 digits with no spaces or special characters'
        });
      }

      const agent = await Agent.findByPk(id);
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      agent.accountNumber = accountNumber;
      agent.accountName = accountName;
      agent.bankName = bankName;
      await agent.save();

      return res.json({
        success: true,
        message: 'Bank details updated',
        agent: {
          id: agent.id,
          email: agent.email,
          bankDetails: {
            accountNumber: agent.accountNumber,
            accountName: agent.accountName,
            bankName: agent.bankName
          }
        }
      });
    } catch (error) {
      console.error('Update bank details error:', error);
      return res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  }
};