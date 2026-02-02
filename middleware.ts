import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Define protected routes and their required permissions
const protectedRoutes = {
  '/admin': 2, // Admin only
  '/write': 1, // Member only
} as const;

// Define public routes that don't need authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/boards',          // 게시판 목록 (공개)
  '/api/posts',           // 게시글 목록 (공개)
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session from cookie (used for both protected routes and API auth)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  // Check if it's a public route
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public access to specific API routes
  if (pathname.startsWith('/api/posts/') && !pathname.match(/\/api\/posts\/\d+\/(like|edit|delete)/)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/comments/') && !pathname.match(/\/api\/comments\/\d+\/(like|edit|delete)/)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/boards/') && !pathname.match(/\/api\/boards\/\d+\/(edit|delete)/)) {
    return NextResponse.next();
  }

  // Check if it's a protected route
  for (const [route, requiredRole] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!sessionCookie) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Parse session data
      let sessionUser: { id: number; role: number };
      try {
        sessionUser = JSON.parse(sessionCookie.value);
      } catch {
        // Invalid session, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user has required role
      if (sessionUser.role < requiredRole) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  // For API routes that need authentication, check headers
  if (pathname.startsWith('/api/')) {
    // Auth APIs are always public (they handle their own auth)
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // Allow public access to posts/comments/boards GET requests
    if ((pathname.startsWith('/api/posts/') || pathname.startsWith('/api/comments/') || pathname.startsWith('/api/boards/')) &&
        request.method === 'GET') {
      return NextResponse.next();
    }

    // API routes that need authentication
    if (!sessionCookie) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    try {
      const sessionUser = JSON.parse(sessionCookie.value);
      // Add user info to request headers for API routes to use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', sessionUser.id.toString());
      requestHeaders.set('x-user-role', sessionUser.role.toString());

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
