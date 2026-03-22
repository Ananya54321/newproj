'use client'

import Link from 'next/link'
import { Globe, MapPin, Heart, PawPrint } from 'lucide-react'
import type { Profile, NgoProfile } from '@/lib/auth/types'

interface NgoCardProps {
  profile: Profile & { ngo_profile: NgoProfile }
}

export function NgoCard({ profile }: NgoCardProps) {
  const ngo = profile.ngo_profile
  return (
    <div className="bg-card rounded-2xl p-5 boty-shadow flex items-start gap-4">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={ngo?.organization_name ?? ''} className="w-full h-full object-cover" />
        ) : (
          <PawPrint className="w-6 h-6 text-primary/40" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/ngos/${profile.id}`}
          className="font-semibold text-foreground hover:text-primary boty-transition block truncate"
        >
          {ngo?.organization_name ?? profile.full_name ?? 'NGO'}
        </Link>
        {ngo?.mission_statement && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{ngo.mission_statement}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
          {ngo?.address && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ngo.address}</span>
          )}
          {ngo?.website_url && (
            <a href={ngo.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary boty-transition">
              <Globe className="w-3 h-3" />Website
            </a>
          )}
          {ngo?.accepts_donations && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Heart className="w-3 h-3" />Accepts donations
            </span>
          )}
        </div>
      </div>

      <Link
        href={`/ngos/${profile.id}`}
        className="shrink-0 text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 boty-transition"
      >
        View
      </Link>
    </div>
  )
}
