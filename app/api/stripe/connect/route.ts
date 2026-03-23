import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { getStripeConnectUrl } from '@/lib/stripe/service'

export async function GET() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  }

  const connectUrl = getStripeConnectUrl(user.id)
  return NextResponse.redirect(connectUrl)
}
