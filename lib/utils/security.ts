import bcrypt from 'bcryptjs';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sanitize user input (XSS prevention)
 */
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove all HTML tags by default
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize HTML content (allow basic HTML tags)
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'title'],
  });
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email);
  return result.success;
}

/**
 * Validate password strength
 * Requirements: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호에는 최소 1개의 대문자가 포함되어야 합니다.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호에는 최소 1개의 소문자가 포함되어야 합니다.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호에는 최소 1개의 숫자가 포함되어야 합니다.');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('비밀번호에는 최소 1개의 특수문자가 포함되어야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate secure token
 */
export function generateToken(length: number = 64): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize username
 * Rules: alphanumeric, underscore, hyphen, 3-20 characters
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  const schema = z
    .string()
    .min(3, '아이디는 최소 3자 이상이어야 합니다.')
    .max(20, '아이디는 최대 20자까지 가능합니다.')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      '아이디는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다.'
    );

  const result = schema.safeParse(username);

  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
}

/**
 * Validate and sanitize nickname
 * Rules: 2-20 characters, no special characters except basic punctuation
 */
export function validateNickname(nickname: string): {
  isValid: boolean;
  error?: string;
} {
  const schema = z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(20, '닉네임은 최대 20자까지 가능합니다.')
    .regex(
      /^[가-힣a-zA-Z0-9\s]+$/,
      '닉네임에는 한글, 영문, 숫자만 사용할 수 있습니다.'
    );

  const result = schema.safeParse(nickname);

  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number
): boolean {
  return fileSize <= maxSize;
}

/**
 * Sanitize filename (remove path traversal, special characters)
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const sanitized = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');

  // Remove dangerous characters
  return sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Check if string contains SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE)\b)/i,
    /('|(--)|(;)|(\/\*)|(\*\/))/,
    /(\bOR\b.*=\b.*\bOR\b)/i,
    /(\bAND\b.*=\b.*\bAND\b)/i,
    /(\bXOR\b)/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Check if string contains XSS patterns
 */
export function detectXss(input: string): boolean {
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Mask email for privacy
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.slice(0, 2)}***@${domain}`;
}

/**
 * Mask phone number for privacy
 */
export function maskPhone(phone: string): string {
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-****-${phone.slice(7)}`;
  }
  return phone;
}
