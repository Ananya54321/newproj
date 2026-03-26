import { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import DogLoader from '@/components/dog-loader'

export const metadata: Metadata = {
  title: 'Login - Furever',
  description: 'Sign in to your Furever account.',
}

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel - hero ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-10 bg-[#2C3520] overflow-hidden">
        {/* Dog animation */}
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <DogLoader />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/">
            <h1 className="font-serif text-2xl tracking-[0.2em] text-white/90 uppercase font-bold">
              Furever
            </h1>
          </Link>
        </div>

        {/* Quote */}
        <div className="relative z-10">
          <blockquote className="font-serif text-xl italic text-white/80 leading-relaxed max-w-xs">
            "Where every tail finds its sanctuary."
          </blockquote>
        </div>
      </div>

      {/* ── Right panel - form ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/">
            <h1 className="font-serif text-2xl tracking-[0.15em] text-foreground uppercase font-bold">
              Furever
            </h1>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <LoginForm redirectTo={redirectTo ?? '/dashboard'} />
        </div>
      </div>
    </div>
  )
}
