'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getVetAppointments,
  updateAppointmentStatus,
  getMyVetProfile,
  formatAppointmentDateTime,
} from '@/lib/vets/service'
import type { AppointmentWithRelations, VeterinarianProfile } from '@/lib/auth/types'
import { toast } from 'sonner'
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  PawPrint,
  BadgeCheck,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AppointmentStatusBadge } from '@/components/vets/appointment-status-badge'

type Tab = 'requests' | 'upcoming' | 'history'

export default function VetPracticePage() {
  const { user, profile } = useAuth()
  const [vetProfile, setVetProfile] = useState<VeterinarianProfile | null>(null)
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('requests')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [vet, appts] = await Promise.all([
        getMyVetProfile(user.id),
        getVetAppointments(user.id),
      ])
      setVetProfile(vet)
      setAppointments(appts)
    } catch {
      toast.error('Failed to load practice data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusChange = async (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    setActionLoading(id)
    const { error } = await updateAppointmentStatus(id, status)
    setActionLoading(null)
    if (error) {
      toast.error(error)
    } else {
      toast.success(
        status === 'confirmed' ? 'Appointment accepted' :
        status === 'completed' ? 'Marked as completed' : 'Appointment declined'
      )
      fetchData()
    }
  }

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const pending = appointments.filter((a) => a.status === 'pending')
  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' && new Date(a.scheduled_at) >= now
  )
  const history = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled' ||
           (a.status === 'confirmed' && new Date(a.scheduled_at) < now)
  )

  const todayCount = appointments.filter((a) => {
    const d = new Date(a.scheduled_at)
    return a.status === 'confirmed' && d >= todayStart && d <= todayEnd
  }).length

  const monthCompleted = appointments.filter((a) => {
    return a.status === 'completed' && new Date(a.scheduled_at) >= monthStart
  }).length

  const tabAppointments = tab === 'requests' ? pending : tab === 'upcoming' ? upcoming : history

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading practice…
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  {vetProfile?.clinic_name ?? 'My Practice'}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {vetProfile?.verified_at ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Pending verification
                    </span>
                  )}
                  {vetProfile?.specialty && vetProfile.specialty.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {vetProfile.specialty.join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link href="/vet-practice/schedule">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calendar className="w-4 h-4" />
                Manage Schedule
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <StatCard icon={<Clock className="w-4 h-4 text-amber-600" />} label="Pending" value={pending.length} color="amber" />
            <StatCard icon={<Calendar className="w-4 h-4 text-primary" />} label="Today" value={todayCount} color="primary" />
            <StatCard icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} label="Completed (this month)" value={monthCompleted} color="green" />
          </div>
        </div>
      </div>

      {/* Tabs + appointments */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex gap-1 p-1 bg-card rounded-xl boty-shadow w-fit">
          {(['requests', 'upcoming', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'requests' ? `Requests${pending.length ? ` (${pending.length})` : ''}` :
               t === 'upcoming' ? 'Upcoming' : 'History'}
            </button>
          ))}
        </div>

        {tabAppointments.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {tab === 'requests' ? 'No pending appointment requests' :
               tab === 'upcoming' ? 'No upcoming appointments' :
               'No appointment history yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tabAppointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                tab={tab}
                actionLoading={actionLoading}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, color
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'amber' | 'primary' | 'green'
}) {
  const bg = color === 'amber' ? 'bg-amber-50' : color === 'green' ? 'bg-green-50' : 'bg-primary/5'
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function AppointmentCard({
  appointment: a,
  tab,
  actionLoading,
  onStatusChange,
}: {
  appointment: AppointmentWithRelations
  tab: Tab
  actionLoading: string | null
  onStatusChange: (id: string, status: 'confirmed' | 'completed' | 'cancelled') => void
}) {
  const isLoading = actionLoading === a.id

  return (
    <div className="bg-card rounded-2xl p-5 boty-shadow">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {a.user_profile?.full_name ?? 'Client'}
              </span>
            </div>
            {a.pet && (
              <div className="flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{a.pet.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {formatAppointmentDateTime(a.scheduled_at)}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
              {a.consultation_type?.replace('_', ' ')}
            </span>
            <span className="text-xs text-muted-foreground">{a.duration_minutes} min</span>
            <AppointmentStatusBadge status={a.status} />
          </div>

          {a.notes && (
            <p className="text-xs text-muted-foreground italic">&ldquo;{a.notes}&rdquo;</p>
          )}
        </div>

        {tab === 'requests' && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => onStatusChange(a.id, 'cancelled')}
              className="text-xs"
            >
              Decline
            </Button>
            <Button
              size="sm"
              disabled={isLoading}
              onClick={() => onStatusChange(a.id, 'confirmed')}
              className="text-xs gap-1"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Accept
            </Button>
          </div>
        )}

        {tab === 'upcoming' && (
          <Button
            size="sm"
            disabled={isLoading}
            onClick={() => onStatusChange(a.id, 'completed')}
            className="text-xs gap-1 shrink-0"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Complete
          </Button>
        )}
      </div>
    </div>
  )
}
