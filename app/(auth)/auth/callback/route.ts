import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * GET /auth/callback
 *
 * Handles two Supabase auth flows:
 *  1. PKCE code exchange — `code` param (email confirmation + OAuth)
 *  2. OTP / magic link  — `token_hash` + `type` params
 *
 * With @supabase/ssr the PKCE code_verifier is stored in a cookie by the
 * browser client, so the code exchange happens entirely server-side here.
 * No client-side redirect is needed.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'
  const urlError = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')

  // ── Provider-level error ─────────────────────────────────────────────
  if (urlError) {
    const dest =
      type === 'recovery'
        ? `/forgot-password?error=${encodeURIComponent(errorDescription ?? urlError)}`
        : `/login?error=${encodeURIComponent(errorDescription ?? urlError)}`
    return NextResponse.redirect(new URL(dest, url.origin))
  }

  // Cookies set by Supabase during the session exchange — forwarded to the
  // redirect response so the server session is established immediately.
  const pendingCookies: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  // ── PKCE code exchange (email confirmation + OAuth) ───────────────────
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      const response = NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
      )
      applyPendingCookies(response, pendingCookies)
      return response
    }

    if (data.user) {
      await createProfileIfMissing(data.user)
    }

    const dest = determineRedirect(data.user, next)
    const response = NextResponse.redirect(new URL(dest, url.origin))
    applyPendingCookies(response, pendingCookies)
    return response
  }

  // ── OTP / magic-link (token_hash flow) ───────────────────────────────
  if (token_hash && type) {
    if (type === 'recovery') {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'recovery',
      })
      const dest = verifyError
        ? `/forgot-password?error=${encodeURIComponent(verifyError.message)}`
        : '/reset-password'
      const response = NextResponse.redirect(new URL(dest, url.origin))
      applyPendingCookies(response, pendingCookies)
      return response
    }

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      // Supabase email OTP types: signup, recovery, email, email_change, invite
      type: type as 'signup' | 'recovery' | 'email' | 'email_change' | 'invite',
    })

    if (verifyError) {
      console.error('[auth/callback] verifyOtp error:', verifyError.message)
      const response = NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(verifyError.message)}`, url.origin)
      )
      applyPendingCookies(response, pendingCookies)
      return response
    }

    if (verifyData?.user) {
      await createProfileIfMissing(verifyData.user)
    }

    const dest = determineRedirect(verifyData?.user ?? null, next)
    const response = NextResponse.redirect(new URL(dest, url.origin))
    applyPendingCookies(response, pendingCookies)
    return response
  }

  // Fallback — no valid params
  return NextResponse.redirect(new URL('/login', url.origin))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyPendingCookies(
  response: NextResponse,
  cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>
) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<ReturnType<typeof NextResponse.redirect>['cookies']['set']>[2])
  })
}

async function createProfileIfMissing(user: User) {
  try {
    const admin = createServerSupabaseAdminClient()
    const { data: existing } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    const meta = user.user_metadata ?? {}
    const role = (meta.role as string) ?? 'user'
    const needsVerification = ['veterinarian', 'ngo', 'store_owner'].includes(role)

    if (!existing) {
      await admin.from('profiles').insert({
        id: user.id,
        email: user.email ?? '',
        full_name: (meta.full_name as string) ?? null,
        role,
        avatar_url: (meta.avatar_url as string) ?? null,
        verification_status: needsVerification ? 'pending' : null,
      })
    }

    // Ensure specialty table row exists for professional roles.
    // This runs on both new signups and re-visits (idempotent via upsert).
    const effectiveRole = existing?.role ?? role

    if (effectiveRole === 'veterinarian') {
      await admin.from('veterinarians').upsert(
        {
          id: user.id,
          license_number: (meta.license_number as string) ?? null,
          clinic_name: (meta.clinic_name as string) ?? null,
          clinic_address: (meta.clinic_address as string) ?? null,
          license_document_url: (meta.license_document_url as string) ?? null,
          extra_document_urls: (meta.extra_document_urls as string[]) ?? [],
          social_links: (meta.social_links as Record<string, string>) ?? {},
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      // Also store address + coords on profile
      if (meta.clinic_address) {
        await admin.from('profiles').update({ address: meta.clinic_address }).eq('id', user.id)
      }
    } else if (effectiveRole === 'ngo') {
      await admin.from('ngos').upsert(
        {
          id: user.id,
          organization_name: (meta.organization_name as string) ?? 'Unnamed Organisation',
          registration_number: (meta.registration_number as string) ?? null,
          mission_statement: (meta.mission_statement as string) ?? null,
          registration_document_url: (meta.registration_document_url as string) ?? null,
          extra_document_urls: (meta.extra_document_urls as string[]) ?? [],
          social_links: (meta.social_links as Record<string, string>) ?? {},
          accepts_donations: true,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      if (meta.address) {
        await admin.from('profiles').update({ address: meta.address }).eq('id', user.id)
      }
    } else if (effectiveRole === 'store_owner') {
      const storeName = (meta.store_name as string) ?? null
      if (storeName) {
        const slug = storeName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        await admin.from('stores').upsert(
          {
            owner_id: user.id,
            name: storeName,
            slug,
            address: (meta.address as string) ?? null,
            store_images: (meta.store_images as string[]) ?? [],
            social_links: (meta.social_links as Record<string, string>) ?? {},
            is_active: false,
          },
          { onConflict: 'owner_id', ignoreDuplicates: true }
        )
      }
      if (meta.address) {
        await admin.from('profiles').update({ address: meta.address }).eq('id', user.id)
      }
    }
  } catch (err) {
    // Non-fatal — the DB trigger on auth.users also creates the profile row
    console.error('[auth/callback] Could not create profile:', err)
  }
}

function determineRedirect(user: User | null, fallback: string): string {
  if (!user) return fallback
  const role = (user.user_metadata?.role as string) ?? 'user'
  if (['veterinarian', 'ngo', 'store_owner'].includes(role)) return '/onboarding'
  return fallback
}
