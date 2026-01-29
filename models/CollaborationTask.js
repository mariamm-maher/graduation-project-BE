const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CollaborationTask = sequelize.define('CollaborationTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CollaborationBoards',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  taskName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'review', 'completed', 'cancelled'),
    defaultValue: 'todo',
    allowNull: false
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = CollaborationTask;
