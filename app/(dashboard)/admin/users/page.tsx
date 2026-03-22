'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabaseClient } from '@/lib/supabase/client'
import { getUsers, type AdminUser } from '@/lib/admin/service'
import { AdminLayout } from '../_components/admin-layout'
import { ROLE_LABELS } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

const ROLE_COLORS: Record<string, string> = {
  admin:        'bg-primary/10 text-primary',
  veterinarian: 'bg-blue-100 text-blue-700',
  ngo:          'bg-purple-100 text-purple-700',
  store_owner:  'bg-emerald-100 text-emerald-700',
  user:         'bg-secondary text-secondary-foreground',
}

const VERIFICATION_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-destructive/10 text-destructive',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUsersPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') router.replace('/dashboard')
  }, [authLoading, profile, router])

  useEffect(() => {
    if (profile?.role !== 'admin') return
    getUsers(supabaseClient).then((u) => { setUsers(u); setLoading(false) })
  }, [profile])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search ||
        (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  if (authLoading || !profile) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
  }
  if (profile.role !== 'admin') return null

  return (
    <AdminLayout title="Users" description={`${users.length.toLocaleString()} registered users`}>
      <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-1">
            {['all', 'user', 'veterinarian', 'ngo', 'store_owner', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium boty-transition',
                  roleFilter === role
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {role === 'all' ? 'All' : ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Header row */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 bg-background/50 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
        </div>

        {/* User rows */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No users match your search.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4 items-center px-5 py-3.5 hover:bg-background/30 boty-transition"
              >
                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : <User className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>

                {/* Role badge */}
                <div className="sm:block">
                  <span className={cn(
                    'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                    ROLE_COLORS[u.role] ?? 'bg-secondary text-secondary-foreground'
                  )}>
                    {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                  </span>
                </div>

                {/* Verification status */}
                <div className="sm:block">
                  {u.verification_status ? (
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                      VERIFICATION_COLORS[u.verification_status] ?? 'bg-secondary text-secondary-foreground'
                    )}>
                      {u.verification_status.charAt(0).toUpperCase() + u.verification_status.slice(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Join date */}
                <div className="sm:block">
                  <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
