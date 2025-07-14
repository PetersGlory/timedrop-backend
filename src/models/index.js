const sequelize = require('../config/database');
const User = require('./user');
const Market = require('./market');
const Order = require('./order');
const Portfolio = require('./portfolio');
const Settings = require('./settings');
const Bookmark = require('./bookmark');

// Define associations here as needed
// e.g., User.hasMany(Order), etc.

// Sync all models with database
const syncDatabase = async () => {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    const alterOption = process.env.NODE_ENV === 'development';
    await User.sync({ alter: alterOption });
    await Market.sync({ alter: alterOption });
    await Order.sync({ alter: alterOption });
    await Portfolio.sync({ alter: alterOption });
    await Settings.sync({ alter: alterOption });
    await Bookmark.sync({ alter: alterOption });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Database synced successfully');
  } catch (error) {
    if (error.original && error.original.code === 'ER_TOO_MANY_KEYS') {
      console.error('MySQL key limit reached (max 64 keys per table). Consider cleaning up old indexes or using migrations instead of sync({ alter: true }) for the User table.');
    }
    console.error('Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Market,
  Order,
  Portfolio,
  Settings,
  Bookmark,
  syncDatabase
};