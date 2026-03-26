'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ImagePlus, Loader2, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { createReturnRequest, RETURN_POLICY, type ReturnFormData } from '@/lib/marketplace/service'
import type { ReturnReasonType, OrderWithItems } from '@/lib/auth/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReturnRequestFormProps {
  order: OrderWithItems
  userId: string
  onSuccess: () => void
  onClose: () => void
}

const REASON_OPTIONS: { value: ReturnReasonType; label: string; description: string; needsImages: boolean }[] = [
  {
    value: 'damaged',
    label: 'Item arrived damaged',
    description: 'Full refund including delivery. Requires photos of the damage.',
    needsImages: true,
  },
  {
    value: 'wrong_item',
    label: 'Wrong item received',
    description: 'Full refund including delivery. Requires photos of the item received.',
    needsImages: true,
  },
  {
    value: 'changed_mind',
    label: 'Changed my mind',
    description: 'Product-only refund. Processed automatically once item is collected.',
    needsImages: false,
  },
]

export function ReturnRequestForm({ order, userId, onSuccess, onClose }: ReturnRequestFormProps) {
  const [reasonType, setReasonType] = useState<ReturnReasonType | null>(null)
  const [reasonNote, setReasonNote] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedReason = REASON_OPTIONS.find((r) => r.value === reasonType)

  // Check if any items are non-returnable
  const hasNonReturnable = order.items.some((item) => {
    const cat = (item.product as unknown as { category?: string })?.category
    return RETURN_POLICY[cat ?? 'other'] === 'ineligible'
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files.slice(0, 3 - images.length)) {
      const { url, error } = await uploadToCloudinary(file, 'returns')
      if (error) { toast.error('Image upload failed'); continue }
      if (url) setImages((prev) => [...prev, url])
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reasonType) return
    if (selectedReason?.needsImages && images.length === 0) {
      toast.error('Please upload at least one photo for damaged/wrong item returns.')
      return
    }

    setSubmitting(true)
    const data: ReturnFormData = {
      order_id: order.id,
      reason_type: reasonType,
      reason_note: reasonNote.trim() || null,
      image_urls: images,
    }
    const { error } = await createReturnRequest(data, userId)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Return request submitted.')
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-serif text-lg font-semibold text-foreground">Request a Return</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Non-returnable notice */}
          {hasNonReturnable && (
            <div className="flex gap-2.5 rounded-xl bg-destructive/10 p-3.5">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Some items in this order (medicines / opened consumables) are non-returnable.
                You may still request a return for other eligible items.
              </p>
            </div>
          )}

          {/* Refund policy summary */}
          <div className="rounded-xl bg-card border border-border/50 p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Return Policy</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span className="text-foreground"><span className="font-medium">Damaged / wrong item</span> - Full refund incl. delivery, after admin review &amp; collection</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="text-foreground"><span className="font-medium">Changed mind</span> - Product-only refund, auto-processed after collection</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                <span className="text-muted-foreground">Medicines &amp; opened consumables are non-returnable</span>
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reason for Return <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              {REASON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReasonType(opt.value)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3.5 transition-colors',
                    reasonType === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:border-primary/40 bg-card'
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Additional notes */}
          <div className="space-y-1.5">
            <Label htmlFor="return-note" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Additional Notes
            </Label>
            <Textarea
              id="return-note"
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Describe the issue in more detail…"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Image upload (required for damaged/wrong) */}
          {selectedReason?.needsImages && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Photos of Item <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-3 flex-wrap">
                {images.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/40 shrink-0">
                    <Image src={url} alt={`Return photo ${i + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-0.5">Add photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} multiple />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" /> Up to 3 photos. Clear images speed up the review.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!reasonType || submitting || uploading}
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : 'Submit Return'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
