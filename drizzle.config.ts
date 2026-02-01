import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/oneboard.db',
  },
  // This option will create tables from schema automatically when running db:push
} satisfies Config;
