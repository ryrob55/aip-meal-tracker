'use client'

import { BottomNav } from './BottomNav'
import { FloatingAddButton } from './FloatingAddButton'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingAddButton />
      <BottomNav />
    </>
  )
}
