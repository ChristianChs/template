import { ApiError } from "./api-error";
import type { ApiResponse } from "@/lib/types/api.model";

const FALLBACK_MESSAGES: Record<number, string> = {
  0: "No se pudo conectar con el servidor",
  400: "La solicitud no es válida",
  401: "Usuario o contraseña incorrectos",
  403: "No tienes permiso para realizar esta acción",
  404: "El recurso no existe",
  422: "Los datos enviados no son válidos",
  500: "Ocurrió un error inesperado",
};

/** Extrae message/errors del body del ApiError, con fallback por status. */
export function parseError(e: ApiError): { message: string; errors?: Record<string, string> } {
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
