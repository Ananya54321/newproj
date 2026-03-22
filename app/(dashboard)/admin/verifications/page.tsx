'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, User, Store } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import {
  getPendingVets, getPendingNGOs, getPendingStores,
  approveVet, rejectVet, approveNGO, rejectNGO, approveStore, rejectStore,
  type PendingVet, type PendingNGO, type PendingStore,
} from '@/lib/admin/service'
import { AdminLayout } from '../_components/admin-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface RejectFormProps {
  onSubmit: (reason: string) => void
  onCancel: () => void
  loading?: boolean
}

function RejectForm({ onSubmit, onCancel, loading }: RejectFormProps) {
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
        <Button
          size="sm"
          variant="destructive"
          disabled={!reason.trim() || loading}
          onClick={() => onSubmit(reason.trim())}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          Confirm Reject
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  count: number
  color: string
  children: React.ReactNode
}

function Section({ title, count, color, children }: SectionProps) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-background/30 boty-transition"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
            count > 0 ? color : 'bg-emerald-100 text-emerald-700'
          )}>
            {count > 0 ? `${count} pending` : 'All clear'}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border/50">
          {count === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No pending {title.toLowerCase()} — all caught up!
            </div>
          ) : children}
        </div>
      )}
    </div>
  )
}

export default function VerificationsPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [vets, setVets] = useState<PendingVet[]>([])
  const [ngos, setNgos] = useState<PendingNGO[]>([])
  const [stores, setStores] = useState<PendingStore[]>([])
  const [loading, setLoading] = useState(true)

  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: 'vet' | 'ngo' | 'store' } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') router.replace('/dashboard')
  }, [authLoading, profile, router])

  useEffect(() => {
    if (profile?.role !== 'admin') return
    Promise.all([getPendingVets(supabaseClient), getPendingNGOs(supabaseClient), getPendingStores(supabaseClient)])
      .then(([v, n, s]) => { setVets(v); setNgos(n); setStores(s) })
      .finally(() => setLoading(false))
  }, [profile])

  if (authLoading || !profile) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
  }
  if (profile.role !== 'admin') return null

  const pendingTotal = vets.length + ngos.length + stores.length

  const handleApproveVet = async (id: string) => {
    setActionLoading(id)
    const { error } = await approveVet(id, profile.id, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Vet approved'); setVets((v) => v.filter((x) => x.id !== id)) }
    setActionLoading(null)
  }

  const handleRejectVet = async (id: string, reason: string) => {
    setActionLoading(id)
    const { error } = await rejectVet(id, reason, profile.id, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Vet rejected'); setVets((v) => v.filter((x) => x.id !== id)) }
    setActionLoading(null)
    setRejectTarget(null)
  }

  const handleApproveNGO = async (id: string) => {
    setActionLoading(id)
    const { error } = await approveNGO(id, profile.id, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('NGO approved'); setNgos((n) => n.filter((x) => x.id !== id)) }
    setActionLoading(null)
  }

  const handleRejectNGO = async (id: string, reason: string) => {
    setActionLoading(id)
    const { error } = await rejectNGO(id, reason, profile.id, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('NGO rejected'); setNgos((n) => n.filter((x) => x.id !== id)) }
    setActionLoading(null)
    setRejectTarget(null)
  }

  const handleApproveStore = async (id: string) => {
    setActionLoading(id)
    const { error } = await approveStore(id, profile.id, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Store approved'); setStores((s) => s.filter((x) => x.id !== id)) }
    setActionLoading(null)
  }

  const handleRejectStore = async (id: string, reason: string) => {
    setActionLoading(id)
    const { error } = await rejectStore(id, reason, supabaseClient)
    if (error) toast.error(error)
    else { toast.success('Store rejected'); setStores((s) => s.filter((x) => x.id !== id)) }
    setActionLoading(null)
    setRejectTarget(null)
  }

  return (
    <AdminLayout
      title="Verifications"
      description="Review and approve pending account verifications"
      badge={pendingTotal > 0 ? pendingTotal : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading pending verifications…
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Vets */}
          <Section title="Veterinarians" count={vets.length} color="bg-blue-100 text-blue-700">
            <div className="divide-y divide-border/50">
              {vets.map((vet) => (
                <div key={vet.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {vet.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={vet.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : <User className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{vet.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{vet.email}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        {vet.clinic_name && <span>Clinic: <span className="text-foreground">{vet.clinic_name}</span></span>}
                        {vet.license_number && <span>License: <span className="text-foreground">{vet.license_number}</span></span>}
                        {vet.years_experience && <span>Experience: <span className="text-foreground">{vet.years_experience}y</span></span>}
                        <span>Applied: <span className="text-foreground">{formatDate(vet.created_at)}</span></span>
                      </div>
                      {rejectTarget?.id === vet.id && rejectTarget.type === 'vet' && (
                        <RejectForm
                          loading={actionLoading === vet.id}
                          onSubmit={(r) => handleRejectVet(vet.id, r)}
                          onCancel={() => setRejectTarget(null)}
                        />
                      )}
                    </div>
                    {rejectTarget?.id !== vet.id && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => handleApproveVet(vet.id)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 boty-transition disabled:opacity-50"
                        >
                          {actionLoading === vet.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => setRejectTarget({ id: vet.id, type: 'vet' })}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 boty-transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Pending NGOs */}
          <Section title="NGOs & Rescues" count={ngos.length} color="bg-purple-100 text-purple-700">
            <div className="divide-y divide-border/50">
              {ngos.map((ngo) => (
                <div key={ngo.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {ngo.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ngo.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : <User className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{ngo.organization_name ?? ngo.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{ngo.email}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        {ngo.registration_number && <span>Reg#: <span className="text-foreground">{ngo.registration_number}</span></span>}
                        <span>Applied: <span className="text-foreground">{formatDate(ngo.created_at)}</span></span>
                      </div>
                      {ngo.mission_statement && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ngo.mission_statement}</p>
                      )}
                      {rejectTarget?.id === ngo.id && rejectTarget.type === 'ngo' && (
                        <RejectForm
                          loading={actionLoading === ngo.id}
                          onSubmit={(r) => handleRejectNGO(ngo.id, r)}
                          onCancel={() => setRejectTarget(null)}
                        />
                      )}
                    </div>
                    {rejectTarget?.id !== ngo.id && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => handleApproveNGO(ngo.id)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 boty-transition disabled:opacity-50"
                        >
                          {actionLoading === ngo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => setRejectTarget({ id: ngo.id, type: 'ngo' })}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 boty-transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Pending Stores */}
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
                      {store.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{store.description}</p>
                      )}
                      {rejectTarget?.id === store.id && rejectTarget.type === 'store' && (
                        <RejectForm
                          loading={actionLoading === store.id}
                          onSubmit={(r) => handleRejectStore(store.id, r)}
                          onCancel={() => setRejectTarget(null)}
                        />
                      )}
                    </div>
                    {rejectTarget?.id !== store.id && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => handleApproveStore(store.id)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 boty-transition disabled:opacity-50"
                        >
                          {actionLoading === store.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => setRejectTarget({ id: store.id, type: 'store' })}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 boty-transition disabled:opacity-50"
                        >
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
      )}
    </AdminLayout>
  )
}
