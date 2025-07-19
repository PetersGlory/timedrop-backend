const Order = require('../models/order');

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

  // Create a new order for the authenticated user
  async createOrder(req, res) {
    try {
      const order = await Order.create({ ...req.body, userId: req.user.id });
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