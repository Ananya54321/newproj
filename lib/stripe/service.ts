/**
 * Stripe Connect service.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY              - server-side secret key
 *   STRIPE_CONNECT_CLIENT_ID       - OAuth client_id from Stripe Connect settings
 *   NEXT_PUBLIC_APP_URL            - your app's base URL (e.g. http://localhost:3000)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { StripeConnection } from '@/lib/auth/types'

const CONNECT_CLIENT_ID = process.env.STRIPE_CONNECT_CLIENT_ID ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/** Builds the Stripe Connect OAuth URL for the given user. */
export function getStripeConnectUrl(userId: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CONNECT_CLIENT_ID,
    scope: 'read_write',
    redirect_uri: `${APP_URL}/api/stripe/connect/callback`,
    state: userId,
  })
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`
}

/** Exchanges an OAuth code for a Stripe account ID and stores it in Supabase. */
export async function exchangeStripeCode(
  code: string,
  userId: string
): Promise<{ accountId: string | null; error: string | null }> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return { accountId: null, error: 'Stripe not configured.' }

  try {
    const res = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_secret: secretKey,
      }).toString(),
    })

    const data = (await res.json()) as {
      access_token?: string
      stripe_user_id?: string
      error?: string
      error_description?: string
    }

    if (data.error || !data.stripe_user_id) {
      return { accountId: null, error: data.error_description ?? data.error ?? 'Stripe OAuth failed.' }
    }

    // Store in DB
    const { createServerSupabaseAdminClient } = await import('@/lib/supabase/server')
    const admin = createServerSupabaseAdminClient()
    const { error: dbError } = await admin
      .from('stripe_connections')
      .upsert(
        {
          user_id: userId,
          stripe_account_id: data.stripe_user_id,
          charges_enabled: false,
          details_submitted: false,
        },
        { onConflict: 'user_id' }
      )

    if (dbError) return { accountId: null, error: dbError.message }
    return { accountId: data.stripe_user_id, error: null }
  } catch (err) {
    return { accountId: null, error: err instanceof Error ? err.message : 'Unknown error.' }
  }
}

/** Fetches the Stripe connection for a user from Supabase. */
export async function getStripeConnection(
  userId: string,
  client: SupabaseClient
): Promise<StripeConnection | null> {
  const { data } = await client
    .from('stripe_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as StripeConnection | null) ?? null
}
