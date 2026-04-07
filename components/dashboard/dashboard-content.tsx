'use client'

import { AlertTriangle, CalendarDays, PawPrint, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/lib/auth/types'
import { ROLE_LABELS } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface DashboardContentProps {
  profile: Profile | null
}

export function DashboardContent({ profile }: DashboardContentProps) {
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const isVerificationPending =
    profile?.verification_status === 'pending' &&
    ['veterinarian', 'ngo', 'store_owner'].includes(profile?.role ?? '')

  return (
    <div className="flex-1 pt-16 px-4 pb-6 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground">
          Welcome back, {firstName}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your digital sanctuary is ready.
        </p>
      </div>

      {/* Verification banner */}
      {isVerificationPending && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Account under review
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Your {ROLE_LABELS[profile!.role]} account is being verified. This typically
                takes 1–2 business days. Some features are restricted until approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickCard
          label="My Pets"
          description="View and manage your pet profiles"
          icon={<PawPrint className="w-5 h-5" />}
          href="/pets"
          accent="bg-primary/10 text-primary"
          cta="Add a Pet"
        />
        <QuickCard
          label="Appointments"
          description="Upcoming vet consultations"
          icon={<CalendarDays className="w-5 h-5" />}
          href="/appointments"
          accent="bg-blue-100 text-blue-700"
          cta="Book Now"
        />
        <QuickCard
          label="Find a Vet"
          description="Browse verified veterinarians"
          icon={<Stethoscope className="w-5 h-5" />}
          href="/vets"
          accent="bg-emerald-100 text-emerald-700"
          cta="Browse Vets"
        />
        <QuickCard
          label="Emergency Reports"
          description="Real-time animal emergencies nearby"
          icon={<AlertTriangle className="w-5 h-5" />}
          href="/emergency"
          accent="bg-destructive/10 text-destructive"
          cta="View Feed"
        />
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emergency Reports */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Active Reports
              </h2>
            </div>
            <Link
              href="/emergency"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No active emergency reports nearby.</p>
            <Link
              href="/emergency/report"
              className="mt-3 text-xs text-primary hover:underline"
            >
              Report an emergency
            </Link>
          </div>
        </div>

        {/* Next Appointment */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Next Visit
            </h2>
            <Link
              href="/appointments"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Book
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            <Link
              href="/appointments/new"
              className="mt-3 text-xs text-primary hover:underline"
            >
              Schedule a visit
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickCard({
  label,
  description,
  icon,
  href,
  accent,
  cta,
}: {
  label: string
  description: string
  icon: React.ReactNode
  href: string
  accent: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3 hover:border-primary/40 boty-transition group"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', accent)}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-foreground group-hover:text-primary boty-transition">
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <p className="text-xs text-primary font-medium">{cta} →</p>
    </Link>
  )
}
