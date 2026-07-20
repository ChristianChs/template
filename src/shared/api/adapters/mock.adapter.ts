import { format } from "date-fns";
import type { HttpClient } from "../http-client";
import { ApiError } from "../api-error";
import type { ApiResponse } from "@/lib/types/api.model";
import type { PaginatedRequest } from "@/lib/types/table.model";
import type { OptionItem } from "@/lib/types/select.model";

interface MockCliente {
  Id: number;
  Denominacion: string;
  IdTipoDocumento: number;
  TipoDocumento: string;
  Observacion: string;
  Activo: "1" | "0";
  Eliminado: "1" | "0";
  UsuarioRegistro?: string;
  FechaRegistro?: string;
  UsuarioModifico?: string;
  FechaModifico?: string;
}

const TIPOS_DOCUMENTO: OptionItem[] = [
  { VALUE: "1", LABEL: "DNI" },
  { VALUE: "2", LABEL: "RUC" },
  { VALUE: "3", LABEL: "CARNET DE EXTRANJERÍA" },
  { VALUE: "4", LABEL: "PASAPORTE" },
];

const NOMBRES = [
  "COMERCIAL ANDINA S.A.C.", "JUAN PÉREZ QUISPE", "INVERSIONES DEL SUR E.I.R.L.",
  "MARÍA FERNÁNDEZ ROJAS", "DISTRIBUIDORA ORIENTE S.R.L.", "CARLOS MAMANI CONDORI",
  "TEXTILES UNIDOS S.A.", "ANA LUCÍA TORRES VEGA", "AGROINDUSTRIAS VALLE S.A.C.",
  "PEDRO CASTILLO HUAMÁN", "SERVICIOS GLOBALES PERÚ", "ROSA MENDOZA FLORES",
  "CONSTRUCTORA LOS ANDES", "LUIS ALBERTO GONZALES", "IMPORTACIONES PACÍFICO",
  "CARMEN QUISPE APAZA", "TRANSPORTES RÁPIDOS S.A.", "JORGE SALAZAR NIETO",
  "FERRETERÍA CENTRAL E.I.R.L.", "LUCÍA RAMOS PAREDES", "MINERA ALTIPLANO S.A.C.",
  "MIGUEL ÁNGEL CHOQUE", "PANADERÍA SAN MARTÍN", "SOFÍA VARGAS LUNA",
  "TECNOLOGÍA AVANZADA PERÚ", "RICARDO HUANCA TICONA", "BOTICA SALUD TOTAL",
  "ELENA CÁRDENAS RÍOS", "GRIFOS DEL NORTE S.A.", "FERNANDO APAZA MAMANI",
  "LIBRERÍA EL SABER", "PATRICIA NÚÑEZ SOTO", "METALMECÁNICA INDUSTRIAL",
  "HUGO ESPINOZA CRUZ", "CLÍNICA VIDA SANA S.A.C.",
];

function now() {
  return format(new Date(), "dd/MM/yyyy HH:mm");
}

function seed(): MockCliente[] {
  return NOMBRES.map((nombre, i) => {
    const tipo = TIPOS_DOCUMENTO[i % TIPOS_DOCUMENTO.length];
    return {
      Id: i + 1,
      Denominacion: nombre,
      IdTipoDocumento: Number(tipo.VALUE),
      TipoDocumento: tipo.LABEL,
      Observacion: i % 3 === 0 ? "Cliente frecuente" : "",
      Activo: i % 4 === 3 ? "0" : "1",
      Eliminado: i % 9 === 8 ? "1" : "0",
      UsuarioRegistro: "admin",
      FechaRegistro: `0${(i % 9) + 1}/06/2026 10:${String(10 + (i % 50)).padStart(2, "0")}`,
      ...(i % 5 === 0
        ? { UsuarioModifico: "admin", FechaModifico: `01/07/2026 09:${String(10 + i).slice(-2)}` }
        : {}),
    };
  });
}

function ok<T>(data: T, message = ""): ApiResponse<T> {
  return { success: true, message, data };
}

/** Lanza el ApiError con el mismo body serializado que mandaría el backend real. */
function fail(status: number, message: string, errors?: Record<string, string>): never {
  throw new ApiError(status, JSON.stringify({ success: false, message, errors }));
}

function paginate(db: MockCliente[], body: PaginatedRequest) {
  const { page = 1, pageSize = 10, filters = {} } = body ?? {};
  let rows = db;

  if (filters.search) {
    const term = filters.search.toLowerCase();
    rows = rows.filter((r) => r.Denominacion.toLowerCase().includes(term));
  }
  if (filters.status === "1" || filters.status === "0") {
    rows = rows.filter((r) => r.Activo === filters.status);
  }

  const total = rows.length;
  const totalPages = Math.ceil(total / pageSize);
  const items = rows.slice((page - 1) * pageSize, page * pageSize);
  return ok({ items, total, page, pageSize, totalPages });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Cliente HTTP en memoria. Mismo contrato que el de fetch, sin red. */
export function createMockClient(): HttpClient {
  const db: MockCliente[] = seed();

  function find(id: number): MockCliente {
    const record = db.find((r) => r.Id === id);
    if (!record) fail(404, "El cliente no existe");
    return record;
  }

  function upsert(body: Partial<MockCliente>) {
    const denominacion = (body.Denominacion ?? "").trim();
    const duplicated = db.some(
      (r) => r.Denominacion.toLowerCase() === denominacion.toLowerCase() && r.Id !== body.Id
    );
    if (duplicated) {
      fail(422, "La denominación ya existe", {
        Denominacion: "Ya existe un cliente con esa denominación",
      });
    }

    const tipo = TIPOS_DOCUMENTO.find((t) => t.VALUE === String(body.IdTipoDocumento));

    if (body.Id && body.Id > 0) {
      const record = find(body.Id);
      Object.assign(record, body, {
        Denominacion: denominacion,
        TipoDocumento: tipo?.LABEL ?? record.TipoDocumento,
        UsuarioModifico: "admin",
        FechaModifico: now(),
      });
      return ok({ Id: record.Id }, "Cliente actualizado correctamente");
    }

    const nuevo: MockCliente = {
      Id: Math.max(0, ...db.map((r) => r.Id)) + 1,
      Denominacion: denominacion,
      IdTipoDocumento: Number(body.IdTipoDocumento ?? 0),
      TipoDocumento: tipo?.LABEL ?? "",
      Observacion: body.Observacion ?? "",
      Activo: body.Activo ?? "1",
      Eliminado: "0",
      UsuarioRegistro: "admin",
      FechaRegistro: now(),
    };
    db.unshift(nuevo);
    return ok({ Id: nuevo.Id }, "Cliente registrado correctamente");
  }

  function setFlag(id: number, flag: "Eliminado" | "Activo", value: "1" | "0", message: string) {
    find(id)[flag] = value;
    return ok({ Id: id }, message);
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    await delay(400); // latencia simulada
    const payload = body as Record<string, never>;

    switch (path) {
      case "/clientes/list":
        return paginate(db, body as PaginatedRequest) as T;
      case "/clientes/save":
        return upsert(payload) as T;
      case "/clientes/delete":
        return setFlag(payload.Id, "Eliminado", "1", "Cliente eliminado correctamente") as T;
      case "/clientes/restore":
        return setFlag(payload.Id, "Eliminado", "0", "Cliente restaurado correctamente") as T;
      case "/clientes/active": {
        const record = find(payload.Id);
        record.Activo = record.Activo === "1" ? "0" : "1";
        return ok({ Id: record.Id }, "Estado actualizado correctamente") as T;
      }
      case "/clientes/combos":
        return ok({ tipoDocumento: TIPOS_DOCUMENTO }) as T;
      default:
        fail(404, `Mock sin ruta: ${path}`);
    }
  }

  return {
    get: (path, config) => post(path, config?.params),
    post,
    put: post,
    patch: post,
    delete: (path, config) => post(path, config?.params),
  };
}
