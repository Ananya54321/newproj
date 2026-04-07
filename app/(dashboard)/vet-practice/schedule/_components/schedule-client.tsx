'use client'

import { useState } from 'react'
import { updateVetProfile } from '@/lib/vets/service'
import { ScheduleEditor, DEFAULT_HOURS } from '@/components/vet/schedule-editor'
import type { DayHours } from '@/components/vet/schedule-editor'
import { toast } from 'sonner'
import { Calendar, IndianRupee, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CONSULTATION_TYPES = [
  { value: 'in_person', label: 'In-Person' },
  { value: 'video', label: 'Video Call' },
  { value: 'home_visit', label: 'Home Visit' },
] as const

interface Props {
  userId: string
  initialAvailableHours: DayHours
  initialConsultationFee: string
}

export function ScheduleClient({ userId, initialAvailableHours, initialConsultationFee }: Props) {
  const [availableHours, setAvailableHours] = useState<DayHours>(initialAvailableHours)
  const [consultationFee, setConsultationFee] = useState(initialConsultationFee)
  const [consultationTypes, setConsultationTypes] = useState<string[]>(['in_person'])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const fee = consultationFee ? parseFloat(consultationFee) : null
    const { error } = await updateVetProfile(userId, {
      available_hours: availableHours,
      consultation_fee: fee,
    })
    setSaving(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Schedule saved')
    }
  }

  const toggleType = (type: string) => {
    setConsultationTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/vet-practice" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">My Schedule</h1>
              <p className="text-sm text-muted-foreground">Set your availability and consultation settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-xl space-y-5">
          {/* Weekly Availability */}
          <div className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
            <h2 className="font-semibold text-foreground">Weekly Availability</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Toggle days on/off and set your working hours for each day.
            </p>
            <ScheduleEditor value={availableHours} onChange={setAvailableHours} />
          </div>

          {/* Consultation Settings */}
          <div className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
            <h2 className="font-semibold text-foreground">Consultation Settings</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Consultation Fee (INR)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Consultation Types Offered
              </label>
              <div className="flex gap-2 flex-wrap">
                {CONSULTATION_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleType(value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      consultationTypes.includes(value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border/60 hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full max-w-xl">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Save Schedule'}
          </Button>
        </div>
      </div>
    </div>
  )
}
