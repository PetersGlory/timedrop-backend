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

      // Attempt to find a matching order for pairing
      // Match: same market, same price, opposite type, status Open, orderPair is null or has less than 2 users, and not by this user
      const oppositeType = type === 'BUY' ? 'SELL' : 'BUY';
      let matchedOrder = await Order.findOne({
        where: {
          marketId,
          price,
          type: oppositeType,
          status: 'Open',
          userId: { $ne: req.user.id },
          // orderPair is either null or has less than 2 users
        }
      });

      let orderPair = null;

      if (matchedOrder && (!matchedOrder.orderPair || matchedOrder.orderPair.length < 2)) {
        // Pair with the matched order
        orderPair = matchedOrder.orderPair ? [...matchedOrder.orderPair, req.user.id] : [matchedOrder.userId, req.user.id];
        // Update the matched order's orderPair
        matchedOrder.orderPair = orderPair;
        await matchedOrder.save();
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
        status: 'Open',
        orderPair
      });

      res.status(201).json({ success: true, order });
    } catch (error) {
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
  }
};