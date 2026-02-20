import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = ':memory:';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-token-generation';

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

// Mock Next.js headers API (cookies)
const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
const mockCookieDelete = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    set: mockCookieSet,
    get: mockCookieGet,
    delete: mockCookieDelete,
  })),
}));

// Export mock functions for test access
(global as any).__mockCookieSet = mockCookieSet;
(global as any).__mockCookieGet = mockCookieGet;
(global as any).__mockCookieDelete = mockCookieDelete;
