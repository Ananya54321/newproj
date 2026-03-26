'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users, ShieldCheck, AlertTriangle, MessageSquare, Clock, TrendingUp,
  ArrowRight, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp,
  User, Store, ExternalLink, MapPin, Search, Trash2, FileText, PawPrint,
} from 'lucide-react'
import { supabaseClient } from '@/lib/supabase/client'
import {
  approveVet, rejectVet, approveNGO, rejectNGO, approveStore, rejectStore,
  updateEmergencyStatus, adminDeleteCommunity,
  type AdminStats, type PendingVet, type PendingNGO, type PendingStore, type AdminUser,
} from '@/lib/admin/service'
import { AdminLayout } from './admin-layout'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EMERGENCY_STATUS_CONFIG, EMERGENCY_CATEGORY_CONFIG, ROLE_LABELS } from '@/lib/auth/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'verifications' | 'users' | 'emergency' | 'community' | 'returns'

export type EmergencyReport = {
  id: string; title: string; description: string | null; location: string
  status: string; category: string; image_urls: string[] | null; created_at: string
  reporter_id: string
  profiles: { full_name: string | null; email: string; avatar_url: string | null } | null
}

export type AdminCommunity = {
  id: string; name: string; slug: string; description: string | null
  icon_url: string | null; member_count: number; post_count: number
  created_at: string; created_by: string | null
}

export type AdminReturnRequest = {
  id: string
  order_id: string
  reason_type: string
  reason_note: string | null
  image_urls: string[]
  status: string
  refund_type: string | null
  refund_amount: number | null
  admin_notes: string | null
  created_at: string
  order: { id: string; total_amount: number; created_at: string; store: { id: string; name: string } | null } | null
  user: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
}

export interface AdminDashboardProps {
  adminId: string
  initialStats: AdminStats
  initialVets: PendingVet[]
  initialNGOs: PendingNGO[]
  initialStores: PendingStore[]
  initialUsers: AdminUser[]
  initialReports: EmergencyReport[]
  initialCommunities: AdminCommunity[]
  initialReturnRequests: AdminReturnRequest[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function RejectForm({ onSubmit, onCancel, loading }: {
  onSubmit: (reason: string) => void; onCancel: () => void; loading?: boolean
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejection (required)…"
        className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" variant="destructive" disabled={!reason.trim() || loading}
          onClick={() => onSubmit(reason.trim())}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          Confirm Reject
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function Section({ title, count, color, children }: {
  title: string; count: number; color: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-background/30 boty-transition">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
            count > 0 ? color : 'bg-emerald-100 text-emerald-700')}>
            {count > 0 ? `${count} pending` : 'All clear'}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border/50">
          {count === 0
            ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">No pending {title.toLowerCase()} - all caught up!</div>
            : children}
        </div>
      )}
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ stats }: { stats: AdminStats }) {
  const pendingTotal = stats.pendingVets + stats.pendingNGOs + stats.pendingStores
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, tab: 'users', color: 'bg-blue-500/10 text-blue-600', alert: false },
    { label: 'Pending Approvals', value: pendingTotal, icon: ShieldCheck, tab: 'verifications',
      color: pendingTotal > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600', alert: pendingTotal > 0 },
    { label: 'Active Emergencies', value: stats.activeEmergencies, icon: AlertTriangle, tab: 'emergency',
      color: stats.activeEmergencies > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600', alert: stats.activeEmergencies > 0 },
    { label: 'Communities', value: stats.totalCommunities, icon: MessageSquare, tab: 'community', color: 'bg-purple-500/10 text-purple-600', alert: false },
  ]
  return (
    <>
      {pendingTotal > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{pendingTotal} pending verification{pendingTotal !== 1 ? 's' : ''}</span> need your review
          </p>
          <Link href="/admin?tab=verifications" className="text-sm font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 boty-transition">
            Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, tab, color, alert }) => (
          <Link key={label} href={`/admin?tab=${tab}`}
            className={cn('bg-card rounded-2xl p-5 boty-shadow boty-transition hover:shadow-md hover:ring-1 hover:ring-primary/10 group', alert && 'ring-1 ring-amber-200')}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}><Icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center justify-between">
              {label}<ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 boty-transition" />
            </p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 boty-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Pending Verifications</h2>
            <Link href="/admin?tab=verifications" className="text-xs text-primary hover:underline boty-transition">View all →</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Veterinarians', count: stats.pendingVets, color: 'bg-blue-500' },
              { label: 'NGOs / Rescues', count: stats.pendingNGOs, color: 'bg-purple-500' },
              { label: 'Pet Stores', count: stats.pendingStores, color: 'bg-emerald-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full shrink-0', color)} />
                <span className="text-sm text-muted-foreground flex-1">{label}</span>
                <span className={cn('text-sm font-semibold tabular-nums', count > 0 ? 'text-amber-600' : 'text-muted-foreground')}>{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 boty-shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Platform Summary</h2>
          </div>
          <div className="space-y-3 divide-y divide-border/50">
            {[
              { label: 'Total emergency reports', value: stats.totalEmergencies },
              { label: 'Active emergencies', value: stats.activeEmergencies },
              { label: 'Total posts', value: stats.totalPosts },
              { label: 'Total donations', value: stats.totalDonations },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Verifications tab ────────────────────────────────────────────────────────

function VerificationsTab({ adminId, initialVets, initialNGOs, initialStores }: {
  adminId: string
  initialVets: PendingVet[]
  initialNGOs: PendingNGO[]
  initialStores: PendingStore[]
}) {
  const [vets, setVets] = useState(initialVets)
  const [ngos, setNgos] = useState(initialNGOs)
  const [stores, setStores] = useState(initialStores)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: 'vet' | 'ngo' | 'store' } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleApproveVet = async (id: string) => {
    setActionLoading(id)
    const { error } = await approveVet(id, adminId, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Vet approved'); setVets((p) => p.filter((x) => x.id !== id)) }
    setActionLoading(null)
  }
  const handleRejectVet = async (id: string, reason: string) => {
    setActionLoading(id)
    const { error } = await rejectVet(id, reason, adminId, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Vet rejected'); setVets((p) => p.filter((x) => x.id !== id)) }
    setActionLoading(null); setRejectTarget(null)
  }
  const handleApproveNGO = async (id: string) => {
    setActionLoading(id)
    const { error } = await approveNGO(id, adminId, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('NGO approved'); setNgos((p) => p.filter((x) => x.id !== id)) }
    setActionLoading(null)
  }
  const handleRejectNGO = async (id: string, reason: string) => {
    setActionLoading(id)
    const { error } = await rejectNGO(id, reason, adminId, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('NGO rejected'); setNgos((p) => p.filter((x) => x.id !== id)) }
    setActionLoading(null); setRejectTarget(null)
  }
  const handleApproveStore = async (id: string) => {
    setActionLoading(id)
    const { error } = await approveStore(id, adminId, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Store approved'); setStores((p) => p.filter((x) => x.id !== id)) }
    setActionLoading(null)
  }
  const handleRejectStore = async (id: string, reason: string) => {
    setActionLoading(id)
    const { error } = await rejectStore(id, reason, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Store rejected'); setStores((p) => p.filter((x) => x.id !== id)) }
    setActionLoading(null); setRejectTarget(null)
  }

  return (
    <div className="space-y-4">
      <Section title="Veterinarians" count={vets.length} color="bg-blue-100 text-blue-700">
        <div className="divide-y divide-border/50">
          {vets.map((vet) => (
            <div key={vet.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {vet.avatar_url ? <img src={vet.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{vet.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{vet.email}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                    {vet.clinic_name && <span>Clinic: <span className="text-foreground">{vet.clinic_name}</span></span>}
                    {vet.license_number && <span>License: <span className="text-foreground">{vet.license_number}</span></span>}
                    {vet.years_experience && <span>Exp: <span className="text-foreground">{vet.years_experience}y</span></span>}
                    <span>Applied: <span className="text-foreground">{formatDate(vet.created_at)}</span></span>
                  </div>
                  {vet.specialty && vet.specialty.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {vet.specialty.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{s}</span>
                      ))}
                    </div>
                  )}
                  {rejectTarget?.id === vet.id && rejectTarget.type === 'vet' && (
                    <RejectForm loading={actionLoading === vet.id} onSubmit={(r) => handleRejectVet(vet.id, r)} onCancel={() => setRejectTarget(null)} />
                  )}
                </div>
                {rejectTarget?.id !== vet.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/users/${vet.id}`} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/70 boty-transition">
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Link>
                    <button type="button" disabled={!!actionLoading} onClick={() => handleApproveVet(vet.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 boty-transition disabled:opacity-50">
                      {actionLoading === vet.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button type="button" disabled={!!actionLoading} onClick={() => setRejectTarget({ id: vet.id, type: 'vet' })}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 boty-transition disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="NGOs & Rescues" count={ngos.length} color="bg-purple-100 text-purple-700">
        <div className="divide-y divide-border/50">
          {ngos.map((ngo) => (
            <div key={ngo.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {ngo.avatar_url ? <img src={ngo.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{ngo.organization_name ?? ngo.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{ngo.email}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                    {ngo.registration_number && <span>Reg#: <span className="text-foreground">{ngo.registration_number}</span></span>}
                    <span>Applied: <span className="text-foreground">{formatDate(ngo.created_at)}</span></span>
                  </div>
                  {ngo.mission_statement && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ngo.mission_statement}</p>}
                  {rejectTarget?.id === ngo.id && rejectTarget.type === 'ngo' && (
                    <RejectForm loading={actionLoading === ngo.id} onSubmit={(r) => handleRejectNGO(ngo.id, r)} onCancel={() => setRejectTarget(null)} />
                  )}
                </div>
                {rejectTarget?.id !== ngo.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/users/${ngo.id}`} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/70 boty-transition">
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Link>
                    <button type="button" disabled={!!actionLoading} onClick={() => handleApproveNGO(ngo.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 boty-transition disabled:opacity-50">
                      {actionLoading === ngo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button type="button" disabled={!!actionLoading} onClick={() => setRejectTarget({ id: ngo.id, type: 'ngo' })}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 boty-transition disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pet Stores" count={stores.length} color="bg-emerald-100 text-emerald-700">
        <div className="divide-y divide-border/50">
          {stores.map((store) => (
            <div key={store.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{store.name}</p>
                  <p className="text-xs text-muted-foreground">Owner: {store.owner_name ?? 'Unknown'} · {store.owner_email}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                    {store.slug && <span>Slug: <span className="text-foreground">{store.slug}</span></span>}
                    <span>Applied: <span className="text-foreground">{formatDate(store.created_at)}</span></span>
                  </div>
                  {store.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{store.description}</p>}
                  {rejectTarget?.id === store.id && rejectTarget.type === 'store' && (
                    <RejectForm loading={actionLoading === store.id} onSubmit={(r) => handleRejectStore(store.id, r)} onCancel={() => setRejectTarget(null)} />
                  )}
                </div>
                {rejectTarget?.id !== store.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/users/${store.owner_id}`} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/70 boty-transition">
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Link>
                    <button type="button" disabled={!!actionLoading} onClick={() => handleApproveStore(store.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 boty-transition disabled:opacity-50">
                      {actionLoading === store.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button type="button" disabled={!!actionLoading} onClick={() => setRejectTarget({ id: store.id, type: 'store' })}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 boty-transition disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-primary/10 text-primary', veterinarian: 'bg-blue-100 text-blue-700',
  ngo: 'bg-purple-100 text-purple-700', store_owner: 'bg-emerald-100 text-emerald-700',
  user: 'bg-secondary text-secondary-foreground',
}
const VERIFICATION_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-destructive/10 text-destructive',
}

function UsersTab({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const filtered = useMemo(() => initialUsers.filter((u) => {
    const matchSearch = !search || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (roleFilter === 'all' || u.role === roleFilter)
  }), [initialUsers, search, roleFilter])

  return (
    <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-border/50 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-1 flex-wrap">
          {['all', 'user', 'veterinarian', 'ngo', 'store_owner', 'admin'].map((role) => (
            <button key={role} type="button" onClick={() => setRoleFilter(role)}
              className={cn('px-2.5 py-1 rounded text-xs font-medium boty-transition',
                roleFilter === role ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {role === 'all' ? 'All' : ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 bg-background/50 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
        <span>User</span><span>Role</span><span>Status</span><span>Joined</span>
      </div>
      {filtered.length === 0
        ? <div className="py-12 text-center text-sm text-muted-foreground">No users match your search.</div>
        : (
          <div className="divide-y divide-border/50">
            {filtered.map((u) => (
              <div key={u.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4 items-center px-5 py-3.5 hover:bg-background/30 boty-transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name ?? '-'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[u.role] ?? 'bg-secondary text-secondary-foreground')}>
                  {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                </span>
                {u.verification_status
                  ? <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', VERIFICATION_COLORS[u.verification_status] ?? 'bg-secondary text-secondary-foreground')}>
                      {u.verification_status.charAt(0).toUpperCase() + u.verification_status.slice(1)}
                    </span>
                  : <span className="text-xs text-muted-foreground">-</span>}
                <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ─── Emergency tab ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' },
]

function EmergencyTab({ initialReports }: { initialReports: EmergencyReport[] }) {
  const [reports, setReports] = useState(initialReports)
  const [updating, setUpdating] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = statusFilter === 'all' ? reports : reports.filter((r) => r.status === statusFilter)
  const activeCount = reports.filter((r) => ['open', 'in_progress'].includes(r.status)).length

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id)
    const { error } = await updateEmergencyStatus(id, newStatus, supabaseClient)
    if (error) toast.error(error)
    else { setReports((p) => p.map((r) => r.id === id ? { ...r, status: newStatus } : r)); toast.success('Status updated') }
    setUpdating(null)
  }

  return (
    <>
      {activeCount > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><span className="font-semibold">{activeCount}</span> active emergency report{activeCount !== 1 ? 's' : ''} need attention</span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-card rounded-xl p-1 boty-shadow">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => {
            const count = s === 'all' ? reports.length : reports.filter((r) => r.status === s).length
            return (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium boty-transition',
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {s === 'all' ? 'All' : EMERGENCY_STATUS_CONFIG[s as keyof typeof EMERGENCY_STATUS_CONFIG]?.label ?? s}
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', statusFilter === s ? 'bg-primary-foreground/20' : 'bg-muted')}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>
      {filtered.length === 0
        ? <div className="bg-card rounded-2xl boty-shadow py-12 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No reports</p>
            <p className="text-xs text-muted-foreground mt-1">No emergency reports match the selected filter.</p>
          </div>
        : (
          <div className="space-y-3">
            {filtered.map((report) => {
              const statusCfg = EMERGENCY_STATUS_CONFIG[report.status as keyof typeof EMERGENCY_STATUS_CONFIG]
              const catCfg = EMERGENCY_CATEGORY_CONFIG[report.category as keyof typeof EMERGENCY_CATEGORY_CONFIG]
              return (
                <div key={report.id} className="bg-card rounded-2xl boty-shadow p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {catCfg && <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', catCfg.color)}>{catCfg.label}</span>}
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusCfg?.color ?? 'bg-secondary text-secondary-foreground')}>
                              {statusCfg?.label ?? report.status}
                            </span>
                          </div>
                        </div>
                        <select value={report.status} disabled={updating === report.id} onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 boty-transition shrink-0">
                          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      {report.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{report.description}</p>}
                      <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground flex-wrap">
                        {report.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location}</span>}
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{report.profiles?.full_name ?? report.profiles?.email ?? 'Unknown reporter'}</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </>
  )
}

// ─── Community tab ────────────────────────────────────────────────────────────

function CommunityTab({ initialCommunities }: { initialCommunities: AdminCommunity[] }) {
  const [communities, setCommunities] = useState(initialCommunities)
  const [deleting, setDeleting] = useState<string | null>(null)

  const totalMembers = communities.reduce((acc, c) => acc + c.member_count, 0)
  const totalPosts = communities.reduce((acc, c) => acc + c.post_count, 0)

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    const { error } = await adminDeleteCommunity(id, supabaseClient)
    if (error) toast.error(error)
    else { toast.success(`"${name}" deleted`); setCommunities((p) => p.filter((c) => c.id !== id)) }
    setDeleting(null)
  }

  return (
    <>
      {communities.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[{ label: 'Communities', value: communities.length, icon: MessageSquare },
            { label: 'Total Members', value: totalMembers, icon: Users },
            { label: 'Total Posts', value: totalPosts, icon: FileText },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card rounded-xl boty-shadow px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-background/50 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
          <span>Community</span><span>Members</span><span>Posts</span><span>Created</span><span />
        </div>
        {communities.length === 0
          ? <div className="py-12 text-center text-sm text-muted-foreground">No communities found.</div>
          : (
            <div className="divide-y divide-border/50">
              {communities.map((c) => (
                <div key={c.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 items-center px-5 py-4 hover:bg-background/30 boty-transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.icon_url ? <img src={c.icon_url} alt="" className="w-full h-full object-cover" /> : <PawPrint className="w-5 h-5 text-primary/40" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                      <p className="text-xs text-muted-foreground font-mono">/{c.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-3.5 h-3.5 shrink-0" /><span className="font-medium text-foreground">{c.member_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="w-3.5 h-3.5 shrink-0" /><span className="font-medium text-foreground">{c.post_count.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button type="button" disabled={deleting === c.id}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-lg hover:bg-destructive/10 boty-transition disabled:opacity-50">
                        {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{c.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the community, all its posts, comments, and memberships. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c.id, c.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Community
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  )
}

// ─── Returns tab ──────────────────────────────────────────────────────────────

const RETURN_REASON_LABELS: Record<string, string> = {
  damaged:      'Damaged item',
  wrong_item:   'Wrong item received',
  changed_mind: 'Changed mind',
}

const RETURN_STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-800',
  collecting: 'bg-blue-100 text-blue-800',
  collected:  'bg-purple-100 text-purple-800',
  approved:   'bg-emerald-100 text-emerald-800',
  rejected:   'bg-destructive/10 text-destructive',
  refunded:   'bg-emerald-200 text-emerald-900',
}

function ReturnsTab({ initialReturnRequests, adminId }: { initialReturnRequests: AdminReturnRequest[]; adminId: string }) {
  const [requests, setRequests] = useState<AdminReturnRequest[]>(initialReturnRequests)
  const [actioning, setActioning] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  void adminId

  const handleAction = async (id: string, action: 'collecting' | 'approved' | 'refunded') => {
    setActioning(id)
    const req = requests.find((r) => r.id === id)
    const updates: Record<string, unknown> = { status: action }
    if (action === 'approved') {
      const refundAmt = req?.refund_type === 'full'
        ? req?.order?.total_amount
        : (req?.order?.total_amount ?? 0)
      updates.refund_amount = refundAmt
    }
    const { error } = await supabaseClient.from('return_requests').update(updates).eq('id', id)
    setActioning(null)
    if (error) { toast.error(error.message); return }
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action, ...updates } : r))
    toast.success('Updated')
  }

  const handleReject = async (id: string, reason: string) => {
    setActioning(id)
    const { error } = await supabaseClient
      .from('return_requests')
      .update({ status: 'rejected', admin_notes: reason })
      .eq('id', id)
    setActioning(null)
    if (error) { toast.error(error.message); return }
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected', admin_notes: reason } : r))
    setRejectingId(null)
    toast.success('Return rejected')
  }

  if (requests.length === 0) {
    return (
      <div className="py-16 text-center bg-card rounded-2xl boty-shadow">
        <p className="font-semibold text-foreground">No return requests</p>
        <p className="text-sm text-muted-foreground mt-1">Customer return requests will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="bg-card rounded-2xl p-5 boty-shadow space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Order #{req.order_id.slice(0, 8).toUpperCase()}</p>
              <p className="font-semibold text-foreground mt-0.5">{req.order?.store?.name ?? 'Unknown store'}</p>
              <p className="text-xs text-muted-foreground">{req.user?.full_name ?? req.user?.email}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RETURN_STATUS_COLORS[req.status] ?? 'bg-muted text-muted-foreground'}`}>
                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(req.created_at)}</span>
            </div>
          </div>

          <div className="bg-background rounded-xl p-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">{RETURN_REASON_LABELS[req.reason_type] ?? req.reason_type}</p>
            {req.reason_note && <p className="text-sm text-muted-foreground">{req.reason_note}</p>}
            <p className="text-xs text-muted-foreground">
              Refund: <span className="font-medium">{req.refund_type === 'full' ? 'Full (incl. delivery)' : 'Product only'}</span>
              {' '}· Order value: <span className="font-medium">₹{req.order?.total_amount?.toLocaleString()}</span>
            </p>
          </div>

          {req.image_urls?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {req.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border/40 hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          )}

          {req.admin_notes && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">Admin note: {req.admin_notes}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {req.status === 'pending' && (
              <>
                <button type="button" disabled={actioning === req.id} onClick={() => handleAction(req.id, 'collecting')}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  Initiate Pickup
                </button>
                <button type="button" onClick={() => setRejectingId(rejectingId === req.id ? null : req.id)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
                  Reject
                </button>
              </>
            )}
            {req.status === 'collected' && req.reason_type !== 'changed_mind' && (
              <>
                <button type="button" disabled={actioning === req.id} onClick={() => handleAction(req.id, 'approved')}
                  className="text-xs px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  Approve Refund
                </button>
                <button type="button" onClick={() => setRejectingId(rejectingId === req.id ? null : req.id)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
                  Reject
                </button>
              </>
            )}
            {req.status === 'approved' && (
              <button type="button" disabled={actioning === req.id} onClick={() => handleAction(req.id, 'refunded')}
                className="text-xs px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                Mark Refunded
              </button>
            )}
          </div>

          {rejectingId === req.id && (
            <RejectForm
              loading={actioning === req.id}
              onSubmit={(reason) => handleReject(req.id, reason)}
              onCancel={() => setRejectingId(null)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TAB_META: Record<Tab, { title: string; description: string }> = {
  overview:      { title: 'Admin Panel',         description: 'Manage and monitor the Furever platform' },
  verifications: { title: 'Verifications',        description: 'Review and approve pending account verifications' },
  users:         { title: 'Users',                description: 'All registered users' },
  emergency:     { title: 'Emergency Reports',    description: 'Monitor and manage animal emergency reports' },
  community:     { title: 'Community Management', description: 'View and moderate communities on the platform' },
  returns:       { title: 'Return Requests',      description: 'Review and process product return requests' },
}

function AdminDashboardInner(props: AdminDashboardProps) {
  const { adminId, initialStats, initialVets, initialNGOs, initialStores, initialUsers, initialReports, initialCommunities, initialReturnRequests } = props
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'overview') as Tab
  const pendingTotal = initialStats.pendingVets + initialStats.pendingNGOs + initialStats.pendingStores
  const { title, description } = TAB_META[tab] ?? TAB_META.overview

  return (
    <AdminLayout title={title} description={description} badge={pendingTotal > 0 ? pendingTotal : undefined} activeTab={tab}>
      {tab === 'overview'      && <OverviewTab stats={initialStats} />}
      {tab === 'verifications' && <VerificationsTab adminId={adminId} initialVets={initialVets} initialNGOs={initialNGOs} initialStores={initialStores} />}
      {tab === 'users'         && <UsersTab initialUsers={initialUsers} />}
      {tab === 'emergency'     && <EmergencyTab initialReports={initialReports} />}
      {tab === 'community'     && <CommunityTab initialCommunities={initialCommunities} />}
      {tab === 'returns'       && <ReturnsTab initialReturnRequests={initialReturnRequests} adminId={adminId} />}
    </AdminLayout>
  )
}

export function AdminDashboard(props: AdminDashboardProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    }>
      <AdminDashboardInner {...props} />
    </Suspense>
  )
}
