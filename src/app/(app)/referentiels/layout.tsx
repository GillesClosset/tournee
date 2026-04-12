'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const referentielTabs = [
  { href: '/referentiels/chauffeurs', label: 'Chauffeurs' },
  { href: '/referentiels/vehicules', label: 'Véhicules' },
  { href: '/referentiels/points-de-passage', label: 'Points de passage' },
]

export default function ReferentielsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Référentiels</h1>
        <p className="text-sm text-muted-foreground">Gestion des données de référence</p>
      </div>

      <nav className="flex gap-1 rounded-lg bg-muted p-1">
        {referentielTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname === tab.href
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
