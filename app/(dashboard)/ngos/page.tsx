import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getApprovedNGOs, getUpcomingEvents } from '@/lib/ngo/service'
import { NgosClient } from './_components/ngos-client'

export const metadata = { title: 'NGOs & Rescues — Furever' }

export default async function NGOsPage() {
  const supabase = await createServerSupabaseClient()
  const [ngos, events] = await Promise.all([
    getApprovedNGOs(supabase),
    getUpcomingEvents(30, supabase),
  ])

  return <NgosClient initialNgos={ngos} initialEvents={events} />
}
