const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
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