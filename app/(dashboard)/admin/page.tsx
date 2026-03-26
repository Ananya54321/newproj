import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server'
import {
  getAdminStats, getPendingVets, getPendingNGOs, getPendingStores,
  getUsers, getAllEmergencyReports, getAdminCommunities, getAdminReturnRequests,
} from '@/lib/admin/service'
import { AdminDashboard } from './_components/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all tab data in parallel using the admin client (bypasses RLS)
  const adminClient = createServerSupabaseAdminClient()
  const [stats, pendingVets, pendingNGOs, pendingStores, users, emergencyReports, communities, returnRequests] =
    await Promise.all([
      getAdminStats(adminClient),
      getPendingVets(adminClient),
      getPendingNGOs(adminClient),
      getPendingStores(adminClient),
      getUsers(adminClient),
      getAllEmergencyReports(adminClient),
      getAdminCommunities(adminClient),
      getAdminReturnRequests(adminClient),
    ])

  return (
    <AdminDashboard
      adminId={user.id}
      initialStats={stats}
      initialVets={pendingVets}
      initialNGOs={pendingNGOs}
      initialStores={pendingStores}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialReports={emergencyReports as any[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialCommunities={communities as any[]}
      initialUsers={users}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialReturnRequests={returnRequests as any[]}
    />
  )
}
