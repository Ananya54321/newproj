import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/auth/types'

const APP_ID = process.env.COMETCHAT_APP_ID!
const REGION = process.env.COMETCHAT_REGION!
const API_KEY = process.env.COMETCHAT_API_KEY!

const BASE_URL = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`

async function upsertCometChatUser(uid: string, name: string): Promise<void> {
  await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: API_KEY },
    body: JSON.stringify({ uid, name }),
  }).catch(() => {
    // User may already exist — safe to ignore
  })
}

async function generateAuthToken(uid: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/users/${uid}/auth_tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: API_KEY },
    body: JSON.stringify({ force: true }),
  })

  if (!res.ok) {
    throw new Error(`CometChat token generation failed: ${res.status}`)
  }

  const data = await res.json()
  return data.data.authToken as string
}

export async function POST(req: NextRequest) {
  // ── 1. Verify Supabase session ────────────────────────────────────────────
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Fetch profile to check role ────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'role' | 'full_name' | 'email'> | null; error: unknown }

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // ── 3. HARD BLOCK — only 'user' role (pet owners) get chat ───────────────
  if (profile.role !== 'user') {
    return NextResponse.json(
      { error: 'Chat is only available for pet owners' },
      { status: 403 }
    )
  }

  // ── 4. Create or upsert CometChat user ────────────────────────────────────
  const displayName = profile.full_name ?? profile.email ?? user.id
  await upsertCometChatUser(user.id, displayName)

  // ── 5. Issue auth token ───────────────────────────────────────────────────
  try {
    const token = await generateAuthToken(user.id)
    return NextResponse.json({ token })
  } catch (err) {
    console.error('[CometChat] token error:', err)
    return NextResponse.json({ error: 'Failed to generate chat token' }, { status: 500 })
  }
}
