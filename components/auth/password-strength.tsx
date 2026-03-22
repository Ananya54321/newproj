'use client'

import { cn } from '@/lib/utils'

interface PasswordStrengthResult {
  strength: 'weak' | 'moderate' | 'strong'
  score: number
  checks: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length

  let strength: PasswordStrengthResult['strength'] = 'weak'
  if (checks.minLength && checks.hasUppercase && checks.hasLowercase && checks.hasNumber) {
    strength = checks.hasSpecial || password.length >= 12 ? 'strong' : 'moderate'
  }

  return { strength, score, checks }
}

interface PasswordStrengthProps {
  password: string
  className?: string
}

const STRENGTH_CONFIG = {
  weak: { label: 'Weak', color: 'bg-destructive', width: 'w-1/3', textColor: 'text-destructive' },
  moderate: { label: 'Moderate', color: 'bg-amber-500', width: 'w-2/3', textColor: 'text-amber-600' },
  strong: { label: 'Strong', color: 'bg-emerald-500', width: 'w-full', textColor: 'text-emerald-600' },
} as const

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  if (!password) return null

  const result = calculatePasswordStrength(password)
  const config = STRENGTH_CONFIG[result.strength]

  return (
    <div className={cn('space-y-2 mt-2', className)}>
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div className={cn('h-full transition-all duration-300', config.color, config.width)} />
        </div>
        <span className={cn('text-xs font-medium', config.textColor)}>{config.label}</span>
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {[
          { label: '8+ characters', met: result.checks.minLength },
          { label: 'Uppercase letter', met: result.checks.hasUppercase },
          { label: 'Lowercase letter', met: result.checks.hasLowercase },
          { label: 'Number', met: result.checks.hasNumber },
          { label: 'Special character', met: result.checks.hasSpecial },
        ].map(({ label, met }) => (
          <li
            key={label}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              met ? 'text-foreground/80' : 'text-muted-foreground'
            )}
          >
            <span>{met ? '✓' : '○'}</span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
