'use client'

import { useState } from 'react'
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
import { PetAvatar } from './pet-avatar'
import { uploadPetAvatar, type PetFormData } from '@/lib/pets/service'
import { SPECIES_OPTIONS } from '@/lib/auth/types'
import type { Pet } from '@/lib/auth/types'

interface PetFormProps {
  initial?: Pet
  onSubmit: (data: PetFormData) => Promise<{ error: string | null }>
  submitLabel?: string
}

export function PetForm({ initial, onSubmit, submitLabel = 'Save Pet' }: PetFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial?.avatar_url ?? null)

  const [form, setForm] = useState<PetFormData>({
    name: initial?.name ?? '',
    species: (initial?.species as PetFormData['species']) ?? 'dog',
    breed: initial?.breed ?? '',
    birth_date: initial?.birth_date ?? '',
    weight_kg: initial?.weight_kg ?? undefined,
    medical_notes: initial?.medical_notes ?? '',
    avatar_url: initial?.avatar_url ?? null,
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Pet name is required.')
      return
    }

    setSubmitting(true)
    let avatarUrl = form.avatar_url

    // Upload avatar if a new file was selected
    if (avatarFile && initial?.id) {
      const { url, error: uploadErr } = await uploadPetAvatar(avatarFile, initial.id)
      if (uploadErr) {
        toast.error(`Avatar upload failed: ${uploadErr}`)
        setSubmitting(false)
        return
      }
      avatarUrl = url
    }

    const result = await onSubmit({ ...form, avatar_url: avatarUrl })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(initial ? 'Pet updated!' : 'Pet added!')
      router.push('/pets')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar upload */}
      <div className="flex items-center gap-4">
        <PetAvatar
          avatarUrl={avatarPreview}
          species={form.species}
          name={form.name}
          size="xl"
        />
        <div>
          <Label htmlFor="avatar" className="text-sm font-medium">
            Photo (optional)
          </Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="mt-1.5 text-sm"
            disabled={!initial?.id}
          />
          {!initial?.id && (
            <p className="text-xs text-muted-foreground mt-1">
              You can upload a photo after adding the pet.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Buddy"
            className="mt-1.5"
            required
          />
        </div>

        {/* Species */}
        <div>
          <Label>Species *</Label>
          <Select
            value={form.species}
            onValueChange={(v) => setForm((f) => ({ ...f, species: v as PetFormData['species'] }))}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPECIES_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.emoji} {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Breed */}
        <div>
          <Label htmlFor="breed">Breed</Label>
          <Input
            id="breed"
            value={form.breed ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
            placeholder="Golden Retriever"
            className="mt-1.5"
          />
        </div>

        {/* Birth date */}
        <div>
          <Label htmlFor="birth_date">Date of Birth</Label>
          <Input
            id="birth_date"
            type="date"
            value={form.birth_date ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
            className="mt-1.5"
          />
        </div>

        {/* Weight */}
        <div>
          <Label htmlFor="weight_kg">Weight (kg)</Label>
          <Input
            id="weight_kg"
            type="number"
            min="0"
            step="0.1"
            value={form.weight_kg ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                weight_kg: e.target.value ? parseFloat(e.target.value) : undefined,
              }))
            }
            placeholder="5.2"
            className="mt-1.5"
          />
        </div>

        {/* Medical notes */}
        <div className="sm:col-span-2">
          <Label htmlFor="medical_notes">Medical Notes</Label>
          <Textarea
            id="medical_notes"
            value={form.medical_notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, medical_notes: e.target.value }))}
            placeholder="Allergies, vaccinations, medications..."
            rows={3}
            className="mt-1.5 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none sm:min-w-32">
          {submitting ? 'Saving...' : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/pets')}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
