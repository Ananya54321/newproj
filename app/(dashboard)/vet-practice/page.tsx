import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { getMyVetProfile, getVetAppointments } from '@/lib/vets/service'
import { VetPracticeClient } from './_components/vet-practice-client'

export default async function VetPracticePage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  // Check role — non-vets should not see vet-practice
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'veterinarian') redirect('/dashboard')
  const [vetProfile, appointments] = await Promise.all([
    getMyVetProfile(user.id, supabase),
    getVetAppointments(user.id, supabase),
  ])

  return <VetPracticeClient vetProfile={vetProfile} initialAppointments={appointments} />
}
