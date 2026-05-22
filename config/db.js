const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'gradproject',        // database name
  'postgres',    // username
  'mariam', // password
  '12345', // password
  {
    host: '192.168.100.6',
    dialect: 'postgres',
    password:'mariam',
    password:'12345',
    port: 5432,
    logging: false, 
  }
);

module.exports = sequelize;
