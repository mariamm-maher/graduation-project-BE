const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'gradproject',        // database name
  'postgres',    // username
  '12345', // password


  {
    host: 'localhost',
    dialect: 'postgres',
    password:'admin',
    port: 5432,
    logging: false, 
  }
);

module.exports = sequelize;
