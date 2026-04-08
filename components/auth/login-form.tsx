'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail, syncSessionWithServer } from '@/lib/auth/service'
import type { LoginFormData } from '@/lib/auth/types'
import { toast } from 'sonner'

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
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

  const isLoading = loading

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
