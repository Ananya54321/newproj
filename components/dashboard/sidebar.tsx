'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingBag,
  AlertTriangle,
  CalendarDays,
  User,
  LogOut,
  Menu,
  PawPrint,
  X,
  Package,
  Users,
  Heart,
  Stethoscope,
  Store,
  Building2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/components/boty/cart-context'
import { NotificationBell } from '@/components/community/notification-bell'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean }

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  user: [
    { href: '/pets',         label: 'My Pets',        icon: PawPrint },
    { href: '/appointments', label: 'Appointments',    icon: CalendarDays },
    { href: '/vets',         label: 'Find a Vet',      icon: Stethoscope },
    { href: '/emergency',    label: 'Emergency',       icon: AlertTriangle },
    { href: '/marketplace',  label: 'Marketplace',     icon: ShoppingBag },
    { href: '/orders',       label: 'My Orders',       icon: Package },
    { href: '/community',    label: 'Community',       icon: Users },
    { href: '/ngos',         label: 'NGOs & Rescues',  icon: Heart },
    { href: '/chat',         label: 'Chat',            icon: MessageSquare },
    { href: '/profile',      label: 'Profile',         icon: User },
  ],
  store_owner: [
    { href: '/store',       label: 'My Store',       icon: Store },
    { href: '/orders',      label: 'Orders',          icon: Package },
    { href: '/marketplace', label: 'Marketplace',     icon: ShoppingBag },
    { href: '/emergency',   label: 'Emergency',       icon: AlertTriangle },
    { href: '/community',   label: 'Community',       icon: Users },
    { href: '/ngos',        label: 'NGOs & Rescues',  icon: Heart },
    { href: '/profile',     label: 'Profile',         icon: User },
  ],
  veterinarian: [
    { href: '/vet-practice',          label: 'My Practice', icon: Stethoscope, exact: true },
    { href: '/vet-practice/schedule', label: 'My Schedule', icon: CalendarDays },
    { href: '/emergency',             label: 'Emergency',   icon: AlertTriangle },
    { href: '/community',             label: 'Community',   icon: Users },
    { href: '/ngos',                  label: 'NGOs & Rescues', icon: Heart },
    { href: '/profile',               label: 'Profile',     icon: User },
  ],
  ngo: [
    { href: '/ngo',        label: 'NGO Dashboard',  icon: Building2, exact: true },
    { href: '/ngo/events', label: 'Events',          icon: CalendarDays },
    { href: '/emergency',  label: 'Emergency',       icon: AlertTriangle },
    { href: '/community',  label: 'Community',       icon: Users },
    { href: '/profile',    label: 'Profile',         icon: User },
  ],
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const pathname = usePathname()
  const { signOut, profile, user, loading } = useAuth()
  const { setIsOpen: openCart, itemCount } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Still fetching auth state — render a skeleton placeholder so layout doesn't shift
  if (loading) {
    return (
      <>
        <aside className="hidden lg:flex flex-col w-56 xl:w-60 h-screen border-r border-border/60 bg-card shrink-0 animate-pulse">
          <div className="px-4 py-5 border-b border-border/60">
            <div className="h-5 w-24 rounded bg-secondary mb-1" />
            <div className="h-3 w-32 rounded bg-secondary" />
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-secondary" />
            ))}
          </nav>
        </aside>
        {/* Mobile: keep hamburger area visible during auth loading */}
        <div className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-card border border-border/60 shadow-sm animate-pulse">
          <div className="w-5 h-5 rounded bg-secondary" />
        </div>
      </>
    )
  }

  // Admin has their own top bar; unauthenticated handled by layout
  if (!user || profile?.role === 'admin') return null

  const nav = NAV_BY_ROLE[profile?.role ?? 'user'] ?? NAV_BY_ROLE.user

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    // signOut() triggers SIGNED_OUT in SessionSync which clears cookies + redirects
    await signOut().catch(() => {})
  }

  // ── Shared sidebar content ─────────────────────────────────────────────────

  const sidebarContent = (fullWidth: boolean) => (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className={cn(
        'border-b border-border/60 flex items-center h-[65px]',
        fullWidth && !collapsed ? 'px-4 justify-between' : 'px-2 justify-center'
      )}>
        {fullWidth && !collapsed ? (
          <>
            <Link href="/dashboard">
              <p className="font-serif text-lg font-semibold text-foreground tracking-wide">Furever</p>
              {profile?.full_name && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-36">
                  {profile.full_name}
                </p>
              )}
            </Link>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => openCart(true)}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted boty-transition"
                aria-label="Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-full">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
              <NotificationBell />
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted boty-transition"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : fullWidth && collapsed ? (
          /* Collapsed desktop header */
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted boty-transition"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          /* Mobile header */
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <p className="font-serif text-lg font-semibold text-foreground tracking-wide">Furever</p>
            {profile?.full_name && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-36">
                {profile.full_name}
              </p>
            )}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 py-4 space-y-0.5 overflow-y-auto',
        collapsed && fullWidth ? 'px-2' : 'px-3'
      )}>
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              title={collapsed && fullWidth ? label : undefined}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors',
                collapsed && fullWidth
                  ? 'justify-center p-2.5'
                  : 'gap-3 px-3 py-2.5',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!(collapsed && fullWidth) && label}
            </Link>
          )
        })}
      </nav>

      {/* Emergency CTA */}
      <div className={cn('pb-3', collapsed && fullWidth ? 'px-2' : 'px-3')}>
        <Link
          href="/emergency/report"
          onClick={() => setMobileOpen(false)}
          title={collapsed && fullWidth ? 'Report Emergency' : undefined}
          className={cn(
            'flex items-center w-full py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors',
            collapsed && fullWidth ? 'justify-center' : 'justify-center gap-2'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          {!(collapsed && fullWidth) && 'Report Emergency'}
        </Link>
      </div>

      {/* Sign out */}
      <div className={cn(
        'pb-5 border-t border-border/60 pt-3',
        collapsed && fullWidth ? 'px-2' : 'px-3'
      )}>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed && fullWidth ? 'Sign Out' : undefined}
          className={cn(
            'flex items-center rounded-lg text-sm font-medium text-muted-foreground hover:bg-foreground/6 hover:text-foreground transition-colors w-full disabled:opacity-60 disabled:cursor-not-allowed',
            collapsed && fullWidth ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!(collapsed && fullWidth) && (signingOut ? 'Signing out…' : 'Sign Out')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col h-screen border-r border-border/60 bg-card shrink-0 transition-all duration-200',
        collapsed ? 'w-16' : 'w-56 xl:w-60'
      )}>
        {sidebarContent(true)}
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
            {sidebarContent(false)}
          </aside>
        </>
      )}
    </>
  )
}
