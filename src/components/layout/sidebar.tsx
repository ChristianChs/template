import { getSidebarNav } from "@/actions/sidebar/get-sidebar-nav"
import { SidebarNav } from "./sidebar-nav"

// Server Component: único lugar donde se resuelve la data del sidebar.
// SidebarNav (client) se encarga del render, estado activo y colapso.
export async function Sidebar() {
  const items = await getSidebarNav()

  return <SidebarNav items={items} />
}
