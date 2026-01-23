const express = require('express');
const passport = require('./config/passport');
const { sequelize } = require('./models');
const seedRoles = require('./config/seedRoles');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaign'));
app.use('/api/chat', require('./routes/chat'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    // Sync database (create tables if they don't exist)
    return sequelize.sync();
  })
  .then(() => {
    console.log('Database synchronized');
    // Seed roles
    return seedRoles();
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

// 404 Handler - Must be after all routes
app.use(notFound);

// Global Error Handler - Must be last
app.use(errorHandler);

module.exports = app;
