'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, ShieldCheck, AlertTriangle, MessageSquare,
  Clock, TrendingUp, ArrowRight, Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import { getAdminStats, type AdminStats } from '@/lib/admin/service'
import { AdminLayout } from './_components/admin-layout'
import { cn } from '@/lib/utils'

export default function AdminOverviewPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [authLoading, profile, router])

  useEffect(() => {
    if (profile?.role !== 'admin') return
    getAdminStats(supabaseClient).then((s) => {
      setStats(s)
      setLoading(false)
    })
  }, [profile])

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  if (profile.role !== 'admin') return null

  const pendingTotal = (stats?.pendingVets ?? 0) + (stats?.pendingNGOs ?? 0) + (stats?.pendingStores ?? 0)

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: 'Pending Approvals',
      value: pendingTotal,
      icon: ShieldCheck,
      href: '/admin/verifications',
      color: pendingTotal > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600',
      alert: pendingTotal > 0,
    },
    {
      label: 'Active Emergencies',
      value: stats?.activeEmergencies ?? 0,
      icon: AlertTriangle,
      href: '/admin/emergency',
      color: (stats?.activeEmergencies ?? 0) > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600',
      alert: (stats?.activeEmergencies ?? 0) > 0,
    },
    {
      label: 'Communities',
      value: stats?.totalCommunities ?? 0,
      icon: MessageSquare,
      href: '/admin/community',
      color: 'bg-purple-500/10 text-purple-600',
    },
  ]

  return (
    <AdminLayout
      title="Admin Panel"
      description="Manage and monitor the Furever platform"
      badge={pendingTotal > 0 ? pendingTotal : undefined}
    >
      {/* Alert banners */}
      {pendingTotal > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{pendingTotal} pending verification{pendingTotal !== 1 ? 's' : ''}</span>
            {' '}need your review
          </p>
          <Link
            href="/admin/verifications"
            className="text-sm font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 boty-transition"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, href, color, alert }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'bg-card rounded-2xl p-5 boty-shadow boty-transition hover:shadow-md hover:ring-1 hover:ring-primary/10 group',
              alert && 'ring-1 ring-amber-200'
            )}
          >
            {loading ? (
              <div className="h-14 flex items-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center justify-between">
                  {label}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 boty-transition" />
                </p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Verification breakdown */}
        <div className="bg-card rounded-2xl p-5 boty-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Pending Verifications</h2>
            <Link href="/admin/verifications" className="text-xs text-primary hover:underline boty-transition">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Veterinarians', count: stats?.pendingVets ?? 0, color: 'bg-blue-500' },
                { label: 'NGOs / Rescues', count: stats?.pendingNGOs ?? 0, color: 'bg-purple-500' },
                { label: 'Pet Stores', count: stats?.pendingStores ?? 0, color: 'bg-emerald-500' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', color)} />
                  <span className="text-sm text-muted-foreground flex-1">{label}</span>
                  <span className={cn(
                    'text-sm font-semibold tabular-nums',
                    count > 0 ? 'text-amber-600' : 'text-muted-foreground'
                  )}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform summary */}
        <div className="bg-card rounded-2xl p-5 boty-shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Platform Summary</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 divide-y divide-border/50">
              {[
                { label: 'Total emergency reports', value: stats?.totalEmergencies ?? 0 },
                { label: 'Active emergencies', value: stats?.activeEmergencies ?? 0 },
                { label: 'Total posts', value: stats?.totalPosts ?? 0 },
                { label: 'Total donations', value: stats?.totalDonations ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
