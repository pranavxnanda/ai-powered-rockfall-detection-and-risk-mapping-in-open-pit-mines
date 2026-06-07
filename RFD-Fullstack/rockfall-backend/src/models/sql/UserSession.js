const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const UserSession = sequelize.define('UserSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  jwtToken: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  updatedAt: false,
});

module.exports = UserSession;