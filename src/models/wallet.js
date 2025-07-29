const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  balance: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'NGN'
  }
}, {
  timestamps: true
});

module.exports = Wallet;
