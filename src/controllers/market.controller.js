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
        isDaily: market.isDaily,
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
        isDaily: market.isDaily,
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
        isDaily: isDaily,
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
 * Admin endpoint to resolve a market and credit winners or refund unpaired orders.
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
 *   - For 'Paired' orders: Calculate winnings proportionally and credit winners.
 *   - For 'Open' or 'PartiallyPaired' orders: Refund users their original stake.
 *   - Create transaction records for all users.
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

      // Track results for reporting
      const credited = [];
      const refunded = [];
      const processedPairGroups = new Set();

      for (const order of orders) {
        // Handle PAIRED orders (fully matched orders)
        if (order.status === 'Paired' && Array.isArray(order.orderPair) && order.orderPair.length > 1) {
          // Create a unique key for this pair group to avoid double processing
          const pairKey = order.orderPair.slice().sort().join('-');
          if (processedPairGroups.has(pairKey)) continue;
          processedPairGroups.add(pairKey);

          // Get all orders in this pair group
          const pairOrders = orders.filter(o => {
            if (!Array.isArray(o.orderPair) || o.orderPair.length <= 1) return false;
            const oPairKey = o.orderPair.slice().sort().join('-');
            return oPairKey === pairKey;
          });

          // Separate winners and losers
          const winners = [];
          const losers = [];

          for (const pairOrder of pairOrders) {
            const orderInfo = {
              order: pairOrder,
              userId: pairOrder.userId,
              type: pairOrder.type,
              price: parseFloat(pairOrder.price),
              filledQuantity: parseFloat(pairOrder.filledQuantity || pairOrder.quantity)
            };

            if (pairOrder.type === correctOrderType) {
              winners.push(orderInfo);
            } else {
              losers.push(orderInfo);
            }
          }

          // Calculate total losing stakes
          const totalLosingStakes = losers.reduce((sum, loser) => sum + loser.price, 0);
          const profitPool = totalLosingStakes * 0.9; // 90% of losing stakes

          // Calculate total winning filled quantity
          const totalWinningQuantity = winners.reduce((sum, winner) => sum + winner.filledQuantity, 0);

          // Distribute winnings proportionally based on filled quantity
          for (const winner of winners) {
            const proportionalShare = totalWinningQuantity > 0 
              ? winner.filledQuantity / totalWinningQuantity 
              : 0;
            
            const winnings = proportionalShare * profitPool;
            const totalCredit = winner.price + winnings; // Original stake + proportional winnings

            const wallet = await Wallet.findOne({ where: { userId: winner.userId } });
            if (wallet) {
              wallet.balance = parseFloat(wallet.balance) + totalCredit;
              await wallet.save();
              credited.push({ 
                userId: winner.userId, 
                amount: totalCredit,
                breakdown: {
                  originalStake: winner.price,
                  winnings: winnings,
                  filledQuantity: winner.filledQuantity,
                  proportionalShare: (proportionalShare * 100).toFixed(2) + '%'
                }
              });

              // Add transaction for winner
              await Transaction.create({
                userId: winner.userId,
                type: 'trade',
                amount: totalCredit,
                transaction_fee: (totalLosingStakes * 0.1) * proportionalShare, // Proportional fee
                status: 'completed',
                description: `Market resolved: ${market.question || marketId}, win`,
                reference: `market:${marketId}`,
                metadata: {
                  orderId: winner.order.id,
                  marketId: marketId,
                  result: result,
                  credited: true,
                  orderType: winner.type,
                  filledQuantity: winner.filledQuantity,
                  originalStake: winner.price,
                  winnings: winnings,
                  pair: winner.order.orderPair
                }
              });
            }
          }

          // Create loss transactions for losers (no credit)
          for (const loser of losers) {
            await Transaction.create({
              userId: loser.userId,
              type: 'trade',
              amount: 0,
              transaction_fee: null,
              status: 'completed',
              description: `Market resolved: ${market.question || marketId}, loss`,
              reference: `market:${marketId}`,
              metadata: {
                orderId: loser.order.id,
                marketId: marketId,
                result: result,
                credited: false,
                orderType: loser.type,
                filledQuantity: loser.filledQuantity,
                lostStake: loser.price,
                pair: loser.order.orderPair
              }
            });
          }

        } else if (order.status === 'Open' || order.status === 'PartiallyPaired') {
          // Refund unpaired or partially paired orders
          const refundAmount = parseFloat(order.price);
          
          const wallet = await Wallet.findOne({ where: { userId: order.userId } });
          if (wallet) {
            wallet.balance = parseFloat(wallet.balance) + refundAmount;
            await wallet.save();
            refunded.push({ 
              userId: order.userId, 
              amount: refundAmount,
              status: order.status,
              filledQuantity: parseFloat(order.filledQuantity || 0),
              totalQuantity: parseFloat(order.quantity)
            });

            // Add refund transaction
            await Transaction.create({
              userId: order.userId,
              type: 'refund',
              amount: refundAmount,
              transaction_fee: null,
              status: 'completed',
              description: `Market resolved: ${market.question || marketId}, order refunded (${order.status})`,
              reference: `market:${marketId}`,
              metadata: {
                orderId: order.id,
                marketId: marketId,
                result: result,
                refunded: true,
                orderStatus: order.status,
                orderType: order.type,
                filledQuantity: order.filledQuantity || 0,
                totalQuantity: order.quantity,
                pair: order.orderPair
              }
            });
          }
        }
      }

      // Close the market
      market.status = 'closed';
      market.outcome = result;
      await market.save();

      // Update all order statuses to 'Filled'
      await Promise.all(orders.map(async order => {
        order.status = 'Filled';
        await order.save();
      }));

      return res.json({
        success: true,
        message: 'Market resolved successfully.',
        marketId,
        marketName: market.question || market.category,
        result,
        summary: {
          totalOrders: orders.length,
          winnersCount: credited.length,
          refundsCount: refunded.length,
          totalCredited: credited.reduce((sum, c) => sum + c.amount, 0).toFixed(2),
          totalRefunded: refunded.reduce((sum, r) => sum + r.amount, 0).toFixed(2)
        },
        credited,
        refunded,
        closed: true
      });
    } catch (error) {
      console.error('Error resolving market:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}; 