'use client'

import Link from 'next/link'
import { LayoutDashboard, ShieldCheck, Users, AlertTriangle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminTopBar } from './admin-top-bar'

const ADMIN_TABS = [
  { label: 'Overview',      tab: 'overview',      icon: LayoutDashboard },
  { label: 'Verifications', tab: 'verifications', icon: ShieldCheck },
  { label: 'Users',         tab: 'users',         icon: Users },
  { label: 'Emergency',     tab: 'emergency',     icon: AlertTriangle },
  { label: 'Community',     tab: 'community',     icon: MessageSquare },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  badge?: number
  activeTab: string
}

export function AdminLayout({ children, title, description, badge, activeTab }: AdminLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-0 pb-0">
          <AdminTopBar />

          <div className="flex items-center gap-3 mt-5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>
                {badge !== undefined && badge > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold min-w-5">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          <nav className="flex items-end gap-0 -mb-px overflow-x-auto">
            {ADMIN_TABS.map(({ label, tab, icon: Icon }) => (
              <Link
                key={tab}
                href={`/admin?tab=${tab}`}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap boty-transition',
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </div>
    </div>
  )
}
