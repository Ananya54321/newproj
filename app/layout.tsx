import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/boty/cart-context'
import { AuthProvider } from '@/components/auth/auth-provider'
import { SessionSync } from '@/components/auth/session-sync'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600']
});

const playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: { default: 'PawHaven - A Pet Care Community', template: '%s | PawHaven' },
  description: 'Connect with vets, pet owners, NGOs, and shops on PawHaven - the all-in-one pet care platform.',
  keywords: ['pets', 'veterinarian', 'pet care', 'pet community', 'animal welfare', 'emergency rescue', 'pet marketplace'],
  openGraph: {
    type: 'website',
    siteName: 'PawHaven',
    title: 'PawHaven - A Pet Care Community',
    description: 'Connect with vets, pet owners, NGOs, and shops on PawHaven - the all-in-one pet care platform.',
    // images: [{ url: '/og-default.png', width: 1200, height: 630 }],  // uncomment once og-default.png is added to /public
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PawHaven - A Pet Care Community',
    description: 'Connect with vets, pet owners, NGOs, and shops on PawHaven - the all-in-one pet care platform.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#F7F4EF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <SessionSync />
            {children}
          </CartProvider>
          <Toaster richColors position="top-right" />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
