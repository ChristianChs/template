import { z } from "zod";
import type { BaseModel } from "@/lib/types/base.model";

export interface ClientesModel extends BaseModel {
  Denominacion: string;
  TipoDocumento: string; // label que devuelve el listado
  IdTipoDocumento: number | null;
  Observacion: string;
}

export const clientesSchema = z.object({
  Denominacion: z.string().min(1, "Denominación es requerida").max(150),
  Observacion: z.string().max(500, "No debe exceder 500 caracteres"),
  IdTipoDocumento: z.number().min(1, "Tipo de documento es requerido"),
  Activo: z.enum(["1", "0"]),
});

export type ClientesFormValues = z.infer<typeof clientesSchema>;

export const DEFAULT_VALUES: ClientesFormValues = {
  Denominacion: "",
  Observacion: "",
  IdTipoDocumento: 0,
  Activo: "1",
};

/** Proyecta un registro del listado a los valores del form (modo edición). */
export function toFormValues(record: ClientesModel): ClientesFormValues {
  return {
    Denominacion: record.Denominacion,
    Observacion: record.Observacion ?? "",
    IdTipoDocumento: record.IdTipoDocumento ?? 0,
    Activo: record.Activo,
  };
}
