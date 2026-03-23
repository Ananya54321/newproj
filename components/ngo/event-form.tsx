'use client'

import { useState } from 'react'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import type { NgoEventFormData } from '@/lib/ngo/service'
import { Loader2, ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  initial?: Partial<NgoEventFormData>
  onSubmit: (data: NgoEventFormData) => Promise<void>
  submitLabel?: string
}

export function EventForm({ initial, onSubmit, submitLabel = 'Create Event' }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [type, setType] = useState<'meetup' | 'fundraiser'>(initial?.type ?? 'meetup')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [eventDate, setEventDate] = useState(initial?.event_date ? initial.event_date.slice(0, 16) : '')
  const [registrationUrl, setRegistrationUrl] = useState(initial?.registration_url ?? '')
  const [goalAmount, setGoalAmount] = useState(initial?.goal_amount ? String(initial.goal_amount) : '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    const url = await uploadToCloudinary(file, 'furever/ngo-events')
    setUploadingImage(false)
    if (url) setImageUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !eventDate) return
    setSubmitting(true)
    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      type,
      location: location.trim() || null,
      event_date: new Date(eventDate).toISOString(),
      image_url: imageUrl || null,
      registration_url: registrationUrl.trim() || null,
      goal_amount: goalAmount ? parseFloat(goalAmount) : null,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Event Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Annual Adoption Day"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Event Type *</label>
        <div className="flex gap-2">
          {(['meetup', 'fundraiser'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors capitalize ${
                type === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border/60 hover:border-primary/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Date & Time *</label>
        <input
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Address or online"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Tell people about this event…"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Event Image</label>
        {imageUrl ? (
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Event" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
            {uploadingImage ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload event image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      {/* Registration URL */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Registration URL</label>
        <input
          type="url"
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Goal Amount (fundraiser only) */}
      {type === 'fundraiser' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Fundraising Goal (USD)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      <Button type="submit" disabled={submitting || uploadingImage} className="w-full">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : submitLabel}
      </Button>
    </form>
  )
}
