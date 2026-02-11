import { cookies } from 'next/headers';
import { verifySessionToken } from './jwt';
import type { SessionUser } from './jwt';

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  return await verifySessionToken(sessionCookie.value);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('인증이 필요합니다.');
  }

  return user;
}

/**
 * Require admin role - throws error if not admin
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role !== 2) {
    throw new Error('관리자만 접근할 수 있습니다.');
  }

  return user;
}

/**
 * Check if user has required role
 */
export async function hasRole(requiredRole: number): Promise<boolean> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return false;
  }

  return user.role >= requiredRole;
}
