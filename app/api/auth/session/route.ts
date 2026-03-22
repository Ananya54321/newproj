import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/session
 *
 * Syncs the client-side Supabase session (access_token + refresh_token)
 * into server-side HTTP-only cookies so that SSR and middleware can read auth state.
 *
 * Called by SessionSync component on mount and on SIGNED_IN / TOKEN_REFRESHED events.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token, refresh_token } = body as {
      access_token?: string
      refresh_token?: string
    }

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ success: true, userId: data.user?.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
