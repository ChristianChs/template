"use client";

import { icons } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AuditInfo, type AuditStrings } from "./audit-info";

const SIZE_CLASS = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

interface ModalGenericProps {
  icon?: keyof typeof icons;
  open: boolean;
  onClose: () => void;
  titleModal: string;
  audit: AuditStrings;
  labelButton: string;
  isSaving: boolean;
  size?: keyof typeof SIZE_CLASS;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

/** Shell de modal CRUD: header con ícono, form, auditoría y footer Cancelar/Guardar. */
export function ModalGeneric({
  icon,
  open,
  onClose,
  titleModal,
  audit,
  labelButton,
  isSaving,
  size = "md",
  onSubmit,
  children,
}: ModalGenericProps) {
  const Icon = icon ? icons[icon] : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto", SIZE_CLASS[size])}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon && <Icon className="size-5 text-primary" />}
            {titleModal}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {children}

          <AuditInfo audit={audit} />

          <DialogFooter className="items-center gap-2 sm:justify-between">
            <p className="text-xs text-muted-foreground">(*) Campos obligatorios</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-1 size-4 animate-spin" />}
                {labelButton}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
