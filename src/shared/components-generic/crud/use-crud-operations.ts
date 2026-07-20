"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { postService } from "@/actions/global-service";
import type { BaseModel, VariablesModel } from "@/lib/types/base.model";
import type { AuditStrings } from "@/shared/components-generic/modal/audit-info";

interface UseCrudOperationsParams<T extends BaseModel, TForm extends FieldValues> {
  variables: VariablesModel;
  queryKey: string;
  form: UseFormReturn<TForm>;
  getDisplayName?: (record: T) => string;
}

function buildAuditStrings<T extends BaseModel>(record: T | null): AuditStrings {
  if (!record) return { userRegister: null, userModified: null };
  return {
    userRegister: record.UsuarioRegistro
      ? `${record.UsuarioRegistro} — ${record.FechaRegistro}`
      : null,
    userModified: record.UsuarioModifico
      ? `${record.UsuarioModifico} — ${record.FechaModifico}`
      : null,
  };
}

/** Ciclo de vida del modal CRUD: abrir/cerrar, guardar y mapear errores 422 al form. */
export function useCrudOperations<T extends BaseModel, TForm extends FieldValues = FieldValues>({
  variables,
  queryKey,
  form,
  getDisplayName,
}: UseCrudOperationsParams<T, TForm>) {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /** Abre el modal en modo creación con el form vacío. */
  const openCreateModal = () => {
    setMode("create");
    setSelectedRecord(null);
    setIsOpen(true);
  };

  /** Abre el modal en modo edición y carga el registro seleccionado. */
  const openEditModal = (record: T) => {
    setMode("edit");
    setSelectedRecord(record);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  /** Guarda el registro; en 422 mapea los errores del backend campo a campo. */
  async function saveRecord(data: TForm) {
    const endpoint = mode === "create" ? variables.ENDPOINT_SAVE : variables.ENDPOINT_UPDATE;
    setIsSaving(true);

    const res = await postService(endpoint, { ...data, Id: selectedRecord?.Id ?? 0 });
    setIsSaving(false);

    if (!res.ok) {
      // 422: el backend manda las keys exactas del form (§4.3)
      Object.entries(res.errors ?? {}).forEach(([campo, msg]) =>
        form.setError(campo as Path<TForm>, { message: msg })
      );
      return void toast.error(res.message);
    }

    toast.success(res.message || "Registro guardado correctamente");
    qc.invalidateQueries({ queryKey: [queryKey] });
    closeModal();
  }

  const titleModal =
    mode === "create"
      ? `Nueva ${variables.TITLE_MODAL}`
      : `Editar ${variables.TITLE_MODAL}${
          getDisplayName && selectedRecord ? `: ${getDisplayName(selectedRecord)}` : ""
        }`;

  const audit = buildAuditStrings(selectedRecord);

  return {
    isOpen,
    mode,
    selectedRecord,
    isSaving,
    titleModal,
    audit,
    openCreateModal,
    openEditModal,
    closeModal,
    saveRecord,
  };
}
