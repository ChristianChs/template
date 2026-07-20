# Spec — CRUD Genérico (Next.js)

> Portabilidad del patrón Angular (`app-format-generic` + `app-modal-generic` + `BaseSignalComponent`) a Next.js App Router.

**Stack:** Next.js (App Router) · TypeScript · shadcn/ui · TanStack Table · TanStack Query · react-hook-form + Zod · Server Actions

---

## 1. Principio rector

El módulo **declara**, el genérico **ejecuta**.

Un módulo nuevo no escribe: fetch, paginación, filtros, columna de estado, columna de acciones, confirmaciones, toasts, invalidación de cache, ni apertura/cierre de modal.

Un módulo nuevo **sí** escribe: sus endpoints (strings), sus columnas de negocio, su schema Zod y su formulario JSX.

---

## 2. Estructura de archivos

Alineada con el proyecto existente. ⭐ = archivos nuevos de este spec.

```
src/
├── app/                                     # SOLO routing. Cero lógica.
│   ├── layout.tsx                           # root + <Providers>
│   ├── providers.tsx                        # ⭐ QueryClientProvider + <Toaster />
│   ├── page.tsx                             # landing → /
│   └── dashboard/
│       ├── layout.tsx                       # ⭐ shell: sidebar + header
│       ├── page.tsx                         # → /dashboard
│       ├── clientes/page.tsx                # ⭐ 3 líneas → <ClientesComponent />
│       ├── configuracion/page.tsx
│       └── suscripciones/page.tsx
│
├── actions/                                 # FRONTERA SERVER: todo lo que lleva "use server"
│   ├── global-service.ts                    # ⭐ getService / postService
│   └── sidebar/get-sidebar-nav.ts           # (existente)
│
├── shared/                                  # capa reusable de aplicación
│   ├── shared-variables.ts                  # ⭐ SHARED_VAR (archivo suelto, sin carpeta)
│   │
│   ├── api/                                 # INFRAESTRUCTURA HTTP (existente, sin "use server")
│   │   ├── client.ts                        # elige adapter según env
│   │   ├── http-client.ts                   # interface HttpClient + RequestConfig
│   │   ├── api-error.ts
│   │   └── adapters/
│   │       ├── create-fetch-client.ts       # (existente)
│   │       └── create-mock-client.ts        # ⭐ mismo contrato, data en memoria — ver §14
│   │
│   └── components-generic/                  # ⭐ acá viven TODOS los genéricos futuros
│       ├── table/
│       │   ├── crud-table.tsx               # principal (≈ app-format-generic)
│       │   ├── crud-table-filters.tsx       # buscador + combo estado (default)
│       │   ├── crud-table-actions.tsx       # celda de acciones
│       │   ├── crud-table-pagination.tsx
│       │   └── use-crud-table.ts            # interno: query + paginación + filtros
│       ├── modal/
│       │   ├── modal-generic.tsx            # shell (≈ app-modal-generic)
│       │   └── audit-info.tsx
│       ├── form/
│       │   └── date-picker-field.tsx        # ⭐ Popover + Calendar (≈ DateFormatDirective)
│       └── crud/
│           ├── use-crud-operations.ts       # open/edit/close/saveRecord
│           └── use-load-options.ts          # combos opcionales
│
├── modules/                                 # ⭐ un folder por CRUD (≈ feature de Angular)
│   └── clientes/
│       ├── clientes.variables.ts            # solo strings
│       ├── clientes.columns.ts              # solo columnas de negocio
│       ├── clientes.model.ts                # interface + schema Zod + defaults
│       ├── clientes.form.tsx                # el formulario, campo por campo
│       └── clientes.component.tsx           # orquestador (≈ .component.ts + .html)
│
├── components/
│   ├── ui/                                  # shadcn — territorio de la CLI, no tocar
│   └── layout/                              # sidebar, header
│
├── lib/                                     # utilidades puras
│   ├── types/
│   │   ├── nav.ts                           # (existente)
│   │   ├── base.model.ts                    # ⭐ BaseModel, VariablesModel
│   │   ├── table.model.ts                   # ⭐ CrudColumn, PaginatedRequest/Response
│   │   └── select.model.ts                  # ⭐ OptionItem
│   ├── utils.ts                             # shadcn (cn)
│   ├── date.ts                              # ⭐ toApiDate / fromApiDate / displayDate
│   ├── icons.ts
│   ├── fonts.ts
│   └── data/
│
└── styles/globals.css
```

### Reglas de frontera

| Carpeta | Qué vive ahí | Qué NO |
|---|---|---|
| `app/` | rutas, layouts, providers | lógica de negocio, componentes de módulo |
| `actions/` | **todo `"use server"`** | helpers puros, tipos |
| `shared/api/` | HTTP: fetch, auth, errores, adapters | server actions |
| `shared/components-generic/` | genéricos reusables por N módulos | nada específico de un módulo |
| `modules/<x>/` | los 5 archivos del CRUD | fetch, paginación, acciones |
| `components/ui/` | shadcn, generado por CLI | componentes propios |
| `lib/` | tipos, utils, fechas, iconos, fonts | componentes, fetch |

**Decisión — routing:** URLs `/dashboard/clientes`. Se elimina el route group `(dashboard)`: hoy está inerte (hace lo mismo que un `layout.tsx` dentro de `dashboard/`) y agrega un nivel. El shell vive en `app/dashboard/layout.tsx`. Las zonas que no usen el shell (login, landing) van fuera de `dashboard/`, en la raíz o en su propio grupo (`(auth)/`).

**Decisión — código de módulo:** vive en `src/modules/`, **no** colocado dentro de `app/`. Mapea 1:1 con el feature folder de Angular y deja `app/` como puro routing. El precio es un `page.tsx` de tres líneas por módulo:

```tsx
// app/dashboard/clientes/page.tsx
import { ClientesComponent } from "@/modules/clientes/clientes.component";
export default function Page() { return <ClientesComponent />; }
```

---

## 3. Contratos de datos

### 3.1 `lib/types/base.model.ts`

```ts
export interface BaseModel {
  Id: number;
  Activo: "1" | "0";            // estado del registro (toggle)
  Eliminado: "1" | "0";         // ⚠️ borrado lógico — ver §10, pendiente de confirmar
  UsuarioRegistro?: string;
  FechaRegistro?: string;
  UsuarioModifico?: string;
  FechaModifico?: string;
}

export interface VariablesModel {
  TITLE: string;                 // "Lista de resoluciones"
  TITLE_MODAL: string;           // "resolución"  → "Nueva resolución" / "Editar resolución"
  TITLE_ROUTE: string;           // breadcrumb
  ROUTE: string;
  ENDPOINT_GET_DATA: string;
  ENDPOINT_SAVE: string;
  ENDPOINT_UPDATE: string;       // puede repetir SAVE si el backend hace upsert por Id
  ENDPOINT_DELETE: string;       // borrado lógico
  ENDPOINT_RESTORE: string;
  ENDPOINT_TOGGLE_STATUS: string;
  ENDPOINT_GET_COMBOS?: string;  // opcional
}
```

### 3.2 `lib/types/table.model.ts`

Mantengo tu shape de columnas de Angular (`dataIndex` / `align` / `width`) y adentro del genérico se adapta a `ColumnDef` de TanStack. El módulo nunca ve TanStack Table.

```ts
export interface CrudColumn<T> {
  title: string;
  dataIndex: keyof T & string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
  render?: (value: unknown, record: T) => React.ReactNode;  // opcional, para badges/formatos
}

export interface PaginatedRequest {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

### 3.3 `lib/types/api.model.ts` — el envelope (ver §4.3)

```ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;   // solo en 422; keys = campos del form
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 3.4 `lib/types/select.model.ts`

```ts
export interface OptionItem {
  VALUE: string;
  LABEL: string;
}
```

### 3.5 `shared/shared-variables.ts`

```ts
export const SHARED_VAR = {
  LIST_STATUS_ALL: [
    { VALUE: "-1", LABEL: "TODOS" },
    { VALUE: "1",  LABEL: "ACTIVO" },
    { VALUE: "0",  LABEL: "DESACTIVO" },
  ],
  LIST_DATA_ALL: { VALUE: "-1", LABEL: "TODOS" },
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  SEARCH_DEBOUNCE_MS: 400,
} as const;
```

Sin importar `OptionItem` acá: el tipado estructural se encarga. Es un archivo de datos, no de tipos.

---

## 4. Servicio global (Server Actions)

Se apoya en el `HttpClient` que ya existe (`shared/api/adapters/create-fetch-client.ts`). El genérico **nunca** importa `api` directo: siempre pasa por estas dos actions.

```ts
// actions/global-service.ts
"use server";

import { cookies } from "next/headers";
import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/api-error";
import type { RequestConfig } from "@/shared/api/http-client";

export type ActionResult<T> =
  | { ok: true;  data: T }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

async function withAuth(): Promise<RequestConfig> {
  const token = (await cookies()).get("token")?.value;
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
}

async function call<T>(endpoint: string, payload: unknown): Promise<ActionResult<T>> {
  try {
    const data = await api.post<T>(endpoint, payload ?? {}, await withAuth());
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ApiError) {
      return { ok: false, status: e.status, message: extractMessage(e) };
    }
    return { ok: false, status: 0, message: "Error inesperado" };
  }
}

export async function getService<T>(endpoint: string, params?: unknown) {
  return call<T>(endpoint, params);
}

export async function postService<T>(endpoint: string, data: unknown) {
  return call<T>(endpoint, data);
}
```

### 4.1 Por qué `ActionResult` y no `throw` — ⚠️ crítico

Next **serializa** lo que cruza la frontera de un Server Action. En producción, los errores lanzados se **redactan**: el `message` se reemplaza por un texto genérico + un `digest`, y las clases custom pierden el prototipo. Es decir: `catch (e) { toast.error(e.message) }` funciona en dev y muestra basura en prod.

Regla: **el `try/catch` y el `instanceof ApiError` viven dentro de la action**, donde el objeto todavía existe. Al cliente le llega un objeto plano y serializable.

Del lado cliente, se re-lanza como `Error` normal para que TanStack Query lo tome:

```ts
// dentro de use-crud-table.ts
queryFn: async () => {
  const res = await getService<PaginatedResponse<T>>(variables.ENDPOINT_GET_DATA, payload);
  if (!res.ok) throw new Error(res.message);   // ya es un Error de cliente: el mensaje sobrevive
  return res.data;
}
```

Y en mutaciones:

```ts
const res = await postService(endpoint, data);
if (!res.ok) return toast.error(res.message);
toast.success("Registro guardado");
qc.invalidateQueries({ queryKey: [queryKey] });
```

### 4.2 Notas de diseño

- **Auth por llamada, no en `defaultConfig`.** `createFetchClient(baseUrl, defaultConfig)` congela los headers al construir el cliente. Si el token se mete ahí, queda leído en module-init → stale. `withAuth()` lee `cookies()` en cada invocación y lo pasa como `config`, que el adapter ya soporta.
- **`getService` y `postService` son la misma llamada hoy** (ambos → `api.post`), porque hasta las lecturas van por POST con body. Los dos nombres se conservan por intención semántica y para que el día que el backend exponga GETs reales solo se toque este archivo.
- **Server Actions se serializan.** Next las ejecuta en fila, no en paralelo. Para la tabla es irrelevante. Si un módulo carga combos **y** tabla al montar, van secuenciales. Si molesta, la salida es mover solo `ENDPOINT_GET_DATA` a un Route Handler. No lo optimices antes de verlo.

### 4.3 Contrato de respuesta del API — ✅ decidido

El backend lo escribes tú, así que esto **no se confirma: se define**. El mock de §14 es la implementación de referencia de este contrato.

#### Regla de oro

> **Los errores viajan con status HTTP de error. Nunca `200 OK` con `success: false`.**

No es purismo. `createFetchClient` hace `if (!res.ok) throw new ApiError(...)`. Un `200` con `success: false` **jamás lanza el `ApiError`** → todo el flujo de errores queda muerto en silencio. El adapter ya tomó esta decisión; el backend la respeta.

Corolario: **el front nunca hace `if (res.success)`.** Se entera del error porque el adapter lanzó. El campo `success` existe solo para que los logs se lean solos.

#### Éxito — `200`

```json
{ "success": true, "message": "Cliente registrado correctamente", "data": { "Id": 42 } }
```

#### Listado — `200` (la paginación vive dentro de `data`)

```json
{
  "success": true,
  "message": "",
  "data": { "items": [], "total": 42, "page": 1, "pageSize": 10, "totalPages": 5 }
}
```

#### Error de negocio / validación — `422`

```json
{
  "success": false,
  "message": "La denominación ya existe",
  "errors": { "Denominacion": "Ya existe un cliente con esa denominación" }
}
```

Las keys de `errors` son **los nombres exactos de los campos del form** (`Denominacion`, no `denominacion`). Eso hace que mapearlos sea trivial:

```ts
Object.entries(errors).forEach(([campo, msg]) => form.setError(campo, { message: msg }));
```

#### Mapa de status

| Status | Cuándo | Qué hace el front |
|---|---|---|
| `200` | todo bien | usa `data` |
| `400` | request malformado | toast con `message` |
| `401` | sin sesión | `redirect("/login")` (server-side, en `call()`) |
| `403` | sin permiso | toast con `message` |
| `404` | no existe | toast con `message` |
| `422` | validación / regla de negocio | `form.setError` por campo + toast con `message` |
| `500` | error inesperado | toast genérico (nunca stack traces al usuario) |

#### Invariantes

1. `message` **siempre** presente, **siempre** mostrable al usuario. Nunca stack traces.
2. `data` **siempre** presente en éxito (objeto o `null`), nunca ausente.
3. `errors` **solo** en `422`.
4. Todos los listados usan el mismo shape de paginación. Sin excepciones.

## 5. `CrudTable` — el genérico principal

### 5.1 API pública

```tsx
<CrudTable<ResolutionsModel>
  variables={VARIABLES}
  columns={COLUMNS_DATA_TABLE}
  queryKey="resolutions"
  onAdd={crud.openCreateModal}
  onEdit={crud.openEditModal}

  // opcionales
  pageSize={25}
  extraVariables={{ IdSede: 3 }}
  extraFilters={<MisFiltrosCustom />}
/>
```

| Prop | Tipo | Req. | Nota |
|---|---|---|---|
| `variables` | `VariablesModel` | ✅ | de acá salen todos los endpoints y títulos |
| `columns` | `CrudColumn<T>[]` | ✅ | **solo columnas de negocio** |
| `queryKey` | `string` | ✅ | clave de cache de TanStack Query |
| `onAdd` | `() => void` | ✅ | abrir modal es cosa del módulo |
| `onEdit` | `(record: T) => void` | ✅ | idem |
| `pageSize` | `number` | ❌ | default `SHARED_VAR.DEFAULT_PAGE_SIZE` |
| `extraVariables` | `object` | ❌ | se hace merge al body de cada request |
| `extraFilters` | `ReactNode` | ❌ | **reemplaza toda el área de filtros** (todo-o-nada) |

### 5.2 Columnas que el genérico inyecta solo

El módulo nunca las escribe:

1. **`N°`** — índice correlativo (o `Id`, según tu ejemplo).
2. **`ESTADO`** — badge derivado de `Activo`.
3. **`ACCIONES`** — ver §5.4.

`columns` (las del módulo) se insertan **entre** `N°` y `ESTADO`.

### 5.3 Filtros

Área default: `Input` (buscador) + `Select` (estado, alimentado por `SHARED_VAR.LIST_STATUS_ALL`).

Reglas de construcción del payload:

- `page` / `pageSize` → **siempre** viajan.
- `filters.search` → solo si tiene texto (trim ≠ "").
- `filters.status` → solo si es `"1"` o `"0"`. Si es `"-1"` (Todos), **se omite la key**.
- Filtros extra del módulo → mismo objeto `filters`, misma regla: si no tiene valor, no viaja.

El buscador va **debounced** a `SHARED_VAR.SEARCH_DEBOUNCE_MS`. Cualquier cambio de filtro **resetea `page` a 1**.

`extraFilters` es todo-o-nada: si lo pasas, el área default desaparece. Puedes reusar las keys `search`/`status` con tu propio input, o inventar keys nuevas — el genérico las manda tal cual, sin saber qué son.

Request final:

```json
{ "page": 1, "pageSize": 10, "filters": { "search": "juan", "status": "1" } }
```

### 5.4 Columna de acciones

Endpoint-driven: la celda ya sabe a qué pegarle porque `variables` trae los strings.

| Acción | Visible cuando | Llama a |
|---|---|---|
| ✏️ Editar | siempre | `onEdit(record)` → sube al módulo |
| 🔁 Toggle estado | `Eliminado === "0"` | `postService(ENDPOINT_TOGGLE_STATUS, { Id })` |
| 🗑️ Eliminar | `Eliminado === "0"` | `postService(ENDPOINT_DELETE, { Id })` |
| ♻️ Restaurar | `Eliminado === "1"` | `postService(ENDPOINT_RESTORE, { Id })` |

Toda acción destructiva (eliminar / restaurar / toggle) pasa por un `AlertDialog` de shadcn. Al confirmar: llama → `toast.success(message)` → `queryClient.invalidateQueries({ queryKey: [queryKey] })`.

Ninguna de estas cuatro se escribe nunca en un módulo.

### 5.5 `use-crud-table.ts` (interno)

```ts
export function useCrudTable<T>({ variables, queryKey, pageSize, extraVariables }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize ?? SHARED_VAR.DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: [queryKey, page, size, filters, extraVariables],
    queryFn: async () => {
      const res = await getService<PaginatedResponse<T>>(variables.ENDPOINT_GET_DATA, {
        page,
        pageSize: size,
        filters: cleanFilters(filters),   // aplica las reglas de §5.3
        ...extraVariables,
      });
      if (!res.ok) throw new Error(res.message);   // ver §4.1
      return res.data;
    },
    placeholderData: keepPreviousData,  // paginación sin parpadeo
  });

  return { query, page, setPage, size, setSize, filters, setFilters };
}
```

> `refresh()` de Angular **no existe acá**. Su equivalente es `invalidateQueries([queryKey])`, que el propio genérico dispara tras cada mutación.

---

## 6. `useCrudOperations` — el ciclo del modal

```ts
// shared/components-generic/crud/use-crud-operations.ts
export function useCrudOperations<T extends BaseModel>({
  variables,
  queryKey,
  getDisplayName,          // opcional: (r) => r.Denominacion
}: {
  variables: VariablesModel;
  queryKey: string;
  getDisplayName?: (record: T) => string;
}) {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => { setMode("create"); setSelectedRecord(null); setIsOpen(true); };
  const openEditModal   = (r: T) => { setMode("edit"); setSelectedRecord(r); setIsOpen(true); };
  const closeModal      = () => setIsOpen(false);

  async function saveRecord(data: unknown) {
    const endpoint = mode === "create" ? variables.ENDPOINT_SAVE : variables.ENDPOINT_UPDATE;
    setIsSaving(true);

    const res = await postService(endpoint, { ...data, Id: selectedRecord?.Id ?? 0 });
    setIsSaving(false);

    if (!res.ok) {
      // 422: el backend manda las keys exactas del form (§4.3)
      Object.entries(res.errors ?? {}).forEach(([campo, msg]) =>
        form.setError(campo as Path<TForm>, { message: msg }),
      );
      return toast.error(res.message);              // el modal queda abierto, con los datos
    }

    toast.success("Registro guardado correctamente");
    qc.invalidateQueries({ queryKey: [queryKey] });
    closeModal();
  }

  const titleModal = mode === "create"
    ? `Nueva ${variables.TITLE_MODAL}`
    : `Editar ${variables.TITLE_MODAL}${
        getDisplayName && selectedRecord ? `: ${getDisplayName(selectedRecord)}` : ""
      }`;

  const audit = buildAuditStrings(selectedRecord);

  return { isOpen, mode, selectedRecord, isSaving, titleModal, audit,
           openCreateModal, openEditModal, closeModal, saveRecord };
}
```

### Auditoría

Igual que tu `userRegister()` / `userModified()`: **dos strings ya armados**, no cuatro campos crudos.

```ts
function buildAuditStrings<T extends BaseModel>(record: T | null) {
  if (!record) return { userRegister: null, userModified: null };
  return {
    userRegister: record.UsuarioRegistro
      ? `${record.UsuarioRegistro} — ${record.FechaRegistro}` : null,
    userModified: record.UsuarioModifico
      ? `${record.UsuarioModifico} — ${record.FechaModifico}` : null,
  };
}
```

---

## 7. `ModalGeneric` — el shell

Equivalente a `app-modal-generic`. **No sabe nada del formulario**, solo lo envuelve.

```tsx
<ModalGeneric
  icon="FileText"                 // lucide-react
  open={crud.isOpen}
  onClose={crud.closeModal}
  titleModal={crud.titleModal}
  audit={crud.audit}
  labelButton={crud.mode === "create" ? "Registrar" : "Actualizar"}
  isSaving={crud.isSaving}
  size="lg"                       // sm | md | lg | xl
  onSubmit={form.handleSubmit(crud.saveRecord)}
>
  {children}   {/* ← el formulario del módulo, tal cual */}
</ModalGeneric>
```

Aporta: `Dialog` de shadcn, header con ícono + título, footer con Cancelar/Guardar (con spinner en `isSaving`), el bloque de auditoría, y el `<form>` que envuelve a `children`. El aviso de "(*) Campos obligatorios" también vive acá, no en el módulo.

---

## 8. `useLoadOptions` — combos (opcional)

```ts
export function useLoadOptions<T = Record<string, OptionItem[]>>(endpoint?: string) {
  return useQuery({
    queryKey: ["options", endpoint],
    queryFn: () => getService<T>(endpoint!),
    enabled: !!endpoint,     // sin endpoint → nunca corre
    staleTime: 5 * 60 * 1000 // los combos casi no cambian
  });
}
```

Uso solo donde haga falta:

```ts
const { data: combos } = useLoadOptions(VARIABLES.ENDPOINT_GET_COMBOS);
const resolutionTypes = combos?.tipoResolucion ?? [];
const reasons         = combos?.motivo ?? [];
```

Un módulo sin combos simplemente no llama al hook. Opcional de verdad.

---

## 9. Fechas — el reemplazo de `DateFormatDirective`

**Las fechas llegan del backend ya formateadas, listas para mostrar.** La tabla las pinta tal cual: sin `render`, sin pipe, sin nada. Los helpers existen **solo** para el input de fecha, porque el `<Calendar>` de shadcn habla en `Date` y todo el resto del sistema habla en `string`.

**En React no existen las directivas.** El equivalente de tu `DateFormatDirective` se parte en dos: funciones puras + un componente que las encapsula.

### 9.1 Helpers (`lib/date.ts`)

```ts
import { format, parse, isValid } from "date-fns";

const API_FORMAT = "dd/MM/yyyy";   // el mismo string que el backend manda y espera

/** Convierte el Date del calendario al string que espera el backend. */
export function toApiDate(date?: Date | null): string {
  return date && isValid(date) ? format(date, API_FORMAT) : "";
}

/** Convierte el string del backend a Date, para alimentar el calendario. */
export function fromApiDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, API_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}
```

Dos funciones. No hay `displayDate` ni `displayDateTime`: no hacen falta, el backend ya formateó. Lo mismo aplica a los strings de auditoría (§6) — se concatenan y listo.

### 9.2 `DatePickerField` — el único que usa los helpers

Vive en `components-generic` porque lo usa todo módulo con fechas. Encapsula `Popover + Calendar` y **convierte adentro**:

```tsx
/** Campo de fecha para react-hook-form. El valor del form es siempre string en formato API. */
export function DatePickerField<T extends FieldValues>({
  control, name, label, required, placeholder = "dd/mm/aaaa",
}: DatePickerFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>
            {label} {required && <span className="text-destructive">*</span>}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button variant="outline" className="justify-start font-normal">
                  <CalendarIcon className="mr-2 size-4" />
                  {field.value || placeholder}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                locale={es}
                selected={fromApiDate(field.value)}            // string → Date
                onSelect={(d) => field.onChange(toApiDate(d))} // Date → string
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### 9.3 Consecuencias

Como el string formateado es la única representación que circula:

- **Columnas de tabla:** cero tratamiento. `{ title: "FECHA REG.", dataIndex: "FechaRegistro", ... }` y ya.
- **Schema Zod:** `FechaResolucion: z.string().min(1, "...")`. Sin `z.date()`, sin `z.coerce.date()`.
- **`toFormValues(record)`:** un spread pelado. Ningún módulo mapea fechas.
- **`saveRecord`:** manda el payload tal cual. No toca nada.

Uso en el módulo — una línea:

```tsx
<DatePickerField control={form.control} name="FechaResolucion" label="Fecha resolución" required />
```

> ⚠️ **El costo:** un string formateado **no se puede ordenar ni comparar**. `"13/07/2026" < "02/08/2026"` es `false` alfabéticamente. Hoy no importa (el orden lo decide el backend, §11.10), pero si algún día se necesita ordenar por fecha, va sí o sí en el servidor.

---

## 10. El módulo, de punta a punta (ejemplo: `resolutions`)

### 10.1 `resolutions.variables.ts`

```ts
export const VARIABLES: VariablesModel = {
  TITLE: "Lista de resoluciones",
  TITLE_MODAL: "resolución",
  TITLE_ROUTE: "Resoluciones",
  ROUTE: "/documentos/resoluciones",
  ENDPOINT_GET_DATA: "/documentos/resolucion",
  ENDPOINT_SAVE: "/documentos/resolucion_save",
  ENDPOINT_UPDATE: "/documentos/resolucion_save",
  ENDPOINT_DELETE: "/documentos/resolucion_delete",
  ENDPOINT_RESTORE: "/documentos/resolucion_restore",
  ENDPOINT_TOGGLE_STATUS: "/documentos/resolucion_active",
  ENDPOINT_GET_COMBOS: "/documentos/resolucion_combo",
};
```

### 10.2 `resolutions.columns.ts`

```ts
export const COLUMNS_DATA_TABLE: CrudColumn<ResolutionsModel>[] = [
  { title: "DENOMINACIÓN",     dataIndex: "Denominacion",    key: "Denominacion",    width: 250 },
  { title: "TIPO RESOLUCIÓN",  dataIndex: "TipoResolucion",  key: "TipoResolucion",  width: 280 },
  { title: "FECHA RESOLUCIÓN", dataIndex: "FechaResolucion", key: "FechaResolucion", width: 140, align: "center" },
  { title: "FECHA REG.",       dataIndex: "FechaRegistro",   key: "FechaRegistro",   width: 120, align: "center" },
];
```

`N°`, `ESTADO` y `ACCIONES` ya no se declaran: las pone el genérico.

### 10.3 `resolutions.model.ts` — tipo + Zod + defaults

Zod reemplaza a los `Validators` de Angular, uno a uno.

```ts
export interface ResolutionsModel extends BaseModel {
  Denominacion: string;
  TipoResolucion: string;      // label que devuelve el listado
  FechaResolucion: string;
  Asunto: string;
  Observacion: string;
  IdTipoResolucion: number | null;
  IdMotivo: number | null;
}

export const resolutionsSchema = z.object({
  Denominacion:     z.string().min(1, "Denominación es requerida").max(200),
  FechaResolucion:  z.string().min(1, "Fecha resolución es requerida"),
  Asunto:           z.string().min(1, "Asunto es requerido").max(300),
  Observacion:      z.string().max(500, "Observación no debe exceder 500 caracteres"),
  IdTipoResolucion: z.coerce.number({ message: "Tipo resolución es requerido" }),
  IdMotivo:         z.coerce.number({ message: "Motivo es requerido" }),
  Activo:           z.enum(["1", "0"]),
});

export type ResolutionsForm = z.infer<typeof resolutionsSchema>;

export const DEFAULT_VALUES: ResolutionsForm = {
  Denominacion: "", FechaResolucion: "", Asunto: "", Observacion: "",
  IdTipoResolucion: null as any, IdMotivo: null as any, Activo: "1",
};
```

`Id` **no va en el schema**: lo inyecta `saveRecord` desde `selectedRecord`.

### 10.4 `resolutions.component.tsx` — el orquestador

```tsx
"use client";

export function ResolutionsComponent() {
  const crud = useCrudOperations<ResolutionsModel>({
    variables: VARIABLES,
    queryKey: "resolutions",
    getDisplayName: (r) => r.Denominacion,
  });

  const form = useForm<ResolutionsForm>({
    resolver: zodResolver(resolutionsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { data: combos } = useLoadOptions(VARIABLES.ENDPOINT_GET_COMBOS);

  // Sincroniza el form con el modo del modal (≈ patchValue de Angular)
  useEffect(() => {
    if (!crud.isOpen) return;
    form.reset(crud.mode === "edit" && crud.selectedRecord
      ? toFormValues(crud.selectedRecord)
      : DEFAULT_VALUES);
  }, [crud.isOpen, crud.mode, crud.selectedRecord]);

  return (
    <>
      <CrudTable<ResolutionsModel>
        variables={VARIABLES}
        columns={COLUMNS_DATA_TABLE}
        queryKey="resolutions"
        onAdd={crud.openCreateModal}
        onEdit={crud.openEditModal}
      />

      <ModalGeneric
        icon="FileText"
        open={crud.isOpen}
        onClose={crud.closeModal}
        titleModal={crud.titleModal}
        audit={crud.audit}
        isSaving={crud.isSaving}
        size="lg"
        labelButton={crud.mode === "create" ? "Registrar" : "Actualizar"}
        onSubmit={form.handleSubmit(crud.saveRecord)}
      >
        <ResolutionsForm
          form={form}
          resolutionTypes={combos?.tipoResolucion ?? []}
          reasons={combos?.motivo ?? []}
        />
      </ModalGeneric>
    </>
  );
}
```

### 10.5 `resolutions.form.tsx` — 100% del módulo, campo por campo

Sin AutoForm, sin generación mágica. Es la traducción directa de tu `<fieldset>` de Angular usando los componentes `Form*` de shadcn:

```tsx
export function ResolutionsForm({ form, resolutionTypes, reasons }: Props) {
  return (
    <Form {...form}>
      <fieldset className="rounded-lg border-2 px-3 pb-3">
        <legend className="px-2 text-sm font-semibold text-primary">
          <Info className="mr-2 inline size-4" />
          Información de la resolución
        </legend>

        <div className="grid grid-cols-12 gap-3">
          <FormField
            control={form.control}
            name="Denominacion"
            render={({ field }) => (
              <FormItem className="col-span-12 md:col-span-8">
                <FormLabel>
                  Resolución (001-2026-XXXX) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input maxLength={200} placeholder="Ingresa la denominación" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* FechaResolucion, IdTipoResolucion, IdMotivo, Asunto, Observacion… */}
        </div>
      </fieldset>
    </Form>
  );
}
```

**Equivalencias de widgets:**

| Angular | shadcn/React |
|---|---|
| `<ng-select>` | `<Select>` de shadcn, o `<Combobox>` (Popover + Command) si necesitas búsqueda |
| `mwlFlatpickr` | `<Calendar>` + `<Popover>` (o `react-day-picker` directo) |
| `<i class="ri-...">` | `lucide-react` |
| `[ngClass]="{'is-invalid': ...}"` | `<FormMessage />` lo resuelve solo |

---

## 11. Decisiones y puntos abiertos

### ✅ Cerrado
1. **`Activo` vs. `Eliminado`.** Dos campos distintos. `Activo` = estado de negocio (toggle), `Eliminado` = borrado lógico. Los tres endpoints separados son correctos.
2. **Contrato de respuesta del API.** Definido en §4.3. El backend lo escribes tú; el mock de §14 es la implementación de referencia.
3. **Fechas.** Llegan formateadas del backend. Solo `DatePickerField` convierte, vía `toApiDate`/`fromApiDate` (§9).
4. **Ordenamiento por columna.** Descartado. El backend manda el orden. Ver §11.10 para por qué **no** se hace en el front.
5. **Errores de validación por campo.** El `422` de §4.3 trae `errors: { Campo: "mensaje" }` con las keys exactas del form. `saveRecord` los mapea con `form.setError`. Requiere que el módulo le pase el `form` al hook — decisión tomada, se implementa.
6. **401 → login.** `global-service.call()` detecta `status === 401` y hace `redirect("/login")`. Server-side, ahí sí funciona.

### ⏸ Diferido a propósito
7. **Permisos por rol.** La columna de acciones muestra siempre las 4. Cuando haga falta, se agrega `permissions?: { canEdit, canDelete, canToggle }` como prop de `CrudTable`. Hueco previsto, no implementado.

### 📌 Notas de diseño (no son pendientes, son recordatorios)
8. **`GET_DATA` va por POST.** El endpoint no queda cacheable por HTTP. Decisión consciente.
9. **Estados de la tabla.** `CrudTable` renderiza tres estados que ningún módulo escribe: cargando (skeleton de N filas), sin resultados (empty state) y error (mensaje + botón "Reintentar").
10. **Por qué NO se ordena en el front.** ⚠️ Con paginación de servidor, ordenar en el cliente ordena solo **los N registros que el backend ya eligió** — no los N primeros de la tabla ordenada. Con 200 clientes, ordenar la página 1 por nombre da "los 10 que mandó el backend, alfabetizados entre sí". El bug aparece recién cuando alguien pasa a la página 2 y ve un nombre que debió salir en la 1. Ordenar en cliente **solo es correcto sobre el dataset completo, sin paginar**. Si algún día se necesita orden real: `sort: { field, dir }` al payload de §5.3 y `sortable?: boolean` a `CrudColumn`. La key `sort` queda **reservada** en el contrato.
11. **Numeración de la columna `N°` con paginación.** No reinicia en cada página: `(page - 1) * pageSize + index + 1`. Trivial, pero se olvida siempre.

---

## 12. Fuera de alcance (decidido)

- ❌ Exportación a Excel / PDF (`COLUMNS_DATA_EXCEL` / `COLUMNS_DATA_PDF`)
- ❌ Factory de actions por módulo
- ❌ AutoForm / generación de formularios desde el schema
- ❌ Permisos por rol (ver §11.9 — hueco previsto, no implementado)
- ❌ Ordenamiento por columna (ver §11.10 — el backend manda el orden)

---

## 13. Convenciones de código

### JSDoc

Una línea, imperativa, en **lo exportado**: componentes, hooks y actions. Nada más.

```ts
/** Abre el modal en modo edición y carga el registro seleccionado. */
function openEditModal(record: T) { ... }

/** Tabla CRUD genérica: fetch, paginación, filtros y acciones por endpoint. */
export function CrudTable<T extends BaseModel>(props: CrudTableProps<T>) { ... }

/** Carga las opciones de combo de un endpoint. No corre si el endpoint es undefined. */
export function useLoadOptions<T>(endpoint?: string) { ... }
```

**No** se documenta:
- `@param` / `@returns` — los tipos ya lo dicen.
- Helpers internos, salvo que hagan algo no obvio.
- Nada que repita el nombre de la función (`/** Guarda el registro. */ function saveRecord()` es ruido).

Si una función necesita más de una línea para explicarse, **la función está mal hecha** — se parte, no se documenta más.

Excepción: comentarios `//` puntuales donde el *porqué* no es evidente (ej. `// ver §4.1: ApiError no cruza la frontera server`).

### Naming

| Cosa | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case, sufijo por rol | `crud-table.tsx`, `clientes.variables.ts` |
| Campos del modelo | **PascalCase español** (lo que manda el backend) | `Denominacion`, `FechaRegistro` |
| Todo lo demás (funciones, hooks, props) | camelCase inglés | `openEditModal`, `isSaving` |
| Constantes | SCREAMING_SNAKE | `VARIABLES`, `SHARED_VAR`, `COLUMNS_DATA_TABLE` |

---

## 14. Entregable de validación: CRUD de Clientes (con mock)

Último paso del spec. Sirve para probar que el genérico funciona **sin backend**, y de paso valida el patrón de adapters.

### 14.1 El mock es un adapter, no un `if` disperso

Este es el pago del diseño que ya tienes: `create-mock-client.ts` implementa **la misma interface `HttpClient`** que `create-fetch-client.ts`. Se enchufa en `client.ts` y **nada más en el proyecto se entera**. Ni el genérico, ni `global-service`, ni el módulo.

```ts
// shared/api/client.ts
import { createFetchClient } from "./adapters/create-fetch-client";
import { createMockClient } from "./adapters/create-mock-client";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const api = useMock
  ? createMockClient()
  : createFetchClient(process.env.API_BASE_URL!);
```

Cero cambios en el código de negocio para pasar de mock a backend real: se toca una variable de entorno.

```ts
// shared/api/adapters/create-mock-client.ts

/** Cliente HTTP en memoria. Mismo contrato que el de fetch, sin red. */
export function createMockClient(): HttpClient {
  let db: ClientesModel[] = [...SEED_CLIENTES];   // ~35 registros para ver paginación real

  async function post<T>(path: string, body: any): Promise<T> {
    await delay(400);                              // latencia simulada
    switch (path) {
      case "/clientes/list":    return paginate(db, body) as T;
      case "/clientes/save":    return upsert(db, body) as T;
      case "/clientes/delete":  return setFlag(db, body.Id, "Eliminado", "1") as T;
      case "/clientes/restore": return setFlag(db, body.Id, "Eliminado", "0") as T;
      case "/clientes/active":  return toggle(db, body.Id) as T;
      case "/clientes/combos":  return { tipoDocumento: TIPOS_DOCUMENTO } as T;
      default: throw new ApiError(404, null, `Mock sin ruta: ${path}`);
    }
  }

  return { get: post as any, post, put: post as any, patch: post as any, delete: post as any };
}
```

`paginate()` debe implementar **las reglas reales de §5.3**: filtrar por `search`, filtrar por `status` solo si viene la key, cortar por `page`/`pageSize`, y devolver `{ items, total, page, totalPages }`. Si el mock no respeta esas reglas, no está probando nada.

**Bonus:** hacer que `/clientes/save` devuelva `ApiError(422)` cuando la denominación ya existe. Así se prueba el punto §11.8 sin backend.

### 14.2 El módulo debe ejercitar los 4 widgets

| Campo | Widget | Prueba que… |
|---|---|---|
| `Denominacion` | `<Input>` | validación `min(1).max(150)`, error inline |
| `Observacion` | `<Textarea>` | validación `max(500)`, campo opcional |
| `IdTipoDocumento` | `<Select>` | **`useLoadOptions`** alimenta el combo desde `ENDPOINT_GET_COMBOS` |
| `Activo` | `<Switch>` | toggle `"1"` / `"0"`, y que el mismo valor se refleje en la columna ESTADO |

```ts
// modules/clientes/clientes.model.ts
export const clientesSchema = z.object({
  Denominacion:    z.string().min(1, "Denominación es requerida").max(150),
  Observacion:     z.string().max(500, "No debe exceder 500 caracteres"),
  IdTipoDocumento: z.coerce.number({ message: "Tipo de documento es requerido" }),
  Activo:          z.enum(["1", "0"]),
});
```

### 14.3 Criterios de aceptación

El genérico funciona si, **sin tocar un solo archivo de `shared/` ni de `actions/`**:

- [ ] La tabla lista, pagina y muestra el `N°` correlativo correcto en la página 2.
- [ ] El buscador filtra (debounced) y resetea a página 1.
- [ ] El combo de estado filtra; en "TODOS" la key `status` **no viaja** en el payload.
- [ ] "Nuevo" abre el modal vacío; "Editar" lo abre con los datos cargados y el título `Editar cliente: <Denominación>`.
- [ ] Guardar cierra el modal, muestra toast y **refresca la tabla sola** (sin prop `refresh`).
- [ ] Eliminar pide confirmación, y el registro pasa a mostrar `Restaurar`.
- [ ] Toggle cambia el badge de estado.
- [ ] El bloque de auditoría muestra los dos strings al editar, y nada al crear.
- [ ] `modules/clientes/` tiene exactamente 5 archivos y **cero código de fetch**.

Si algo de esto obliga a tocar `shared/`, el genérico está mal abstraído.

---

## 15. Checklist: crear un módulo nuevo

1. `xxx.variables.ts` → pegar endpoints y títulos.
2. `xxx.model.ts` → interface + schema Zod + `DEFAULT_VALUES`.
3. `xxx.columns.ts` → solo las columnas de negocio.
4. `xxx.form.tsx` → los campos, a mano.
5. `xxx.component.tsx` → copiar el orquestador de §10.4 y cambiar 4 nombres.
6. `app/dashboard/xxx/page.tsx` → 3 líneas.

Cero código de fetch. Cero código de paginación. Cero código de acciones.