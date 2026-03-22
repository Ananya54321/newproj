'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getUserAppointments,
  getVetAppointments,
  updateAppointmentStatus,
  splitAppointments,
} from '@/lib/vets/service'
import { supabaseClient } from '@/lib/supabase/client'
import type { AppointmentStatus, AppointmentWithRelations } from '@/lib/auth/types'

export function useAppointments() {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const data =
        profile?.role === 'veterinarian'
          ? await getVetAppointments(user.id, supabaseClient)
          : await getUserAppointments(user.id, supabaseClient)
      setAppointments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.role])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = useCallback(
    async (appointmentId: string, status: AppointmentStatus) => {
      const result = await updateAppointmentStatus(appointmentId, status)
      if (!result.error) await load()
      return result
    },
    [load]
  )

  const { upcoming, past } = splitAppointments(appointments)

  return { appointments, upcoming, past, loading, error, reload: load, changeStatus }
}
