'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, X, Link2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createPost } from '@/lib/community/service'
import { getCommunityBySlug } from '@/lib/community/service'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { PostType } from '@/lib/auth/types'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function NewPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [communityId, setCommunityId] = useState<string | null>(null)
  const [type, setType] = useState<PostType>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCommunityBySlug(slug).then((c) => { if (c) setCommunityId(c.id) })
  }, [slug])

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4)
    setImageFiles(files)
    setImagePreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const removeImage = (i: number) => {
    setImageFiles((p) => p.filter((_, idx) => idx !== i))
    setImagePreviews((p) => p.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !communityId) return
    setSaving(true)
    try {
      let imageUrls: string[] = []
      if (type === 'image' && imageFiles.length > 0) {
        for (const file of imageFiles) {
          const { url, error } = await uploadToCloudinary(file, `community-posts`)
          if (error) { toast.error(error); return }
          if (url) imageUrls.push(url)
        }
      }

      const { post, error } = await createPost(
        {
          title,
          content: type === 'text' ? content || null : null,
          type,
          image_urls: imageUrls,
          link_url: type === 'link' ? linkUrl || null : null,
        },
        communityId,
        user.id
      )
      if (error) toast.error(error)
      else {
        toast.success('Post created!')
        router.push(`/community/${slug}/post/${post!.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const POST_TYPES: { value: PostType; label: string; icon: React.ElementType }[] = [
    { value: 'text', label: 'Text', icon: () => <span className="text-sm">T</span> },
    { value: 'image', label: 'Image', icon: Upload },
    { value: 'link', label: 'Link', icon: Link2 },
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/community/${slug}`} className="p-1.5 text-muted-foreground hover:text-foreground boty-transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Create Post</h1>
      </div>

      <div className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
        {/* Type selector */}
        <div className="flex gap-2 border-b border-border/60 pb-3">
          {POST_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium boty-transition',
                type === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Text content */}
          {type === 'text' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="What's on your mind? (optional)"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}

          {/* Image upload */}
          {type === 'image' && (
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
                <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 boty-transition text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" /> Add images (up to 4)
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Link URL */}
          {type === 'link' && (
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}

          <Button type="submit" disabled={saving || !title.trim()} className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Posting…</> : 'Post'}
          </Button>
        </form>
      </div>
    </div>
  )
}
