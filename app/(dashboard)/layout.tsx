import React from 'react'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
