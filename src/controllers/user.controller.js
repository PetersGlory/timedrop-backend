const User = require('../models/user');

module.exports = {
  // Get the authenticated user's profile
  async getUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update the authenticated user's profile
  async updateUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { firstName, lastName, phone } = req.body;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone) user.phone = phone;
      await user.save();
      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Change the authenticated user's password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const isMatch = await user.validatePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}; 