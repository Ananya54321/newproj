'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/auth/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables.')
}

export const supabaseClient = createBrowserClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
)

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}
