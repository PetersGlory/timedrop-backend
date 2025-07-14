const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Portfolio = sequelize.define('Portfolio', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  holdings: {
    type: DataTypes.JSON, // array of {marketId, quantity, etc.}
    allowNull: true
  },
  openOrders: {
    type: DataTypes.JSON, // array of order objects
    allowNull: true
  },
  filledOrders: {
    type: DataTypes.JSON, // array of order objects
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Portfolio; 