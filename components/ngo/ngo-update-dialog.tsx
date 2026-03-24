'use client'

import { useState } from 'react'
import { Loader2, Upload, X, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { createNGOUpdate } from '@/lib/ngo/service'
import type { NgoUpdate } from '@/lib/auth/types'
import { toast } from 'sonner'

interface NgoUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onCreated: (update: NgoUpdate) => void
}

export function NgoUpdateDialog({ open, onOpenChange, userId, onCreated }: NgoUpdateDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const { url, error } = await uploadToCloudinary(imageFile, `ngo-updates/${userId}`)
        if (error) {
          toast.error('Image upload failed: ' + error)
          return
        }
        imageUrl = url
      }

      const { update, error } = await createNGOUpdate(
        { title: title.trim(), content: content.trim(), image_url: imageUrl },
        userId
      )

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Update posted!')
      if (update) onCreated(update)
      resetForm()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) resetForm() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Post an Update
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="update-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="update-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rescue update, fundraising news…"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="update-content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="update-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Share what's happening with your organization…"
              required
              className="resize-none"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>Cover Image (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-background/80 rounded-full flex items-center justify-center hover:bg-background boty-transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full py-5 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 boty-transition text-sm text-muted-foreground">
                <Upload className="w-4 h-4" />
                Upload image
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { onOpenChange(false); resetForm() }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim() || !content.trim()} className="flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Posting…</> : 'Post Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
