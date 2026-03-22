'use client'

import { Calendar } from 'lucide-react'
import type { NgoUpdate } from '@/lib/auth/types'

interface NgoUpdateCardProps {
  update: NgoUpdate
  onDelete?: (id: string) => void
}

export function NgoUpdateCard({ update, onDelete }: NgoUpdateCardProps) {
  const date = new Date(update.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article className="bg-card rounded-2xl p-5 boty-shadow space-y-3">
      {update.image_url && (
        <div className="rounded-xl overflow-hidden max-h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={update.image_url} alt={update.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <h3 className="font-semibold text-foreground">{update.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Calendar className="w-3 h-3" />
          {date}
        </div>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{update.content}</p>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(update.id)}
          className="text-xs text-muted-foreground hover:text-destructive boty-transition"
        >
          Delete
        </button>
      )}
    </article>
  )
}
