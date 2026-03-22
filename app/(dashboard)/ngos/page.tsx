'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Heart, PawPrint } from 'lucide-react'
import { getApprovedNGOs } from '@/lib/ngo/service'
import { NgoCard } from '@/components/ngo/ngo-card'
import type { Profile, NgoProfile } from '@/lib/auth/types'

export default function NGOsPage() {
  const [ngos, setNgos] = useState<(Profile & { ngo_profile: NgoProfile })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getApprovedNGOs().then(setNgos).finally(() => setLoading(false))
  }, [])

  const filtered = ngos.filter((n) =>
    !search ||
    (n.ngo_profile?.organization_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (n.ngo_profile?.mission_statement ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">NGOs & Rescues</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  Support verified animal welfare organizations making a difference in your community.
                </p>
              </div>
            </div>
            {/* Search */}
            <div className="relative shrink-0 w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
            <PawPrint className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">
              {search ? 'No NGOs match your search' : 'No verified NGOs yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <NgoCard key={n.id} profile={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
