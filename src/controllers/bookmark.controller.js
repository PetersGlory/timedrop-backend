const Bookmark = require('../models/bookmark');

module.exports = {
  // Get all bookmarks for the authenticated user
  async getBookmarks(req, res) {
    try {
      const bookmarks = await Bookmark.findAll({ where: { userId: req.user.id } });
      res.json({ bookmarks });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Add a new bookmark for the authenticated user
  async addBookmark(req, res) {
    try {
      const { marketId } = req.body;
      if (!marketId) {
        return res.status(400).json({ message: 'marketId is required' });
      }
      const bookmark = await Bookmark.create({ userId: req.user.id, marketId });
      res.status(201).json({ success: true, bookmark });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  },

  // Remove a bookmark by marketId for the authenticated user
  async removeBookmark(req, res) {
    try {
      const { id: marketId } = req.params;
      const bookmark = await Bookmark.findOne({ where: { userId: req.user.id, marketId } });
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      await bookmark.destroy();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}; 