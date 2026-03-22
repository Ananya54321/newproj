import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/auth/types'
import { ROLE_LABELS } from '@/lib/auth/types'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

/**
 * The onboarding page is shown to users who are authenticated but whose
 * role requires manual verification (vets, NGOs, store owners).
 *
 * Verified users are immediately redirected to the dashboard.
 */
export default async function OnboardingPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile | null

  // Redirect fully-verified users
  if (!p || p.verification_status === 'approved' || p.role === 'user' || p.role === 'admin') {
    redirect('/dashboard')
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50 border-amber-200',
      title: 'Your account is under review',
      message:
        "Our team is verifying your credentials. This typically takes 1-2 business days. You will receive an email once approved.",
    },
    rejected: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/5 border-destructive/20',
      title: 'Verification unsuccessful',
      message:
        'Unfortunately, your account could not be verified at this time. Please review the reason below and reach out to support if you believe this is an error.',
    },
  } as const

  const status = p.verification_status ?? 'pending'
  const config = status === 'rejected' ? statusConfig.rejected : statusConfig.pending
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <Link href="/">
          <p className="font-serif text-2xl font-bold text-foreground tracking-wide">Furever</p>
        </Link>

        {/* Status card */}
        <div className={`rounded-2xl border p-6 ${config.bg}`}>
          <div className="flex items-start gap-4">
            <Icon className={`w-6 h-6 mt-0.5 shrink-0 ${config.color}`} />
            <div className="space-y-1">
              <h2 className="font-semibold text-foreground">{config.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{config.message}</p>
            </div>
          </div>
        </div>

        {/* Role context */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {ROLE_LABELS[p.role]} Account
              </p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
            </div>
          </div>

          {status === 'rejected' && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
              <p className="text-xs font-medium text-destructive mb-1">Reason</p>
              <p className="text-xs text-muted-foreground">
                {/* In production, rejection_reason from the DB would appear here */}
                Your submitted documents could not be verified. Please ensure they are legible and up-to-date.
              </p>
            </div>
          )}

          {status === 'pending' && (
            <ol className="space-y-2 text-sm text-muted-foreground">
              {[
                'Account created & email verified',
                'Documents submitted for review',
                'Team review (1–2 business days)',
                'Approval email sent',
              ].map((step, i) => (
                <li key={step} className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      i < 2 ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={i < 2 ? 'text-foreground' : ''}>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {status === 'rejected' ? (
            <Link
              href="mailto:support@furever.app"
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-colors"
            >
              Continue to Dashboard
            </Link>
          )}
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl border border-border/60 text-sm font-medium text-center text-muted-foreground hover:bg-muted transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
