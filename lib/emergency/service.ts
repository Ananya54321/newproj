import { supabaseClient } from '@/lib/supabase/client'
import type {
  EmergencyCategory,
  EmergencyReport,
  EmergencyReportWithReporter,
  EmergencyStatus,
} from '@/lib/auth/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmergencyFormData {
  title: string
  description?: string
  location: string
  lat?: number | null
  lng?: number | null
  category: EmergencyCategory
  image_urls?: string[]
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const REPORT_SELECT = `
  id, reporter_id, title, description, location, lat, lng,
  image_urls, status, category, created_at, updated_at,
  reporter:profiles!emergency_reports_reporter_id_fkey(id, full_name, avatar_url)
`

export async function getEmergencyReports(
  client = supabaseClient,
  filters?: { status?: EmergencyStatus; category?: EmergencyCategory }
): Promise<EmergencyReportWithReporter[]> {
  let query = client
    .from('emergency_reports')
    .select(REPORT_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.category) query = query.eq('category', filters.category)

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return normalizeReports(data ?? [])
}

export async function getReportById(
  reportId: string,
  client = supabaseClient
): Promise<EmergencyReportWithReporter | null> {
  const { data, error } = await client
    .from('emergency_reports')
    .select(REPORT_SELECT)
    .eq('id', reportId)
    .single()

  if (error || !data) return null
  return normalizeReports([data])[0]
}

export async function getUserReports(
  userId: string,
  client = supabaseClient
): Promise<EmergencyReportWithReporter[]> {
  const { data, error } = await client
    .from('emergency_reports')
    .select(REPORT_SELECT)
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return normalizeReports(data ?? [])
}

export async function createEmergencyReport(
  formData: EmergencyFormData,
  userId: string
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabaseClient
    .from('emergency_reports')
    .insert({
      reporter_id: userId,
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      location: formData.location.trim(),
      lat: formData.lat ?? null,
      lng: formData.lng ?? null,
      category: formData.category,
      image_urls: formData.image_urls ?? [],
      status: 'open',
    })
    .select('id')
    .single()

  if (error) return { id: null, error: error.message }
  return { id: data.id, error: null }
}

export async function updateReportStatus(
  reportId: string,
  status: EmergencyStatus
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('emergency_reports')
    .update({ status })
    .eq('id', reportId)

  return { error: error?.message ?? null }
}

export async function uploadReportImage(
  file: File,
  reportId: string
): Promise<{ url: string | null; error: string | null }> {
  const { uploadToCloudinary } = await import('@/lib/cloudinary/upload')
  const { url, error } = await uploadToCloudinary(file, `emergency/${reportId}`)
  return { url, error }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeReports(rows: any[]): EmergencyReportWithReporter[] {
  return rows.map((row) => ({
    ...row,
    reporter: Array.isArray(row.reporter)
      ? row.reporter[0] ?? null
      : row.reporter ?? null,
  })) as EmergencyReportWithReporter[]
}

export function formatReportDate(isoString: string): string {
  const d = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffH < 1) {
    const diffM = Math.floor(diffMs / (1000 * 60))
    return diffM <= 1 ? 'Just now' : `${diffM} minutes ago`
  }
  if (diffH < 24) return `${diffH}h ago`
  const diffDays = Math.floor(diffH / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
