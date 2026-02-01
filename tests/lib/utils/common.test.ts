import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatDate,
  formatRelativeTime,
  truncate,
  formatFileSize,
  generateSlug,
  sleep,
  retry,
  debounce,
  throttle,
  isEmpty,
  deepClone,
  generateId,
} from '@/lib/utils/common';

describe('Common Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const date = '2026-01-22T10:00:00Z';
      const formatted = formatDate(date);

      expect(formatted).toBeDefined();
      expect(formatted).toContain('2026');
    });

    it('should format Date object', () => {
      const date = new Date('2026-01-22T10:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toBeDefined();
    });

    it('should use custom options', () => {
      const date = '2026-01-22T10:00:00Z';
      const formatted = formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' });

      expect(formatted).toContain('2026');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-22T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format time just now', () => {
      const date = new Date('2026-01-22T11:59:30Z');
      expect(formatRelativeTime(date)).toBe('방금 전');
    });

    it('should format minutes ago', () => {
      const date = new Date('2026-01-22T11:55:00Z');
      expect(formatRelativeTime(date)).toBe('5분 전');
    });

    it('should format hours ago', () => {
      const date = new Date('2026-01-22T08:00:00Z');
      expect(formatRelativeTime(date)).toBe('4시간 전');
    });

    it('should format days ago', () => {
      const date = new Date('2026-01-20T12:00:00Z');
      expect(formatRelativeTime(date)).toBe('2일 전');
    });

    it('should format months ago', () => {
      const date = new Date('2025-12-22T12:00:00Z');
      expect(formatRelativeTime(date)).toBe('1개월 전');
    });

    it('should format years ago', () => {
      const date = new Date('2024-01-22T12:00:00Z');
      expect(formatRelativeTime(date)).toBe('2년 전');
    });
  });

  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should default to 100 characters', () => {
      const text = 'a'.repeat(150);
      const truncated = truncate(text);
      expect(truncated).toHaveLength(103); // 100 + '...'
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format terabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from text', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello @#$ World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('Hello   World   Test')).toBe('hello-world-test');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(generateSlug('---Hello World---')).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      expect(generateSlug('HELLO WORLD')).toBe('hello-world');
    });
  });

  describe('sleep', () => {
    it('should sleep for specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const fn = () => {
        attempts++;
        return Promise.resolve('success');
      };

      const result = await retry(fn);
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = () => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('fail'));
        }
        return Promise.resolve('success');
      };

      const result = await retry(fn, { maxAttempts: 3, delay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const fn = () => Promise.reject(new Error('fail'));

      await expect(retry(fn, { maxAttempts: 2, delay: 10 })).rejects.toThrow('fail');
    });

    it('should use exponential backoff', async () => {
      let attempts = 0;
      const start = Date.now();
      const fn = () => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('fail'));
        }
        return Promise.resolve('success');
      };

      await retry(fn, { maxAttempts: 3, delay: 50, backoff: 2 });
      const elapsed = Date.now() - start;

      // 50ms (first retry) + 100ms (second retry) = at least 150ms
      expect(elapsed).toBeGreaterThanOrEqual(150);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect limit time', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();

      vi.advanceTimersByTime(99);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isEmpty', () => {
    it('should detect null and undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should detect empty string', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
    });

    it('should detect empty array', () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it('should detect empty object', () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ key: 'value' })).toBe(false);
    });

    it('should handle non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should clone object', () => {
      const obj = { a: 1, b: 2 };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it('should clone nested object', () => {
      const obj = { a: { b: { c: 1 } } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned.a).not.toBe(obj.a);
    });

    it('should clone array', () => {
      const arr = [1, 2, 3];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });

    it('should create independent copy', () => {
      const obj = { a: { b: 1 } };
      const cloned = deepClone(obj);

      cloned.a.b = 2;

      expect(obj.a.b).toBe(1);
      expect(cloned.a.b).toBe(2);
    });
  });

  describe('generateId', () => {
    it('should generate ID without prefix', () => {
      const id = generateId();

      expect(id).toBeDefined();
      expect(id).toBeTruthy();
    });

    it('should generate ID with prefix', () => {
      const id = generateId('user');

      expect(id).toMatch(/^user_/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });
  });
});
