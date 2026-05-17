const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  ownerId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'}
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Official brand name',
  },
  segment: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Brand segment/category (e.g. "Technology", "Fashion")',
  },
  slug: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'URL-friendly version of the brand name (e.g. "my-brand")',
  },

  mission: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'What the brand does and why it exists',
  },

  vision: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Long-term goal the brand aspires to achieve',
  },

  values: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of brand core values, e.g. ["Integrity", "Innovation"]',
  },

  targetAudience: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: `
      Object describing the target audience, e.g.:
      {
        "ageRange": "18-35",
        "gender": "All",
        "interests": ["tech", "fashion"],
        "location": "Global",
        "incomeLevel": "Middle to Upper"
      }
    `,
  },

  productsAndServices: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: `
      Array of product/service objects, e.g.:
      [
        { "name": "Product A", "category": "Software", "description": "..." },
        { "name": "Service B", "category": "Consulting",  "description": "..." }
      ]
    `,
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the brand is currently active',
  },

  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  indexes: [
    { unique: true, fields: ['name'] },
    { unique: true, fields: ['slug'] },
  ],
});



module.exports =  Brand;

