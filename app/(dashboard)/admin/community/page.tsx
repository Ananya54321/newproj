'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, Users, FileText, MessageSquare, PawPrint } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import { getAdminCommunities, adminDeleteCommunity } from '@/lib/admin/service'
import { AdminLayout } from '../_components/admin-layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

type AdminCommunity = {
  id: string
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  member_count: number
  post_count: number
  created_at: string
  created_by: string | null
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminCommunityPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [communities, setCommunities] = useState<AdminCommunity[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') router.replace('/dashboard')
  }, [authLoading, profile, router])

  useEffect(() => {
    if (profile?.role !== 'admin') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAdminCommunities(supabaseClient).then((data: any[]) => {
      setCommunities(data as AdminCommunity[])
      setLoading(false)
    })
  }, [profile])

  if (authLoading || !profile) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
  }
  if (profile.role !== 'admin') return null

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    const { error } = await adminDeleteCommunity(id, supabaseClient)
    if (error) {
      toast.error(error)
    } else {
      toast.success(`"${name}" deleted`)
      setCommunities((prev) => prev.filter((c) => c.id !== id))
    }
    setDeleting(null)
  }

  const totalMembers = communities.reduce((acc, c) => acc + c.member_count, 0)
  const totalPosts = communities.reduce((acc, c) => acc + c.post_count, 0)

  return (
    <AdminLayout title="Community Management" description="View and moderate communities on the platform">
      {/* Summary row */}
      {!loading && communities.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Communities', value: communities.length, icon: MessageSquare },
            { label: 'Total Members', value: totalMembers, icon: Users },
            { label: 'Total Posts', value: totalPosts, icon: FileText },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card rounded-xl boty-shadow px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
        {/* Header row */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-background/50 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
          <span>Community</span>
          <span>Members</span>
          <span>Posts</span>
          <span>Created</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading communities…
          </div>
        ) : communities.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No communities found.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {communities.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 items-center px-5 py-4 hover:bg-background/30 boty-transition"
              >
                {/* Name + description */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden text-lg">
                    {c.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.icon_url} alt="" className="w-full h-full object-cover" />
                    ) : <PawPrint className="w-5 h-5 text-primary/40" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">/{c.slug}</p>
                  </div>
                </div>

                {/* Members */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{c.member_count.toLocaleString()}</span>
                </div>

                {/* Posts */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{c.post_count.toLocaleString()}</span>
                </div>

                {/* Created */}
                <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>

                {/* Delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      disabled={deleting === c.id}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-lg hover:bg-destructive/10 boty-transition disabled:opacity-50"
                    >
                      {deleting === c.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete &ldquo;{c.name}&rdquo;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the community, all its posts, comments, and memberships. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(c.id, c.name)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Community
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
