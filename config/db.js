const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'gradproject',        // database name
  'postgres',    // username
  'admin', // password
  {
    host: 'localhost',
    dialect: 'postgres',
    password:'admin',
    port: 5432,
    logging: false, // يخلي الكونسول أنضف
  }
);

module.exports = sequelize;
