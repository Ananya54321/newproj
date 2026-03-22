'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShieldCheck, Users, AlertTriangle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_TABS = [
  { label: 'Overview',      href: '/admin',              icon: LayoutDashboard },
  { label: 'Verifications', href: '/admin/verifications', icon: ShieldCheck },
  { label: 'Users',         href: '/admin/users',         icon: Users },
  { label: 'Emergency',     href: '/admin/emergency',     icon: AlertTriangle },
  { label: 'Community',     href: '/admin/community',     icon: MessageSquare },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  badge?: number
}

export function AdminLayout({ children, title, description, badge }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      {/* Admin header */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-7 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>
                {badge !== undefined && badge > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold min-w-[1.25rem]">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          {/* Tab nav */}
          <nav className="flex items-end gap-0 -mb-px overflow-x-auto">
            {ADMIN_TABS.map(({ label, href, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap boty-transition',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </div>
    </div>
  )
}
