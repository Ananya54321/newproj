import { Stethoscope } from 'lucide-react'
import { VetCard } from '@/components/vets/vet-card'
import { getApprovedVets } from '@/lib/vets/service'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Find a Vet — Furever',
  description: 'Browse verified veterinarians and book a consultation.',
}

export default async function VetsPage() {
  const client = await createServerSupabaseClient()
  const vets = await getApprovedVets(client)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">Find a Veterinarian</h1>
              <p className="text-muted-foreground text-sm max-w-lg">
                All vets on Furever are verified. Browse profiles and book an appointment directly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {vets.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No vets available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verified veterinarians will appear here once approved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vets.map((vet) => (
              <VetCard key={vet.id} vet={vet} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
