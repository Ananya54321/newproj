'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin, AlertTriangle, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import { getAllEmergencyReports, updateEmergencyStatus } from '@/lib/admin/service'
import { AdminLayout } from '../_components/admin-layout'
import { EMERGENCY_STATUS_CONFIG, EMERGENCY_CATEGORY_CONFIG } from '@/lib/auth/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type EmergencyReport = {
  id: string
  title: string
  description: string | null
  location: string
  status: string
  category: string
  image_urls: string[] | null
  created_at: string
  reporter_id: string
  profiles: {
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'closed',      label: 'Closed' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminEmergencyPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<EmergencyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') router.replace('/dashboard')
  }, [authLoading, profile, router])

  useEffect(() => {
    if (profile?.role !== 'admin') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAllEmergencyReports(supabaseClient).then((data: any[]) => {
      setReports(data as EmergencyReport[])
      setLoading(false)
    })
  }, [profile])

  if (authLoading || !profile) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
  }
  if (profile.role !== 'admin') return null

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id)
    const { error } = await updateEmergencyStatus(id, newStatus, supabaseClient)
    if (error) {
      toast.error(error)
    } else {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r))
      toast.success('Status updated')
    }
    setUpdating(null)
  }

  const filtered = statusFilter === 'all' ? reports : reports.filter((r) => r.status === statusFilter)
  const activeCount = reports.filter((r) => ['open', 'in_progress'].includes(r.status)).length

  return (
    <AdminLayout
      title="Emergency Reports"
      description="Monitor and manage animal emergency reports"
      badge={activeCount > 0 ? activeCount : undefined}
    >
      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-card rounded-xl p-1 boty-shadow">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => {
            const count = s === 'all' ? reports.length : reports.filter((r) => r.status === s).length
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium boty-transition',
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s === 'all' ? 'All' : EMERGENCY_STATUS_CONFIG[s as keyof typeof EMERGENCY_STATUS_CONFIG]?.label ?? s}
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  statusFilter === s ? 'bg-primary-foreground/20' : 'bg-muted'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading emergency reports…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl boty-shadow py-12 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No reports</p>
          <p className="text-xs text-muted-foreground mt-1">No emergency reports match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const statusCfg = EMERGENCY_STATUS_CONFIG[report.status as keyof typeof EMERGENCY_STATUS_CONFIG]
            const catCfg = EMERGENCY_CATEGORY_CONFIG[report.category as keyof typeof EMERGENCY_CATEGORY_CONFIG]

            return (
              <div key={report.id} className="bg-card rounded-2xl boty-shadow p-4">
                <div className="flex items-start gap-4">
                  {/* Category icon area */}
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {catCfg && (
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', catCfg.color)}>
                              {catCfg.label}
                            </span>
                          )}
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            statusCfg?.color ?? 'bg-secondary text-secondary-foreground'
                          )}>
                            {statusCfg?.label ?? report.status}
                          </span>
                        </div>
                      </div>

                      {/* Status dropdown */}
                      <div className="shrink-0">
                        <select
                          value={report.status}
                          disabled={updating === report.id}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 boty-transition"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {report.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{report.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground flex-wrap">
                      {report.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {report.profiles?.full_name ?? report.profiles?.email ?? 'Unknown reporter'}
                      </span>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
