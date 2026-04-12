'use client'

import { usePathname } from 'next/navigation'
import { navLinks, isNavGroup } from './nav-links'

function findLabelForPath(pathname: string): string {
  for (const item of navLinks) {
    if (isNavGroup(item)) {
      for (const child of item.children) {
        if (pathname.startsWith(child.href)) return child.label
      }
    } else {
      if (item.href === '/' && pathname === '/') return 'Tableau de bord'
      if (item.href !== '/' && pathname.startsWith(item.href)) return item.label
    }
  }
  return 'Tournée Nath'
}

function buildBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const crumbs: Array<{ label: string; href?: string }> = []

  if (pathname === '/') return [{ label: 'Tableau de bord' }]

  // Try to find matching nav items for breadcrumb segments
  const segments = pathname.split('/').filter(Boolean)
  let accumulated = ''

  for (const segment of segments) {
    accumulated += '/' + segment
    const label = findLabelForPath(accumulated)
    if (label !== 'Tournée Nath') {
      crumbs.push({ label, href: accumulated })
    }
  }

  if (crumbs.length === 0) {
    crumbs.push({ label: findLabelForPath(pathname) })
  }

  return crumbs
}

export function Header() {
  const pathname = usePathname()
  const breadcrumbs = buildBreadcrumbs(pathname)
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground/40">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'font-medium text-foreground' : ''}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>
    </header>
  )
}
