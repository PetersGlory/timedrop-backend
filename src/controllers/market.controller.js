const Market = require('../models/market');
const Category = require('../models/category');
const { subHours, addHours } = require('date-fns');

module.exports = {
  // Get all markets

  // Get all markets
  async getMarkets(req, res) {
    try {
      const markets = await Market.findAll();

      // Map and format each market according to the required structure
      const formattedMarkets = markets.map(market => ({
        id: String(market.id),
        category: market.category || 'General',
        question: market.question || market.title || '',
        image: {
          url: market.imageUrl || 'https://placehold.co/600x400.png',
          hint: market.imageHint || 'stock market',
        },
        startDate: market.startDate
          ? new Date(market.startDate).toISOString()
          : subHours(new Date(), 4).toISOString(),
        endDate: market.endDate
          ? new Date(market.endDate).toISOString()
          : addHours(new Date(), 20).toISOString(),
        history: market.history || [], // order history, should be an array
      }));

      res.json({ markets: formattedMarkets });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
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
        image: {
          url: market.url || 'https://placehold.co/600x400.png',
          hint: market.hint || 'stock market',
        },
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
    const {category, question, history, image, startDate, endDate} = req.body
    try {
      const market = await Market.create({
        question,
        category,
        history: history || [],
        image: {
          url: image.imageURL,
          hint: image.imageHint
        },
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
  }
}; 