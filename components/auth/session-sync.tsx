'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { syncSessionWithServer } from '@/lib/auth/service'

/**
 * Invisible component placed in the root layout.
 * Ensures the client-side Supabase session is reflected in server-side cookies
 * so SSR/middleware can always read auth state correctly.
 */
export function SessionSync() {
  const router = useRouter()
  const syncedRef = useRef(false)
  const lastEventRef = useRef<string | null>(null)

  useEffect(() => {
    // Sync on first mount
    const initialSync = async () => {
      if (syncedRef.current) return
      await syncSessionWithServer()
      syncedRef.current = true
    }

    initialSync()

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      // Debounce rapid-fire events of the same type
      if (lastEventRef.current === event) return
      lastEventRef.current = event

      if (event === 'SIGNED_OUT') {
        // Redirect to login if the user was on a protected page
        const isDashboard = window.location.pathname.startsWith('/dashboard')
        const isOnboarding = window.location.pathname.startsWith('/onboarding')
        if (isDashboard || isOnboarding) {
          window.location.href = '/login'
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Persist the refreshed tokens server-side
        syncedRef.current = false
        await syncSessionWithServer()
        syncedRef.current = true
      } else if (event === 'SIGNED_IN' && session) {
        syncedRef.current = false
        await syncSessionWithServer()
        syncedRef.current = true
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
