import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/server'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/auth', '/terms', '/privacy']
const AUTH_PATHS = ['/login', '/signup']
const PROTECTED_PATHS = [
  '/dashboard', '/onboarding',
  '/pets', '/appointments', '/emergency', '/orders', '/profile', '/store', '/ngo', '/admin',
  '/community', '/ngos', '/marketplace', '/vets', '/checkout',
  '/vet-practice',
]

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Always allow auth callback
  if (pathname.startsWith('/auth/callback')) return response

  const supabase = createMiddlewareSupabaseClient(request, response)

  // ── Single auth check via getUser (avoids double lock acquisition) ────
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = matchesPrefix(pathname, PROTECTED_PATHS)
  const isAuthPage = matchesPrefix(pathname, AUTH_PATHS)

  // ── Protected routes: must be authenticated ───────────────────────────
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl, { headers: response.headers })
  }

  // ── Auth pages: redirect authenticated users to dashboard ─────────────
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url), {
      headers: response.headers,
    })
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
