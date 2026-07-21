"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Maximize,
  Menu,
  PanelLeft,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SessionUser } from "@/lib/types/auth.model"
import { useSidebar } from "./sidebar-provider"
import { LogoutButton } from "./logout-button"

interface TopbarProps {
  user: SessionUser | null
}

export function Topbar({ user }: TopbarProps) {
  const { collapsed, setCollapsed, setMobileOpen } = useSidebar()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      {/* Toggle: drawer en mobile/tablet, colapso en desktop */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir menú"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        onClick={() => setCollapsed(!collapsed)}
      >
        <PanelLeft className="size-5" />
      </Button>

      <Breadcrumb />

      <div className="ml-auto flex items-center gap-2">
        <FullscreenButton />
        <UserBlock user={user} />
      </div>
    </header>
  )
}

function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }))

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            {crumb.isLast ? (
              <span className="truncate font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function formatSegment(segment: string) {
  const decoded = decodeURIComponent(segment).replace(/-/g, " ")
  return decoded.charAt(0).toUpperCase() + decoded.slice(1)
}

function FullscreenButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden md:inline-flex"
      aria-label="Pantalla completa"
      onClick={() => {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
      }}
    >
      <Maximize className="size-4" />
    </Button>
  )
}

function UserBlock({ user }: TopbarProps) {
  const nombre = user?.nombre ?? "Usuario"
  const rol = user?.rol ?? ""
  const primerNombre = nombre.split(" ")[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex items-center gap-2 rounded-md py-1.5 pr-3 pl-1.5",
          "border border-border bg-background shadow-sm",
          "transition-colors duration-200 hover:border-primary/40 hover:bg-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "data-[state=open]:border-primary/40 data-[state=open]:bg-accent"
        )}
        aria-label="Menú de usuario"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <CircleUserRound className="size-5" />
        </span>
        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block truncate text-sm font-semibold text-foreground">
            {nombre}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {rol}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "hidden size-4 shrink-0 text-muted-foreground transition-transform duration-200 sm:block",
            "group-data-[state=open]:rotate-180"
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          ¡Bienvenido, {primerNombre}!
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="size-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
