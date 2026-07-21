"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/api-error";
import { parseError } from "@/shared/api/parse-api-error";
import type { ApiResponse } from "@/lib/types/api.model";
import type { LoginPayload, LoginResponse } from "@/lib/types/auth.model";
import type { ActionResult } from "./global-service";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

async function setSessionCookies(token: string, user: LoginResponse["user"]) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
  cookieStore.set("token", token, options);
  cookieStore.set("session", JSON.stringify(user), options);
}

/** Autentica al usuario y setea las cookies de sesión. Redirige a /dashboard en éxito. */
export async function login(credentials: LoginPayload): Promise<ActionResult<void>> {
  try {
    const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", credentials);
    await setSessionCookies(res.data.token, res.data.user);
  } catch (e) {
    if (e instanceof ApiError) {
      return { ok: false, status: e.status, ...parseError(e) };
    }
    return { ok: false, status: 0, message: "Error inesperado" };
  }

  redirect("/dashboard");
}

/** Cierra la sesión y redirige a /login. */
export async function logout(): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("session");
  redirect("/login");
}
