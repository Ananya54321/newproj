'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getNotifications, markNotificationRead, markAllNotificationsRead, formatPostDate } from '@/lib/community/service'
import { supabaseClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/auth/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    if (!user?.id) return
    getNotifications(user.id).then(setNotifications).catch(console.error)

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border/60 flex-row items-center justify-between space-y-0">
            <SheetTitle className="font-serif text-xl">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline boty-transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">All caught up</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No notifications yet</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={handleMarkRead}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
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
  const content = (
    <div
      className={cn(
        'flex items-start gap-3 px-5 py-4 hover:bg-muted/50 boty-transition cursor-pointer',
        !n.is_read && 'bg-primary/5'
      )}
      onClick={() => onRead(n)}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full mt-1.5 shrink-0',
          n.is_read ? 'bg-transparent' : 'bg-primary'
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
        {n.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1.5">{formatPostDate(n.created_at)}</p>
      </div>
    </div>
  )

  if (n.link) {
    return (
      <Link href={n.link} onClick={onClose}>
        {content}
      </Link>
    )
  }
  return content
}
