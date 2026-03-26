import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { ProfileClient } from './_components/profile-client'
import type { Profile } from '@/lib/auth/types'

export const metadata = { title: 'Profile - Furever' }

export default async function ProfilePage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return <ProfileClient profile={profile as Profile} />
}
