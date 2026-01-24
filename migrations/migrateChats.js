// Migration to rename influencerId to otherUserId in Chats table
// Run this migration to update your database schema

const sequelize = require('../config/db');

async function migrateChatsTable() {
  try {
    // Get the query interface
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if influencerId column exists
    const columns = await queryInterface.describeTable('Chats');
    
    if (columns.influencerId) {
      console.log('Migrating: Renaming influencerId to otherUserId...');
      
      // Rename the column
      await queryInterface.renameColumn('Chats', 'influencerId', 'otherUserId');
      
      console.log('✓ Migration complete: influencerId renamed to otherUserId');
      return true;
    } else if (columns.otherUserId) {
      console.log('✓ Column already named otherUserId - no migration needed');
      return true;
    } else {
      console.log('✗ Neither influencerId nor otherUserId found in Chats table');
      return false;
    }
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

module.exports = migrateChatsTable;
