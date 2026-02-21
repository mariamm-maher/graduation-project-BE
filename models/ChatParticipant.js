const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatParticipant = sequelize.define('ChatParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chatRoomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ChatRooms',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  role: {
    type: DataTypes.ENUM('owner', 'influencer', 'admin'),
    allowNull: false,
    validate: {
      isIn: [['owner', 'influencer', 'admin']]
    }
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['chatRoomId', 'userId'],
      name: 'unique_chat_participant'
    }
  ]
});

module.exports = ChatParticipant;
