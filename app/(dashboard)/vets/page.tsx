import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getApprovedVets } from '@/lib/vets/service'
import { VetsClient } from './_components/vets-client'

export const metadata = { title: 'Find a Vet — Furever' }

export default async function VetsPage() {
  const supabase = await createServerSupabaseClient()
  const vets = await getApprovedVets(supabase).catch(() => [])

  return <VetsClient initialVets={vets} />
}
