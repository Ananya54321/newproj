import { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'
import DogLoader2 from '@/components/dog-loader2'

export const metadata: Metadata = {
  title: 'Join Furever',
  description: 'Create your Furever account and join the sanctuary.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-row-reverse">
      {/* ── Right panel - hero ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[45%] relative flex-col justify-end p-10 bg-[#C4AA87] overflow-hidden">
        {/* Dog animation */}
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <DogLoader2 />
        </div>

        {/* Quote card */}
        <div className="relative z-10 bg-background/80 backdrop-blur-sm rounded-2xl p-6 max-w-xs shadow-sm">
          <p className="font-serif text-sm italic text-foreground/90 leading-relaxed mb-3">
            "The purity of a person's heart can be quickly measured by how they regard their animals."
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            - The Furever Philosophy
          </p>
        </div>
      </div>

      {/* ── Left panel - form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-6 py-10 sm:px-10 lg:px-14 xl:px-20 bg-background overflow-y-auto">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
              Furever
            </p>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
