/**
 * Fix notifications table - add missing message column
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'data', 'oneboard.db');

console.log(`Database path: ${dbPath}`);

try {
  const db = new Database(dbPath);

  // Check if message column exists
  const tableInfo = db.prepare("PRAGMA table_info(notifications)").all();
  const hasMessageColumn = tableInfo.some((col: any) => col.name === 'message');
  const hasLinkColumn = tableInfo.some((col: any) => col.name === 'link');

  if (hasMessageColumn) {
    console.log('✅ message column already exists');
  } else {
    // Add message column
    console.log('Adding message column to notifications table...');
    db.prepare('ALTER TABLE notifications ADD COLUMN message TEXT NOT NULL DEFAULT ""').run();
    console.log('✅ message column added successfully');
  }

  if (hasLinkColumn) {
    console.log('✅ link column already exists');
  } else {
    // Add link column
    console.log('Adding link column to notifications table...');
    db.prepare('ALTER TABLE notifications ADD COLUMN link TEXT').run();
    console.log('✅ link column added successfully');
  }

  db.close();
  console.log('Done!');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
