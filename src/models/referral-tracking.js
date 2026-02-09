const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReferralTracking = sequelize.define('ReferralTracking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  referralCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Agents',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  marketId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  orderAmount: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  orderType: {
    type: DataTypes.ENUM('BUY', 'SELL'),
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['referralCode']
    },
    {
      fields: ['agentId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['marketId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = ReferralTracking;