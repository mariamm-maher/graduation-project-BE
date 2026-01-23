const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'gradproject',        // database name
  'postgres',    // username
  'waad123', // password
  {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    logging: false, // يخلي الكونسول أنضف
  }
);

module.exports = sequelize;
