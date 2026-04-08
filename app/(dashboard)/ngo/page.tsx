'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getNGOUpdates, getNGODonations, deleteNGOUpdate, formatDonationAmount } from '@/lib/ngo/service'
import { getNgoCollaborationRequests } from '@/lib/collaboration/service'
import { NgoUpdateCard } from '@/components/ngo/ngo-update-card'
import { NgoUpdateDialog } from '@/components/ngo/ngo-update-dialog'
import { CollaborationRequestCard } from '@/components/collaboration/collaboration-request-card'
import type { NgoUpdate, DonationWithRelations, NgoProductCollaborationWithRelations } from '@/lib/auth/types'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Heart, FileText, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export default function NgoDashboardPage() {
  const { user, profile } = useAuth()

  const [updates, setUpdates] = useState<NgoUpdate[]>([])
  const [donations, setDonations] = useState<DonationWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [collabRequests, setCollabRequests] = useState<NgoProductCollaborationWithRelations[]>([])
  const [activeTab, setActiveTab] = useState<'updates' | 'collaborations'>('updates')

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [u, d, c] = await Promise.all([
        getNGOUpdates(user.id),
        getNGODonations(user.id),
        getNgoCollaborationRequests(user.id),
      ])
      setUpdates(u)
      setDonations(d)
      setCollabRequests(c)
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const handleDeleteUpdate = async (id: string) => {
    const { error } = await deleteNGOUpdate(id)
    if (error) toast.error(error)
    else { toast.success('Update deleted'); setUpdates((u) => u.filter((x) => x.id !== id)) }
  }

  const totalDonations = donations
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  return (
    <>
      <NgoUpdateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={user?.id ?? ''}
        onCreated={(update) => setUpdates((prev) => [update, ...prev])}
      />

      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1">NGO Dashboard</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  {profile?.full_name
                    ? `Welcome back, ${profile.full_name.split(' ')[0]}.`
                    : 'Manage your organization and engage with donors.'}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Post Update
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl p-5 boty-shadow text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-primary" />
              <p className="text-2xl font-semibold text-foreground">{formatDonationAmount(totalDonations)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Total Donations</p>
          </div>
          <div className="bg-card rounded-2xl p-5 boty-shadow text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <p className="text-2xl font-semibold text-foreground">{updates.length}</p>
            </div>
            <p className="text-xs text-muted-foreground">Updates Posted</p>
          </div>
          <div className="bg-card rounded-2xl p-5 boty-shadow text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-primary" />
              <p className="text-2xl font-semibold text-foreground">
                {collabRequests.filter((c) => c.status === 'accepted').length}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Active Collaborations</p>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex items-center gap-1 border-b border-border/50 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('updates')}
              className={`px-4 py-2 text-sm font-medium boty-transition border-b-2 -mb-px ${
                activeTab === 'updates' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Updates ({updates.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('collaborations')}
              className={`px-4 py-2 text-sm font-medium boty-transition border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'collaborations' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Collaborations
              {collabRequests.filter((c) => c.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-medium">
                  {collabRequests.filter((c) => c.status === 'pending').length} new
                </span>
              )}
            </button>
          </div>

          {/* Updates tab */}
          {activeTab === 'updates' && (
            <>
              {updates.length === 0 ? (
                <div className="py-12 text-center bg-card rounded-2xl boty-shadow">
                  <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-foreground">No updates yet</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Share news with donors and supporters.</p>
                  <Button size="sm" onClick={() => setDialogOpen(true)}>Post First Update</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {updates.map((u) => (
                    <NgoUpdateCard key={u.id} update={u} onDelete={handleDeleteUpdate} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Collaborations tab */}
          {activeTab === 'collaborations' && (
            <>
              {collabRequests.length === 0 ? (
                <div className="py-12 text-center bg-card rounded-2xl boty-shadow">
                  <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-foreground">No collaboration requests yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pet store owners can request to feature a product with your NGO, donating a percentage of profits.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pending first */}
                  {collabRequests.filter((c) => c.status === 'pending').length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Pending Requests</p>
                      <div className="space-y-3">
                        {collabRequests.filter((c) => c.status === 'pending').map((c) => (
                          <CollaborationRequestCard
                            key={c.id}
                            collaboration={c}
                            onResponded={(id, accepted) => {
                              setCollabRequests((prev) =>
                                prev.map((r) =>
                                  r.id === id ? { ...r, status: accepted ? 'accepted' : 'rejected' } : r
                                )
                              )
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Accepted */}
                  {collabRequests.filter((c) => c.status === 'accepted').length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Active Collaborations</p>
                      <div className="space-y-3">
                        {collabRequests.filter((c) => c.status === 'accepted').map((c) => (
                          <CollaborationRequestCard key={c.id} collaboration={c} onResponded={() => {}} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Rejected */}
                  {collabRequests.filter((c) => c.status === 'rejected').length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Declined</p>
                      <div className="space-y-3 opacity-60">
                        {collabRequests.filter((c) => c.status === 'rejected').map((c) => (
                          <CollaborationRequestCard key={c.id} collaboration={c} onResponded={() => {}} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent donations */}
        {donations.length > 0 && activeTab === 'updates' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Recent Donations</h2>
            </div>
            <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
              {donations.slice(0, 10).map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {d.is_anonymous ? 'Anonymous' : d.donor?.full_name ?? 'Donor'}
                    </p>
                    {d.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">&quot;{d.message}&quot;</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatDonationAmount(d.amount, d.currency)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{d.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
