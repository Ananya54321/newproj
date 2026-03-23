'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import { updateProfileSlug } from '@/lib/profiles/service'
import { toast } from 'sonner'
import { Loader2, User, ExternalLink, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/lib/auth/types'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  const [slug, setSlug] = useState('')
  const [savingSlug, setSavingSlug] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setBio(profile.bio ?? '')
      setSlug(profile.slug ?? '')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    const { error } = await supabaseClient
      .from('profiles')
      .update({ full_name: fullName, phone, bio })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      toast.error(error.message)
    } else {
      await refreshProfile()
      toast.success('Profile updated')
    }
  }

  const handleSlugSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    const trimmed = slug.trim().toLowerCase()
    if (!trimmed) {
      toast.error('Username cannot be empty')
      return
    }
    setSavingSlug(true)
    const { error } = await updateProfileSlug(user.id, trimmed)
    setSavingSlug(false)
    if (error) {
      toast.error(error)
    } else {
      await refreshProfile()
      toast.success('Username saved')
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading profile…
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-primary" />
              )}
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-0.5">{profile.full_name ?? 'Your Profile'}</h1>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1.5 inline-block">
                {ROLE_LABELS[profile.role]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-xl space-y-5">
          {/* Personal Information */}
          <form onSubmit={handleSave} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
            <h2 className="font-semibold text-foreground mb-1">Personal Information</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border/40 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us a little about yourself…"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Save Changes'}
            </Button>
          </form>

          {/* Public Profile URL */}
          <form onSubmit={handleSlugSave} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Public Profile URL</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Choose a unique username so others can find your public profile.
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <div className="flex rounded-xl overflow-hidden border border-border/60 focus-within:ring-2 focus-within:ring-primary/30">
                <span className="px-3 py-2.5 bg-muted text-sm text-muted-foreground border-r border-border/40 shrink-0">
                  furever.app/users/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="your-username"
                  maxLength={50}
                  className="flex-1 px-3 py-2.5 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                3–50 characters. Letters, numbers, hyphens and underscores only.
              </p>
            </div>

            {profile.slug && (
              <Link
                href={`/users/${profile.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View your public profile
              </Link>
            )}

            <Button type="submit" disabled={savingSlug} variant="outline" className="w-full">
              {savingSlug ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Save Username'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
