"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { login } from "@/actions/auth-service";
import { loginSchema, DEFAULT_VALUES, type LoginFormValues } from "./login.model";
import { LoginForm } from "./login.form";

/** Orquestador del login: form + llamada al server action. */
export function LoginComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: DEFAULT_VALUES,
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    const res = await login(data);
    setIsSubmitting(false);

    // En éxito, login() ya hace redirect() del lado servidor.
    if (!res.ok) {
      Object.entries(res.errors ?? {}).forEach(([campo, msg]) =>
        form.setError(campo as keyof LoginFormValues, { message: msg })
      );
      toast.error(res.message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <LoginForm form={form} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Iniciar sesión
      </Button>
    </form>
  );
}
