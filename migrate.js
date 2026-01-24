require('dotenv').config();
const migrateChatsTable = require('./migrations/migrateChats');

async function runMigration() {
  try {
    console.log('Starting database migration...\n');
    const success = await migrateChatsTable();
    
    if (success) {
      console.log('\n✓ Migration successful!');
      process.exit(0);
    } else {
      console.log('\n✗ Migration failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
