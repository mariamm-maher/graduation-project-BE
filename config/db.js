const { Sequelize } = require('sequelize');

// host: 'localhost',
// password: 'mariam',

const sequelize = new Sequelize(
  'gradproject',        // database name
  'postgres',    // username
  'waad123', // password
  {
    host: 'localhost',
    dialect: 'postgres',
    password:'waad123',
    port: 5432,
    logging: false, 
  }
);

module.exports = sequelize;
