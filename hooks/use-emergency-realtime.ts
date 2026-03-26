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

  // Full load with spinner - used on mount and manual reload only
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

  // Silent background refresh - no spinner, used by realtime + post-action
  const silentRefresh = useCallback(async () => {
    try {
      const data = await getEmergencyReports(supabaseClient, optionsRef.current)
      setReports(data)
    } catch {
      // silent - don't disrupt the UI on background errors
    }
  }, [])

  useEffect(() => {
    load()

    const channel = supabaseClient
      .channel('emergency_reports_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_reports' },
        () => { silentRefresh() }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [load, silentRefresh])

  const changeStatus = useCallback(
    async (reportId: string, status: EmergencyStatus) => {
      const result = await updateReportStatus(reportId, status)
      if (!result.error) silentRefresh()
      return result
    },
    [silentRefresh]
  )

  const submitReport = useCallback(
    async (data: EmergencyFormData, userId: string) => {
      const result = await createEmergencyReport(data, userId)
      if (!result.error) silentRefresh()
      return result
    },
    [silentRefresh]
  )

  return { reports, loading, error, reload: load, changeStatus, submitReport }
}
