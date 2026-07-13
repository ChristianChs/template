import type { NavIconName } from "@/lib/icons"

// Nota: el spec tipaba `icon: LucideIcon`, pero los componentes (funciones) no
// son serializables a través de la frontera Server Action -> Client Component.
// Se usa el nombre del ícono (string) y el cliente lo resuelve vía `navIcons`.

export type NavLink = {
  title: string
  href: string
  icon?: NavIconName // presente en la data, NO se renderiza en nivel 2
}

export type NavItem = {
  title: string
  icon: NavIconName
  href?: string // si existe y NO hay `items`, se renderiza como link simple
  items?: NavLink[] // si existe, se renderiza como Collapsible (grupo)
}
