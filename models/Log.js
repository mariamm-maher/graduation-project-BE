const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    comment: 'Optional FK to Users table representing the actor'
  },
  actor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Human-readable actor identifier (username or email)'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Action performed (e.g. CREATE, UPDATE, DELETE, LOGIN, LOGOUT)'
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Entity affected (e.g. Campaign, User, Session)'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Optional id of the affected entity'
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Optional JSON payload with extra context'
  }
}, {
  timestamps: true, // createdAt is the event time
  updatedAt: false,
  tableName: 'Logs',
  indexes: [
    { name: 'idx_logs_actor_id', fields: ['actorId'] },
    { name: 'idx_logs_entity', fields: ['entity'] },
    { name: 'idx_logs_action', fields: ['action'] }
  ]
});

module.exports = Log;
