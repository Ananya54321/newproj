'use client'

import { useState, useCallback } from 'react'
import { Stethoscope, Loader2, Navigation, Search } from 'lucide-react'
import { VetCard } from '@/components/vets/vet-card'
import { getUserLocation, haversineDistance } from '@/lib/geo/utils'
import type { LatLng } from '@/lib/geo/utils'
import type { VetWithProfile } from '@/lib/auth/types'

interface Props {
  initialVets: VetWithProfile[]
}

export function VetsClient({ initialVets }: Props) {
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(false)

  const handleGetLocation = useCallback(async () => {
    setLocating(true)
    const loc = await getUserLocation()
    setLocating(false)
    if (loc) setUserLocation(loc)
  }, [])

  const getVetDistance = (vet: VetWithProfile): number | null => {
    const lat = vet.profile?.latitude
    const lng = vet.profile?.longitude
    if (!userLocation || lat == null || lng == null) return null
    return haversineDistance(userLocation, { lat: Number(lat), lng: Number(lng) })
  }

  const displayedVets = initialVets
    .filter((v) =>
      !search ||
      (v.profile?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (v.clinic_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (v.specialty ?? []).some((s) => s.toLowerCase().includes(search.toLowerCase()))
    )
    .map((v) => ({ ...v, distance: getVetDistance(v) }))
    .sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance
      if (a.distance != null) return -1
      if (b.distance != null) return 1
      return 0
    })

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
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
            <div className="relative shrink-0 w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vets, specialties…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Distance control */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
            {userLocation ? 'Sorted by distance' : 'Sort by distance'}
          </button>
          {userLocation && (
            <button
              onClick={() => setUserLocation(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {displayedVets.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">
              {search ? 'No vets match your search' : 'No vets available yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Verified veterinarians will appear here once approved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedVets.map((vet) => (
              <VetCard key={vet.id} vet={vet} distance={vet.distance} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
