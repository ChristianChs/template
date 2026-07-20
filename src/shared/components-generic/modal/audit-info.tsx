export interface AuditStrings {
  userRegister: string | null;
  userModified: string | null;
}

/** Bloque de auditoría: quién registró y quién modificó. No renderiza si no hay datos. */
export function AuditInfo({ audit }: { audit: AuditStrings }) {
  if (!audit.userRegister && !audit.userModified) return null;

  return (
    <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      {audit.userRegister && <p>Registro: {audit.userRegister}</p>}
      {audit.userModified && <p>Modificación: {audit.userModified}</p>}
    </div>
  );
}
