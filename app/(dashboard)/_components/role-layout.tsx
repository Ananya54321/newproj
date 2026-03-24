'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { NotificationBell } from '@/components/community/notification-bell'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface RoleTab {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

interface RoleLayoutProps {
  children: React.ReactNode
  tabs: RoleTab[]
  title: string
  subtitle?: string
  icon: React.ElementType
}

export function RoleLayout({ children, tabs }: RoleLayoutProps) {
  const pathname = usePathname()
  const { signOut, profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('You have been signed out.')
    window.location.href = '/'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + notification */}
      <div className="px-4 py-5 border-b border-border/60 flex items-center justify-between">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <p className="font-serif text-lg font-semibold text-foreground tracking-wide">Furever</p>
          {profile?.full_name && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-36">
              {profile.full_name}
            </p>
          )}
        </Link>
        <NotificationBell />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {tabs.map(({ href, label, icon: TabIcon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Emergency CTA */}
      <div className="px-3 pb-3">
        <Link
          href="/emergency/report"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Report Emergency
        </Link>
      </div>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 min-h-screen border-r border-border/60 bg-card shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-card border border-border/60 text-foreground shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r border-border/60 shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
