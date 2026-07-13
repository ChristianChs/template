import type { Metadata } from "next";
import { fontBody } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Panel de administración",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className={`${fontBody.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
