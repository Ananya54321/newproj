'use client'

import { supabaseClient } from '@/lib/supabase/client'
import {
  AuthResponse,
  LoginFormData,
  SignupFormData,
  ResetPasswordFormData,
  toAuthError,
} from './types'

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUpWithEmail(
  formData: SignupFormData
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.full_name,
          role: formData.role,
          // Role-specific metadata
          ...(formData.role === 'veterinarian' && {
            license_number: formData.license_number ?? null,
            specialty: formData.specialty ?? null,
            clinic_name: formData.clinic_name ?? null,
            clinic_address: formData.clinic_address ?? null,
            license_document_url: formData.license_document_url ?? null,
            extra_document_urls: formData.extra_document_urls ?? null,
            social_links: formData.social_links ?? null,
          }),
          ...(formData.role === 'ngo' && {
            organization_name: formData.organization_name ?? null,
            registration_number: formData.registration_number ?? null,
            mission_statement: formData.mission_statement ?? null,
            address: formData.address ?? null,
            registration_document_url: formData.registration_document_url ?? null,
            extra_document_urls: formData.extra_document_urls ?? null,
            social_links: formData.social_links ?? null,
          }),
          ...(formData.role === 'store_owner' && {
            store_name: formData.store_name ?? null,
            address: formData.address ?? null,
            store_images: formData.store_images ?? null,
            social_links: formData.social_links ?? null,
          }),
        },
      },
    })

    if (error) {
      return { data: null, error: toAuthError(error) }
    }

    // Supabase returns success even for duplicate emails when email confirmations
    // are enabled - detect via empty identities array.
    if (data.user?.identities?.length === 0) {
      return {
        data: null,
        error: {
          message:
            'An account with this email already exists. Please log in instead.',
          code: 'user_already_exists',
        },
      }
    }

    return { data: data.user, error: null }
  } catch (err) {
    return { data: null, error: toAuthError(err as Error) }
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signInWithEmail(
  formData: LoginFormData
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      return { data: null, error: toAuthError(error) }
    }

    return { data: data.user, error: null }
  } catch (err) {
    return { data: null, error: toAuthError(err as Error) }
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<{ error: AuthResponse['error'] }> {
  try {
    const { error } = await supabaseClient.auth.signOut()
    if (error) return { error: toAuthError(error) }
    return { error: null }
  } catch (err) {
    return { error: toAuthError(err as Error) }
  }
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function resetPassword(
  formData: ResetPasswordFormData
): Promise<AuthResponse<{ sent: boolean }>> {
  try {
    const redirectUrl = `${window.location.origin}/auth/callback?type=recovery`

    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      formData.email,
      { redirectTo: redirectUrl }
    )

    if (error) return { data: null, error: toAuthError(error) }
    return { data: { sent: true }, error: null }
  } catch (err) {
    return { data: null, error: toAuthError(err as Error) }
  }
}

export async function updatePassword(
  newPassword: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    })
    if (error) return { data: null, error: toAuthError(error) }
    return { data: data.user, error: null }
  } catch (err) {
    return { data: null, error: toAuthError(err as Error) }
  }
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export type OAuthProvider = 'google'

const OAUTH_REDIRECT_KEY = 'furever_oauth_redirect'

export async function signInWithOAuth(
  provider: OAuthProvider,
  redirectTo = '/dashboard'
): Promise<AuthResponse<{ url: string }>> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(OAUTH_REDIRECT_KEY, redirectTo)
    }

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) return { data: null, error: toAuthError(error) }
    return { data: { url: data.url }, error: null }
  } catch (err) {
    return { data: null, error: toAuthError(err as Error) }
  }
}

export function getOAuthRedirectDestination(): string {
  if (typeof window === 'undefined') return '/dashboard'
  const dest = localStorage.getItem(OAUTH_REDIRECT_KEY)
  localStorage.removeItem(OAUTH_REDIRECT_KEY)
  return dest ?? '/dashboard'
}

// ─── Current user ─────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser()
    if (error) return { data: null, error: toAuthError(error) }
    return { data: user, error: null }
  } catch (err) {
    return { data: null, error: toAuthError(err as Error) }
  }
}

// ─── Session sync (client → server cookies) ───────────────────────────────────

/**
 * Syncs the current session tokens to server-side cookies.
 * Pass `tokens` directly when you already have the session (e.g. from an auth
 * event callback) to avoid acquiring the auth lock again mid-refresh.
 */
export async function syncSessionWithServer(
  tokens?: { access_token: string; refresh_token: string }
): Promise<void> {
  try {
    let access_token = tokens?.access_token
    let refresh_token = tokens?.refresh_token

    if (!access_token || !refresh_token) {
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) return
      access_token = session.access_token
      refresh_token = session.refresh_token
    }

    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, refresh_token }),
    })
  } catch (err) {
    console.error('Failed to sync session with server:', err)
  }
}
