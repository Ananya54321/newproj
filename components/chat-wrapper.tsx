'use client'

import dynamic from 'next/dynamic'
import { Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useCometChat } from '@/hooks/useCometChat'
import { CometChatProvider } from '@/CometChat/context/CometChatContext'
import type { Profile } from '@/lib/auth/types'

// Lazy-load the heavy CometChat UI — avoids SSR issues with browser-only APIs
const CometChatApp = dynamic(() => import('@/CometChat/CometChatApp'), {
  ssr: false,
  loading: () => <ChatSkeleton />,
})

interface ChatWrapperProps {
  profile: Profile
}

export function ChatWrapper({ profile }: ChatWrapperProps) {
  const { status } = useCometChat(profile)

  // Hard frontend gate — real security is in the API route
  if (profile.role !== 'user') {
    return <ChatDenied />
  }

  if (status === 'denied') return <ChatDenied />
  if (status === 'error') return <ChatError />
  if (status === 'idle' || status === 'loading') return <ChatSkeleton />

  // CometChatProvider is required by useCometChatContext inside CometChatApp
  return (
    <CometChatProvider>
      <div className="h-full w-full">
        <CometChatApp />
      </div>
    </CometChatProvider>
  )
}

// ─── States ───────────────────────────────────────────────────────────────────

function ChatSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Connecting to chat...</p>
      </div>
    </div>
  )
}

function ChatDenied() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Chat unavailable</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat is only available for pet owners.
          </p>
        </div>
      </div>
    </div>
  )
}

function ChatError() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Could not load chat</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong while connecting. Please refresh and try again.
          </p>
        </div>
      </div>
    </div>
  )
}

