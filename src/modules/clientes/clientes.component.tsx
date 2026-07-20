"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CrudTable } from "@/shared/components-generic/table/crud-table";
import { ModalGeneric } from "@/shared/components-generic/modal/modal-generic";
import { useCrudOperations } from "@/shared/components-generic/crud/use-crud-operations";
import { useLoadOptions } from "@/shared/components-generic/crud/use-load-options";
import { VARIABLES } from "./clientes.variables";
import { COLUMNS_DATA_TABLE } from "./clientes.columns";
import {
  clientesSchema,
  DEFAULT_VALUES,
  toFormValues,
  type ClientesFormValues,
  type ClientesModel,
} from "./clientes.model";
import { ClientesForm } from "./clientes.form";

/** Orquestador del CRUD de clientes: tabla + modal + form. */
export function ClientesComponent() {
  const form = useForm<ClientesFormValues>({
    resolver: zodResolver(clientesSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const crud = useCrudOperations<ClientesModel, ClientesFormValues>({
    variables: VARIABLES,
    queryKey: "clientes",
    form,
    getDisplayName: (r) => r.Denominacion,
  });

  const { data: combos } = useLoadOptions(VARIABLES.ENDPOINT_GET_COMBOS);

  // Sincroniza el form con el modo del modal (≈ patchValue de Angular)
  useEffect(() => {
    if (!crud.isOpen) return;
    form.reset(
      crud.mode === "edit" && crud.selectedRecord
        ? toFormValues(crud.selectedRecord)
        : DEFAULT_VALUES
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crud.isOpen, crud.mode, crud.selectedRecord]);

  return (
    <>
      <CrudTable<ClientesModel>
        variables={VARIABLES}
        columns={COLUMNS_DATA_TABLE}
        queryKey="clientes"
        onAdd={crud.openCreateModal}
        onEdit={crud.openEditModal}
      />

      <ModalGeneric
        icon="Users"
        open={crud.isOpen}
        onClose={crud.closeModal}
        titleModal={crud.titleModal}
        audit={crud.audit}
        isSaving={crud.isSaving}
        size="lg"
        labelButton={crud.mode === "create" ? "Registrar" : "Actualizar"}
        onSubmit={form.handleSubmit(crud.saveRecord)}
      >
        <ClientesForm form={form} documentTypes={combos?.tipoDocumento ?? []} />
      </ModalGeneric>
    </>
  );
}
