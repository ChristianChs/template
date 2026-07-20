"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/api-error";
import type { RequestConfig } from "@/shared/api/http-client";
import type { ApiResponse } from "@/lib/types/api.model";

export type ActionResult<T> =
  | { ok: true; data: T; message: string }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

const FALLBACK_MESSAGES: Record<number, string> = {
  0: "No se pudo conectar con el servidor",
  400: "La solicitud no es válida",
  403: "No tienes permiso para realizar esta acción",
  404: "El recurso no existe",
  422: "Los datos enviados no son válidos",
  500: "Ocurrió un error inesperado",
};

async function withAuth(): Promise<RequestConfig> {
  const token = (await cookies()).get("token")?.value;
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
}

/** Extrae message/errors del body del ApiError, con fallback por status. */
function parseError(e: ApiError): { message: string; errors?: Record<string, string> } {
  let body: unknown = e.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (body && typeof body === "object" && "message" in body) {
    const { message, errors } = body as Partial<ApiResponse<unknown>>;
    if (typeof message === "string" && message) return { message, errors };
  }
  return { message: FALLBACK_MESSAGES[e.status] ?? FALLBACK_MESSAGES[500] };
}

// Ver §4.1 del spec: ApiError no sobrevive la frontera server → cliente.
// El try/catch vive acá y al cliente le llega un objeto plano serializable.
async function call<T>(endpoint: string, payload: unknown): Promise<ActionResult<T>> {
  try {
    const res = await api.post<ApiResponse<T>>(endpoint, payload ?? {}, await withAuth());
    return { ok: true, data: res.data, message: res.message };
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) redirect("/login");
      return { ok: false, status: e.status, ...parseError(e) };
    }
    return { ok: false, status: 0, message: "Error inesperado" };
  }
}

/** Lee datos de un endpoint (hoy también por POST con body). */
export async function getService<T>(endpoint: string, params?: unknown) {
  return call<T>(endpoint, params);
}

/** Envía datos a un endpoint. */
export async function postService<T = unknown>(endpoint: string, data: unknown) {
  return call<T>(endpoint, data);
}
