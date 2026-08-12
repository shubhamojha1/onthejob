import { Analytics } from '@vercel/analytics/react'
import { Outlet } from 'react-router-dom'

/** Mounts app-wide services around every route. */
export function AppShell() {
  return (
    <>
      <Outlet />
      <Analytics />
    </>
  )
}
