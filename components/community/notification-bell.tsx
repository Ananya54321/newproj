'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/community/service'
import { supabaseClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/auth/types'
import { formatPostDate } from '@/lib/community/service'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    if (!user?.id) return
    getNotifications(user.id).then(setNotifications).catch(console.error)

    // Real-time subscription
    const channel = supabaseClient
      .channel(`notifications:${user.id}`)
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
      .subscribe()

    return () => { supabaseClient.removeChannel(channel) }
  }, [user?.id])

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => setOpen((o) => !o)

  const handleMarkRead = async (n: Notification) => {
    if (n.is_read) return
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
    await markNotificationRead(n.id)
  }

  const handleMarkAll = async () => {
    if (!user?.id) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await markAllNotificationsRead(user.id)
  }

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted boty-transition"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border/60 rounded-2xl boty-shadow z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="font-semibold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs text-primary hover:underline boty-transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={handleMarkRead} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification: n,
  onRead,
  onClose,
}: {
  notification: Notification
  onRead: (n: Notification) => void
  onClose: () => void
}) {
  const inner = (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 boty-transition cursor-pointer',
        !n.is_read && 'bg-primary/5'
      )}
      onClick={() => onRead(n)}
    >
      <div className={cn(
        'w-2 h-2 rounded-full mt-1.5 shrink-0',
        n.is_read ? 'bg-transparent' : 'bg-primary'
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
        {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-xs text-muted-foreground mt-1">{formatPostDate(n.created_at)}</p>
      </div>
    </div>
  )

  if (n.link) {
    return (
      <Link href={n.link} onClick={onClose}>
        {inner}
      </Link>
    )
  }
  return inner
}
