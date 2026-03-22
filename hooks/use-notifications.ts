'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getNotifications } from '@/lib/community/service'
import { supabaseClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/auth/types'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) { setNotifications([]); return }

    setLoading(true)
    getNotifications(user.id)
      .then(setNotifications)
      .finally(() => setLoading(false))

    const channel = supabaseClient
      .channel(`use-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => n.id === payload.new.id ? { ...n, ...payload.new } as Notification : n)
          )
        }
      )
      .subscribe()

    return () => { supabaseClient.removeChannel(channel) }
  }, [user?.id])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, unreadCount, loading, setNotifications }
}
