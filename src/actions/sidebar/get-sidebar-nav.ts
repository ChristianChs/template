"use server"

import { sidebarNav } from "@/lib/data/sidebar-nav"
import type { NavItem } from "@/lib/types/nav"

export async function getSidebarNav(): Promise<NavItem[]> {
  // hoy: retorna el mock directo, sin delay artificial.
  // mañana: acá va el fetch real (DB, API, lo que sea) — la firma no cambia.
  return sidebarNav
}
