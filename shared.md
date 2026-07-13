# Arquitectura Base para Proyecto Next.js (Frontend + Backend Independiente)

## Objetivo

Construir una arquitectura **escalable, desacoplada y fácil de mantener**, evitando código repetido sin caer en un CRUD completamente genérico.

La prioridad es:

- Reducir duplicación de código.
- Facilitar cambios globales de diseño o comportamiento.
- Poder cambiar tecnologías (Axios, Fetch, backend, etc.) sin afectar la aplicación.
- Mantener flexibilidad para que cada módulo tenga su propia lógica de negocio.

---

# Principios

## Desacoplar antes que generalizar

No construir un "CRUD mágico" que haga todo.

En su lugar:

- Reutilizar infraestructura.
- Mantener independiente la lógica de negocio.
- Componer funcionalidades mediante componentes pequeños.

---

## Arquitectura propuesta

```text
src/
│
├── core/
│   ├── http/
│   ├── crud/
│   ├── hooks/
│   └── ui/
│
├── modules/
│   ├── users/
│   ├── products/
│   └── clients/
│
└── shared/
```

### core

Contiene todo lo reutilizable para cualquier módulo.

Ejemplos:

- Cliente HTTP
- Tabla reutilizable
- Modales
- Confirmaciones
- Hooks comunes
- Componentes para React Hook Form
- Utilidades

---

### modules

Cada módulo contiene únicamente lo específico de la entidad.

Ejemplo:

```text
modules/
└── users/
    ├── repository.ts
    ├── UserForm.tsx
    ├── columns.ts
    ├── schema.ts
    └── page.tsx
```

---

# Cliente HTTP desacoplado

La aplicación nunca debe depender directamente de Axios o Fetch.

En lugar de:

```
Página
    ↓
Axios
```

Utilizar:

```
Página
    ↓
Repository
    ↓
HttpClient
    ↓
Axios (hoy)
Fetch (mañana)
```

## Contrato

```ts
interface HttpClient {
    get<T>()
    post<T>()
    put<T>()
    delete<T>()
}
```

## Implementaciones

- AxiosClient
- FetchClient

Solo cambia la implementación.

La aplicación nunca se modifica.

Este enfoque sigue el principio **Dependency Inversion Principle (DIP)**.

---

# Repository Pattern

Los componentes nunca deben conocer la forma de acceder a los datos.

En lugar de:

```ts
axios.get("/users")
```

Utilizar:

```ts
userRepository.getAll()
```

Así el día que cambie el backend únicamente se modifica el repositorio.

---

# Formularios

## NO crear un formulario completamente genérico

Los formularios suelen terminar teniendo lógica muy diferente:

- Upload de archivos
- Selects dependientes
- Tabs
- Componentes personalizados
- Arrays dinámicos
- Reglas de negocio

Intentar hacer un FormBuilder universal suele terminar complicando el código.

Cada entidad tendrá su propio formulario.

Ejemplo:

```
UserForm.tsx

ProductForm.tsx

ClientForm.tsx
```

---

# React Hook Form

Aunque los formularios sean independientes, sí reutilizar componentes.

Por ejemplo:

```
RHFInput

RHFSelect

RHFTextarea

RHFCheckbox

RHFDatePicker
```

Estos encapsulan toda la integración entre React Hook Form y shadcn/ui.

Así se evita repetir continuamente:

- FormField
- FormItem
- FormControl
- FormLabel
- FormMessage

---

# Qué reutilizar

Centralizar únicamente aquello que realmente es común.

## Sí reutilizar

- Cliente HTTP
- Tabla
- Toolbar
- Modal
- Confirmación de eliminación
- Paginación
- Buscador
- Manejo de errores
- Toasts
- Hooks
- Componentes RHF
- Layouts
- Utilidades

---

## No reutilizar

- Formularios
- Validaciones del dominio
- Reglas de negocio
- Procesos específicos
- Casos especiales

---

# Arquitectura por composición

Evitar un componente gigante.

En lugar de:

```
CrudGenerator
```

Construir mediante piezas:

```
UserPage

↓

CrudTable

↓

Toolbar

↓

DeleteDialog

↓

UserForm
```

Cada componente tiene una única responsabilidad.

---

# Contratos

Toda la infraestructura debe trabajar mediante interfaces.

Ejemplos:

```ts
HttpClient

CrudRepository<T>

UserRepository
```

Esto permite cambiar implementaciones sin afectar el resto del sistema.

---

# Stack tecnológico

- Next.js
- TypeScript
- shadcn/ui
- React Hook Form
- Backend independiente
- Axios (inicialmente)
- Posibilidad de migrar a Fetch
- Zod o Valibot (por definir)

---

# Filosofía de desarrollo

No abstraer por similitud.

Abstraer por estabilidad.

Si algo cambia constantemente (formularios, reglas de negocio), no debe hacerse genérico.

Si algo cambia muy poco y se reutiliza en toda la aplicación (cliente HTTP, tablas, modales, hooks), sí debe centralizarse.

---

# Objetivo final

Construir una infraestructura reutilizable que permita que cada nuevo módulo solo implemente:

- Su repositorio.
- Sus columnas.
- Su formulario.
- Su esquema de validación.
- Su página.

Todo lo demás debe venir proporcionado por la infraestructura común.

De esta forma:

- Cambiar Axios por Fetch implica modificar un único lugar.
- Cambiar el diseño de las tablas afecta automáticamente a todos los módulos.
- Cambiar el estilo de los formularios reutilizables se realiza una sola vez.
- La lógica de negocio permanece desacoplada de la infraestructura.
- El proyecto puede crecer sin convertirse en un CRUD genérico difícil de mantener.