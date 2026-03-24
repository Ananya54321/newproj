'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

/**
 * Redirects admin users to /admin when they land on non-admin pages.
 * Rendered inside the dashboard layout so it applies to all protected routes.
 */
export function AdminRedirect() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && profile?.role === 'admin' && !pathname.startsWith('/admin')) {
      router.replace('/admin')
    }
  }, [loading, profile, pathname, router])

  return null
}
