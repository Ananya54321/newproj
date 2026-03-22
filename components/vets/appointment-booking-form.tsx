'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Loader2 } from 'lucide-react'
import { getAvailableSlots, createAppointment } from '@/lib/vets/service'
import { CONSULTATION_TYPE_CONFIG, type ConsultationType, type VetWithProfile } from '@/lib/auth/types'
import type { Pet } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface AppointmentBookingFormProps {
  vet: VetWithProfile
  pets: Pet[]
}

export function AppointmentBookingForm({ vet, pets }: AppointmentBookingFormProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [petId, setPetId] = useState<string | null>(null)
  const [consultationType, setConsultationType] = useState<ConsultationType>('in_person')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!selectedDate) return
    setSelectedSlot(null)
    setLoadingSlots(true)
    getAvailableSlots(vet.id, selectedDate)
      .then(setSlots)
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, vet.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot.')
      return
    }

    setSubmitting(true)

    // Build ISO datetime by combining date + slot
    const [h, m] = selectedSlot.split(':').map(Number)
    const dt = new Date(selectedDate)
    dt.setHours(h, m, 0, 0)

    const { id, error } = await createAppointment({
      vet_id: vet.id,
      pet_id: petId,
      scheduled_at: dt.toISOString(),
      consultation_type: consultationType,
      duration_minutes: 30,
      notes: notes || undefined,
    })

    if (error) {
      toast.error(error)
    } else {
      toast.success('Appointment booked! The vet will confirm shortly.')
      router.push('/appointments')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date picker */}
      <div>
        <Label className="mb-2 block">Select Date *</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          className="rounded-xl border border-border/60 bg-card p-3 w-fit"
        />
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <Label className="mb-2 block">Select Time *</Label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading available slots...
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No available slots on this date. Please choose another day.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-sm font-medium border boty-transition',
                    selectedSlot === slot
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border/60 hover:border-primary/50'
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consultation type */}
      <div>
        <Label className="mb-1.5 block">Consultation Type *</Label>
        <Select
          value={consultationType}
          onValueChange={(v) => setConsultationType(v as ConsultationType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(CONSULTATION_TYPE_CONFIG) as [ConsultationType, { label: string; icon: string }][]).map(
              ([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.icon} {config.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Pet selector */}
      {pets.length > 0 && (
        <div>
          <Label className="mb-1.5 block">Which pet? (optional)</Label>
          <Select value={petId ?? ''} onValueChange={(v) => setPetId(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a pet..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No specific pet</SelectItem>
              {pets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div>
        <Label htmlFor="notes" className="mb-1.5 block">
          Notes (optional)
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe symptoms or reason for visit..."
          rows={3}
          className="resize-none"
        />
      </div>

      <Button type="submit" disabled={submitting || !selectedDate || !selectedSlot} className="w-full sm:w-auto sm:min-w-40">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Booking...
          </>
        ) : (
          'Book Appointment'
        )}
      </Button>
    </form>
  )
}
