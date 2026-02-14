const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'gradproject',        // database name
  'postgres',    // username
  'mariam', // password
  {
    host: 'localhost',
    dialect: 'postgres',
    password:'mariam',
    port: 5432,
    logging: false, // يخلي الكونسول أنضف
  }
);

module.exports = sequelize;
