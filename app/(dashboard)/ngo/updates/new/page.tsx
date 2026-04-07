'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createNGOUpdate } from '@/lib/ngo/service'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function NewNGOUpdatePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const { url, error } = await uploadToCloudinary(imageFile, `ngo-updates/${user.id}`)
        if (error) { toast.error(error); return }
        imageUrl = url
      }

      const { error } = await createNGOUpdate({ title, content, image_url: imageUrl }, user.id)
      if (error) toast.error(error)
      else {
        toast.success('Update posted!')
        router.push('/ngo')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto pt-16 pb-8 sm:py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ngo" className="p-1.5 text-muted-foreground hover:text-foreground boty-transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Post Update</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Rescue update, fundraising news…"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Content <span className="text-destructive">*</span>
          </label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Share what's happening with your organization…"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Cover Image (optional)</label>
          {imagePreview ? (
            <div className="relative w-full rounded-xl overflow-hidden bg-muted max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 boty-transition text-sm text-muted-foreground">
              <Upload className="w-4 h-4" /> Upload image
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Posting…</> : 'Post Update'}
        </Button>
      </form>
    </div>
  )
}
