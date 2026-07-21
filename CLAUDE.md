# CLAUDE.md

Este archivo brinda guía a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Comandos

- `npm run dev` — inicia el servidor de desarrollo (Turbopack)
- `npm run build` — build de producción
- `npm run start` — ejecuta el build de producción
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

Este proyecto todavía no tiene un test runner configurado.

Modo mock (sin necesidad de backend): setear `NEXT_PUBLIC_USE_MOCK=true` en `.env.local`. Backend real: setear `NEXT_PUBLIC_API_URL` en su lugar. Ver `src/shared/api/client.ts`.

## Arquitectura

Es un proyecto Next.js 16 con App Router (React 19, Tailwind v4, shadcn/ui estilo `new-york`, TanStack Query/Table, react-hook-form + Zod). Los specs de diseño con los que se construyó este código viven en `.claude/skills/spec/` — léelos para el detalle completo; el resumen de abajo es lo que realmente está implementado.

### Estructura en capas y reglas de frontera

```
src/
├── app/                        # SOLO routing — sin lógica de negocio, sin fetching
│   └── dashboard/<modulo>/page.tsx   # ~3 líneas, renderiza el *.component.tsx del módulo
├── actions/                    # todo lo que lleva "use server" vive acá
│   └── global-service.ts       # getService/postService — ÚNICO punto de entrada a la API
├── shared/
│   ├── api/                    # infraestructura HTTP, sin "use server"
│   │   ├── http-client.ts      # interface HttpClient (contrato)
│   │   ├── client.ts           # elige el adapter según NEXT_PUBLIC_USE_MOCK
│   │   └── adapters/           # fetch.adapter.ts (activo), mock.adapter.ts (activo),
│   │                            # axios.adapter.ts (solo referencia, comentado por completo)
│   └── components-generic/     # piezas genéricas de CRUD reusadas por todos los módulos
│       ├── table/              # crud-table.tsx + use-crud-table.ts (query/paginación/filtros)
│       ├── modal/               # modal-generic.tsx (shell), audit-info.tsx
│       ├── form/                 # date-picker-field.tsx
│       └── crud/                 # use-crud-operations.ts, use-load-options.ts
├── modules/<nombre>/            # una carpeta por feature CRUD (ej. clientes)
│   ├── <nombre>.variables.ts     # strings de endpoints + títulos (VariablesModel)
│   ├── <nombre>.columns.ts        # solo columnas de negocio de la tabla
│   ├── <nombre>.model.ts           # interface TS + schema Zod + DEFAULT_VALUES
│   ├── <nombre>.form.tsx            # el JSX del formulario, campo por campo
│   └── <nombre>.component.tsx        # orquestador: conecta CrudTable + ModalGeneric + form
├── components/
│   ├── ui/                      # primitivos generados por shadcn — territorio del CLI, no tocar a mano
│   └── layout/                   # sidebar, sidebar-nav, sidebar-provider, topbar
└── lib/                         # utilidades puras: tipos, helpers de fecha, íconos, fonts, mock data
```

**Fronteras que nunca se deben cruzar:**
- Ningún módulo fuera de `shared/api/adapters/` importa `fetch` o `axios` directamente — siempre se pasa por `api` (`shared/api/client.ts`), y el código de negocio siempre pasa por `actions/global-service.ts`, nunca por `api` directo.
- `app/` no contiene lógica — una página es un wrapper delgado que importa el `*.component.tsx` de un módulo.
- Un módulo CRUD nuevo escribe únicamente sus 5 archivos (variables, columns, model, form, component) y nunca escribe fetch, paginación, filtros, badge de estado, columna de acciones, diálogo de confirmación, toast, ni invalidación de cache — eso ya lo hacen `CrudTable`, `useCrudOperations` y `ModalGeneric`.

### Contrato del cliente HTTP

`HttpClient` (`shared/api/http-client.ts`) es una interface `get/post/patch/put/delete` implementada por factories de adapters intercambiables (estilo funcional — la factory retorna un objeto, sin clases). Los adapters normalizan todos los errores a `ApiError` (`shared/api/api-error.ts`); cualquier respuesta fuera de 2xx lanza excepción, nunca retorna un valor. Cambiar `createFetchClient` → `createAxiosClient` en `client.ts` es el único cambio necesario para cambiar de librería.

### Frontera de Server Actions y manejo de errores

`getService`/`postService` en `actions/global-service.ts` envuelven las llamadas a `api` en `try/catch` y retornan un `ActionResult<T>` serializable (`{ ok: true, data } | { ok: false, status, message, errors? }`) — **nunca `throw`** al cruzar la frontera de un Server Action, porque Next redacta los mensajes de error lanzados en producción. El código de cliente vuelve a lanzar un `Error` plano para que TanStack Query lo capture (`if (!res.ok) throw new Error(res.message)`).

### Contrato de respuesta de la API (lo define el backend, el mock lo implementa como referencia)

- Los errores viajan con status HTTP de error; nunca `200 OK` con `success: false` (el fetch adapter solo lanza excepción en respuestas fuera de 2xx, así que esa combinación rompe el manejo de errores en silencio).
- Éxito: `{ success, message, data }`. Listados: la paginación vive dentro de `data` como `{ items, total, page, pageSize, totalPages }`.
- `422` incluye `errors: { NombreCampo: "mensaje" }` con las keys exactas del campo del form — `useCrudOperations.saveRecord` las mapea directo a `form.setError`.
- `401` → redirect server-side a `/login` dentro de `global-service.call()`.

### Cómo crear un módulo CRUD nuevo

1. `<nombre>.variables.ts` — endpoints/títulos (`VariablesModel`)
2. `<nombre>.model.ts` — interface que extiende `BaseModel`, schema Zod, `DEFAULT_VALUES`
3. `<nombre>.columns.ts` — solo columnas de negocio (`N°`, `ESTADO`, `ACCIONES` los inyecta `CrudTable` automáticamente)
4. `<nombre>.form.tsx` — campos a mano usando los componentes `Form*` de shadcn (sin AutoForm ni generación desde el schema)
5. `<nombre>.component.tsx` — copiar un orquestador existente (ej. `modules/clientes/clientes.component.tsx`) y renombrar
6. `app/dashboard/<nombre>/page.tsx` — página de 3 líneas que renderiza el componente

Fechas: el backend manda strings ya formateados para mostrar; las columnas de la tabla los renderizan tal cual, sin lógica de formato. `lib/date.ts` (`toApiDate`/`fromApiDate`) existe solo para conectar el `Date` del `Calendar` de shadcn con ese string, y se usa exclusivamente dentro de `DatePickerField`. Como las fechas son strings planos, nunca se ordenan en el cliente — el ordenamiento queda deliberadamente delegado al backend (ordenar solo una página paginada en el cliente da resultados incorrectos).

### Autenticación

Sesión basada en dos cookies **httpOnly** (`token`, `session`), nunca en `localStorage`:

- `src/proxy.ts` (convención `proxy` de Next 16, reemplaza al viejo `middleware.ts`) protege `/dashboard/*`: sin cookie `token` redirige a `/login`; con sesión activa, `/login` redirige a `/dashboard`.
- `src/actions/auth-service.ts` (`"use server"`) expone `login()` y `logout()`. `login()` llama `/auth/login`, setea ambas cookies y hace `redirect("/dashboard")`; `logout()` las borra y hace `redirect("/login")`.
- `withAuth()` en `global-service.ts` ya leía la cookie `token` y la mandaba como `Authorization: Bearer` en cada request — es el único punto donde se adjunta auth, ningún módulo lo hace por su cuenta.
- `src/lib/session.ts` (`getSession()`) lee la cookie `session` **solo desde Server Components** — así el nombre/rol del usuario nunca se expone a JS de cliente. `app/dashboard/layout.tsx` la lee y se la pasa a `Topbar` como prop.
- El mock adapter implementa `/auth/login` como referencia (usuario `admin` / password `admin123`); conectar un backend real es solo agregar ese caso en el fetch adapter, sin tocar nada de lo anterior.

### Convenciones de nombres

| Cosa | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case, sufijo por rol | `crud-table.tsx`, `clientes.variables.ts` |
| Campos del modelo | PascalCase en español (refleja al backend) | `Denominacion`, `FechaRegistro` |
| Funciones/hooks/props | camelCase en inglés | `openEditModal`, `isSaving` |
| Constantes | SCREAMING_SNAKE | `VARIABLES`, `SHARED_VAR` |

### Estilos

Tailwind v4, configuración CSS-first — no hay `tailwind.config.ts`; todos los tokens de diseño (`--primary`, `--sidebar`, `--radius`, etc.) viven en `src/styles/globals.css` bajo `:root` y se mapean vía `@theme inline`. Sin dark mode (sin bloque `.dark`, sin `next-themes`). Las fuentes están centralizadas en `src/lib/fonts.ts` y se aplican vía `className`, no como CSS variables. Los componentes de shadcn (`components/ui/*`) son generados por el CLI y editables, pero los cambios de marca (color/radius/tipografía) van en la capa de tokens, no parcheados componente por componente.

`components.json`: estilo `new-york`, color base `neutral`, alias de rutas vía `@/*` → `src/*` (ver `tsconfig.json`).
