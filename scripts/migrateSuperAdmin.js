/**
 * Migration script to add SuperAdmin role support
 * Run this BEFORE creating your first SuperAdmin
 * 
 * Usage: node scripts/migrateSuperAdmin.js
 */

require('dotenv').config();
const { sequelize } = require('../models');

async function migrateSuperAdmin() {
  try {
    console.log('\n=== SuperAdmin Migration ===\n');
    console.log('⏳ Connecting to database...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n⏳ Running migration...');

    // Drop the old constraint and add new one with SuperAdmin
    await sequelize.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    console.log('✅ Removed old role constraint');

    await sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('Attendee', 'Admin', 'SuperAdmin'));
    `);
    console.log(' Added new role constraint with SuperAdmin');

    // Add created_by column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(user_id);
    `);
    console.log(' Added created_by column');

    // Create indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
    `);
    console.log('Created index on created_by');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    console.log(' Created index on role');

    console.log('\n Migration completed successfully!');
    console.log('\n=== Next Steps ===');
    console.log('1. Run: node scripts/createSuperAdmin.js');
    console.log('2. Create your first SuperAdmin account');
    console.log('3. Start using the SuperAdmin features');

    process.exit(0);
  } catch (error) {
    console.error('\n Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSuperAdmin();
