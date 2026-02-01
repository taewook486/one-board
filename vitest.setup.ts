import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = ':memory:';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock fs/promises for testing
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock Sharp for image processing tests
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn(() => ({
      toBuffer: vi.fn(() => Promise.resolve(Buffer.from('test'))),
    })),
    metadata: vi.fn(() => Promise.resolve({ width: 1920, height: 1080 })),
    toFormat: vi.fn(() => ({
      toBuffer: vi.fn(() => Promise.resolve(Buffer.from('test'))),
    })),
  })),
}));

// Mock better-sqlite3
vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => ({
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    })),
    exec: vi.fn(),
    close: vi.fn(),
  })),
}));
