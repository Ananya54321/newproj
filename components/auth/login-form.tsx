'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail, signInWithOAuth, syncSessionWithServer } from '@/lib/auth/service'
import type { LoginFormData } from '@/lib/auth/types'
import { toast } from 'sonner'

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})

  const validate = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const result = await signInWithEmail(formData)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      await syncSessionWithServer()
      toast.success('Welcome back!')
      // Hard navigate to ensure middleware picks up new session
      window.location.href = redirectTo
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setOauthLoading(true)
    try {
      const result = await signInWithOAuth('google', redirectTo)
      if (result.error) {
        toast.error(result.error.message)
        setOauthLoading(false)
      }
      // On success, browser redirects - no further action needed
    } catch {
      setOauthLoading(false)
    }
  }

  const isLoading = loading || oauthLoading

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Access your digital sanctuary</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => {
              setFormData((p) => ({ ...p, email: e.target.value }))
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
            }}
            disabled={isLoading}
            aria-invalid={!!errors.email}
            className="h-11 bg-background border-border/60 focus-visible:ring-primary/40"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in with magic link
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {
                setFormData((p) => ({ ...p, password: e.target.value }))
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
              }}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              className="h-11 pr-11 bg-background border-border/60 focus-visible:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isLoading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border/60" />
        <span className="mx-3 text-xs text-muted-foreground uppercase tracking-widest">
          Or continue with
        </span>
        <div className="flex-1 border-t border-border/60" />
      </div>

      {/* Social login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full h-11 flex items-center justify-center gap-2.5 rounded-md border border-border/60 bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {oauthLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Google
      </button>

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground">
        New to Furever?{' '}
        <Link
          href="/signup"
          className="text-foreground font-medium hover:text-primary transition-colors"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
