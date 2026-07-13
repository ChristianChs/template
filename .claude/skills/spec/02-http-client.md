# Spec: HTTP Client


## Objetivo

Definir un punto único de acceso HTTP para todo el frontend, desacoplado de la
librería concreta que lo implementa (`fetch`, `axios`, o cualquier otra).
Ningún módulo de negocio debe importar `fetch` o `axios` directamente: todos
dependen del contrato `HttpClient`.

Esto es una aplicación de Dependency Inversion: el código de alto nivel
(resources, hooks, actions) depende de una abstracción, no de una
implementación concreta. Cambiar de librería debe implicar tocar **un solo
archivo**.

No se usan clases para esto. El contrato es un `type`/`interface` de
TypeScript, y cada implementación es una función factory que retorna un
objeto que lo cumple (cierre sobre configuración, en vez de `this`). Esto es
consistente con el estilo funcional del resto del proyecto.

## Contrato

```ts
// shared/api/http-client.ts

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface HttpClient {
  get<T>(path: string, config?: RequestConfig): Promise<T>;
  post<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>;
  put<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(path: string, config?: RequestConfig): Promise<T>;
}
```

Reglas del contrato:

- Todos los métodos retornan directamente el dato deserializado (`T`), no la
  respuesta cruda (`Response` de fetch o `AxiosResponse` de axios). Esa
  diferencia entre librerías se resuelve dentro del adapter, nunca fuera.
- `params` solo acepta tipos primitivos serializables a querystring. Objetos
  anidados o arrays no están cubiertos por este contrato base; si un endpoint
  los necesita, se resuelve en el `resource` del módulo (ver
  `03-crud-resource-pattern.md`), no en el cliente genérico.
- Los errores HTTP (status fuera de 2xx) siempre se lanzan como excepción,
  nunca se retornan como parte del valor de éxito. Ver sección de Errores.

## Manejo de errores

Todo adapter normaliza sus errores a un mismo tipo, para que el resto de la
app no necesite saber si el error vino de fetch o de axios.

```ts
// shared/api/api-error.ts

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string
  ) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}
```

- Cualquier respuesta con status fuera de 2xx lanza `ApiError`.
- Errores de red (sin respuesta del servidor) lanzan `ApiError` con
  `status = 0` o un tipo separado `NetworkError`, a definir en la
  implementación, pero siempre como excepción, nunca como valor de retorno
  silencioso.
- Quien consume el cliente (actions, hooks) decide qué hacer con el error;
  este spec no define esa capa. Ver `03-crud-resource-pattern.md` y
  `04-forms-convention.md`.

## Implementación: adapter con fetch

```ts
// shared/api/adapters/fetch.adapter.ts

export function createFetchClient(baseUrl: string, defaultConfig?: RequestConfig): HttpClient {
  async function request<T>(
    path: string,
    options: RequestInit,
    config?: RequestConfig
  ): Promise<T> {
    const params = { ...defaultConfig?.params, ...config?.params };
    const qs = Object.keys(params).length
      ? `?${new URLSearchParams(params as Record<string, string>)}`
      : "";

    const res = await fetch(`${baseUrl}${path}${qs}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...defaultConfig?.headers,
        ...config?.headers,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => null);
      throw new ApiError(res.status, body);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  return {
    get: (path, config) => request(path, { method: "GET" }, config),
    post: (path, body, config) =>
      request(path, { method: "POST", body: JSON.stringify(body) }, config),
    patch: (path, body, config) =>
      request(path, { method: "PATCH", body: JSON.stringify(body) }, config),
    put: (path, body, config) =>
      request(path, { method: "PUT", body: JSON.stringify(body) }, config),
    delete: (path, config) => request(path, { method: "DELETE" }, config),
  };
}
```

## Implementación: adapter con axios (referencia, no activo)

Por ahora el proyecto usa `fetch` como implementación activa. El adapter de
axios se mantiene como referencia, listo para activarse el día que se decida
migrar, pero **no se instala la dependencia hasta ese momento**.

Como `tsconfig` típicamente incluye todo `src/**` en el type-check, un
`import axios from "axios"` activo rompe el build aunque el archivo no se
use en ningún lado, por no tener la librería instalada. La solución es dejar
todo el contenido del archivo dentro de un bloque de comentario `/* ... */`,
no comentado línea por línea (eso se vuelve ilegible y es fácil dejarlo a
medias). El archivo existe, documenta la implementación completa, pero no
participa del build hasta que se descomente.

Pasos para activarlo en el futuro:

1. `npm install axios`
2. Descomentar el bloque completo del archivo.
3. Cambiar el import en `shared/api/client.ts` de `createFetchClient` a
   `createAxiosClient`.

```ts
// shared/api/adapters/axios.adapter.ts
//
// Adapter de referencia. No activo mientras el proyecto use fetch.
// Para activarlo: `npm install axios`, descomentar todo este bloque,
// y actualizar shared/api/client.ts para usar createAxiosClient.

/*
import axios, { AxiosResponse } from "axios";
import type { HttpClient, RequestConfig } from "../http-client";
import { ApiError } from "../api-error";

export function createAxiosClient(baseUrl: string, defaultConfig?: RequestConfig): HttpClient {
  const instance = axios.create({
    baseURL: baseUrl,
    headers: defaultConfig?.headers,
  });

  async function handle<T>(promise: Promise<AxiosResponse<T>>): Promise<T> {
    try {
      const res = await promise;
      return res.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        throw new ApiError(e.response?.status ?? 0, e.response?.data);
      }
      throw e;
    }
  }

  return {
    get: (path, config) =>
      handle(instance.get(path, { headers: config?.headers, params: config?.params })),
    post: (path, body, config) =>
      handle(instance.post(path, body, { headers: config?.headers })),
    patch: (path, body, config) =>
      handle(instance.patch(path, body, { headers: config?.headers })),
    put: (path, body, config) =>
      handle(instance.put(path, body, { headers: config?.headers })),
    delete: (path, config) =>
      handle(instance.delete(path, { headers: config?.headers })),
  };
}
*/
```

## Punto único de decisión

```ts
// shared/api/client.ts
import { createFetchClient } from "./adapters/fetch.adapter";
// import { createAxiosClient } from "./adapters/axios.adapter";

export const api: HttpClient = createFetchClient(process.env.NEXT_PUBLIC_API_URL!);
```

Este es el único archivo del proyecto que sabe qué librería HTTP se está
usando. Todo lo demás importa `api` desde aquí, tipado como `HttpClient`.

## Criterio de aceptación

- Ningún archivo fuera de `shared/api/adapters/` importa `fetch` o `axios`
  directamente.
- Cambiar de adapter (fetch → axios o viceversa) no requiere modificar
  ningún `resource` de ningún módulo.
- Los errores que llegan a un `resource` o a un hook siempre son instancias
  de `ApiError`, sin importar el adapter activo.
- El contrato `HttpClient` puede mockearse por completo en tests sin
  necesidad de mockear `fetch` o `axios` a nivel de red.
- `shared/api/adapters/axios.adapter.ts` existe como referencia comentada y
  `npm run build` / `tsc --noEmit` pasan sin necesidad de tener `axios`
  instalado.
