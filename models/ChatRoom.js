const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  collaborationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Collaborations',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'Optional: Associates the chat room with a collaboration'
  },
  type: {
    type: DataTypes.ENUM('one_to_one', 'group'),
    allowNull: false,
    defaultValue: 'one_to_one',
    validate: {
      isIn: [['one_to_one', 'group']]
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Optional name for group chats'
  }
}, {
  timestamps: true,
  updatedAt: false
});

module.exports = ChatRoom;
