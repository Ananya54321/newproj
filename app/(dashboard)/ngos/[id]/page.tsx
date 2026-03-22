'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, MapPin, Calendar, Loader2, PawPrint } from 'lucide-react'
import { getNGOById, getNGOUpdates } from '@/lib/ngo/service'
import { DonationForm } from '@/components/ngo/donation-form'
import { NgoUpdateCard } from '@/components/ngo/ngo-update-card'
import type { Profile, NgoProfile, NgoUpdate } from '@/lib/auth/types'

export default function NgoProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [ngo, setNgo] = useState<(Profile & { ngo_profile: NgoProfile }) | null>(null)
  const [updates, setUpdates] = useState<NgoUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound404, setNotFound404] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [ngoData, ngoUpdates] = await Promise.all([
        getNGOById(id),
        getNGOUpdates(id),
      ])
      if (!ngoData) setNotFound404(true)
      else { setNgo(ngoData); setUpdates(ngoUpdates) }
      setLoading(false)
    }
    load()
  }, [id])

  if (!loading && notFound404) notFound()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  if (!ngo) return null
  const profile = ngo
  const ngoProfile = ngo.ngo_profile

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <Link href="/ngos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground boty-transition">
        <ArrowLeft className="w-4 h-4" /> Back to NGOs
      </Link>

      <div className="flex items-start gap-6 flex-col sm:flex-row">
        {/* Main */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Profile card */}
          <div className="bg-card rounded-2xl p-6 boty-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={ngoProfile?.organization_name ?? ''} className="w-full h-full object-cover" />
                ) : (
                  <PawPrint className="w-8 h-8 text-primary/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-serif text-2xl font-semibold text-foreground">
                  {ngoProfile?.organization_name ?? profile.full_name ?? 'NGO'}
                </h1>
                <div className="flex items-center flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Member since {memberSince}
                  </span>
                  {ngoProfile?.address && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ngoProfile.address}</span>
                  )}
                  {ngoProfile?.website_url && (
                    <a href={ngoProfile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary boty-transition">
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>
            {ngoProfile?.mission_statement && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{ngoProfile.mission_statement}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{profile.bio}</p>
            )}
          </div>

          {/* Updates */}
          <div>
            <h2 className="font-semibold text-foreground mb-3">Recent Updates</h2>
            {updates.length === 0 ? (
              <div className="py-12 text-center bg-card rounded-2xl boty-shadow">
                <p className="text-muted-foreground text-sm">No updates yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((u) => (
                  <NgoUpdateCard key={u.id} update={u} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Donation */}
        <aside className="w-full sm:w-80 shrink-0">
          {ngoProfile?.accepts_donations ? (
            <DonationForm
              ngoId={profile.id}
              ngoName={ngoProfile.organization_name ?? profile.full_name ?? 'this NGO'}
            />
          ) : (
            <div className="bg-card rounded-2xl p-5 boty-shadow text-center">
              <p className="text-sm text-muted-foreground">This organization is not currently accepting donations.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
