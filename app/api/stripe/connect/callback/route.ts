import { NextRequest, NextResponse } from 'next/server'
import { exchangeStripeCode } from '@/lib/stripe/service'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // userId
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?stripe_error=${encodeURIComponent(error)}`, APP_URL)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?stripe_error=invalid_callback', APP_URL))
  }

  const { error: exchangeError } = await exchangeStripeCode(code, state)

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/dashboard?stripe_error=${encodeURIComponent(exchangeError)}`, APP_URL)
    )
  }

  return NextResponse.redirect(new URL('/dashboard?stripe_connected=1', APP_URL))
}
