"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { logout } from "@/actions/auth-service"

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={isPending}
      onSelect={(e) => {
        e.preventDefault()
        startTransition(() => {
          logout()
        })
      }}
    >
      <LogOut className="size-4" />
      Cerrar sesión
    </DropdownMenuItem>
  )
}
