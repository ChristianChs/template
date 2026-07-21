import type { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { LoginComponent } from "@/modules/auth/login.component";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface-1 p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Heading className="text-xl">Iniciar sesión</Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa tus credenciales para continuar
          </p>
        </div>
        <LoginComponent />
      </div>
    </main>
  );
}
