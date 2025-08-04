const { Op } = require('sequelize');
const { Wallet, Market } = require('../models');
const Order = require('../models/order');
const User = require('../models/user'); // Import User model
module.exports = {
  // Get all orders for the authenticated user
  async getOrders(req, res) {
    try {
      const orders = await Order.findAll({ where: { userId: req.user.id } });
      // Optionally, split into open and filled orders
      const openOrders = orders.filter(o => o.status === 'Open');
      const filledOrders = orders.filter(o => o.status === 'Filled');
      res.json({ openOrders, filledOrders });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new order for the authenticated user, with orderPair logic
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

    // Calculate total cost for BUY, or check asset for SELL
    const totalCost = parseFloat(price);

    if (type === 'BUY') {
      if (parseFloat(wallet.balance) < totalCost) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      // Deduct from wallet
      wallet.balance = (parseFloat(wallet.balance) - totalCost).toFixed(8);
      await wallet.save();
    }
    // For SELL, you would check asset balance (not implemented here)

    // Helper function to check if orderPair has room for more users
    const hasRoomInOrderPair = (orderPair) => {
      return !orderPair || (Array.isArray(orderPair) && orderPair.length < 2);
    };

    // Helper function to check if user is already in orderPair
    const isUserInOrderPair = (orderPair, userId) => {
      return orderPair && Array.isArray(orderPair) && orderPair.includes(userId);
    };

    // Attempt to find a matching order for pairing
    // Match: same market, same price, opposite type, status Open, orderPair has room, and not by this user
    const oppositeType = type === 'BUY' ? 'SELL' : 'BUY';
    
    // Get all potential matching orders
    const potentialMatches = await Order.findAll({
      where: {
        marketId,
        price,
        type: oppositeType,
        status: 'Open',
        userId: { [Op.ne]: req.user.id } // Using Sequelize operator for 'not equal'
      }
    });

    // Filter for orders that have room in their orderPair and don't already include this user
    let matchedOrder = null;
    for (const order of potentialMatches) {
      if (hasRoomInOrderPair(order.orderPair) && !isUserInOrderPair(order.orderPair, req.user.id)) {
        matchedOrder = order;
        break;
      }
    }

    let orderPair = null;
    let isPaired = false;

    if (matchedOrder) {
      // Pair with the matched order
      const existingPair = matchedOrder.orderPair || [];
      orderPair = [...existingPair, req.user.id];
      
      // Update the matched order's orderPair
      matchedOrder.orderPair = orderPair;
      matchedOrder.status = 'Paired';
      await matchedOrder.save();
      
      isPaired = true;
      
      // If orderPair is now full (2 users), mark both orders as paired/matched
      if (orderPair.length === 2) {
        // You might want to update status or add additional logic here
        // For example, create a transaction record, update market stats, etc.
        console.log(`Order ${matchedOrder.id} paired with new order for users: ${orderPair.join(', ')}`);
      }
    } else {
      // No match found, create a new pair with only this user
      orderPair = [req.user.id];
    }

    // Create the order according to order.js model, including orderPair
    const order = await Order.create({
      marketId,
      marketName: market.question || market.category || '', // fallback if marketName is not present
      userId: req.user.id,
      type,
      price,
      quantity,
      status: 'Paired',
      orderPair
    });

    // Prepare response with additional pairing information
    const response = {
      success: true,
      order,
      pairingInfo: {
        isPaired,
        pairSize: orderPair.length,
        pairedWith: isPaired ? matchedOrder.id : null,
        orderPairUsers: orderPair
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