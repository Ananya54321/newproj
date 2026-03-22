'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/lib/auth/types'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setBio(profile.bio ?? '')
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
            {/* Avatar */}
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
        <div className="max-w-xl">
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
        </div>
      </div>
    </div>
  )
}
