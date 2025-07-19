const Market = require('../models/market');
const Category = require('../models/category');

module.exports = {
  // Get all markets
  async getMarkets(req, res) {
    try {
      const markets = await Market.findAll();
      res.json({ markets });
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
      res.json({ market });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create a new market
  async createMarket(req, res) {
    try {
      const market = await Market.create(req.body);
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