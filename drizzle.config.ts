import type { Config } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;

// Check if using Postgres or SQLite
const isPostgres = POSTGRES_URL || DATABASE_URL?.startsWith('postgres');

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  dbCredentials: isPostgres
    ? { url: POSTGRES_URL || DATABASE_URL! }
    : { url: DATABASE_URL || './data/oneboard.db' },
  // This option will create tables from schema automatically when running db:push
} satisfies Config;
