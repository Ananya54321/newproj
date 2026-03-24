import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getProfileBySlug } from '@/lib/profiles/service'
import { ROLE_LABELS } from '@/lib/auth/types'
import { User, Stethoscope, Heart, Store, Globe, Instagram, MapPin, CalendarDays, ExternalLink } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const data = await getProfileBySlug(slug, supabase)
  if (!data || data.profile.role === 'admin') return { title: 'Profile Not Found' }
  const name = data.profile.full_name ?? slug
  return {
    title: `${name} — Furever`,
    description: data.profile.bio ?? `${name}'s profile on Furever`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const data = await getProfileBySlug(slug, supabase)

  if (!data || data.profile.role === 'admin') notFound()

  const { profile, vet, ngo, store } = data
  const name = profile.full_name ?? slug

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-3xl font-bold text-foreground">{name}</h1>
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary mt-2">
                {profile.role === 'veterinarian' && <Stethoscope className="w-3 h-3" />}
                {profile.role === 'ngo' && <Heart className="w-3 h-3" />}
                {profile.role === 'store_owner' && <Store className="w-3 h-3" />}
                {ROLE_LABELS[profile.role]}
              </span>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{profile.bio}</p>
              )}
              {profile.address && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{profile.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Veterinarian section */}
        {profile.role === 'veterinarian' && vet && (
          <div className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Veterinary Practice
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {vet.clinic_name && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Clinic</p>
                  <p className="font-medium text-foreground">{vet.clinic_name}</p>
                </div>
              )}
              {vet.clinic_address && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Address</p>
                  <p className="font-medium text-foreground">{vet.clinic_address}</p>
                </div>
              )}
              {vet.years_experience != null && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Experience</p>
                  <p className="font-medium text-foreground">{vet.years_experience} years</p>
                </div>
              )}
              {vet.consultation_fee != null && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Consultation Fee</p>
                  <p className="font-medium text-foreground">${vet.consultation_fee}</p>
                </div>
              )}
            </div>
            {vet.specialty && vet.specialty.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {vet.specialty.map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <SocialLinks links={vet.social_links} />
            {vet.verified_at && (
              <Link
                href={`/vets/${profile.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              >
                <CalendarDays className="w-4 h-4" />
                Book an Appointment
              </Link>
            )}
          </div>
        )}

        {/* NGO section */}
        {profile.role === 'ngo' && ngo && (
          <div className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              {ngo.organization_name}
            </h2>
            {ngo.mission_statement && (
              <p className="text-sm text-muted-foreground leading-relaxed">{ngo.mission_statement}</p>
            )}
            {ngo.address && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {ngo.address}
              </div>
            )}
            <SocialLinks links={ngo.social_links} websiteUrl={ngo.website_url} />
            {ngo.accepts_donations && (
              <Link
                href={`/ngos/${profile.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Heart className="w-4 h-4" />
                Donate
              </Link>
            )}
          </div>
        )}

        {/* Store section */}
        {profile.role === 'store_owner' && store && (
          <div className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              {store.name}
            </h2>
            {store.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{store.description}</p>
            )}
            {store.address && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {store.address}
              </div>
            )}
            {store.store_images && store.store_images.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Store Photos</p>
                <div className="flex gap-2 flex-wrap">
                  {store.store_images.slice(0, 4).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={img} alt={`Store photo ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border border-border/40" />
                  ))}
                </div>
              </div>
            )}
            <SocialLinks links={store.social_links} />
            {store.slug && (
              <Link
                href={`/marketplace/${store.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Store className="w-4 h-4" />
                Visit Store
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SocialLinks({ links, websiteUrl }: { links?: Record<string, string> | null; websiteUrl?: string | null }) {
  const entries: Array<{ icon: React.ElementType; label: string; url: string }> = []
  if (websiteUrl) entries.push({ icon: Globe, label: 'Website', url: websiteUrl })
  if (links?.website) entries.push({ icon: Globe, label: 'Website', url: links.website })
  if (links?.instagram) entries.push({ icon: Instagram, label: 'Instagram', url: links.instagram })

  if (!entries.length) return null

  return (
    <div className="flex gap-3 flex-wrap">
      {entries.map(({ icon: Icon, label, url }) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
          <ExternalLink className="w-3 h-3" />
        </a>
      ))}
    </div>
  )
}
