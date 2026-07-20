export interface BaseModel {
  Id: number;
  Activo: "1" | "0"; // estado del registro (toggle)
  Eliminado: "1" | "0"; // borrado lógico
  UsuarioRegistro?: string;
  FechaRegistro?: string;
  UsuarioModifico?: string;
  FechaModifico?: string;
}

export interface VariablesModel {
  TITLE: string;
  TITLE_MODAL: string;
  TITLE_ROUTE: string;
  ROUTE: string;
  ENDPOINT_GET_DATA: string;
  ENDPOINT_SAVE: string;
  ENDPOINT_UPDATE: string; // puede repetir SAVE si el backend hace upsert por Id
  ENDPOINT_DELETE: string; // borrado lógico
  ENDPOINT_RESTORE: string;
  ENDPOINT_TOGGLE_STATUS: string;
  ENDPOINT_GET_COMBOS?: string;
}
