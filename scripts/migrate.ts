#!/usr/bin/env ts-node
/**
 * Migration Runner
 *
 * Run database migrations with version tracking and rollback support
 */

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Migrations table schema
const MIGRATIONS_TABLE = '_migrations';

interface Migration {
  name: string;
  version: string;
  up: string;
  down?: string;
}

class MigrationRunner {
  private migrationsPath: string;

  constructor(migrationsPath: string = './migrations') {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize migrations table
   */
  async init(): Promise<void> {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        executed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  /**
   * Get all executed migrations
   */
  async getExecutedMigrations(): Promise<string[]> {
    const result = await db.all(sql`
      SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version ASC
    `);

    return result.map((row: any) => row.version);
  }

  /**
   * Load migration files from migrations directory
   */
  loadMigrations(): Migration[] {
    try {
      const files = readdirSync(this.migrationsPath)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      return files.map((file) => {
        const content = readFileSync(join(this.migrationsPath, file), 'utf-8');
        const [name] = file.split('.sql');
        const version = name.split('_')[0];

        // Parse up and down migrations
        const upMatch = content.match(/-- @UP\n([\s\S]+?)(?=\n-- @DOWN|$)/);
        const downMatch = content.match(/-- @DOWN\n([\s\S]+?)$/);

        return {
          name,
          version,
          up: upMatch ? upMatch[1].trim() : content,
          down: downMatch ? downMatch[1].trim() : undefined,
        };
      });
    } catch (error) {
      console.log('No migrations directory found, starting fresh.');
      return [];
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const executed = await this.getExecutedMigrations();
    const all = this.loadMigrations();

    return all.filter((m) => !executed.includes(m.version));
  }

  /**
   * Execute a migration
   */
  async executeMigration(migration: Migration): Promise<void> {
    console.log(`\n⬆️  Running migration: ${migration.name}`);

    try {
      // Execute migration in transaction
      await db.run(sql`BEGIN`);

      const statements = migration.up
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await db.run(sql.raw(statement));
      }

      // Record migration
      await db.run(sql`
        INSERT INTO ${MIGRATIONS_TABLE} (version, name)
        VALUES (${migration.version}, ${migration.name})
      `);

      await db.run(sql`COMMIT`);

      console.log(`✅ Migration ${migration.name} completed`);
    } catch (error) {
      await db.run(sql`ROLLBACK`);
      console.error(`❌ Migration ${migration.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(version: string): Promise<void> {
    const migrations = this.loadMigrations();
    const migration = migrations.find((m) => m.version === version);

    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${version} cannot be rolled back`);
    }

    console.log(`\n⬇️  Rolling back migration: ${migration.name}`);

    try {
      await db.run(sql`BEGIN`);

      const statements = migration.down
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await db.run(sql.raw(statement));
      }

      // Remove migration record
      await db.run(sql`
        DELETE FROM ${MIGRATIONS_TABLE} WHERE version = ${version}
      `);

      await db.run(sql`COMMIT`);

      console.log(`✅ Rollback ${migration.name} completed`);
    } catch (error) {
      await db.run(sql`ROLLBACK`);
      console.error(`❌ Rollback ${migration.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    await this.init();

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📋 Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      await this.executeMigration(migration);
    }

    console.log('\n✨ All migrations completed successfully');
  }

  /**
   * Rollback the last migration
   */
  async rollbackLast(): Promise<void> {
    await this.init();

    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) {
      console.log('❌ No migrations to rollback');
      return;
    }

    const lastVersion = executed[executed.length - 1];
    await this.rollbackMigration(lastVersion);
  }

  /**
   * Rollback specific number of migrations
   */
  async rollback(steps: number = 1): Promise<void> {
    await this.init();

    const executed = await this.getExecutedMigrations();
    const toRollback = executed.slice(-steps);

    if (toRollback.length === 0) {
      console.log('❌ No migrations to rollback');
      return;
    }

    // Rollback in reverse order
    for (let i = toRollback.length - 1; i >= 0; i--) {
      await this.rollbackMigration(toRollback[i]);
    }
  }

  /**
   * Show migration status
   */
  async status(): Promise<void> {
    await this.init();

    const executed = await this.getExecutedMigrations();
    const all = this.loadMigrations();
    const pending = all.filter((m) => !executed.includes(m.version));

    console.log('\n📊 Migration Status\n');
    console.log('Executed migrations:');
    if (executed.length === 0) {
      console.log('  None');
    } else {
      executed.forEach((version) => {
        const migration = all.find((m) => m.version === version);
        console.log(`  ✅ ${version} - ${migration?.name || 'Unknown'}`);
      });
    }

    console.log('\nPending migrations:');
    if (pending.length === 0) {
      console.log('  None');
    } else {
      pending.forEach((migration) => {
        console.log(`  ⏳ ${migration.version} - ${migration.name}`);
      });
    }

    console.log(`\nTotal: ${executed.length} executed, ${pending.length} pending\n`);
  }

  /**
   * Create a new migration file
   */
  async create(name: string): Promise<void> {
    const timestamp = Date.now();
    const version = timestamp.toString();
    const fileName = `${version}_${name}.sql`;
    const filePath = join(this.migrationsPath, fileName);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add your migration description here

-- @UP
BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--   id INTEGER PRIMARY KEY,
--   name TEXT NOT NULL
-- );

COMMIT;

-- @DOWN
BEGIN;

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example_table;

COMMIT;
`;

    const { writeFile } = await import('fs/promises');
    await writeFile(filePath, template);

    console.log(`✅ Migration file created: ${filePath}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'migrate':
      case 'up':
        await runner.migrate();
        break;

      case 'rollback':
      case 'down':
        if (param === 'all') {
          const executed = await runner.getExecutedMigrations();
          await runner.rollback(executed.length);
        } else {
          const steps = param ? parseInt(param, 10) : 1;
          await runner.rollback(steps);
        }
        break;

      case 'status':
        await runner.status();
        break;

      case 'create':
        if (!param) {
          console.error('❌ Migration name is required');
          process.exit(1);
        }
        await runner.create(param);
        break;

      case 'init':
        await runner.init();
        console.log('✅ Migrations initialized');
        break;

      default:
        console.log(`
📦 One Board Migration Runner

Usage:
  npm run db:migrate migrate       Run all pending migrations
  npm run db:migrate rollback [n]  Rollback last n migrations (default: 1)
  npm run db:migrate rollback all  Rollback all migrations
  npm run db:migrate status         Show migration status
  npm run db:migrate create <name>  Create a new migration file
  npm run db:migrate init           Initialize migrations table

Examples:
  npm run db:migrate migrate
  npm run db:migrate rollback
  npm run db:migrate rollback 3
  npm run db:migrate create add_users_table
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { MigrationRunner };
