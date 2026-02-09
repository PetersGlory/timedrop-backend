
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Agent, ReferralTracking, User } = require('../models');

module.exports = {
  // Track a new referral usage
  async trackReferral(req, res) {
    try {
      const { referralCode, marketId, orderAmount, orderId, orderType } = req.body;

      // Validate required fields
      if (!referralCode || !marketId) {
        return res.status(400).json({ 
          message: 'Referral code and market ID are required' 
        });
      }

      // Get user ID from authenticated request
      const userId = req.user.id;

      // Find the agent by referral code
      const agent = await Agent.findOne({ 
        where: { referralCode, isActive: true } 
      });

      if (!agent) {
        return res.status(404).json({ 
          message: 'Invalid or inactive referral code' 
        });
      }

      // Check if this exact referral has already been tracked (prevent duplicates)
      if (orderId) {
        const existingTracking = await ReferralTracking.findOne({
          where: { orderId }
        });

        if (existingTracking) {
          return res.status(200).json({
            success: true,
            message: 'Referral already tracked',
            alreadyTracked: true
          });
        }
      }

      // Create referral tracking record
      const tracking = await ReferralTracking.create({
        referralCode,
        agentId: agent.id,
        userId,
        marketId,
        orderId: orderId || null,
        orderAmount: orderAmount || 0,
        orderType: orderType || null
      });

      // Update agent statistics
      agent.totalReferrals = agent.totalReferrals + 1;
      agent.totalReferralVolume = parseFloat(agent.totalReferralVolume) + parseFloat(orderAmount || 0);
      await agent.save();

      res.status(201).json({
        success: true,
        message: 'Referral tracked successfully',
        tracking: {
          id: tracking.id,
          referralCode: tracking.referralCode,
          marketId: tracking.marketId,
          orderAmount: tracking.orderAmount,
          createdAt: tracking.createdAt
        }
      });
    } catch (error) {
      console.error('Referral tracking error:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  },

  // Get referral statistics for an agent
  async getReferralStats(req, res) {
    try {
      const { referralCode } = req.query;

      if (!referralCode) {
        return res.status(400).json({ 
          message: 'Referral code required' 
        });
      }

      // Find agent
      const agent = await Agent.findOne({ 
        where: { referralCode },
        attributes: ['id', 'name', 'email', 'referralCode', 'totalReferrals', 'totalReferralVolume', 'createdAt']
      });

      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      // Get recent referrals (last 100)
      const recentReferrals = await ReferralTracking.findAll({
        where: { agentId: agent.id },
        order: [['createdAt', 'DESC']],
        limit: 100,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Get statistics by date range (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentStats = await ReferralTracking.findOne({
        where: {
          agentId: agent.id,
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('orderAmount')), 'totalVolume']
        ],
        raw: true
      });

      res.json({
        success: true,
        agent: {
          name: agent.name,
          email: agent.email,
          referralCode: agent.referralCode,
          memberSince: agent.createdAt
        },
        stats: {
          totalReferrals: agent.totalReferrals,
          totalVolume: parseFloat(agent.totalReferralVolume),
          last30Days: {
            referrals: parseInt(recentStats.count) || 0,
            volume: parseFloat(recentStats.totalVolume) || 0
          }
        },
        recentReferrals: recentReferrals.map(ref => ({
          id: ref.id,
          userId: ref.userId,
          userName: ref.user ? `${ref.user.firstName} ${ref.user.lastName}` : 'Unknown',
          marketId: ref.marketId,
          orderAmount: parseFloat(ref.orderAmount),
          orderType: ref.orderType,
          createdAt: ref.createdAt
        }))
      });
    } catch (error) {
      console.error('Get referral stats error:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  },

  // Get user's referral usage history (optional - for users to see which codes they've used)
  async getUserReferralHistory(req, res) {
    try {
      const userId = req.user.id;

      const referrals = await ReferralTracking.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Agent,
            as: 'agent',
            attributes: ['name', 'referralCode']
          }
        ]
      });

      res.json({
        success: true,
        referrals: referrals.map(ref => ({
          id: ref.id,
          agentName: ref.agent ? ref.agent.name : 'Unknown',
          referralCode: ref.referralCode,
          marketId: ref.marketId,
          orderAmount: parseFloat(ref.orderAmount),
          orderType: ref.orderType,
          createdAt: ref.createdAt
        }))
      });
    } catch (error) {
      console.error('Get user referral history error:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  },

  // Validate referral code (check if it exists and is active)
  async validateReferralCode(req, res) {
    try {
      const { referralCode } = req.query;

      if (!referralCode) {
        return res.status(400).json({ 
          message: 'Referral code required' 
        });
      }

      const agent = await Agent.findOne({ 
        where: { referralCode, isActive: true },
        attributes: ['id', 'name', 'referralCode']
      });

      if (!agent) {
        return res.status(404).json({ 
          message: 'Invalid or inactive referral code',
          valid: false
        });
      }

      res.json({
        success: true,
        valid: true,
        agent: {
          name: agent.name,
          referralCode: agent.referralCode
        }
      });
    } catch (error) {
      console.error('Validate referral code error:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  }
};