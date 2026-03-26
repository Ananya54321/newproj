'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import type { NgoEventFormData } from '@/lib/ngo/service'
import { toast } from 'sonner'

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initial?.event_date ? new Date(initial.event_date) : undefined
  )
  const [timeStr, setTimeStr] = useState(
    initial?.event_date ? format(new Date(initial.event_date), 'HH:mm') : '10:00'
  )
  const [goalAmount, setGoalAmount] = useState(initial?.goal_amount ? String(initial.goal_amount) : '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    const { url, error } = await uploadToCloudinary(file, 'ngo-events')
    setUploadingImage(false)
    if (error) {
      toast.error('Image upload failed: ' + error)
      return
    }
    if (url) setImageUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedDate) return
    setSubmitting(true)

    const [hours, minutes] = timeStr.split(':').map(Number)
    const combined = new Date(selectedDate)
    combined.setHours(hours, minutes, 0, 0)

    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      type,
      location: location.trim() || null,
      event_date: combined.toISOString(),
      image_url: imageUrl || null,
      goal_amount: goalAmount ? parseFloat(goalAmount) : null,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="event-title">
          Event Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Annual Adoption Day"
        />
      </div>

      {/* Type toggle */}
      <div className="space-y-1.5">
        <Label>Event Type <span className="text-destructive">*</span></Label>
        <div className="flex gap-2">
          {(['meetup', 'fundraiser'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors capitalize',
                type === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border/60 hover:border-primary/50'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Date <span className="text-destructive">*</span></Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="event-time">
            Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="event-time"
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="event-location">Location</Label>
        <Input
          id="event-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Address or online"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="event-desc">Description</Label>
        <Textarea
          id="event-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Tell people about this event…"
          className="resize-none"
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <Label>Event Image</Label>
        {imageUrl ? (
          <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Event" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 boty-transition"
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

      {/* Goal Amount — fundraiser only */}
      {type === 'fundraiser' && (
        <div className="space-y-1.5">
          <Label htmlFor="event-goal">Fundraising Goal (₹)</Label>
          <Input
            id="event-goal"
            type="number"
            min="1"
            step="1"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="50000"
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting || uploadingImage || !selectedDate}
        className="w-full"
      >
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</>
          : submitLabel}
      </Button>
    </form>
  )
}
