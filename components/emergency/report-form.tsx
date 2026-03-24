'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Image as ImageIcon, Loader2, MapPin, X } from 'lucide-react'
import {
  createEmergencyReport,
  uploadReportImage,
  type EmergencyFormData,
} from '@/lib/emergency/service'
import { EMERGENCY_CATEGORY_CONFIG, type EmergencyCategory } from '@/lib/auth/types'
import { useAuth } from '@/hooks/use-auth'

const MAX_IMAGES = 4

export function ReportForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [form, setForm] = useState<Omit<EmergencyFormData, 'image_urls'>>({
    title: '',
    description: '',
    location: '',
    category: 'other',
  })

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = MAX_IMAGES - imageFiles.length
    const toAdd = files.slice(0, remaining)
    setImageFiles((f) => [...f, ...toAdd])
    setImagePreviews((p) => [...p, ...toAdd.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeImage = (idx: number) => {
    setImageFiles((f) => f.filter((_, i) => i !== idx))
    setImagePreviews((p) => p.filter((_, i) => i !== idx))
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          location: f.location || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }))
        toast.success('Location captured!')
      },
      () => toast.error('Could not get your location. Please type it manually.')
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.location.trim()) {
      toast.error('Title and location are required.')
      return
    }

    if (!user?.id) {
      toast.error('You must be signed in to submit a report.')
      return
    }

    setSubmitting(true)
    try {
      // Create the report first to get an ID for image uploads
      const { id, error } = await createEmergencyReport({ ...form, image_urls: [] }, user.id)
      if (error || !id) {
        toast.error(error ?? 'Failed to create report.')
        return
      }

      // Upload images concurrently
      if (imageFiles.length > 0) {
        const uploadResults = await Promise.all(imageFiles.map((f) => uploadReportImage(f, id)))
        const imageUrls = uploadResults.filter((r) => r.url).map((r) => r.url as string)
        if (imageUrls.length > 0) {
          const { supabaseClient } = await import('@/lib/supabase/client')
          await supabaseClient
            .from('emergency_reports')
            .update({ image_urls: imageUrls })
            .eq('id', id)
        }
      }

      toast.success('Emergency report submitted! Thank you for helping.')
      router.push('/emergency')
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category */}
      <div>
        <Label className="mb-1.5 block">Category *</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm((f) => ({ ...f, category: v as EmergencyCategory }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(EMERGENCY_CATEGORY_CONFIG) as [EmergencyCategory, { label: string; color: string }][]).map(
              ([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Injured dog on Main Street"
          className="mt-1.5"
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Provide details about the animal and situation..."
          rows={4}
          className="mt-1.5 resize-none"
        />
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">Location *</Label>
        <div className="flex gap-2 mt-1.5">
          <Input
            id="location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Street address or landmark"
            required
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetLocation}
            title="Use my current location"
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image upload */}
      <div>
        <Label className="mb-2 block">
          Photos (up to {MAX_IMAGES})
        </Label>
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((src, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {imageFiles.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary boty-transition"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-xs">Add</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageAdd}
          className="hidden"
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto sm:min-w-40">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Report'
        )}
      </Button>
    </form>
  )
}
