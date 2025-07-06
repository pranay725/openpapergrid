import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from './lib/supabase-server'
import { checkRateLimit } from './lib/rate-limiter'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/fulltext',
  '/api/ai/confidence',
  // Add more protected routes as needed
];

// Routes with rate limiting
const RATE_LIMITED_ROUTES = {
  '/api/search': 'search',
  '/api/ai/extract': 'abstractExtraction',
  '/api/fulltext': 'fullTextExtraction',
  '/api/scrape-abstract': 'abstractExtraction'
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createSupabaseMiddlewareClient(request, response)
  const path = request.nextUrl.pathname;

  // Refresh session if expired and get authenticated user
  const { data: { session } } = await supabase.auth.getSession()
  
  // For security-critical operations, verify the user
  let verifiedUser = null;
  if (session && (path.startsWith('/api/fulltext') || path.startsWith('/api/ai/confidence'))) {
    const { data: { user } } = await supabase.auth.getUser();
    verifiedUser = user;
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => path.startsWith(route));
  
  if (isProtectedRoute && !verifiedUser && !session) {
    // For API routes, return 401
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // For pages, redirect to login
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Apply rate limiting
  const rateLimitAction = Object.entries(RATE_LIMITED_ROUTES).find(
    ([route]) => path.startsWith(route)
  )?.[1];

  if (rateLimitAction) {
    const userId = session?.user?.id;
    try {
      // Skip rate limiting if service role key is not configured
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not configured, skipping rate limiting');
      } else {
        const rateLimitResult = await checkRateLimit(request, userId, rateLimitAction);
        
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              message: userId 
                ? `Daily limit reached. Please try again after ${rateLimitResult.resetAt.toLocaleString()}`
                : 'Too many requests. Please sign in for higher limits.',
              resetAt: rateLimitResult.resetAt
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': String(rateLimitResult.remaining + 1),
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString()
              }
            }
          );
        }
        
        // Add rate limit headers to successful responses
        response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting if there's an error
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}