const Portfolio = require('../models/portfolio');

module.exports = {
  // Get the portfolio for the authenticated user
  async getPortfolio(req, res) {
    try {
      const portfolio = await Portfolio.findOne({ where: { userId: req.user.id } });
      if (!portfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      res.json({ portfolio });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}; 