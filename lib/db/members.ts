import { eq, and, or, desc, count } from 'drizzle-orm';
import { db } from './index';
import { members, type Member, type NewMember } from './schema';
import { hashPassword, verifyPassword } from '../utils/security';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schemas
export const createMemberSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional().nullable(),
  password: z.string().min(8),
  nickname: z.string().min(2).max(50),
  name: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

export const updateMemberSchema = createMemberSchema
  .partial()
  .extend({
    id: z.number(),
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

/**
 * Create a new member
 */
export async function createMember(data: {
  username: string;
  email: string | null;
  password: string;
  nickname: string;
  name: string | null;
  phone: string | null;
}): Promise<Member> {
  // Validate input
  const validatedData = createMemberSchema.parse(data);

  // Check if username already exists
  const existingUsername = await findMemberByUsername(validatedData.username);
  if (existingUsername) {
    throw new Error('이미 존재하는 아이디입니다.');
  }

  // Check if email already exists
  if (validatedData.email) {
    const existingEmail = await findMemberByEmail(validatedData.email);
    if (existingEmail) {
      throw new Error('이미 존재하는 이메일입니다.');
    }
  }

  // Check if nickname already exists
  const existingNickname = await findMemberByNickname(validatedData.nickname);
  if (existingNickname) {
    throw new Error('이미 존재하는 닉네임입니다.');
  }

  // Hash password
  const passwordHash = await hashPassword(validatedData.password);

  // Insert member
  const result = await db
    .insert(members)
    .values({
      username: validatedData.username,
      email: validatedData.email,
      passwordHash,
      nickname: validatedData.nickname,
      name: validatedData.name,
      phone: validatedData.phone,
    })
    .returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('회원 생성에 실패했습니다.');
  }

  return result[0] as Member;
}

/**
 * Find member by username
 */
export async function findMemberByUsername(
  username: string
): Promise<Member | undefined> {
  const result = await db
    .select()
    .from(members)
    .where(eq(members.username, username));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as Member;
}

/**
 * Find member by email
 */
export async function findMemberByEmail(
  email: string
): Promise<Member | undefined> {
  const result = await db
    .select()
    .from(members)
    .where(eq(members.email, email));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as Member;
}

/**
 * Find member by nickname
 */
export async function findMemberByNickname(
  nickname: string
): Promise<Member | undefined> {
  const result = await db
    .select()
    .from(members)
    .where(eq(members.nickname, nickname));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as Member;
}

/**
 * Find member by ID
 */
export async function findMemberById(
  id: number
): Promise<Member | undefined> {
  const result = await db
    .select()
    .from(members)
    .where(eq(members.id, id));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as Member;
}

/**
 * Update member information
 */
export async function updateMember(
  id: number,
  data: Partial<{
    email: string | null;
    nickname: string;
    name: string | null;
    phone: string | null;
    profileImage: string | null;
    action?: string;
  }>
): Promise<Member> {
  // Handle special actions
  if (data.action === 'reset_password') {
    // This is a placeholder - actual reset is done by updateMemberPassword
    const member = await findMemberById(id);
    if (!member) {
      throw new Error('회원을 찾을 수 없습니다.');
    }
    return member;
  }

  // Validate data
  if (data.nickname) {
    const existingNickname = await findMemberByNickname(data.nickname);
    if (existingNickname && existingNickname.id !== id) {
      throw new Error('이미 존재하는 닉네임입니다.');
    }
  }

  if (data.email) {
    const existingEmail = await findMemberByEmail(data.email);
    if (existingEmail && existingEmail.id !== id) {
      throw new Error('이미 존재하는 이메일입니다.');
    }
  }

  // Update member
  const result = await db
    .update(members)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id))
    .returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('회원을 찾을 수 없습니다.');
  }

  return result[0] as Member;
}

/**
 * Change member password
 */
export async function updateMemberPassword(
  id: number,
  data: {
    currentPassword: string;
    newPassword: string;
  }
): Promise<void> {
  const validatedData = changePasswordSchema.parse(data);

  // Find member
  const member = await findMemberById(id);
  if (!member) {
    throw new Error('회원을 찾을 수 없습니다.');
  }

  // Verify current password
  const isValid = await verifyPassword(
    validatedData.currentPassword,
    member.passwordHash
  );
  if (!isValid) {
    throw new Error('현재 비밀번호가 올바르지 않습니다.');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(validatedData.newPassword);

  // Update password
  await db
    .update(members)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));
}

/**
 * Soft delete member (update status to DELETED)
 */
export async function deleteMember(id: number): Promise<void> {
  const member = await findMemberById(id);
  if (!member) {
    throw new Error('회원을 찾을 수 없습니다.');
  }

  // Check if admin account
  if (member.role === 2) {
    throw new Error('관리자 계정은 삭제할 수 없습니다.');
  }

  await db
    .update(members)
    .set({
      status: 0, // DELETED
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));
}

/**
 * Verify password for login
 */
export async function verifyMemberPassword(
  username: string,
  password: string
): Promise<Member> {
  // Find member by username
  const member = await findMemberByUsername(username);
  if (!member) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  // Check account status
  if (member.status === 0) {
    throw new Error('탈퇴한 계정입니다.');
  }

  if (member.status === 2) {
    throw new Error('정지된 계정입니다.');
  }

  // Check if account is locked
  if (member.lockedUntil && new Date(member.lockedUntil) > new Date()) {
    throw new Error('계정이 잠겨있습니다. 잠시 후 다시 시도해주세요.');
  }

  // Verify password
  const isValid = await verifyPassword(password, member.passwordHash);
  if (!isValid) {
    // Increment login fail count
    await incrementLoginFailCount(member.id);
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  // Reset login fail count on successful login
  await resetLoginFailCount(member.id);

  return member;
}

/**
 * Increment login fail count
 */
export async function incrementLoginFailCount(id: number): Promise<void> {
  const member = await findMemberById(id);
  if (!member) {
    return;
  }

  const newFailCount = member.loginFailCount + 1;

  // Lock account after 5 failed attempts
  if (newFailCount >= 5) {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes

    await db
      .update(members)
      .set({
        loginFailCount: newFailCount,
        lockedUntil: lockUntil.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(members.id, id));
  } else {
    await db
      .update(members)
      .set({
        loginFailCount: newFailCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(members.id, id));
  }
}

/**
 * Reset login fail count
 */
export async function resetLoginFailCount(id: number): Promise<void> {
  await db
    .update(members)
    .set({
      loginFailCount: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));
}

/**
 * Lock account manually
 */
export async function lockAccount(id: number, reason?: string): Promise<void> {
  const lockUntil = new Date();
  lockUntil.setHours(lockUntil.getHours() + 24); // Lock for 24 hours by default

  await db
    .update(members)
    .set({
      status: 2, // SUSPENDED
      lockedUntil: lockUntil.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));
}

/**
 * Unlock account
 */
export async function unlockAccount(id: number): Promise<void> {
  await db
    .update(members)
    .set({
      status: 1, // ACTIVE
      lockedUntil: null,
      loginFailCount: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));
}

/**
 * Update last login time
 */
export async function updateLastLoginTime(
  id: number,
  ipAddress?: string
): Promise<void> {
  await db
    .update(members)
    .set({
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));
}

/**
 * Get all members (admin only)
 */
export async function getAllMembers(options?: {
  limit?: number;
  offset?: number;
  status?: number;
}): Promise<Member[]> {
  const { limit = 50, offset = 0, status } = options || {};

  const conditions = [];

  if (status !== undefined) {
    conditions.push(eq(members.status, status));
  }

  return db
    .select()
    .from(members)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(members.createdAt)) as any;
}

/**
 * Count members
 */
export async function countMembers(options?: {
  status?: number;
}): Promise<number> {
  const { status } = options || {};

  const conditions = [];

  if (status !== undefined) {
    conditions.push(eq(members.status, status));
  }

  const [result] = await db
    .select({ count: count() })
    .from(members)
    .where(and(...conditions));

  return result ? Number(result.count) : 0;
}

/**
 * Search members
 */
export async function searchMembers(
  query: string,
  limit: number = 20
): Promise<Member[]> {
  const result = await db
    .select()
    .from(members)
    .where(
      or(
        eq(members.username, query),
        eq(members.email, query),
        eq(members.nickname, query)
      )
    )
    .limit(limit);

  return result as Member[];
}

/**
 * Verify email
 */
export async function verifyEmail(
  verificationToken: string
): Promise<void> {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.emailVerificationToken, verificationToken));

  if (!member) {
    throw new Error('인증 토큰이 유효하지 않습니다.');
  }

  await db
    .update(members)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, member.id));
}

/**
 * Set email verification token
 */
export async function setEmailVerificationToken(
  id: number,
  token: string
): Promise<void> {
  await db
    .update(members)
    .set({
      emailVerificationToken: token,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));
}
