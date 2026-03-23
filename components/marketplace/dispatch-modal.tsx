'use client'

import { useState } from 'react'
import { dispatchOrder } from '@/lib/marketplace/service'
import { toast } from 'sonner'
import { Loader2, Truck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  orderId: string
  onSuccess: () => void
  onClose: () => void
}

export function DispatchModal({ orderId, onSuccess, onClose }: Props) {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [dispatchNote, setDispatchNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await dispatchOrder(orderId, {
      tracking_number: trackingNumber.trim() || null,
      dispatch_note: dispatchNote.trim() || null,
    })
    setLoading(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Order marked as shipped')
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl boty-shadow w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Mark as Shipped</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDispatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tracking Number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Dispatch Note</label>
            <textarea
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              rows={3}
              placeholder="Any message for the customer…"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-1.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              Mark Shipped
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
