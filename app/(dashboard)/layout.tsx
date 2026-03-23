import React from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, getServerUser } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { StripeConnectBanner } from '@/components/stripe/stripe-connect-banner'

export default async function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  let showStripeBanner = false
  let stripeError: string | null = null
  let stripeConnected = false

  try {
    const resolvedParams = searchParams ? await searchParams : {}
    stripeError = resolvedParams?.stripe_error ?? null
    stripeConnected = resolvedParams?.stripe_connected === '1'

    const supabase = await createServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, verification_status')
      .eq('id', user.id)
      .single()

    const needsStripe =
      profile &&
      ['veterinarian', 'ngo', 'store_owner'].includes(profile.role) &&
      profile.verification_status === 'approved'

    if (needsStripe) {
      const { data: stripeConn } = await supabase
        .from('stripe_connections')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      showStripeBanner = !stripeConn
    }
  } catch {
    // Non-fatal — banner just won't show
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {(showStripeBanner || stripeError || stripeConnected) && (
          <StripeConnectBanner stripeError={stripeError} stripeConnected={stripeConnected} />
        )}
        {children}
      </main>
    </div>
  )
}
