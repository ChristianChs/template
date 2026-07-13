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
