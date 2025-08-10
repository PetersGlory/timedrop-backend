const User = require('../models/user');
const Market = require('../models/market');
const Order = require('../models/order');
const Portfolio = require('../models/portfolio');
const Settings = require('../models/settings');
const Bookmark = require('../models/bookmark');
const { Withdrawal, Transaction } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  // Users
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async getUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async createUser(req, res) {
    try {
      const user = await User.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async updateUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.update(req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async deleteUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Markets
  async getAllMarkets(req, res) {
    try {
      const markets = await Market.findAll();
      res.json({ markets });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async getMarket(req, res) {
    try {
      const market = await Market.findByPk(req.params.id);
      if (!market) return res.status(404).json({ message: 'Market not found' });
      res.json({ market });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async createMarket(req, res) {
    try {
      const market = await Market.create(req.body);
      res.status(201).json({ market });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async updateMarket(req, res) {
    try {
      const market = await Market.findByPk(req.params.id);
      if (!market) return res.status(404).json({ message: 'Market not found' });
      await market.update(req.body);
      res.json({ market });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async deleteMarket(req, res) {
    try {
      const market = await Market.findByPk(req.params.id);
      if (!market) return res.status(404).json({ message: 'Market not found' });
      await market.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Orders
  async getAllOrders(req, res) {
    try {
      const orders = await Order.findAll();
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async getOrder(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json({ order });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async createOrder(req, res) {
    try {
      const order = await Order.create(req.body);
      res.status(201).json({ order });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async updateOrder(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      await order.update(req.body);
      res.json({ order });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async deleteOrder(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      await order.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Portfolios
  async getAllPortfolios(req, res) {
    try {
      const portfolios = await Portfolio.findAll();
      res.json({ portfolios });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async getPortfolio(req, res) {
    try {
      const portfolio = await Portfolio.findByPk(req.params.id);
      if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
      res.json({ portfolio });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async createPortfolio(req, res) {
    try {
      const portfolio = await Portfolio.create(req.body);
      res.status(201).json({ portfolio });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async updatePortfolio(req, res) {
    try {
      const portfolio = await Portfolio.findByPk(req.params.id);
      if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
      await portfolio.update(req.body);
      res.json({ portfolio });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async deletePortfolio(req, res) {
    try {
      const portfolio = await Portfolio.findByPk(req.params.id);
      if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
      await portfolio.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Settings
  async getAllSettings(req, res) {
    try {
      const settings = await Settings.findAll();
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async getSetting(req, res) {
    try {
      const setting = await Settings.findByPk(req.params.id);
      if (!setting) return res.status(404).json({ message: 'Settings object not found' });
      res.json({ setting });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async createSetting(req, res) {
    try {
      const setting = await Settings.create(req.body);
      res.status(201).json({ setting });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async updateSetting(req, res) {
    try {
      const setting = await Settings.findByPk(req.params.id);
      if (!setting) return res.status(404).json({ message: 'Settings object not found' });
      await setting.update(req.body);
      res.json({ setting });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async deleteSetting(req, res) {
    try {
      const setting = await Settings.findByPk(req.params.id);
      if (!setting) return res.status(404).json({ message: 'Settings object not found' });
      await setting.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Bookmarks
  async getAllBookmarks(req, res) {
    try {
      const bookmarks = await Bookmark.findAll();
      res.json({ bookmarks });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async getBookmark(req, res) {
    try {
      const bookmark = await Bookmark.findByPk(req.params.id);
      if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
      res.json({ bookmark });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async createBookmark(req, res) {
    try {
      const bookmark = await Bookmark.create(req.body);
      res.status(201).json({ bookmark });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async updateBookmark(req, res) {
    try {
      const bookmark = await Bookmark.findByPk(req.params.id);
      if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
      await bookmark.update(req.body);
      res.json({ bookmark });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async deleteBookmark(req, res) {
    try {
      const bookmark = await Bookmark.findByPk(req.params.id);
      if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
      await bookmark.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // activity section
  async getRecentActivities(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt'], // Include relevant user attributes
      });
      const markets = await Market.findAll({
        attributes: ['id', 'question', 'createdAt', 'updatedAt'], // Include relevant market attributes
      });
      const orders = await Order.findAll({
        attributes: ['id', 'type', 'quantity', 'price', 'createdAt', 'updatedAt'], // Include relevant order attributes
      });
      const portfolios = await Portfolio.findAll({
        attributes: ['id', 'createdAt', 'updatedAt'],
      });
      const settings = await Settings.findAll({
        attributes: ['id', 'createdAt', 'updatedAt'],
      });
      const bookmarks = await Bookmark.findAll({
        attributes: ['id', 'createdAt', 'updatedAt'],
      });

      const activities = [];

      // User activities (Login/Logout - need to be implemented in auth controller)
      users.forEach(user => {
        if (user.createdAt) {
          activities.push({
            type: 'User Created',
            description: `User ${user.firstName} ${user.lastName} was created`,
            timestamp: user.createdAt,
            userId: user.id,
            data: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            }
          });
        }
        if (user.updatedAt && user.createdAt.getTime() !== user.updatedAt.getTime()) {
           activities.push({
              type: 'User Updated',
              description: `User ${user.firstName} ${user.lastName} was updated`,
              timestamp: user.updatedAt,
              userId: user.id,
              data: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
              }
            });
        }

      });

      // Market activities
      markets.forEach(market => {
        if (market.createdAt) {
          activities.push({
            type: 'Market Created',
            description: `Market ${market.question} was created`,
            timestamp: market.createdAt,
            marketId: market.id,
            data: { question: market.question }
          });
        }
        if (market.updatedAt && market.createdAt.getTime() !== market.updatedAt.getTime()) {
           activities.push({
              type: 'Market Updated',
              description: `Market ${market.question} was updated`,
              timestamp: market.updatedAt,
              marketId: market.id,
              data: { question: market.question }
            });
        }
      });

      // Order activities
      orders.forEach(order => {
        if (order.createdAt) {
          activities.push({
            type: 'Order Created',
            description: `Order ${order.type} for ${order.quantity} shares was created`,
            timestamp: order.createdAt,
            orderId: order.id,
            data: {
              type: order.type,
              quantity: order.quantity,
              price: order.price,
            },
          });
        }
         if (order.updatedAt && order.createdAt.getTime() !== order.updatedAt.getTime()) {
          activities.push({
            type: 'Order Updated',
            description: `Order ${order.type} for ${order.quantity} shares was updated`,
            timestamp: order.updatedAt,
            orderId: order.id,
            data: {
              type: order.type,
              quantity: order.quantity,
              price: order.price,
            },
          });
        }
      });

      // Portfolio activities
      portfolios.forEach(portfolio => {
        if (portfolio.createdAt) {
          activities.push({
            type: 'Portfolio Created',
            description: `Portfolio was created`,
            timestamp: portfolio.createdAt,
            portfolioId: portfolio.id,
          });
        }
         if (portfolio.updatedAt && portfolio.createdAt.getTime() !== portfolio.updatedAt.getTime()) {
           activities.push({
              type: 'Portfolio Updated',
              description: `Portfolio was updated`,
              timestamp: portfolio.updatedAt,
              portfolioId: portfolio.id,
            });
        }
      });

      // Settings activities
      settings.forEach(setting => {
        if (setting.createdAt) {
          activities.push({
            type: 'Setting Created',
            description: `Setting was created`,
            timestamp: setting.createdAt,
            settingId: setting.id,
          });
        }
        if (setting.updatedAt && setting.createdAt.getTime() !== setting.updatedAt.getTime()) {
           activities.push({
              type: 'Setting Updated',
              description: `Setting was updated`,
              timestamp: setting.updatedAt,
              settingId: setting.id,
            });
        }
      });

      // Bookmark activities
      bookmarks.forEach(bookmark => {
        if (bookmark.createdAt) {
          activities.push({
            type: 'Bookmark Created',
            description: `Bookmark was created`,
            timestamp: bookmark.createdAt,
            bookmarkId: bookmark.id,
          });
        }
        if (bookmark.updatedAt && bookmark.createdAt.getTime() !== bookmark.updatedAt.getTime()) {
           activities.push({
              type: 'Bookmark Updated',
              description: `Bookmark was updated`,
              timestamp: bookmark.updatedAt,
              bookmarkId: bookmark.id,
            });
        }
      });


      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp - a.timestamp);

      res.json({ activities });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get all withdrawal requests (optionally filter by status)
  async getAllWithdrawals(req, res) {
    try {
      const { status } = req.query;
      const where = {};
      if (status) {
        where.status = status;
      }
      const withdrawals = await Withdrawal.findAll({ where, order: [['createdAt', 'DESC']] });
      res.json({ withdrawals });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get a single withdrawal request by ID
  async getWithdrawal(req, res) {
    try {
      const withdrawal = await Withdrawal.findByPk(req.params.id);
      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }

      // Manually fetch the user since association is not set up
      let user = null;
      if (withdrawal.userId) {
        user = await User.findByPk(withdrawal.userId, {
          attributes: ['id', 'firstName', 'lastName', 'email']
        });
      }

      res.json({ 
        withdrawal: {
          ...withdrawal.toJSON(),
          user: user ? user.toJSON() : null
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update a withdrawal request (e.g., approve, reject, mark as completed/failed)
  async updateWithdrawal(req, res) {
    try {
      const withdrawal = await Withdrawal.findByPk(req.params.id);
      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }

      // Only allow updating status, processedAt, and reason
      const allowedFields = ['status', 'processedAt', 'reason'];
      const updates = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // If status is being updated to 'approved', 'rejected', 'completed', or 'failed', set processedAt if not provided
      if (
        updates.status &&
        ['approved', 'rejected', 'completed', 'failed'].includes(updates.status) &&
        !updates.processedAt
      ) {
        updates.processedAt = new Date();
      }

      await withdrawal.update(updates);

      res.json({ withdrawal });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },

  /**
   * Get platform revenue and trading volume statistics.
   * - Revenue: sum of transaction_fee for all 'trade' transactions.
   * - Volume: sum of amount for all 'trade' transactions.
   * - Today's revenue: sum of transaction_fee for 'trade' transactions created today.
   */
  async getRevenueStats(req, res) {
    try {
      // All-time revenue and volume
      const [allStats, todayStats] = await Promise.all([
        Transaction.findAll({
          where: { type: 'trade', status: 'completed' },
          attributes: [
            [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('transaction_fee')), 'totalRevenue'],
            [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'totalVolume']
          ],
          raw: true
        }),
        Transaction.findAll({
          where: {
            type: 'trade',
            status: 'completed',
            created_at: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
              [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999))
            }
          },
          attributes: [
            [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('transaction_fee')), 'todaysRevenue']
          ],
          raw: true
        })
      ]);

      const totalRevenue = parseFloat(allStats[0].totalRevenue) || 0;
      const totalVolume = parseFloat(allStats[0].totalVolume) || 0;
      const todaysRevenue = parseFloat(todayStats[0].todaysRevenue) || 0;

      res.json({
        totalRevenue,
        totalVolume,
        todaysRevenue
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
}; 