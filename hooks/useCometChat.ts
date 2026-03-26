import { useCallback, useEffect, useState } from 'react'
import type { Profile } from '@/lib/auth/types'

type ChatStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'error'

export function useCometChat(profile: Profile | null) {
  const [status, setStatus] = useState<ChatStatus>('idle')

  useEffect(() => {
    if (!profile) return

    // Frontend guard — real enforcement is backend
    if (profile.role !== 'user') {
      setStatus('denied')
      return
    }

    let cancelled = false

    const connect = async () => {
      setStatus('loading')
      try {
        // Dynamic imports keep CometChat (browser-only) out of the SSR bundle
        const { initCometChat } = await import('@/CometChat/initCometChat')
        const { loginCometChat } = await import('@/lib/cometchatAuth')
        await initCometChat()
        await loginCometChat()
        if (!cancelled) setStatus('ready')
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : ''
        setStatus(msg === 'CHAT_NOT_ALLOWED' ? 'denied' : 'error')
      }
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [profile?.id, profile?.role]) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    const { logoutCometChat } = await import('@/lib/cometchatAuth')
    await logoutCometChat()
  }, [])

  return { status, logout }
}
