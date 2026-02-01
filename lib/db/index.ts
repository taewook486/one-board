import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Database path from environment variable or default
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'oneboard.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Set synchronous mode to NORMAL (balance between safety and performance)
sqlite.pragma('synchronous = NORMAL');

// Set cache size to 64MB (negative value means KB)
sqlite.pragma('cache_size = -64000');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Close database connection (useful for cleanup)
export function closeDb() {
  sqlite.close();
}

// Export schema for use in other files
export * from './schema';
