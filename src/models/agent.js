const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  referralCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [6, 20]
    }
  },
  totalReferrals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  totalReferralVolume: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['referralCode']
    }
  ]
});

module.exports = Agent;