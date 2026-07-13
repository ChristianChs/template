import type { HttpClient, RequestConfig } from "../http-client";
import { ApiError } from "../api-error";

export function createFetchClient(baseUrl: string, defaultConfig?: RequestConfig): HttpClient {
  async function request<T>(
    path: string,
    options: RequestInit,
    config?: RequestConfig
  ): Promise<T> {
    const params = { ...defaultConfig?.params, ...config?.params };
    const entries = Object.entries(params).filter(
      ([, value]) => value !== undefined
    );
    const qs = entries.length
      ? `?${new URLSearchParams(
          entries.map(([key, value]) => [key, String(value)])
        )}`
      : "";

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}${qs}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...defaultConfig?.headers,
          ...config?.headers,
          ...options.headers,
        },
      });
    } catch (e) {
      throw new ApiError(0, null, e instanceof Error ? e.message : "Network error");
    }

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
