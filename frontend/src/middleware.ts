import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = !!authCookie;
  const isAuthPage = 
    request.nextUrl.pathname.startsWith('/auth/login') || 
    request.nextUrl.pathname.startsWith('/auth/register');
  
  // If trying to access auth page while already logged in
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If trying to access protected route while not authenticated
  if (!isAuthenticated && !isAuthPage && !request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/api')) {
    if (request.nextUrl.pathname !== '/') {
      // For API requests, return 401
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }
      
      // Redirect to login for non-API requests
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// Specify which paths this middleware applies to
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/tasks/:path*',
    '/messages/:path*',
    '/documents/:path*',
    '/marketing/:path*',
    '/analytics/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
}; 