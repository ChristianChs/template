import { format, parse, isValid } from "date-fns";

const API_FORMAT = "dd/MM/yyyy"; // el mismo string que el backend manda y espera

/** Convierte el Date del calendario al string que espera el backend. */
export function toApiDate(date?: Date | null): string {
  return date && isValid(date) ? format(date, API_FORMAT) : "";
}

/** Convierte el string del backend a Date, para alimentar el calendario. */
export function fromApiDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, API_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}
