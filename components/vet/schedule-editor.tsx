'use client'

import { useState } from 'react'
import { Toggle } from '@/components/ui/toggle'

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const

type DayKey = (typeof DAYS)[number]['key']
type DayHours = Record<DayKey, [string, string] | null>

const DEFAULT_HOURS: DayHours = {
  mon: ['09:00', '17:00'],
  tue: ['09:00', '17:00'],
  wed: ['09:00', '17:00'],
  thu: ['09:00', '17:00'],
  fri: ['09:00', '17:00'],
  sat: null,
  sun: null,
}

interface Props {
  value: DayHours
  onChange: (value: DayHours) => void
}

export function ScheduleEditor({ value, onChange }: Props) {
  const toggleDay = (key: DayKey) => {
    if (value[key]) {
      onChange({ ...value, [key]: null })
    } else {
      onChange({ ...value, [key]: ['09:00', '17:00'] })
    }
  }

  const setTime = (key: DayKey, index: 0 | 1, time: string) => {
    const current = value[key]
    if (!current) return
    const updated: [string, string] = [...current] as [string, string]
    updated[index] = time
    onChange({ ...value, [key]: updated })
  }

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => {
        const hours = value[key]
        const enabled = !!hours

        return (
          <div key={key} className="flex items-center gap-3">
            <Toggle
              pressed={enabled}
              onPressedChange={() => toggleDay(key)}
              className="w-28 shrink-0 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {label}
            </Toggle>

            {enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={hours[0]}
                  onChange={(e) => setTime(key, 0, e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-background border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  type="time"
                  value={hours[1]}
                  onChange={(e) => setTime(key, 1, e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-background border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Closed</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Re-export DEFAULT_HOURS so pages can use it as initial value
export { DEFAULT_HOURS }
export type { DayHours }
