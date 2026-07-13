"use client"

import * as React from "react"

type SidebarContextValue = {
  /** Desktop: sidebar colapsado a rail de íconos */
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  /** Mobile/tablet: drawer (Sheet) abierto */
  mobileOpen: boolean
  setMobileOpen: (value: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false) // expandido por defecto
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar debe usarse dentro de <SidebarProvider>")
  return ctx
}
