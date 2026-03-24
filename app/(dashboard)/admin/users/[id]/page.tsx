'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, User, Stethoscope, Heart, Store, CheckCircle, XCircle,
  Loader2, ExternalLink, Phone, Globe, MapPin, FileText, Award, Clock
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import {
  getAdminUserDetail, approveVet, rejectVet, approveNGO, rejectNGO,
  approveStore, rejectStore,
  type AdminUserDetail,
} from '@/lib/admin/service'
import { AdminTopBar } from '@/app/(dashboard)/admin/_components/admin-top-bar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize', map[status ?? ''] ?? 'bg-muted text-muted-foreground')}>
      {status ?? 'N/A'}
    </span>
  )
}

function DocLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="text-xs text-muted-foreground italic">Not provided</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
    >
      <FileText className="w-3.5 h-3.5" />
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground flex-1">{value ?? <span className="italic text-muted-foreground">—</span>}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      <div className="px-5 py-1">
        {children}
      </div>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { profile: adminProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (!authLoading && adminProfile?.role !== 'admin') router.replace('/dashboard')
  }, [authLoading, adminProfile, router])

  useEffect(() => {
    if (adminProfile?.role !== 'admin' || !params.id) return
    getAdminUserDetail(params.id, supabaseClient)
      .then(setDetail)
      .finally(() => setLoading(false))
  }, [adminProfile, params.id])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading user details…
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>User not found.</p>
        <Link href="/admin?tab=verifications" className="text-sm text-primary hover:underline">
          Back to Verifications
        </Link>
      </div>
    )
  }

  const isVet = detail.role === 'veterinarian'
  const isNGO = detail.role === 'ngo'
  const isStore = detail.role === 'store_owner'
  const isPending = detail.verification_status === 'pending'

  const handleApprove = async () => {
    if (!adminProfile) return
    setActionLoading(true)
    let error: string | null = null
    if (isVet) ({ error } = await approveVet(detail.id, adminProfile.id, supabaseClient))
    else if (isNGO) ({ error } = await approveNGO(detail.id, adminProfile.id, supabaseClient))
    else if (isStore) ({ error } = await approveStore(detail.id, adminProfile.id, supabaseClient))
    setActionLoading(false)
    if (error) { toast.error(error); return }
    toast.success('Account approved')
    setDetail((d) => d ? { ...d, verification_status: 'approved' } : d)
  }

  const handleReject = async () => {
    if (!adminProfile || !rejectReason.trim()) return
    setActionLoading(true)
    let error: string | null = null
    if (isVet) ({ error } = await rejectVet(detail.id, rejectReason.trim(), adminProfile.id, supabaseClient))
    else if (isNGO) ({ error } = await rejectNGO(detail.id, rejectReason.trim(), adminProfile.id, supabaseClient))
    else if (isStore) ({ error } = await rejectStore(detail.id, rejectReason.trim(), supabaseClient))
    setActionLoading(false)
    if (error) { toast.error(error); return }
    toast.success('Account rejected')
    setDetail((d) => d ? { ...d, verification_status: 'rejected' } : d)
    setRejectMode(false)
  }

  return (
    <div className="min-h-screen">
      {/* Global admin top bar */}
      <div className="bg-card border-b border-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <AdminTopBar />
        </div>
      </div>

      {/* Page header */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/admin?tab=verifications"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground boty-transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Verifications
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {detail.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  {detail.full_name ?? 'Unknown User'}
                </h1>
                <StatusBadge status={detail.verification_status} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{detail.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Joined {formatDate(detail.created_at)} · Role: <span className="capitalize text-foreground">{detail.role.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          {/* Action buttons for pending accounts */}
          {isPending && (isVet || isNGO || isStore) && (
            <div className="mt-5 pt-5 border-t border-border/50">
              {!rejectMode ? (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectMode(true)}
                    disabled={actionLoading}
                    className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (required)…"
                    className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      disabled={!rejectReason.trim() || actionLoading}
                      onClick={handleReject}
                      className="gap-1.5"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Confirm Rejection
                    </Button>
                    <Button variant="ghost" onClick={() => { setRejectMode(false); setRejectReason('') }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Profile Info */}
        <SectionCard title="Profile Information" icon={User}>
          <InfoRow label="Full Name" value={detail.full_name} />
          <InfoRow label="Email" value={detail.email} />
          <InfoRow label="Phone" value={detail.phone ? (
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{detail.phone}</span>
          ) : null} />
          <InfoRow label="Bio" value={detail.bio} />
          <InfoRow label="Profile Slug" value={detail.slug ? `@${detail.slug}` : null} />
        </SectionCard>

        {/* Veterinarian Details */}
        {isVet && detail.vet && (
          <SectionCard title="Veterinarian Application" icon={Stethoscope}>
            <InfoRow label="Clinic Name" value={detail.vet.clinic_name} />
            <InfoRow label="Clinic Address" value={detail.vet.clinic_address ? (
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{detail.vet.clinic_address}</span>
            ) : null} />
            <InfoRow label="License Number" value={detail.vet.license_number ? (
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-muted-foreground" />{detail.vet.license_number}</span>
            ) : null} />
            <InfoRow label="Specialties" value={detail.vet.specialty?.length ? detail.vet.specialty.join(', ') : null} />
            <InfoRow label="Experience" value={detail.vet.years_experience ? (
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{detail.vet.years_experience} years</span>
            ) : null} />
            <InfoRow label="Consultation Fee" value={detail.vet.consultation_fee ? `₹${detail.vet.consultation_fee}` : null} />
            <InfoRow label="Professional Bio" value={detail.vet.bio} />
            <InfoRow label="License Document" value={<DocLink url={detail.vet.license_document_url} label="View License" />} />
            <InfoRow label="Resume / CV" value={<DocLink url={detail.vet.resume_url} label="View Resume" />} />
            {detail.vet.rejection_reason && (
              <InfoRow label="Rejection Reason" value={
                <span className="text-destructive">{detail.vet.rejection_reason}</span>
              } />
            )}
          </SectionCard>
        )}

        {/* NGO Details */}
        {isNGO && detail.ngo && (
          <SectionCard title="NGO Application" icon={Heart}>
            <InfoRow label="Organization" value={detail.ngo.organization_name} />
            <InfoRow label="Registration No." value={detail.ngo.registration_number} />
            <InfoRow label="Mission" value={detail.ngo.mission_statement} />
            <InfoRow label="Address" value={detail.ngo.address ? (
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{detail.ngo.address}</span>
            ) : null} />
            <InfoRow label="Website" value={detail.ngo.website_url ? (
              <a href={detail.ngo.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                <Globe className="w-3.5 h-3.5" />
                {detail.ngo.website_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null} />
            <InfoRow label="Accepts Donations" value={detail.ngo.accepts_donations ? 'Yes' : 'No'} />
            <InfoRow label="Reg. Document" value={<DocLink url={detail.ngo.registration_document_url} label="View Document" />} />
            {detail.ngo.rejection_reason && (
              <InfoRow label="Rejection Reason" value={
                <span className="text-destructive">{detail.ngo.rejection_reason}</span>
              } />
            )}
          </SectionCard>
        )}

        {/* Store Details */}
        {isStore && detail.store && (
          <SectionCard title="Store Application" icon={Store}>
            <InfoRow label="Store Name" value={detail.store.name} />
            <InfoRow label="Slug" value={detail.store.slug ? `@${detail.store.slug}` : null} />
            <InfoRow label="Description" value={detail.store.description} />
            <InfoRow label="Address" value={detail.store.address ? (
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{detail.store.address}</span>
            ) : null} />
            <InfoRow label="Logo" value={detail.store.logo_url ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-border/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.store.logo_url} alt="Store logo" className="w-full h-full object-cover" />
              </div>
            ) : null} />
            {detail.store.rejection_reason && (
              <InfoRow label="Rejection Reason" value={
                <span className="text-destructive">{detail.store.rejection_reason}</span>
              } />
            )}
          </SectionCard>
        )}
      </div>
    </div>
  )
}
