"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { postService } from "@/actions/global-service";
import type { BaseModel, VariablesModel } from "@/lib/types/base.model";

interface CrudTableActionsProps<T extends BaseModel> {
  record: T;
  variables: VariablesModel;
  queryKey: string;
  onEdit: (record: T) => void;
}

/** Celda de acciones endpoint-driven: toggle de estado, editar y eliminar. */
export function CrudTableActions<T extends BaseModel>({
  record,
  variables,
  queryKey,
  onEdit,
}: CrudTableActionsProps<T>) {
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  async function run(endpoint: string) {
    setIsRunning(true);
    const res = await postService(endpoint, { Id: record.Id });
    setIsRunning(false);

    if (!res.ok) return void toast.error(res.message);
    toast.success(res.message || "Operación realizada correctamente");
    qc.invalidateQueries({ queryKey: [queryKey] });
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Switch
        checked={record.Activo === "1"}
        disabled={isRunning}
        title={record.Activo === "1" ? "Desactivar" : "Activar"}
        onCheckedChange={() => run(variables.ENDPOINT_TOGGLE_STATUS)}
      />
      <Button variant="ghost" size="icon" title="Editar" onClick={() => onEdit(record)}>
        <Pencil className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setConfirmDelete(true)}>
        <Trash2 className="size-4 text-destructive" />
      </Button>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el registro?</AlertDialogTitle>
            <AlertDialogDescription>
              El registro dejará de mostrarse en la lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRunning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRunning}
              onClick={(e) => {
                e.preventDefault();
                run(variables.ENDPOINT_DELETE).then(() => setConfirmDelete(false));
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
