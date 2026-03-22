'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import {
  getEmergencyReports,
  updateReportStatus,
  type EmergencyFormData,
} from '@/lib/emergency/service'
import { createEmergencyReport } from '@/lib/emergency/service'
import type {
  EmergencyCategory,
  EmergencyReportWithReporter,
  EmergencyStatus,
} from '@/lib/auth/types'

interface UseEmergencyOptions {
  status?: EmergencyStatus
  category?: EmergencyCategory
}

export function useEmergencyRealtime(options: UseEmergencyOptions = {}) {
  const [reports, setReports] = useState<EmergencyReportWithReporter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEmergencyReports(supabaseClient, optionsRef.current)
      setReports(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    // Subscribe to realtime changes
    const channel = supabaseClient
      .channel('emergency_reports_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_reports' },
        () => {
          // Re-fetch on any change to keep joins accurate
          load()
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [load])

  const changeStatus = useCallback(
    async (reportId: string, status: EmergencyStatus) => {
      const result = await updateReportStatus(reportId, status)
      if (!result.error) await load()
      return result
    },
    [load]
  )

  const submitReport = useCallback(
    async (data: EmergencyFormData) => {
      const result = await createEmergencyReport(data)
      if (!result.error) await load()
      return result
    },
    [load]
  )

  return { reports, loading, error, reload: load, changeStatus, submitReport }
}
