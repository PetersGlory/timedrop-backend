const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  marketId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  marketName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('BUY', 'SELL'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  orderPair: {
    type: DataTypes.ARRAY(DataTypes.UUID), // Array of user IDs (max 2)
    allowNull: true,
    validate: {
      len: {
        args: [0, 2],
        msg: 'orderPair cannot contain more than 2 users'
      }
    },
    comment: 'Pairs two users together by their IDs; should not exceed 2 users'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Open', 'Filled', 'Cancelled'),
    defaultValue: 'Open'
  }
}, {
  timestamps: true
});

module.exports = Order; 