'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/service'
import type { AuthState, Profile } from '@/lib/auth/types'

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  const mounted = useRef(true)

  /** Fetch the profile row for the currently authenticated user. */
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data as Profile
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const profile = await fetchProfile(state.user.id)
    if (mounted.current) {
      setState((prev) => ({ ...prev, profile }))
    }
  }, [state.user, fetchProfile])

  const handleSignOut = useCallback(async () => {
    await signOut()
    if (mounted.current) {
      setState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      })
    }
  }, [])

  // Initialise + subscribe to auth state changes
  useEffect(() => {
    mounted.current = true

    // Bootstrap the session on mount
    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!mounted.current) return

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          session,
          loading: false,
          error: null,
        })
      } else {
        setState((prev) => ({ ...prev, loading: false }))
      }
    }

    bootstrap()

    // Listen to future auth events
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return

      if (event === 'SIGNED_OUT' || !session) {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
        })
        return
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          session,
          loading: false,
          error: null,
        })
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
