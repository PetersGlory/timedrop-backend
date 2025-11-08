const { Op } = require('sequelize');
const { Wallet, Market, sequelize } = require('../models');
const Order = require('../models/order');
const User = require('../models/user'); // Import User model


module.exports = {
  // Get all orders for the authenticated user
  async getOrders(req, res) {
    try {
      const userId = req.user.id;
  
      const orders = await Order.findAll({
        where: {
          [Op.or]: [
            { userId }, // keep direct userId support
            sequelize.where(
              sequelize.cast(sequelize.col('orderPair'), 'text'),
              { [Op.like]: `%${userId}%` }
            )
          ]
        }
      });
  
      // Add role info based on position in orderPair
      const enrichedOrders = orders.map(order => {
        let role = null;
        if (Array.isArray(order.orderPair)) {
          if (order.orderPair[0] === userId) {
            role = "firstUser";
          } else if (order.orderPair[1] === userId) {
            role = "secondUser";
            order.type = order.secondType;
          }
        }
        return { ...order.toJSON(), role };
      });
  
      const openOrders = enrichedOrders.filter(o => o.status === 'Open' || o.status === 'Paired');
      const filledOrders = enrichedOrders.filter(o => o.status === 'Filled');
  
      res.json({ openOrders, filledOrders });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new order for the authenticated user, with multi-order pairing logic
  async createOrder(req, res) {
    try {
      const { marketId, type, quantity, price } = req.body;

      // Validate required fields
      if (!marketId || !type || !quantity || !price) {
        return res.status(400).json({ message: 'marketId, type, quantity, and price are required' });
      }

      // Validate order type
      if (!['BUY', 'SELL'].includes(type)) {
        return res.status(400).json({ message: 'Order type must be BUY or SELL' });
      }

      // Check for duplicate order
      const prevOrder = await Order.findOne({
        where: {
          marketId,
          userId: req.user.id,
          price,
          type
        }
      });

      if (prevOrder) {
        return res.status(422).json({
          message: "You already have an order with the same market, type, and price."
        });
      }

      // Fetch user, wallet, and market
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const market = await Market.findOne({ where: { id: marketId } });
      if (!market) {
        return res.status(404).json({ message: 'Market not found' });
      }

      // Calculate total cost and deduct from wallet
      const totalCost = parseFloat(price);
      if (parseFloat(wallet.balance) < totalCost) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      wallet.balance = (parseFloat(wallet.balance) - totalCost).toFixed(8);
      await wallet.save();

      const oppositeType = type === 'BUY' ? 'SELL' : 'BUY';
      const requestedQuantity = parseFloat(quantity);

      // Find all matching opposite orders (FIFO - ordered by creation date)
      const matchingOrders = await Order.findAll({
        where: {
          marketId,
          price,
          type: oppositeType,
          status: { [Op.in]: ['Open', 'PartiallyPaired'] }, // Can match with open or partially paired orders
          userId: { [Op.ne]: req.user.id }
        },
        order: [['createdAt', 'ASC']] // FIFO ordering
      });

      let remainingQuantity = requestedQuantity;
      let orderPair = [req.user.id];
      let matchedOrderIds = [];
      let totalMatchedQuantity = 0;

      // Try to match with existing orders
      for (const matchOrder of matchingOrders) {
        if (remainingQuantity <= 0) break;

        // Calculate how much this order still needs to be filled
        const matchOrderFilled = matchOrder.filledQuantity || 0;
        const matchOrderRemaining = parseFloat(matchOrder.quantity) - matchOrderFilled;

        if (matchOrderRemaining <= 0) continue; // Skip fully filled orders

        // Calculate how much we can match with this order
        const matchAmount = Math.min(remainingQuantity, matchOrderRemaining);

        // Update the matched order
        const newFilledQuantity = matchOrderFilled + matchAmount;
        const existingPair = matchOrder.orderPair || [];
        
        // Add current user to the matched order's pair if not already present
        if (!existingPair.includes(req.user.id)) {
          existingPair.push(req.user.id);
        }

        matchOrder.orderPair = existingPair;
        matchOrder.filledQuantity = newFilledQuantity;
        
        // Update status based on fill
        if (newFilledQuantity >= parseFloat(matchOrder.quantity)) {
          matchOrder.status = 'Paired';
        } else {
          matchOrder.status = 'PartiallyPaired';
        }

        await matchOrder.save();

        // Add matched order's user to our orderPair if not already present
        if (!orderPair.includes(matchOrder.userId)) {
          orderPair.push(matchOrder.userId);
        }

        matchedOrderIds.push(matchOrder.id);
        totalMatchedQuantity += matchAmount;
        remainingQuantity -= matchAmount;
      }

      // Determine status for the new order
      let orderStatus;
      if (totalMatchedQuantity >= requestedQuantity) {
        orderStatus = 'Paired';
      } else if (totalMatchedQuantity > 0) {
        orderStatus = 'PartiallyPaired';
      } else {
        orderStatus = 'Open';
      }

      // Create the new order
      const newOrder = await Order.create({
        marketId,
        marketName: market.question || market.category || '',
        userId: req.user.id,
        type,
        secondType: oppositeType,
        price,
        quantity: requestedQuantity,
        filledQuantity: totalMatchedQuantity,
        status: orderStatus,
        orderPair: orderPair.length > 1 ? orderPair : [req.user.id] // Only include pair if matched
      });

      // Prepare response
      const response = {
        success: true,
        order: newOrder,
        pairingInfo: {
          status: orderStatus,
          requestedQuantity,
          filledQuantity: totalMatchedQuantity,
          remainingQuantity,
          isPaired: orderStatus === 'Paired',
          isPartiallyPaired: orderStatus === 'PartiallyPaired',
          matchedWithOrders: matchedOrderIds,
          orderPairUsers: orderPair,
          pairSize: orderPair.length
        }
      };

      res.status(201).json(response);
      
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },

  // Cancel an open order by ID for the authenticated user
  async cancelOrder(req, res) {
    try {
      const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id } });
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Order is already cancelled' });
      }
      order.status = 'Cancelled';
      await order.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  async getOrdersByPairStatus(req, res) {
    try {
      const { status = 'all' } = req.query; // 'paired', 'unpaired', or 'all'
      
      let whereCondition = {};
      
      if (status === 'paired') {
        // Orders with orderPair containing 2 users
        whereCondition = {
          [Op.and]: [
            { orderPair: { [Op.ne]: null } },
            sequelize.where(
              sequelize.fn('JSON_LENGTH', sequelize.col('orderPair')),
              2
            )
          ]
        };
      } else if (status === 'unpaired') {
        // Orders with orderPair null or containing only 1 user
        whereCondition = {
          [Op.or]: [
            { orderPair: null },
            sequelize.where(
              sequelize.fn('JSON_LENGTH', sequelize.col('orderPair')),
              1
            )
          ]
        };
      }
      
      const orders = await Order.findAll({
        where: whereCondition,
        include: [
          {
            model: Market,
            attributes: ['question', 'category']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      res.json({
        success: true,
        orders,
        totalCount: orders.length
      });
    } catch (error) {
      console.error('Error fetching orders by pair status:', error);
      res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
  }
};