'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Search, Heart, PawPrint, MapPin, Navigation } from 'lucide-react'
import { getApprovedNGOs, getUpcomingEvents } from '@/lib/ngo/service'
import { NgoCard } from '@/components/ngo/ngo-card'
import { EventCard } from '@/components/ngo/event-card'
import { getUserLocation, haversineDistance, formatDistance } from '@/lib/geo/utils'
import type { Profile, NgoProfile, NgoEventWithNgo } from '@/lib/auth/types'
import type { LatLng } from '@/lib/geo/utils'

type Tab = 'organizations' | 'events'
type EventFilter = 'all' | 'meetup' | 'fundraiser'

export default function NGOsPage() {
  const [ngos, setNgos] = useState<(Profile & { ngo_profile: NgoProfile })[]>([])
  const [events, setEvents] = useState<NgoEventWithNgo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('organizations')
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    Promise.all([getApprovedNGOs(), getUpcomingEvents(30)])
      .then(([ngoData, eventData]) => {
        setNgos(ngoData)
        setEvents(eventData)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleGetLocation = useCallback(async () => {
    setLocating(true)
    const loc = await getUserLocation()
    setLocating(false)
    if (loc) {
      setUserLocation(loc)
    }
  }, [])

  const getNgoDistance = (n: Profile & { ngo_profile: NgoProfile }): number | null => {
    if (!userLocation || n.latitude == null || n.longitude == null) return null
    return haversineDistance(userLocation, { lat: Number(n.latitude), lng: Number(n.longitude) })
  }

  const filteredNgos = ngos
    .filter((n) =>
      !search ||
      (n.ngo_profile?.organization_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (n.ngo_profile?.mission_statement ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .map((n) => ({ ...n, distance: getNgoDistance(n) }))
    .sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance
      if (a.distance != null) return -1
      if (b.distance != null) return 1
      return 0
    })

  const filteredEvents = events.filter((e) =>
    eventFilter === 'all' || e.type === eventFilter
  )

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">NGOs & Rescues</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  Support verified animal welfare organizations and discover upcoming events.
                </p>
              </div>
            </div>
            <div className="relative shrink-0 w-full sm:w-64">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-card rounded-xl boty-shadow w-fit">
          {(['organizations', 'events'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'organizations' ? 'Organizations' : `Events${events.length ? ` (${events.length})` : ''}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : tab === 'organizations' ? (
          <>
            {/* Distance sorting */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                {userLocation ? 'Location on — sorted by distance' : 'Sort by distance'}
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

            {filteredNgos.length === 0 ? (
              <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
                <PawPrint className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-semibold text-foreground">
                  {search ? 'No NGOs match your search' : 'No verified NGOs yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNgos.map((n) => (
                  <div key={n.id} className="relative">
                    <NgoCard profile={n} />
                    {n.distance != null && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <MapPin className="w-2.5 h-2.5" />
                        {formatDistance(n.distance)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Event type filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'meetup', 'fundraiser'] as EventFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setEventFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                    eventFilter === f
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border/60 hover:border-primary/50'
                  }`}
                >
                  {f === 'all' ? 'All Events' : f === 'meetup' ? 'Meetups' : 'Fundraisers'}
                </button>
              ))}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
                <Heart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-semibold text-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredEvents.map((e) => (
                  <EventCard key={e.id} event={e} showNgo />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
