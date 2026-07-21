import { z } from "zod";

export const loginSchema = z.object({
  usuario: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const DEFAULT_VALUES: LoginFormValues = {
  usuario: "",
  password: "",
};
