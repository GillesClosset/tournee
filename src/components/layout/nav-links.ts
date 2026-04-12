import { Home, Users, Car, MapPin, Calendar, type LucideIcon } from 'lucide-react'

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  children: NavLink[]
}

export type NavItem = NavLink | NavGroup

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

export const navLinks: NavItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  {
    label: 'Référentiels',
    children: [
      { href: '/referentiels/chauffeurs', label: 'Chauffeurs', icon: Users },
      { href: '/referentiels/vehicules', label: 'Véhicules', icon: Car },
      {
        href: '/referentiels/points-de-passage',
        label: 'Points de passage',
        icon: MapPin,
      },
    ],
  },
  { href: '/planning', label: 'Planning', icon: Calendar },
]
