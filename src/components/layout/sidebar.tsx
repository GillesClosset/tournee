'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Truck, PanelLeftClose, PanelLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navLinks, isNavGroup, type NavLink } from './nav-links'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function handleNavClick() {
    onMobileClose?.()
  }

  const sidebarContent = (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
        // Mobile: always full width when open
        'max-lg:w-60',
        // Desktop: respect collapsed state
        collapsed ? 'lg:w-16' : 'lg:w-60',
      )}
    >
      {/* App header */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck className="size-4" />
        </div>
        {(!collapsed || !mobileOpen) && (
          <span className="text-sm font-semibold text-sidebar-foreground lg:hidden">
            Tournée Nath
          </span>
        )}
        {!collapsed && (
          <span className="hidden text-sm font-semibold text-sidebar-foreground lg:inline">
            Tournée Nath
          </span>
        )}
        {/* Close button on mobile */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
          onClick={onMobileClose}
        >
          <X className="size-4" />
        </Button>
        {/* Collapse toggle on desktop */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto hidden text-sidebar-foreground/60 hover:text-sidebar-foreground lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-1">
          {navLinks.map((item) => {
            if (isNavGroup(item)) {
              return (
                <li key={item.label} className="mt-4 first:mt-0">
                  <span
                    className={cn(
                      'mb-1 block px-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50',
                      collapsed && 'lg:hidden',
                    )}
                  >
                    {item.label}
                  </span>
                  <ul className="flex flex-col gap-0.5">
                    {item.children.map((child) => (
                      <NavItem
                        key={child.href}
                        link={child}
                        active={isActive(child.href)}
                        collapsed={collapsed}
                        onNavigate={handleNavClick}
                      />
                    ))}
                  </ul>
                </li>
              )
            }
            return (
              <NavItem
                key={item.href}
                link={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onNavigate={handleNavClick}
              />
            )
          })}
        </ul>
      </nav>
    </aside>
  )

  return (
    <>
      {/* Mobile: overlay with backdrop */}
      <div className="lg:hidden">
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-30 bg-black/50"
              onClick={onMobileClose}
              aria-hidden="true"
            />
            {sidebarContent}
          </>
        )}
      </div>

      {/* Desktop: always visible */}
      <div className="hidden lg:block">
        {sidebarContent}
        {/* Spacer to push main content */}
        <div
          className={cn('shrink-0 transition-[width] duration-200', collapsed ? 'w-16' : 'w-60')}
        />
      </div>
    </>
  )
}

function NavItem({
  link,
  active,
  collapsed,
  onNavigate,
}: {
  link: NavLink
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = link.icon
  return (
    <li>
      <Link
        href={link.href}
        title={collapsed ? link.label : undefined}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" />
        {/* On mobile always show label; on desktop respect collapsed */}
        <span className={cn('truncate', collapsed && 'lg:hidden')}>{link.label}</span>
      </Link>
    </li>
  )
}
