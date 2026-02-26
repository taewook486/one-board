import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

// Check if using Postgres (production) or SQLite (development)
const DATABASE_URL = process.env.DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const isPostgres = POSTGRES_URL || DATABASE_URL?.startsWith('postgres');

// Import appropriate schema
// Note: Using dynamic require for schema to support both SQLite and PostgreSQL at runtime
// TypeScript cannot represent a union of the two schema types as they have incompatible column types
// Using 'any' for schema is intentional to allow runtime database switching
let schema: any;
if (isPostgres) {
  schema = require('./schema-pg');
} else {
  schema = require('./schema-sqlite');
}

// Create database connection
// Note: Using 'any' here is intentional. Drizzle ORM's SQLite and PostgreSQL database types
// are fundamentally incompatible (different method signatures for select/insert/update/delete).
// A union type would prevent calling any methods on db. This is a known limitation when
// supporting multiple database drivers in TypeScript.
let db: any;

if (isPostgres) {
  // Production: Use Neon Postgres
  const sql = neon(POSTGRES_URL || DATABASE_URL!);

  // Configure Neon for better performance
  neonConfig.fetchConnectionCache = true;

  db = drizzleNeon(sql, { schema });
} else {
  // Development: Use SQLite
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  const dbPath = DATABASE_URL || path.join(process.cwd(), 'data', 'oneboard.db');

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

  // Set synchronous mode to NORMAL
  sqlite.pragma('synchronous = NORMAL');

  // Set cache size to 64MB
  sqlite.pragma('cache_size = -64000');

  db = drizzleSqlite(sqlite, { schema });
}

export { db };

// Export schema types (for TypeScript)
export * from './schema-sqlite';
