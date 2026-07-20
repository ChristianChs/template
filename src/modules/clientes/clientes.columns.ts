import type { CrudColumn } from "@/lib/types/table.model";
import type { ClientesModel } from "./clientes.model";

export const COLUMNS_DATA_TABLE: CrudColumn<ClientesModel>[] = [
  { title: "DENOMINACIÓN", dataIndex: "Denominacion", key: "Denominacion", width: 280 },
  { title: "TIPO DOCUMENTO", dataIndex: "TipoDocumento", key: "TipoDocumento", width: 180 },
  { title: "OBSERVACIÓN", dataIndex: "Observacion", key: "Observacion", width: 220 },
  { title: "FECHA REG.", dataIndex: "FechaRegistro", key: "FechaRegistro", width: 150, align: "center" },
];
