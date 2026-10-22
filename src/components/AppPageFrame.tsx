'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/navbar'
import SimulationLauncher from '@/components/simulations/SimulationLauncher'

/** Reading gets its own chrome; all access and account providers remain outside. */
export default function AppPageFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  if (path === '/comics' || path.startsWith('/comics/')) return <main>{children}</main>
  return <><Navbar /><SimulationLauncher /><main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">{children}</main></>
}
