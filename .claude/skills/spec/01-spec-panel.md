# Spec: Dashboard en Next.js + shadcn/ui (personalizado)

## 1. Objetivo

Construir un dashboard que **no se vea "de plantilla"**. shadcn/ui da la base accesible y sin estilos opinados de más; la personalización real pasa por tokens de diseño, composición de layout y un par de decisiones de tipografía/color que rompan el patrón "azul + gris + Inter" que ya todo el mundo asocia a shadcn.

**Alcance de este spec:** solo **Sidebar + Header** (secciones 3-5). Componentes de datos (tablas, cards de estadísticas, gráficos) se abordan en un spec aparte, más adelante.

**Sin dark mode.** Un solo tema (light), en todos los tokens del documento — no hay bloque `.dark` en ningún lado, ni `next-themes`, ni toggle de tema.

---

## 2. Stack

- **Next.js**: el que ya está instalado en el proyecto (no se fuerza versión, el proyecto ya existe).
- **Tailwind CSS v4**: última mayor, con **configuración CSS-first** (sin `tailwind.config.ts` — todo vive en `globals.css` vía `@theme inline`). Ver sección 4.1 para el detalle.
- **shadcn/ui**: última versión del CLI (ya soporta Tailwind v4 de forma nativa). Componentes copiados a tu repo, no una librería instalada como dependencia.
- **tw-animate-css**: reemplazo de `tailwindcss-animate` (deprecado en proyectos Tailwind v4) para las animaciones de accordion/collapsible.
- **lucide-react**: última versión estable.
- Todo lo demás que se sume en próximos specs (TanStack Table/Query, Recharts, Zod): siempre última versión estable disponible al momento de instalar.

> El resto del stack (TanStack Table/Query, Recharts, Zod, react-hook-form) queda listado como referencia para cuando se aborden los componentes de datos en un spec futuro — no se instala en esta etapa.

**Importante sobre el CLI de shadcn en v4:** al inicializar o agregar componentes, `components.json` debe quedar con `"tailwind": { "config": "" }` (vacío, no hay archivo de config) y `"cssVariables": true`. Si el proyecto ya tiene `tailwind.config.ts` de una instalación previa en v3, hay que migrarlo — confirmar esto es una de las preguntas abiertas al final del documento.

---

## 3. Estructura de carpetas

```
src/
  app/
    (dashboard)/
      layout.tsx          # Sidebar + Topbar shell
      page.tsx             # Overview/home (placeholder por ahora)
  actions/
    sidebar/
      get-sidebar-nav.ts   # "use server" — hoy solo retorna el mock, mañana hace el fetch real
  components/
    ui/                    # componentes shadcn (generados, NO editar a mano el core)
    layout/
      sidebar.tsx
      sidebar-nav.tsx
      topbar.tsx
  lib/
    utils.ts
    fonts.ts
    data/
      sidebar-nav.ts       # mock data del sidebar
    types/
      nav.ts
  styles/
    globals.css            # tokens, @theme inline y overrides
```

> `dashboard/` (StatCard, DataTable, ChartCard) se agrega cuando se trabaje el spec de componentes de datos — no forma parte de esta etapa. No hay carpeta `providers/theme-provider.tsx` porque no hay dark mode que gestionar.

**Regla clave:** los componentes generados por el CLI de shadcn (`components/ui/*`) se tratan como código propio editable, pero los cambios de *marca* (color, radios, tipografía, sombras) van en tokens centralizados, no parcheando cada componente uno por uno.

---

## 4. Personalización real (lo que evita el look genérico)

### 4.1 Tokens de color vía CSS variables (Tailwind v4, CSS-first)

En Tailwind v4 con shadcn ya **no existe `tailwind.config.ts`** para esto — los tokens se definen en `:root` y se mapean a utilidades de Tailwind con `@theme inline`, todo dentro de `globals.css`. Un solo bloque, sin `.dark`:

```css
/* styles/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(240 6% 15%);

  --surface-1: hsl(0 0% 100%);
  --surface-2: hsl(240 5% 97%);
  --surface-3: hsl(240 5% 94%);

  --primary: hsl(350 60% 28%);         /* granate/vino, tono base de marca */
  --primary-foreground: hsl(0 0% 100%);

  --accent: hsl(350 55% 95%);          /* tinte suave del primario */
  --accent-foreground: hsl(350 60% 28%);

  --border: hsl(240 6% 90%);
  --ring: hsl(350 60% 28%);

  --radius: 0.75rem; /* cambiar el radius default rompe mucho el "look shadcn" */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}
```

Con esto, clases como `bg-primary`, `text-accent-foreground`, `rounded-lg` funcionan directo — sin tocar ningún archivo `.config`.

### 4.2 Tipografía

Reemplaza Inter por algo con más carácter para títulos + una neutra para body. La escala de tamaños también se define como tokens en el bloque `@theme inline` de `globals.css` (no en un `tailwind.config` que ya no existe), en vez de usar tamaños ad-hoc por componente.

**Fuentes centralizadas en un solo archivo** (`lib/fonts.ts`), aplicadas vía `className` directo (sin pasar por CSS variables de Tailwind):

```ts
// lib/fonts.ts
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google"

export const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

export const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})
```

> Los nombres (`Space_Grotesk`, `Plus_Jakarta_Sans`) son una sugerencia de punto de partida — cámbialos por los que prefieras, la estructura del archivo no cambia.

**Uso en el layout raíz** (fuente body aplicada globalmente):

```tsx
// app/layout.tsx
import { fontBody } from "@/lib/fonts"
import "@/styles/globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={fontBody.className}>{children}</body>
    </html>
  )
}
```

> Nota: `suppressHydrationWarning` en `<html>` solo hacía falta para evitar el mismatch de `next-themes` al inyectar la clase `dark`. Sin dark mode, no es necesario.

**Uso en componentes de título** — al no usar CSS variables, `fontHeading` se aplica explícitamente donde haga falta (no se hereda solo). Lo más limpio es centralizarlo en un componente `Heading` reutilizable:

```tsx
// components/ui/heading.tsx
import { fontHeading } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export function Heading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn(fontHeading.className, "text-2xl font-semibold", className)} {...props} />
}
```

Así, cualquier pantalla que necesite un título importa `Heading` (o directamente `fontHeading` desde `lib/fonts.ts` si es un caso puntual) en vez de reconfigurar la fuente en cada lugar.

### 4.3 Radios y sombras consistentes
Un solo valor de `--radius` (ya definido en 4.1) y 2-3 niveles de sombra custom, también como tokens en `@theme inline`, usados sistemáticamente en cards, dropdowns y modales.

### 4.4 Densidad de layout
El error más común es dejar el padding/spacing default de los ejemplos de shadcn. Define una escala de densidad (compact/comfortable) y aplícala igual en toda la app.

---

## 5. Componentes de layout

> **Nota de enfoque:** para el nav del sidebar (5.1-5.7 abajo) **no se usa el bloque oficial `Sidebar` de shadcn** — ese bloque trae su propia estructura y estados ya definidos, y limitaría justo las animaciones/diseño custom que se necesitan acá. En su lugar, `sidebar-nav.tsx` se construye 100% a medida usando el primitivo `Collapsible` de Radix (el mismo que usa shadcn por debajo) + clases propias. shadcn sigue siendo útil para piezas donde no compite con el diseño custom: `Sheet` para el drawer mobile, `Button`, etc.

- **Sidebar** con íconos (lucide-react), lista plana de links (sin secciones/agrupaciones visuales) + estado activo por ruta
- **Topbar** con ícono de menú, breadcrumb y bloque de usuario (ver 5.5)
- **Command palette** (⌘K) para navegación rápida — opcional, se evalúa si suma o si con la lista plana del sidebar ya es suficiente
- **Empty states** e **skeletons** propios (no dejar el spinner default)

### 5.1 Sidebar con "Collapsible links group" — lista plana, sin secciones

Máximo **2 niveles**:
- **Nivel 1**: icono + texto. Puede ser un link directo (sin hijos) o un grupo colapsable (con hijos).
- **Nivel 2**: solo texto. El `icon` se incluye en la data por consistencia de tipo, pero **no se renderiza**.
- Si un grupo colapsable tiene un hijo activo (ruta actual coincide con `href`), el grupo se **expande automáticamente** y el link hijo queda resaltado.
- **Sin agrupación visual por secciones**: no hay títulos de sección tipo "General" / "Gestión" separando bloques del sidebar — es una sola lista continua de items.

**Tipos:**

```ts
import type { LucideIcon } from "lucide-react"

export type NavLink = {
  title: string
  href: string
  icon?: LucideIcon // presente en la data, NO se renderiza en nivel 2
}

export type NavItem = {
  title: string
  icon: LucideIcon
  href?: string        // si existe y NO hay `items`, se renderiza como link simple
  items?: NavLink[]     // si existe, se renderiza como Collapsible (grupo)
}
```

> Se eliminó el tipo `NavGroup` (con `label` de sección) que existía en la versión anterior del spec. Ahora `sidebarNav` es directamente `NavItem[]` — una lista plana, sin envoltorio de secciones.

La regla de renderizado es simple: **si `items` existe → `<Collapsible>`, si no existe → link directo**. Así el mismo componente `SidebarNav` decide el tipo de render sin necesidad de un campo `type` extra.

**Mock data** (`lib/data/sidebar-nav.ts`):

```ts
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Tags,
  CreditCard,
  Receipt,
  Settings,
} from "lucide-react"
import type { NavItem } from "@/lib/types/nav"

export const sidebarNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    // sin `items` -> link directo, no colapsable
  },
  {
    title: "Clientes",
    icon: Users,
    // con `items` -> se renderiza como Collapsible
    items: [
      { title: "Lista de clientes", href: "/dashboard/clientes", icon: Users },
      { title: "Nuevo cliente", href: "/dashboard/clientes/nuevo", icon: UserPlus },
      { title: "Segmentos", href: "/dashboard/clientes/segmentos", icon: Tags },
    ],
  },
  {
    title: "Suscripciones",
    icon: CreditCard,
    items: [
      { title: "Planes", href: "/dashboard/suscripciones/planes", icon: CreditCard },
      { title: "Facturación", href: "/dashboard/suscripciones/facturacion", icon: Receipt },
    ],
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
    // sin `items` -> link directo
  },
]
```

Nota: el `icon` en los objetos de `items` (nivel 2) queda en la data por si en el futuro decides mostrarlo (breadcrumbs, command palette, etc.), pero el componente `SidebarNav` lo ignora explícitamente en ese nivel.

### 5.2 Colores del Sidebar (tokens, cero hardcode en el componente)

Reutiliza los tokens generales de 4.1 (`--primary`, `--accent`, etc.) más un par de tokens dedicados al sidebar si su fondo necesita diferenciarse del `--background` general. Con **dos estados de "activo" distintos según el nivel**:

- **Nivel 1 activo** (link directo sin hijos, ej. "Documentos" en la referencia) → fondo **sólido** del color primario, texto blanco.
- **Nivel 2 activo** (subitem seleccionado dentro de un grupo, ej. "Registros") → fondo con un **tinte suave/claro** del primario (no sólido), texto en el tono primario u oscuro.
- **Cualquier item NO activo** (nivel 1 o 2) → sin fondo, transparente. Solo aparece un hover sutil al pasar el mouse.

```css
/* styles/globals.css — agregado al :root de 4.1, un solo set de tokens, sin .dark */
:root {
  /* ...tokens generales de 4.1... */
  --sidebar: hsl(0 0% 100%);                 /* fondo blanco */
  --sidebar-foreground: hsl(240 6% 20%);     /* texto gris oscuro */
  --sidebar-border: hsl(240 6% 90%);
}

@theme inline {
  /* ...mapeos generales de 4.1... */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  /* nivel 1 activo y nivel 2 activo reutilizan --color-primary / --color-accent de 4.1 */
}
```

> El valor exacto del granate (`--primary`) se ajusta a ojo comparando con tu imagen de referencia — la estructura de tokens no cambia.

**Uso en el componente** — nivel 1 activo y nivel 2 activo usan tokens distintos (`primary` sólido vs `accent` suave):

```tsx
// components/layout/sidebar-nav.tsx (fragmento)

// Nivel 1 — link directo, activo:
<Link
  className={cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200",
    "hover:bg-accent hover:text-accent-foreground",
    isActive && "bg-primary text-primary-foreground hover:bg-primary" // sólido
  )}
>
  <item.icon className="size-4" />
  <span>{item.title}</span>
</Link>

// Nivel 2 — subitem dentro de un grupo, activo:
<Link
  className={cn(
    "block rounded-md px-3 py-1.5 text-sm transition-colors duration-200",
    "hover:bg-accent hover:text-accent-foreground",
    isChildActive && "bg-accent text-accent-foreground" // tinte suave, no sólido
  )}
>
  <span>{child.title}</span>
</Link>
```

Todo el contraste, el matiz exacto del granate y qué tan "suave" es el tinte se ajustan **solo en `globals.css`**.

### 5.2.1 Diseño del item: hover con profundidad (no genérico)

El hover plano de "solo cambia el fondo" es justo lo que hace que un sidebar shadcn se sienta genérico. Se agregan 3 capas de feedback al pasar por un item:

1. **Sombra**: el item levanta una sombra suave al hover (sensación de profundidad, no solo cambio de color).
2. **Texto que crece**: el `<span>` del título escala ligeramente (`scale-105`).
3. **Ícono que se pinta y gira**: el ícono pasa de `text-sidebar-foreground` (gris) a `text-primary`, y rota ~6-8° hacia la derecha — el pequeño "guiño" de movimiento que da la sensación de ir pasando por ahí.

**En el item activo**, el mismo efecto se mantiene pero **atenuado** (menos escala, menos rotación) porque el item ya se distingue por su fondo sólido/tinte — no necesita el mismo nivel de "sorpresa" que uno inactivo.

```tsx
// components/layout/sidebar-nav.tsx (fragmento — nivel 1, link directo o cabecera de grupo)
<Link
  href={item.href}
  className={cn(
    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm",
    "transition-shadow duration-200 ease-out",
    "hover:shadow-sm hover:bg-accent",
    isActive && "bg-primary text-primary-foreground shadow-sm"
  )}
>
  <item.icon
    className={cn(
      "size-4 shrink-0 transition-all duration-200 ease-out",
      "text-sidebar-foreground/70 group-hover:text-primary group-hover:rotate-6",
      isActive && "text-primary-foreground group-hover:rotate-3 group-hover:text-primary-foreground"
    )}
  />
  <span
    className={cn(
      "origin-left transition-transform duration-200 ease-out",
      "group-hover:scale-105",
      isActive && "group-hover:scale-[1.02]"
    )}
  >
    {item.title}
  </span>
</Link>
```

Notas de implementación:
- `group` en el `<Link>` + `group-hover:` en los hijos es lo que permite que el ícono y el texto reaccionen juntos al hover del contenedor, sin JS.
- `origin-left` en el `<span>` evita que el texto "empuje" el layout al escalar — crece desde su propio borde izquierdo, no desde el centro.
- El grado de rotación (6-8° normal, 3° en el activo) y el nivel de escala (1.05 normal, 1.02 activo) son los únicos números que se tocan si más adelante quieres ajustar la intensidad — todo lo demás (color, sombra) ya sale de los tokens de 4.1/5.2.
- Esto se suma, no reemplaza, el `transition-colors` de fondo ya definido en 5.2 — ahí sigue la lógica de fondo sólido/tinte según nivel.

### 5.3 Animaciones suaves

Tres lugares donde se necesita transición, cada uno con su propia técnica:

1. **Hover / estado activo de un link** → ya cubierto arriba con `transition-colors duration-200`. Suficiente para que no se sienta "seco"; no hace falta más para un simple cambio de color.

2. **Abrir/cerrar un grupo colapsable (nivel 2)** → en Tailwind v4, `tailwindcss-animate` quedó deprecado en favor de **`tw-animate-css`** (importado en `globals.css`, ver 4.1). Trae las mismas animaciones `accordion-down` / `accordion-up`. El componente `Collapsible` de Radix expone `data-[state=open]` / `data-[state=closed]`, y esas clases se disparan solas:

   ```tsx
   <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
   ```

3. **Colapsar el sidebar completo (ancho, ícono-only)** → transición de `width`, no de `display`, para que se sienta fluido:

   ```tsx
   <aside className={cn("transition-[width] duration-300 ease-in-out", collapsed ? "w-16" : "w-64")}>
   ```

Con esto ninguna transición depende de JS/spring libraries — todo es CSS/Tailwind, así que no agrega peso ni complejidad extra.

### 5.4 Cómo se carga la data en el Sidebar

Flujo con una capa intermedia de **Server Action**, para que hoy sea "mock" y mañana sea el fetch real sin tocar nada del render:

```
lib/data/sidebar-nav.ts        →   actions/sidebar/get-sidebar-nav.ts   →   sidebar.tsx   →   sidebar-nav.tsx
(mock/fuente de data actual)        ("use server", punto único de acceso)    (Server, await)    (Client, render + usePathname)
```

```ts
// actions/sidebar/get-sidebar-nav.ts
"use server"

import { sidebarNav } from "@/lib/data/sidebar-nav"
import type { NavItem } from "@/lib/types/nav"

export async function getSidebarNav(): Promise<NavItem[]> {
  // hoy: retorna el mock directo, sin delay artificial.
  // mañana: acá va el fetch real (DB, API, lo que sea) — la firma no cambia.
  return sidebarNav
}
```

```tsx
// components/layout/sidebar.tsx
import { getSidebarNav } from "@/actions/sidebar/get-sidebar-nav"
import { SidebarNav } from "./sidebar-nav"

export async function Sidebar() {
  const items = await getSidebarNav()

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <SidebarNav items={items} />
    </aside>
  )
}
```

```tsx
// components/layout/sidebar-nav.tsx
"use client" // necesita usePathname para saber la ruta activa

import { usePathname } from "next/navigation"
import type { NavItem } from "@/lib/types/nav"

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  // recorre items -> (item.items ? Collapsible : Link directo)
  // compara item.href / child.href contra pathname para marcar activo
  return /* ... */
}
```

**Por qué así:**
- `getSidebarNav` es un **único punto de entrada** con `"use server"`: funciona invocado desde un Server Component (`await getSidebarNav()`, como arriba) y también quedaría disponible para invocarse desde el cliente el día que evalúes lo del login/localStorage — no hace falta decidir eso ahora, la Server Action ya lo deja abierto.
- El mock vive en `lib/data/sidebar-nav.ts` y la Server Action solo lo re-expone. Cuando pase a ser data real, **solo se edita el cuerpo de `getSidebarNav`** (fetch a DB/API) — `sidebar.tsx` y `sidebar-nav.tsx` no cambian ni una línea, porque siguen recibiendo el mismo tipo `NavItem[]`.
- `Sidebar` pasa a ser un Server Component `async` (patrón estándar de App Router para await de datos), y `SidebarNav` se mantiene igual de chico: solo recibe `items` como prop, sigue siendo el único responsable del estado visual/activo.

### 5.5 Logo y Header, según la referencia visual

- **Logo**: bloque fijo arriba del sidebar, fuera del área scrolleable de `SidebarNav` (así el logo no se mueve si la lista de links crece y hace scroll).
- **Header/Topbar**: fondo blanco, borde inferior sutil (`border-border`), tres zonas:
  - Izquierda: ícono de menú (toggle del sidebar — colapsa a ícono-only en desktop, abre el drawer en mobile).
  - Derecha: avatar + nombre de usuario + rol, en dos líneas (nombre en negrita, rol debajo en gris/tenue) — igual que la referencia y el wireframe.
  - Opcional: ícono de pantalla completa entre el centro y el bloque de usuario (aparece en la referencia).

No hace falta ningún token nuevo para esto: reutiliza `--background`/`--foreground`/`--border` generales de 4.1.

### 5.6 Responsive

- **Mobile y tablet** (`< lg`): el sidebar no se muestra fijo — se abre como `Sheet` (drawer) al tocar el ícono de menú del Topbar. Overlay + cierre al hacer click afuera o al navegar. Mismo comportamiento en ambos tamaños, sin un estado intermedio propio de tablet.
- **Desktop** (`>= lg`): sidebar fijo en pantalla, **expandido por defecto**, con un toggle en el Topbar para colapsarlo a modo ícono-only (rail angosto). El usuario decide cuándo colapsarlo — no es automático por breakpoint dentro de desktop.
- Breakpoint sugerido: `lg` (1024px) como corte entre "drawer" y "fijo colapsable", en vez del `md` (768px) por default — así tablets en vertical siguen usando el drawer, que es más cómodo con menos ancho horizontal.

### 5.7 Interacción en modo colapsado (desktop, ícono-only)

Cuando el sidebar está colapsado a rail de íconos:

- Se ven **solo los íconos de nivel 1** (sin texto), sea el item un link directo o un grupo con hijos.
- **Al hacer click en cualquier ícono de nivel 1** (tenga o no hijos), el sidebar **se re-expande** a su ancho completo — no hay flyout/popover flotante al hover, es expandir y ya.
  - Si el item clickeado es un grupo (tiene `items`), además de expandirse el sidebar, ese grupo queda abierto mostrando sus hijos.
  - Si el item clickeado es un link directo, se expande el sidebar y también navega a esa ruta.

```tsx
// components/layout/sidebar-nav.tsx (fragmento, lógica de click en modo colapsado)
function handleItemClick(item: NavItem) {
  if (collapsed) {
    setCollapsed(false)
    if (item.items) setOpenGroup(item.title) // abre ese grupo al re-expandir
  }
  // si item.href existe, el <Link> navega normalmente además de esto
}
```

Este comportamiento es puramente de estado local en `SidebarNav` (`collapsed`, `openGroup`) — no requiere tokens ni cambios de color adicionales a los ya definidos en 5.2.

---

## 6. Componentes de datos — *fuera de alcance de este spec*

StatCard, DataTable, ChartCard, filtros avanzados, TanStack Query, Server Actions con Zod, etc. se definen en un **spec aparte** cuando se trabaje esa etapa. Este documento se queda solo en Sidebar + Header.

---

## 7. Accesibilidad

- Radix ya da foco/teclado correcto; no lo rompas envolviendo con divs que interceptan eventos.
- Contraste AA mínimo entre `--primary` y `--primary-foreground`, y entre `--accent` y `--accent-foreground` — verificar el tono exacto del granate una vez definido, no asumir que por copiar shadcn ya cumple.

---

## 8. Checklist de entrega (alcance: Sidebar + Header)

- [ ] `globals.css` con tokens en `:root` + mapeo `@theme inline` (sin `tailwind.config.ts`, sin `.dark`)
- [ ] `lib/fonts.ts` con las 2 fuentes, importadas donde corresponde (layout + `Heading`)
- [ ] `actions/sidebar/get-sidebar-nav.ts` ("use server") como único punto de acceso a la data del sidebar
- [ ] Sidebar con Collapsible links group, lista plana sin secciones (mock data en `lib/data/sidebar-nav.ts`, expuesta vía la action)
- [ ] Nivel 1 activo = fondo sólido primario; nivel 2 activo = tinte suave (`accent`); resto sin fondo
- [ ] Hover con profundidad: sombra + texto que escala + ícono que se pinta y gira (~6-8° normal, ~3° en activo)
- [ ] Auto-expand + resaltado de link activo según ruta
- [ ] Transiciones: hover/activo (`transition-colors`), accordion del grupo (`tw-animate-css`), ancho al colapsar sidebar
- [ ] Header/Topbar: menú, breadcrumb, avatar + nombre + rol
- [ ] Responsive: sidebar → `Sheet` drawer en mobile **y tablet** (`< lg`), fijo en desktop (`>= lg`)
- [ ] Toggle de colapso en desktop: rail ícono-only, expandido por defecto, se re-expande al click en cualquier ícono (y abre el grupo si tiene hijos)

---