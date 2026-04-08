'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Heart, ChevronDown } from 'lucide-react'
import { getApprovedNGOs } from '@/lib/ngo/service'
import { requestCollaboration, cancelCollaboration } from '@/lib/collaboration/service'
import type { Product, Profile, NgoProfile, NgoProductCollaborationWithRelations } from '@/lib/auth/types'
import { toast } from 'sonner'

interface CollaborateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  storeId: string
  existingCollaboration: NgoProductCollaborationWithRelations | null
  onCollaborationChanged: () => void
}

export function CollaborateModal({
  open,
  onOpenChange,
  product,
  storeId,
  existingCollaboration,
  onCollaborationChanged,
}: CollaborateModalProps) {
  const [ngos, setNgos] = useState<(Profile & { ngo_profile: NgoProfile })[]>([])
  const [loadingNgos, setLoadingNgos] = useState(false)
  const [selectedNgoId, setSelectedNgoId] = useState('')
  const [percent, setPercent] = useState('5')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingNgos(true)
    getApprovedNGOs()
      .then(setNgos)
      .catch(() => toast.error('Failed to load NGOs'))
      .finally(() => setLoadingNgos(false))
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pct = parseFloat(percent)
    if (!selectedNgoId) { toast.error('Please select an NGO'); return }
    if (isNaN(pct) || pct <= 0 || pct > 100) { toast.error('Percentage must be between 1 and 100'); return }

    setSubmitting(true)
    const { error } = await requestCollaboration({
      product_id: product.id,
      store_id: storeId,
      ngo_id: selectedNgoId,
      ngo_proceeds_percent: pct,
      store_message: message.trim() || null,
    })
    setSubmitting(false)

    if (error) {
      if (error.includes('unique') || error.includes('duplicate')) {
        toast.error('This product already has a collaboration request.')
      } else {
        toast.error(error)
      }
    } else {
      toast.success('Collaboration request sent to NGO!')
      onCollaborationChanged()
      onOpenChange(false)
      setSelectedNgoId('')
      setPercent('5')
      setMessage('')
    }
  }

  const handleCancel = async () => {
    if (!existingCollaboration) return
    setCancelling(true)
    const { error } = await cancelCollaboration(existingCollaboration.id)
    setCancelling(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Collaboration request cancelled')
      onCollaborationChanged()
      onOpenChange(false)
    }
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-destructive/10 text-destructive',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Heart className="w-5 h-5 text-primary" />
            NGO Collaboration
          </DialogTitle>
          <DialogDescription>
            Request an NGO to collaborate on <span className="font-medium text-foreground">{product.name}</span>.
            A portion of each sale goes to the NGO.
          </DialogDescription>
        </DialogHeader>

        {/* Existing collaboration status */}
        {existingCollaboration && (
          <div className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Current Request</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[existingCollaboration.status] ?? ''}`}>
                {existingCollaboration.status}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>NGO: <span className="text-foreground">{existingCollaboration.ngo.ngo_profile?.organization_name ?? existingCollaboration.ngo.full_name}</span></p>
              <p>Proceeds: <span className="text-foreground font-medium">{existingCollaboration.ngo_proceeds_percent}%</span></p>
              {existingCollaboration.ngo_response_message && (
                <p className="italic">&quot;{existingCollaboration.ngo_response_message}&quot;</p>
              )}
            </div>
            {existingCollaboration.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Cancelling…</> : 'Cancel Request'}
              </Button>
            )}
          </div>
        )}

        {/* New request form — only if no existing collaboration */}
        {!existingCollaboration && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NGO selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Select NGO <span className="text-destructive">*</span>
              </label>
              {loadingNgos ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading NGOs…
                </div>
              ) : ngos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved NGOs available yet.</p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedNgoId}
                    onChange={(e) => setSelectedNgoId(e.target.value)}
                    required
                    className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Choose an NGO…</option>
                    {ngos.map((ngo) => (
                      <option key={ngo.id} value={ngo.id}>
                        {ngo.ngo_profile?.organization_name ?? ngo.full_name ?? ngo.email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              )}
            </div>

            {/* Selected NGO preview */}
            {selectedNgoId && (() => {
              const ngo = ngos.find((n) => n.id === selectedNgoId)
              if (!ngo?.ngo_profile?.mission_statement) return null
              return (
                <div className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-0.5">{ngo.ngo_profile.organization_name}</p>
                  <p className="line-clamp-2">{ngo.ngo_profile.mission_statement}</p>
                </div>
              )
            })()}

            {/* Proceeds % */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Proceeds to NGO (%) <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="flex-1 accent-primary"
                />
                <div className="relative w-20">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="w-full px-3 py-2 pr-7 rounded-xl bg-background border border-border/60 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {percent}% of every sale will be donated to the selected NGO.
              </p>
            </div>

            {/* Optional message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Message to NGO <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell them why you'd love to collaborate…"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting || ngos.length === 0}>
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Sending…</> : 'Send Request'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
