import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/auth/types'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export const metadata: Metadata = {
  title: 'Dashboard — Furever',
}

export default async function DashboardPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile | null

  // Redirect professional roles to their own dashboards
  if (p?.role === 'veterinarian') redirect('/vet-practice')
  if (p?.role === 'ngo') redirect('/ngo')
  if (p?.role === 'store_owner') redirect('/store')
  if (p?.role === 'admin') redirect('/admin')

  return <DashboardContent profile={p} />
}
