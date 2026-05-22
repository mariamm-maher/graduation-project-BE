const { Sequelize } = require('sequelize');

// host: 'localhost',
// password: 'mariam',

const sequelize = new Sequelize(
  'gradproject',        // database name
  'postgres',    // username
  'mariam', // password
  {
    host: 'localhost',
    dialect: 'postgres',
    password:'mariam',
    port: 5432,
    logging: false, 
  }
);

module.exports = sequelize;
