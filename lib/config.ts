import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default('./data/oneboard.db'),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),

  // Upload Settings
  UPLOAD_MAX_SIZE: z.string().transform((val) => parseInt(val, 10)).default('5242880'), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,txt,zip'),

  // Session
  SESSION_MAX_AGE: z.string().transform((val) => parseInt(val, 10)).default('604800'), // 7 days

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

// Validated environment variables
export const env = validateEnv();

// Configuration constants
export const config = {
  // Database
  db: {
    path: env.DATABASE_URL,
  },

  // Authentication
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
    sessionMaxAge: env.SESSION_MAX_AGE,
  },

  // Upload
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(',').map((t) => t.trim().toLowerCase()),
    imageMaxWidth: 1920,
    thumbnailSize: 200,
    uploadPath: '/uploads',
  },

  // Environment
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

export default config;
