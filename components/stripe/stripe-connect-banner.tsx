'use client'

import Link from 'next/link'
import { CreditCard, X } from 'lucide-react'
import { useState } from 'react'

interface StripeConnectBannerProps {
  stripeError?: string | null
  stripeConnected?: boolean
}

export function StripeConnectBanner({ stripeError, stripeConnected }: StripeConnectBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Show success toast on connect
  if (stripeConnected) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-emerald-800">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Your Stripe account has been connected successfully. You can now receive payments.</span>
          </div>
          <button type="button" onClick={() => setDismissed(true)} className="text-emerald-600 hover:text-emerald-800 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (stripeError) {
    return (
      <div className="bg-destructive/5 border-b border-destructive/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-destructive">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Stripe connection failed: {stripeError}. Please try again.</span>
          </div>
          <button type="button" onClick={() => setDismissed(true)} className="text-destructive/60 hover:text-destructive shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 text-sm text-amber-900">
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>
            Connect your Stripe account to receive payments and complete identity verification.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/api/stripe/connect"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors"
          >
            Connect Stripe
          </Link>
          <button type="button" onClick={() => setDismissed(true)} className="text-amber-600 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
