const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  marketId: {
    type: DataTypes.UUID,
    primaryKey: true
  }
}, {
  timestamps: true
});

module.exports = Bookmark; 