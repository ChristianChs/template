import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/types/auth.model";

/** Lee la cookie de sesión (httpOnly) desde un Server Component. */
export async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get("session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
