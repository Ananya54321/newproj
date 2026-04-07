'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, PawPrint } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createCommunity } from '@/lib/community/service'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function NewCommunityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) { toast.error('You must be signed in to create a community'); return }
    setSaving(true)
    try {
      let iconUrl: string | null = null
      if (iconFile) {
        const { url, error } = await uploadToCloudinary(iconFile, 'community-icons')
        if (error) { toast.error(error); setSaving(false); return }
        iconUrl = url
      }

      const { community, error } = await createCommunity(
        { name, slug, description: description || null, is_public: isPublic, icon_url: iconUrl },
        user.id
      )
      if (error) {
        toast.error(error)
      } else {
        toast.success('Community created!')
        router.push(`/community/${community!.slug}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto pt-16 pb-8 sm:py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/community" className="p-1.5 text-muted-foreground hover:text-foreground boty-transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Create Community</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
        {/* Icon upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Community Icon</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {iconPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <PawPrint className="w-8 h-8 text-primary/40" />
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground boty-transition border border-dashed border-border/60 rounded-xl px-4 py-2">
              <Upload className="w-4 h-4" /> Upload icon
              <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Community Name <span className="text-destructive">*</span>
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Dogs of Furever"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            URL Slug <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center rounded-xl bg-background border border-border/60 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
            <span className="px-3 py-2.5 text-sm text-muted-foreground border-r border-border/60 bg-muted/30 shrink-0">
              /community/
            </span>
            <input
              required
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
              placeholder="dogs-of-furever"
              className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is this community about?"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Public Community</p>
            <p className="text-xs text-muted-foreground">Anyone can view and join</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative w-11 h-6 rounded-full boty-transition ${isPublic ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm boty-transition ${isPublic ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</> : 'Create Community'}
        </Button>
      </form>
    </div>
  )
}
