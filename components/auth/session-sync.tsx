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
        // Clear server-side cookies first, then redirect from any protected path
        await fetch('/api/auth/session', { method: 'DELETE' })
        const PROTECTED = [
          '/dashboard', '/onboarding', '/pets', '/appointments', '/emergency',
          '/orders', '/profile', '/store', '/ngo', '/admin', '/community',
          '/ngos', '/marketplace', '/vets', '/checkout', '/vet-practice',
        ]
        const path = window.location.pathname
        const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + '/'))
        if (isProtected) {
          window.location.href = '/login'
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Pass tokens directly - avoids re-acquiring the auth lock mid-refresh
        syncedRef.current = false
        await syncSessionWithServer({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
        syncedRef.current = true
      } else if (event === 'SIGNED_IN' && session) {
        syncedRef.current = false
        await syncSessionWithServer({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
        syncedRef.current = true
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
