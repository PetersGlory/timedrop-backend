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
    type: DataTypes.JSON, // Store array of UUIDs as JSON
    allowNull: true,
    validate: {
      isValidOrderPair(value) {
        if (value !== null && value !== undefined) {
          // Check if it's an array
          if (!Array.isArray(value)) {
            throw new Error('orderPair must be an array');
          }
          // Check length
          if (value.length > 2) {
            throw new Error('orderPair cannot contain more than 2 users');
          }
          // Check if all elements are valid UUIDs
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          for (const id of value) {
            if (typeof id !== 'string' || !uuidRegex.test(id)) {
              throw new Error('All orderPair elements must be valid UUIDs');
            }
          }
        }
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

// Helper methods for working with orderPair
Order.prototype.addToOrderPair = function(userId) {
  const currentPair = this.orderPair || [];
  if (currentPair.length >= 2) {
    throw new Error('Order pair is already full (max 2 users)');
  }
  if (currentPair.includes(userId)) {
    throw new Error('User is already in the order pair');
  }
  this.orderPair = [...currentPair, userId];
  return this.save();
};

Order.prototype.removeFromOrderPair = function(userId) {
  const currentPair = this.orderPair || [];
  this.orderPair = currentPair.filter(id => id !== userId);
  return this.save();
};

Order.prototype.isOrderPairFull = function() {
  return (this.orderPair || []).length >= 2;
};

Order.prototype.getOrderPairUsers = function() {
  return this.orderPair || [];
};

module.exports = Order;