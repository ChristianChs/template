import {
  LayoutDashboard,
  Users,
  UserPlus,
  Tags,
  CreditCard,
  Receipt,
  Settings,
} from "lucide-react"

// Registro de íconos usados en la navegación. La data del sidebar guarda el
// nombre (string serializable a través de la frontera Server -> Client);
// el componente cliente lo resuelve acá. Agregar entradas según se necesiten.
export const navIcons = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "user-plus": UserPlus,
  tags: Tags,
  "credit-card": CreditCard,
  receipt: Receipt,
  settings: Settings,
} as const

export type NavIconName = keyof typeof navIcons
