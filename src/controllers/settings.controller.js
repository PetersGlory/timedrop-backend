const Settings = require('../models/settings');

module.exports = {
  // Get settings for the authenticated user
  async getSettings(req, res) {
    try {
      let settings = await Settings.findOne({ where: { userId: req.user.id } });
      if (!settings) {
        // Create default settings using the model as a guide
        settings = await Settings.create({
          userId: req.user.id,
          notificationPreferences: {},
          preferences: {}
        });
      }
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create or update settings for the authenticated user
  async updateSettings(req, res) {
    try {
      let settings = await Settings.findOne({ where: { userId: req.user.id } });
      if (settings) {
        await settings.update(req.body);
      } else {
        settings = await Settings.create({ ...req.body, userId: req.user.id });
      }
      res.json({ success: true, settings });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },

  // Update notification preferences for the authenticated user
  async updateNotifications(req, res) {
    try {
      let settings = await Settings.findOne({ where: { userId: req.user.id } });
      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      await settings.update({ notificationPreferences: req.body });
      res.json({ success: true, settings });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  }
}; 