import React from 'react'

/**
 * Auth routes have their own layout - no global header/footer.
 * The split-panel design lives inside each page.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
