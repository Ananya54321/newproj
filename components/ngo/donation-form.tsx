'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { createDonation } from '@/lib/ngo/service'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500]

interface DonationFormProps {
  ngoId: string
  ngoName: string
  onSuccess?: () => void
}

export function DonationForm({ ngoId, ngoName, onSuccess }: DonationFormProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) { toast.error('Please sign in to donate'); return }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }

    setSubmitting(true)
    const { error } = await createDonation(
      { ngo_id: ngoId, amount: Number(amount), message: message || null, is_anonymous: isAnonymous },
      user.id
    )
    setSubmitting(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success(`Thank you for donating ₹${amount} to ${ngoName}!`)
      setAmount('')
      setMessage('')
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Donate to {ngoName}</h3>
      </div>

      {/* Preset amounts */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Select amount</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium boty-transition ${
                amount === preset
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              ₹{preset.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Or enter custom amount (INR)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder="0.00"
            className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Message <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Leave a note for the organization…"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Anonymous toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Donate anonymously</p>
          <p className="text-xs text-muted-foreground">Your name won&apos;t be shown to the NGO</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAnonymous(!isAnonymous)}
          className={`relative w-11 h-6 rounded-full boty-transition ${isAnonymous ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm boty-transition ${isAnonymous ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="bg-amber-50 text-amber-800 text-xs rounded-lg p-3">
        <strong>Note:</strong> Stripe payment processing coming soon. Your donation intent is recorded.
      </div>

      <Button type="submit" disabled={submitting || !amount} className="w-full">
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</>
          : <><Heart className="w-4 h-4 mr-2" />Donate {amount ? `₹${Number(amount).toLocaleString('en-IN')}` : ''}</>}
      </Button>
    </form>
  )
}
