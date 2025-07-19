const User = require('../models/user');
const Market = require('../models/market');
const Order = require('../models/order');
const Portfolio = require('../models/portfolio');
const Settings = require('../models/settings');
const Bookmark = require('../models/bookmark');

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
      const user = await User.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
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
      const markets = await Market.findAll();
      res.json({ markets });
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
      const order = await Order.findByPk(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json({ order });
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
  }
}; 