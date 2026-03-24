'use client'

import Link from 'next/link'
import { AlertTriangle, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { NotificationBell } from '@/components/community/notification-bell'
import { toast } from 'sonner'

export function AdminTopBar() {
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    toast.success('You have been signed out.')
    window.location.href = '/'
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30">
      <Link href="/admin" className="flex flex-col">
        <span className="font-serif text-lg font-semibold text-foreground tracking-wide">Furever</span>
        {profile?.full_name && (
          <span className="text-xs text-muted-foreground leading-none">
            {profile.full_name} · Admin
          </span>
        )}
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <Link
          href="/emergency/report"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 boty-transition"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Emergency
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground boty-transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
