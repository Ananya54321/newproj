'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, CalendarIcon, ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { createCommunityEvent, getCommunityBySlug } from '@/lib/community/service'
import { useAuth } from '@/hooks/use-auth'
import type { CommunityEventType } from '@/lib/auth/types'
import { toast } from 'sonner'
import { useEffect } from 'react'

const EVENT_TYPES: { value: CommunityEventType; label: string }[] = [
  { value: 'meetup',   label: 'Meetup' },
  { value: 'social',   label: 'Social' },
  { value: 'training', label: 'Training' },
  { value: 'other',    label: 'Other' },
]

export default function NewCommunityEventPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [communityId, setCommunityId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CommunityEventType>('meetup')
  const [location, setLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [timeStr, setTimeStr] = useState('10:00')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCommunityBySlug(slug).then((c) => {
      if (c) setCommunityId(c.id)
      else router.push('/community')
    })
  }, [slug, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    const { url, error } = await uploadToCloudinary(file, 'community-events')
    setUploadingImage(false)
    if (error) { toast.error('Image upload failed'); return }
    if (url) setImageUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedDate || !communityId || !user?.id) return
    setSubmitting(true)

    const [hours, minutes] = timeStr.split(':').map(Number)
    const combined = new Date(selectedDate)
    combined.setHours(hours, minutes, 0, 0)

    const { error } = await createCommunityEvent(
      {
        title: title.trim(),
        description: description.trim() || null,
        type,
        location: location.trim() || null,
        event_date: combined.toISOString(),
        image_url: imageUrl || null,
      },
      communityId,
      user.id
    )
    setSubmitting(false)
    if (error) { toast.error(error); return }
    toast.success('Event created!')
    router.push(`/community/${slug}`)
  }

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href={`/community/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to community
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Create Community Event</h1>
          <p className="text-sm text-muted-foreground mt-1">Organise a gathering for your community members.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-card rounded-2xl p-6 boty-shadow">
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
                placeholder="e.g. Saturday Dog Park Meetup"
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Event Type <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      'py-2.5 rounded-xl border text-sm font-medium transition-colors capitalize',
                      type === value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border/60 hover:border-primary/50'
                    )}
                  >
                    {label}
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
                      className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}
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
                <Label htmlFor="event-time">Time <span className="text-destructive">*</span></Label>
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
                placeholder="Address or online link"
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

            <div className="flex gap-3">
              <Link href={`/community/${slug}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting || uploadingImage || !selectedDate || !title.trim()}
                className="flex-1"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</> : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
