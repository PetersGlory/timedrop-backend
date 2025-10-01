const User = require('../models/user');
const Market = require('../models/market');
const Order = require('../models/order');
const Portfolio = require('../models/portfolio');
const Settings = require('../models/settings');
const Bookmark = require('../models/bookmark');
const { Withdrawal, Transaction, Wallet } = require('../models');
const { Op } = require('sequelize');
const { flw } = require('../utils/flutterwave');

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
      // Only allow fields defined in the User model
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        gender,
        role,
        country
      } = req.body;

      // Sentimental touch: check for required fields and respond with warmth
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          message: "We'd love to welcome a new user, but please provide all required fields: email, password, firstName, and lastName."
        });
      }

      // Create the user (password hashing and timedropId handled by model hooks)
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        gender,
        role,
        country
      });

      // Remove sensitive info before sending response
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.status(201).json({
        message: `Welcome aboard, ${user.firstName}! Your journey with us has just begun.`,
        user: userResponse
      });
    } catch (error) {
      // Sentimental error message
      res.status(400).json({
        message: "We couldn't create your account. Please check your details and try again. If the problem persists, we're here to help.",
        error: error.message
      });
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
      // 1. Fetch all markets
      const markets = await Market.findAll();
  
      // 2. Fetch all orders (only marketId + orderPair needed)
      const orders = await Order.findAll({
        attributes: ['marketId', 'orderPair']
      });
  
      // 3. Group orders by marketId
      const ordersByMarket = orders.reduce((acc, order) => {
        if (!acc[order.marketId]) acc[order.marketId] = [];
        acc[order.marketId].push(order);
        return acc;
      }, {});
  
      // 4. Attach totalBidUsers to each market
      const result = markets.map(market => {
        const marketOrders = ordersByMarket[market.id] || [];
  
        const totalBidUsers = marketOrders.reduce((sum, o) => {
          if (o.orderPair && Array.isArray(o.orderPair)) {
            return sum + o.orderPair.length;
          }
          return sum;
        }, 0);
  
        return {
          ...market.toJSON(),
          totalBidUsers
        };
      });
  
      res.json({ markets: result });
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
      // Find the order by primary key
      const order = await Order.findByPk(req.params.id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Ensure orderPair is always an array (for consistency)
      let orderPair = [];
      if (Array.isArray(order.orderPair)) {
        orderPair = order.orderPair;
      } else if (order.orderPair && typeof order.orderPair === 'object') {
        // If stored as object, wrap in array
        orderPair = [order.orderPair];
      } else if (order.orderPair) {
        // If stored as stringified JSON, try to parse
        try {
          // Parse orderPair and ensure it is an array of two different user IDs (strings)
          let parsedPair = [];
          try {
            parsedPair = JSON.parse(order.orderPair);
            if (!Array.isArray(parsedPair)) parsedPair = [];
          } catch (e) {
            parsedPair = [];
          }
          // Filter to ensure only unique, non-empty string user IDs
          orderPair = Array.from(new Set(parsedPair.filter(id => typeof id === 'string' && id.trim() !== ''))).slice(0, 2);

          // If we have two different user IDs, fetch their user info
          if (orderPair.length === 2 && orderPair[0] !== orderPair[1]) {
            const users = await User.findAll({
              where: { id: orderPair },
              attributes: ['id', 'email', 'firstName', 'lastName']
            });
            // Replace orderPair with user info objects if both users found
            if (users.length === 2) {
              orderPair = users.map(u => ({
                id: u.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName
              }));
            }
          }
        } catch (e) {
          orderPair = [];
        }
      }

      // Compose a detailed order object for admin
      const detailedOrder = {
        id: order.id,
        marketId: order.marketId,
        userId: order.userId,
        marketName: order.marketName,
        type: order.type,
        price: order.price,
        quantity: order.quantity,
        status: order.status,
        orderPair: orderPair, // always an array
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

      res.json({ order: detailedOrder });
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
      // Get all withdrawals
      const withdrawals = await Withdrawal.findAll({ where, order: [['createdAt', 'DESC']] });

      // Collect all userIds from withdrawals
      const userIds = withdrawals
        .map(w => w.userId)
        .filter(id => !!id);

      // Fetch users in bulk
      let usersMap = {};
      if (userIds.length > 0) {
        const users = await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'firstName', 'lastName', 'email']
        });
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user.toJSON();
          return acc;
        }, {});
      }

      // Attach user info to each withdrawal
      const formattedWithdrawals = withdrawals.map(w => {
        const withdrawalObj = w.toJSON();
        return {
          ...withdrawalObj,
          user: withdrawalObj.userId ? usersMap[withdrawalObj.userId] || null : null
        };
      });

      res.json({ withdrawals: formattedWithdrawals });
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
          attributes: ['id', 'firstName', 'lastName']
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

  // sync Withdrawal
    /**
     * Synchronize all pending withdrawals with Flutterwave.
     * This function can be called as an Express route handler (with req, res)
     * or as a plain function (e.g., from a cron job).
     * If req/res are not provided, it returns the results array.
     */
    async syncWithdrawals(req, res) {
      let isApiCall = !!res; // If res is provided, it's an API call
      try {
        // Get all pending withdrawals
        const pendingWithdrawals = await Withdrawal.findAll({ where: { status: "pending", adminSynced: false } });

        if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
          if (isApiCall) {
            return res.status(404).json({ success: false, error: "No pending withdrawals found." });
          } else {
            return [];
          }
        }

        // To collect results for each withdrawal
        const results = [];

        for (const withdrawal of pendingWithdrawals) {
          // Each withdrawal should have a flutterwaveTransferId
          if (!withdrawal.flutterwaveTransferId) {
            results.push({
              id: withdrawal.id,
              success: false,
              error: "Missing flutterwaveTransferId"
            });
            continue;
          }


          const payload = {
            id: withdrawal.flutterwaveTransferId
          };

          try {
            // Fetch transfer status from Flutterwave
            const response = await flw.Transfer.get_a_transfer(payload);

            // Defensive: Check if response and response.data exist
            const fwStatus = response && response.data && response.data.status
              ? response.data.status
              : undefined;

            if (
              !response ||
              response.status !== "success" ||
              !fwStatus
            ) {
              results.push({
                id: withdrawal.id,
                success: false,
                error: (response && response.message) || "Failed to fetch transfer status",
                data: response
              });
              continue;
            }

            // Map Flutterwave status to our status
            let newStatus;
            switch (fwStatus.toLowerCase()) {
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
              { status: newStatus, adminSynced: true },
              { where: { id: withdrawal.id } }
            );

            // Update Transaction status where reference matches withdrawal reference
            await Transaction.update(
              { status: newStatus },
              { where: { reference: withdrawal.reference } }
            );

            if (newStatus === "completed") {
              const userWallet = await Wallet.findOne({ 
                where: { userId: withdrawal.userId } 
              });
              
              if (!userWallet) {
                throw new Error(`Wallet not found for user ${withdrawal.userId}`);
              }
              
              // Calculate new balance: current balance + transaction fee + withdrawal amount
              const currentBalance = parseFloat(userWallet.balance) || 0;
              const transactionFee = parseFloat(withdrawal.transaction_fee) || 0;
              const withdrawalAmount = parseFloat(withdrawal.amount) || 0;
              
              const newBalance = currentBalance + transactionFee + withdrawalAmount;
              
              // Update wallet
              userWallet.balance = newBalance.toFixed(2); // Keep 2 decimal places
              await userWallet.save();
              
              console.log(`✅ Wallet updated for user ${withdrawal.userId}: ${currentBalance} + ${transactionFee} + ${withdrawalAmount} = ${newBalance}`);
            }

            results.push({
              id: withdrawal.id,
              success: true,
              newStatus,
              message: "Transaction status updated"
            });
          } catch (err) {
            results.push({
              id: withdrawal.id,
              success: false,
              error: err && err.message ? err.message : "Error updating transaction"
            });
          }
        }

        if (isApiCall) {
          return res.json({ success: true, data: results });
        } else {
          return results;
        }
      } catch (error) {
        console.error('Get transactions error:', error);
        if (isApiCall) {
          return res.status(500).json({ success: false, error: 'Failed to process validation' });
        } else {
          throw error;
        }
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