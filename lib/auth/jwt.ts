import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionUser {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
  role: number;
  profileImage: string | null;
}

export interface JWTPayload extends JoseJWTPayload {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
  role: number;
  profileImage: string | null;
}

/**
 * Create JWT token for session
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload: JWTPayload = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return token;
}

/**
 * Verify JWT token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    return {
      id: payload.id as number,
      username: payload.username as string,
      nickname: payload.nickname as string,
      email: payload.email as string | null,
      role: payload.role as number,
      profileImage: payload.profileImage as string | null,
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Get session from request
 */
export async function getSessionFromRequest(
  request: Request
): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  const sessionToken = cookies['session'];

  if (!sessionToken) {
    return null;
  }

  return await verifySessionToken(sessionToken);
}
