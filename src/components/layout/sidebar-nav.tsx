"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { fontHeading } from "@/lib/fonts"
import { navIcons, type NavIconName } from "@/lib/icons"
import type { NavItem, NavLink } from "@/lib/types/nav"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useSidebar } from "./sidebar-provider"

export function SidebarNav({ items }: { items: NavItem[] }) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar()
  const pathname = usePathname()

  // cerrar el drawer mobile al navegar
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  return (
    <>
      {/* Desktop (>= lg): fijo, colapsable a rail de íconos */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden",
          "border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "transition-[width] duration-300 ease-in-out lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarLogo collapsed={collapsed} />
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <NavList items={items} collapsed={collapsed} />
        </nav>
      </aside>

      {/* Mobile y tablet (< lg): drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 gap-0 bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SidebarLogo collapsed={false} />
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <NavList items={items} collapsed={false} />
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4",
        collapsed && "justify-center px-2"
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
        A
      </div>
      {!collapsed && (
        <span className={cn(fontHeading.className, "truncate text-base font-semibold")}>
          Acme Corp
        </span>
      )}
    </div>
  )
}

function NavList({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  const pathname = usePathname()
  const { setCollapsed } = useSidebar()
  // Estado derivado: un grupo está abierto si contiene la ruta activa (auto-expand),
  // salvo que el usuario lo haya abierto/cerrado manualmente (override).
  // Los overrides se resetean al navegar, para que el auto-expand vuelva a mandar.
  const [overrides, setOverrides] = React.useState<Record<string, boolean>>({})
  const [lastPathname, setLastPathname] = React.useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOverrides({})
  }

  const isGroupOpen = (item: NavItem) =>
    overrides[item.title] ??
    !!item.items?.some((child) => child.href === pathname)

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.title}>
          {item.items ? (
            <NavGroup
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              open={!collapsed && isGroupOpen(item)}
              onOpenChange={(open) =>
                setOverrides((prev) => ({ ...prev, [item.title]: open }))
              }
              onExpandSidebar={() => setCollapsed(false)}
            />
          ) : (
            <NavDirectLink
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
              onExpandSidebar={() => setCollapsed(false)}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

/** Clases compartidas del item de nivel 1 (link directo o cabecera de grupo). */
function level1ItemClasses(collapsed: boolean, isActive: boolean) {
  return cn(
    "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
    "transition-[background-color,color,box-shadow] duration-200 ease-out",
    "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
    collapsed && "justify-center px-2",
    isActive &&
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
  )
}

function Level1Icon({
  icon,
  isActive,
}: {
  icon: NavIconName
  isActive: boolean
}) {
  const Icon = navIcons[icon]
  return (
    <Icon
      className={cn(
        "size-4 shrink-0 transition-all duration-200 ease-out",
        "text-sidebar-foreground/70 group-hover:rotate-6 group-hover:text-primary",
        isActive &&
          "text-primary-foreground group-hover:rotate-3 group-hover:text-primary-foreground"
      )}
    />
  )
}

function Level1Label({ title, isActive }: { title: string; isActive: boolean }) {
  return (
    <span
      className={cn(
        "origin-left truncate transition-transform duration-200 ease-out",
        "group-hover:scale-105",
        isActive && "group-hover:scale-[1.02]"
      )}
    >
      {title}
    </span>
  )
}

function NavDirectLink({
  item,
  isActive,
  collapsed,
  onExpandSidebar,
}: {
  item: NavItem
  isActive: boolean
  collapsed: boolean
  onExpandSidebar: () => void
}) {
  return (
    <Link
      href={item.href!}
      title={collapsed ? item.title : undefined}
      onClick={() => {
        // en modo colapsado, el click re-expande el sidebar además de navegar
        if (collapsed) onExpandSidebar()
      }}
      className={level1ItemClasses(collapsed, isActive)}
    >
      <Level1Icon icon={item.icon} isActive={isActive} />
      {!collapsed && <Level1Label title={item.title} isActive={isActive} />}
    </Link>
  )
}

function NavGroup({
  item,
  pathname,
  collapsed,
  open,
  onOpenChange,
  onExpandSidebar,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onExpandSidebar: () => void
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger
        title={collapsed ? item.title : undefined}
        onClick={() => {
          // en modo colapsado: re-expandir el sidebar y dejar el grupo abierto
          if (collapsed) onExpandSidebar()
        }}
        className={level1ItemClasses(collapsed, false)}
      >
        <Level1Icon icon={item.icon} isActive={false} />
        {!collapsed && (
          <>
            <Level1Label title={item.title} isActive={false} />
            <ChevronDown
              className={cn(
                "ml-auto size-4 shrink-0 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul className="mt-1 space-y-1 pl-6">
          {item.items!.map((child) => (
            <li key={child.href}>
              <NavChildLink child={child} isActive={pathname === child.href} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function NavChildLink({ child, isActive }: { child: NavLink; isActive: boolean }) {
  // nivel 2: solo texto — child.icon existe en la data pero NO se renderiza
  return (
    <Link
      href={child.href}
      className={cn(
        "group block rounded-md px-3 py-1.5 text-sm",
        "transition-[background-color,color,box-shadow] duration-200 ease-out",
        "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        isActive && "bg-accent text-accent-foreground" // tinte suave, no sólido
      )}
    >
      <span className="block origin-left truncate transition-transform duration-200 ease-out group-hover:scale-105">
        {child.title}
      </span>
    </Link>
  )
}
