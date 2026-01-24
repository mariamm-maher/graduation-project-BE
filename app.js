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
    // Note: This won't add new columns to existing tables
    // To add the otherUserId column, run: node scripts/addOtherUserIdColumn.js
    return sequelize.sync();
  })
  .then(async () => {
    console.log('Database synchronized');
    
    // Migrate influencerId to otherUserId if needed
    try {
      // Check if influencerId column exists
      const [influencerIdCheck] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='Chats' AND column_name='influencerId'
      `);
      
      // Check if otherUserId column exists
      const [otherUserIdCheck] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='Chats' AND column_name='otherUserId'
      `);
      
      if (influencerIdCheck.length > 0 && otherUserIdCheck.length === 0) {
        console.log('Migrating influencerId to otherUserId...');
        // First, make the column nullable temporarily if it has data
        try {
          await sequelize.query(`
            ALTER TABLE "Chats" 
            ALTER COLUMN "influencerId" DROP NOT NULL
          `);
        } catch (e) {
          // Ignore if already nullable or constraint doesn't exist
        }
        // Rename the column from influencerId to otherUserId
        await sequelize.query(`
          ALTER TABLE "Chats" 
          RENAME COLUMN "influencerId" TO "otherUserId"
        `);
        // Make it NOT NULL again
        await sequelize.query(`
          ALTER TABLE "Chats" 
          ALTER COLUMN "otherUserId" SET NOT NULL
        `);
        console.log('✓ Column renamed from influencerId to otherUserId');
      } else if (influencerIdCheck.length > 0 && otherUserIdCheck.length > 0) {
        // Both columns exist - copy data and drop old column
        console.log('Both columns exist. Migrating data and dropping influencerId...');
        await sequelize.query(`
          UPDATE "Chats" 
          SET "otherUserId" = "influencerId" 
          WHERE "otherUserId" IS NULL
        `);
        await sequelize.query(`
          ALTER TABLE "Chats" 
          DROP COLUMN "influencerId"
        `);
        console.log('✓ Data migrated and influencerId column dropped');
      } else if (otherUserIdCheck.length === 0) {
        // Neither column exists - add new one
        console.log('Adding otherUserId column to Chats table...');
        await sequelize.query(`
          ALTER TABLE "Chats" 
          ADD COLUMN "otherUserId" INTEGER NOT NULL REFERENCES "Users"("id")
        `);
        console.log('✓ otherUserId column added successfully');
      } else {
        console.log('✓ otherUserId column already exists');
      }
    } catch (error) {
      console.error('Error migrating Chat table:', error.message);
      // Don't fail the server startup if column already exists or other minor issues
    }
    
    // Seed roles
    return seedRoles();
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    console.error('Error details:', error.message);
  });

// 404 Handler - Must be after all routes
app.use(notFound);

// Global Error Handler - Must be last
app.use(errorHandler);

module.exports = app;
