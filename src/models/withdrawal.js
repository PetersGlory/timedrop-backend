const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Withdrawal = sequelize.define('Withdrawal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  transaction_fee: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'NGN'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  adminSynced:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue:false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  flutterwaveTransferId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Withdrawal;
