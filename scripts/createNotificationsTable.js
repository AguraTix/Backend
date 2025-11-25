/**
 * Script to create the notifications table
 * Run this AFTER deploying the Notification model
 *
 * Usage: node scripts/createNotificationsTable.js
 */

require('dotenv').config();
const { sequelize } = require('../models');

async function createNotificationsTable() {
  try {
    console.log('\n=== Notifications Table Migration ===\n');
    console.log('⏳ Connecting to database...');

    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n⏳ Creating notifications table if it does not exist...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ notifications table ensured');

    console.log('\n⏳ Creating indexes (if not exist)...');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    console.log('✅ Index on user_id');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `);
    console.log('✅ Index on is_read');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt");
    `);
    console.log('✅ Index on createdAt');

    console.log('\n🎉 Notifications table migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Notifications table migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

createNotificationsTable();
