import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { getMyVetProfile } from '@/lib/vets/service'
import { DEFAULT_HOURS } from '@/components/vet/schedule-editor'
import { ScheduleClient } from './_components/schedule-client'
import type { DayHours } from '@/components/vet/schedule-editor'

export default async function VetSchedulePage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'veterinarian') redirect('/dashboard')

  const vet = await getMyVetProfile(user.id, supabase)

  const initialAvailableHours = (vet?.available_hours as DayHours | null) ?? DEFAULT_HOURS
  const initialConsultationFee = vet?.consultation_fee != null ? String(vet.consultation_fee) : ''

  return (
    <ScheduleClient
      userId={user.id}
      initialAvailableHours={initialAvailableHours}
      initialConsultationFee={initialConsultationFee}
    />
  )
}
