'use client'

import { supabaseClient } from '@/lib/supabase/client'
import { AuthSession, SessionResponse, toAuthError } from './types'
import type { AuthChangeEvent } from '@supabase/supabase-js'

export async function getSession(): Promise<SessionResponse> {
  try {
    const { data, error } = await supabaseClient.auth.getSession()
    if (error) return { session: null, error: toAuthError(error) }
    return { session: data.session, error: null }
  } catch (err) {
    return { session: null, error: toAuthError(err as Error) }
  }
}

export async function refreshSession(): Promise<SessionResponse> {
  try {
    const { data, error } = await supabaseClient.auth.refreshSession()
    if (error) return { session: null, error: toAuthError(error) }
    return { session: data.session, error: null }
  } catch (err) {
    return { session: null, error: toAuthError(err as Error) }
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getSession()
  return !!session
}

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: AuthSession | null
) => void

export function onAuthStateChange(callback: AuthStateChangeCallback) {
  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return subscription
}
