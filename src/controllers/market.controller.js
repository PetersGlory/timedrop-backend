// const Market = require('../models/market');
const Category = require('../models/category');
const { subHours, addHours } = require('date-fns');
const { Op } = require('sequelize');
const { Order, Wallet, Transaction, Market, sequelize } = require('../models');

module.exports = {
  // Get all markets

  // Get all markets
  async getMarkets(req, res) {
    try {
      // First try to get all markets, then filter in JavaScript to handle any status column issues
      const [markets] = await sequelize.query(
        `SELECT * FROM Markets ORDER BY createdAt DESC`
      );
      
      // Filter out archived markets in JavaScript
      const filteredMarkets = markets.filter(market => {
        const status = market.status;
        return !status || (status !== 'archieve' && status !== 'Archieve' && status !== 'ARCHIEVE');
      });

      // Map and format each market according to the required structure
      const formattedMarkets = filteredMarkets.length > 0 ? filteredMarkets.map(market => ({
        id: String(market.id),
        category: market.category || 'General',
        question: market.question || market.title || '',
        status: market.status || 'Open',
        outcome: market.outcome || "No",
        image: (() => {
          let imageObj = { url: 'https://placehold.co/600x400.png', hint: 'stock market' };
          // If market.image is a JSON string, parse it
          if (market.image) {
            try {
              const img = typeof market.image === 'string' ? JSON.parse(market.image) : market.image;
              imageObj.url = img.url || imageObj.url;
              imageObj.hint = img.hint || imageObj.hint;
            } catch (e) {
              // fallback to default
            }
          }
          return imageObj;
        })(),
        isDaily: market.isDaily || false,
        startDate: market.startDate
          ? new Date(market.startDate).toISOString()
          : subHours(new Date(), 4).toISOString(),
        endDate: market.endDate
          ? new Date(market.endDate).toISOString()
          : addHours(new Date(), 20).toISOString(),
        history: (() => {
          // If market.history is a JSON string, parse it
          if (market.history) {
            try {
              return typeof market.history === 'string' ? JSON.parse(market.history) : market.history;
            } catch (e) {
              return [];
            }
          }
          return [];
        })(),
      })) : [];

      res.json({ markets: formattedMarkets });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message, errors: error });
    }
  },

  // Get a single market by ID
  async getMarket(req, res) {
    try {
      const market = await Market.findByPk(req.params.id);

      if (!market) {
        return res.status(404).json({ message: 'Market not found' });
      }

      // Format the market according to the required structure
      const formattedMarket = {
        id: String(market.id),
        category: market.category || 'General',
        question: market.question || market.title || '',
        status: market.status || 'Open',
        outcome: market.outcome || "No",
        image: {
          url: market.image.url || 'https://placehold.co/600x400.png',
          hint: market.image.hint || 'stock market',
        },
        isDaily: market.isDaily || false,
        startDate: market.startDate
          ? new Date(market.startDate).toISOString()
          : subHours(new Date(), 4).toISOString(),
        endDate: market.endDate
          ? new Date(market.endDate).toISOString()
          : addHours(new Date(), 20).toISOString(),
        history: market.history || [], // order history, should be an array
      };

      res.json({ market: formattedMarket });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new market
  async createMarket(req, res) {
    const {category, question, history, image, startDate, endDate, isDaily} = req.body
    try {
      const market = await Market.create({
        question,
        category,
        history: history || [],
        image: {
          url: image.imageURL,
          hint: image.imageHint
        },
        isDaily: isDaily || false,
        startDate,
        endDate
      });
      res.status(201).json({ market });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },

  // Update a market by ID
  async updateMarket(req, res) {
    try {
      const market = await Market.findByPk(req.params.id);
      if (!market) {
        return res.status(404).json({ message: 'Market not found' });
      }
      await market.update(req.body);
      res.json({ market });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },

  // Delete a market by ID
  async deleteMarket(req, res) {
    try {
      const market = await Market.findByPk(req.params.id);
      if (!market) {
        return res.status(404).json({ message: 'Market not found' });
      }
      await market.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // --- Category Endpoints ---
  async getCategories(req, res) {
    try {
      const categories = await Category.findAll();
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: 'Category name is required' });
      const category = await Category.create({ name });
      res.status(201).json({ category });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async updateCategory(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      await category.update({ name: req.body.name });
      res.json({ category });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },
  async deleteCategory(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      await category.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },


  /**
   * Admin endpoint to resolve a market and credit winners.
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * 
   * Expects:
   *   req.body: {
   *     marketId: string,
   *     result: 'yes' | 'no'
   *   }
   * 
   * Logic:
   *   - Fetch all orders for the marketId.
   *   - For each order, check if the order type matches the result ('yes' = 'BUY', 'no' = 'SELL').
   *   - If orderPair has 2 users, both are checked for correctness.
   *   - If orderPair has 1 user, check correctness and credit if correct.
   *   - Credit the user's wallet with the order price if correct.
   *   - Close the market after processing.
   */
  async resolveMarket(req, res) {
    const { marketId, result } = req.body;
    if (!marketId || !['yes', 'no'].includes(result)) {
      return res.status(400).json({ message: "marketId and result ('yes' or 'no') are required." });
    }

    // Map result to order type
    const correctOrderType = result === 'yes' ? 'BUY' : 'SELL';

    try {
      // Fetch the market
      const market = await Market.findByPk(marketId);
      if (!market) {
        return res.status(404).json({ message: 'Market not found.' });
      }
      if (market.status === 'closed') {
        return res.status(400).json({ message: 'Market already closed.' });
      }

      // Fetch all orders for this market
      const orders = await Order.findAll({ where: { marketId } });

      // Track credited users for reporting
      const credited = [];
      const processedPairs = new Set();

      for (const order of orders) {
        // Handle paired orders (2 users)
        if (Array.isArray(order.orderPair) && order.orderPair.length === 2) {
          // Create a unique key for the pair to avoid double processing
          const pairKey = order.orderPair.slice().sort((a, b) => a - b).join('-');
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);

          // Find both orders in the pair
          const pairOrders = orders.filter(
            o =>
              Array.isArray(o.orderPair) &&
              o.orderPair.length === 2 &&
              JSON.stringify(o.orderPair.slice().sort((a, b) => a - b)) === JSON.stringify(order.orderPair.slice().sort((a, b) => a - b))
          );

          if (pairOrders.length === 2) {
            // Find the order with the correct type
            const winnerOrder = pairOrders.find(o => o.type === correctOrderType);
            if (winnerOrder) {
              const creditAmount = parseFloat(winnerOrder.price) + (parseFloat(winnerOrder.price) * 0.9);
              const wallet = await Wallet.findOne({ where: { userId: winnerOrder.userId } });
              if (wallet) {
                wallet.balance = parseFloat(wallet.balance) + creditAmount;
                await wallet.save();
                credited.push({ userId: winnerOrder.userId, amount: creditAmount });

                // Add transaction history for the credited user
                await Transaction.create({
                  userId: winnerOrder.userId,
                  type: 'trade',
                  amount: creditAmount,
                  transaction_fee: (parseFloat(winnerOrder.price) * 0.1),
                  status: 'completed',
                  description: `Market resolved: ${marketId}, pair win`,
                  reference: `market:${marketId}`,
                  metadata: {
                    orderId: winnerOrder.id,
                    marketId: marketId,
                    result: result,
                    credited: true,
                    pair: winnerOrder.orderPair
                  }
                });
              }
            }
          }
        } else if (
          // Single user order (no pair)
          Array.isArray(order.orderPair) && order.orderPair.length === 1
        ) {
          // If this order is the correct type, credit the user (with 10% deduction)
          if (order.type === correctOrderType) {
            const creditAmount = parseFloat(order.price);
            const wallet = await Wallet.findOne({ where: { userId: order.userId } });
            if (wallet) {
              wallet.balance = parseFloat(wallet.balance) + creditAmount;
              await wallet.save();
              credited.push({ userId: order.userId, amount: creditAmount });

              // Add transaction history for the credited user
              await Transaction.create({
                userId: order.userId,
                type: 'trade',
                amount: creditAmount,
                transaction_fee: null,
                status: 'completed',
                description: `Market resolved: ${marketId}, solo win`,
                reference: `market:${marketId}`,
                metadata: {
                  orderId: order.id,
                  marketId: marketId,
                  result: result,
                  credited: true,
                  pair: order.orderPair
                }
              });
            }
          }
        }
      }

      // Close the market
      market.status = 'closed';
      market.outcome = result
      await market.save();
      orders.forEach(async order => {
        order.status = 'Filled';
        await order.save();
      });

      return res.json({
        message: 'Market resolved and winners credited.',
        credited,
        marketId,
        closed: true
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
}; 