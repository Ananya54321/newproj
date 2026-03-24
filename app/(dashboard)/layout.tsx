import React from 'react'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { CartDrawer } from '@/components/boty/cart-drawer'
import { AdminRedirect } from '@/components/auth/admin-redirect'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <AdminRedirect />
      <DashboardSidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {children}
      </main>
      <CartDrawer />
    </div>
  )
}
