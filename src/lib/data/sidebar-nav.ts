import type { NavItem } from "@/lib/types/nav"

export const sidebarNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "layout-dashboard",
    // sin `items` -> link directo, no colapsable
  },
  {
    title: "Clientes",
    icon: "users",
    // con `items` -> se renderiza como Collapsible
    items: [
      { title: "Lista de clientes", href: "/dashboard/clientes", icon: "users" },
      { title: "Segmentos", href: "/dashboard/clientes/segmentos", icon: "tags" },
    ],
  },
  {
    title: "Suscripciones",
    icon: "credit-card",
    items: [
      { title: "Planes", href: "/dashboard/suscripciones/planes", icon: "credit-card" },
      { title: "Facturación", href: "/dashboard/suscripciones/facturacion", icon: "receipt" },
    ],
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: "settings",
    // sin `items` -> link directo
  },
]
