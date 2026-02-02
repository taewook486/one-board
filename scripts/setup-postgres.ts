#!/usr/bin/env tsx
/**
 * Setup Postgres Database
 *
 * This script creates all tables and initializes data in Neon Postgres
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupDatabase() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ POSTGRES_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🚀 Connecting to Neon database...');

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute SQL file
    console.log('📝 Creating tables...');
    const sqlPath = join(__dirname, 'schema-postgres.sql');
    const schemaSql = readFileSync(sqlPath, 'utf-8');

    await client.query(schemaSql);
    console.log('✅ Tables created successfully');

    // Close the connection before running init script
    await client.end();

    // Now run the init script to populate data
    console.log('📊 Populating initial data...');

    // Dynamically import and run the init script
    const { initDatabase } = await import('./init-db-postgres');
    await initDatabase();

  } catch (error) {
    console.error('❌ Setup failed:', error);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

setupDatabase();
