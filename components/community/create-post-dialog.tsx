'use client'

import { useState } from 'react'
import { Loader2, Upload, X, Link2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createPost } from '@/lib/community/service'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface CommunityOption {
  id: string
  slug: string
  name: string
}

interface CreatePostDialogProps {
  communityId?: string
  communitySlug?: string
  communities?: CommunityOption[]
  onCreated?: () => void
  children?: React.ReactNode
}

export function CreatePostDialog({ communityId: initialCommunityId, communitySlug: initialCommunitySlug, communities, onCreated, children }: CreatePostDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialCommunityId ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const communityId = initialCommunityId ?? selectedCommunityId
  const communitySlug = initialCommunitySlug ?? communities?.find((c) => c.id === selectedCommunityId)?.slug ?? ''

  const reset = () => {
    setSelectedCommunityId(initialCommunityId ?? '')
    setTitle('')
    setContent('')
    setLinkUrl('')
    setImageFiles([])
    setImagePreviews([])
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - imageFiles.length)
    const newFiles = [...imageFiles, ...files].slice(0, 4)
    setImageFiles(newFiles)
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  const removeImage = (i: number) => {
    const newFiles = imageFiles.filter((_, idx) => idx !== i)
    setImageFiles(newFiles)
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !communityId) return
    setSaving(true)
    try {
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const { url, error } = await uploadToCloudinary(file, 'community-posts')
          if (error) { toast.error(error); return }
          if (url) imageUrls.push(url)
        }
      }

      const type = imageUrls.length > 0 ? 'image' : linkUrl.trim() ? 'link' : 'text'

      const { post, error } = await createPost(
        {
          title,
          content: content.trim() || null,
          type,
          image_urls: imageUrls,
          link_url: linkUrl.trim() || null,
        },
        communityId,
        user.id
      )
      if (error) {
        toast.error(error)
      } else {
        toast.success('Post created!')
        setOpen(false)
        reset()
        if (onCreated) {
          onCreated()
        } else {
          router.push(`/community/${communitySlug}/post/${post!.id}`)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Community selector (when not pre-set) */}
          {!initialCommunityId && communities && communities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Community</label>
              <select
                required
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select a community…</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              maxLength={300}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{title.length}/300</p>
          </div>

          {/* Description */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="What's on your mind? (optional)"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Image upload */}
          <div>
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-background/80 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imagePreviews.length < 4 && (
              <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 boty-transition text-sm text-muted-foreground">
                <Upload className="w-4 h-4" />
                {imagePreviews.length === 0 ? 'Add images (optional, up to 4)' : 'Add more images'}
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
            )}
          </div>

          {/* Link URL */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-background border border-border/60 focus-within:ring-2 focus-within:ring-primary/30">
            <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Link URL (optional)"
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving || !title.trim()} className="flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Posting…</> : 'Post'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
