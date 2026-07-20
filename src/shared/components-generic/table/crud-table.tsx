"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { BaseModel, VariablesModel } from "@/lib/types/base.model";
import type { CrudColumn } from "@/lib/types/table.model";
import { useCrudTable } from "./use-crud-table";
import { CrudTableFilters } from "./crud-table-filters";
import { CrudTableActions } from "./crud-table-actions";
import { CrudTablePagination } from "./crud-table-pagination";

interface CrudTableProps<T extends BaseModel> {
  variables: VariablesModel;
  columns: CrudColumn<T>[];
  queryKey: string;
  onAdd: () => void;
  onEdit: (record: T) => void;
  pageSize?: number;
  extraVariables?: Record<string, unknown>;
  extraFilters?: React.ReactNode;
}

interface ColumnMeta {
  align?: "left" | "center" | "right";
  width?: number;
}

const ALIGN_CLASS = { left: "text-left", center: "text-center", right: "text-right" } as const;

/** Tabla CRUD genérica: fetch, paginación, filtros y acciones por endpoint. */
export function CrudTable<T extends BaseModel>({
  variables,
  columns,
  queryKey,
  onAdd,
  onEdit,
  pageSize,
  extraVariables,
  extraFilters,
}: CrudTableProps<T>) {
  const { query, page, setPage, size, setSize, filters, updateFilters } = useCrudTable<T>({
    variables,
    queryKey,
    pageSize,
    extraVariables,
  });

  const columnDefs = useMemo<ColumnDef<T>[]>(
    () => [
      {
        id: "__index",
        header: "N°",
        // Numeración continua entre páginas — ver §11.11 del spec
        cell: ({ row }) => (page - 1) * size + row.index + 1,
        meta: { align: "center", width: 60 } satisfies ColumnMeta,
      },
      ...columns.map(
        (col): ColumnDef<T> => ({
          id: col.key,
          accessorKey: col.dataIndex,
          header: col.title,
          cell: ({ row, getValue }) =>
            col.render ? col.render(getValue(), row.original) : (getValue() as React.ReactNode),
          meta: { align: col.align, width: col.width } satisfies ColumnMeta,
        })
      ),
      {
        id: "__estado",
        header: "ESTADO",
        cell: ({ row }) =>
          row.original.Eliminado === "1" ? (
            <Badge variant="destructive">ELIMINADO</Badge>
          ) : row.original.Activo === "1" ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">ACTIVO</Badge>
          ) : (
            <Badge variant="secondary">DESACTIVO</Badge>
          ),
        meta: { align: "center", width: 110 } satisfies ColumnMeta,
      },
      {
        id: "__acciones",
        header: "ACCIONES",
        cell: ({ row }) => (
          <CrudTableActions
            record={row.original}
            variables={variables}
            queryKey={queryKey}
            onEdit={onEdit}
          />
        ),
        meta: { align: "center", width: 140 } satisfies ColumnMeta,
      },
    ],
    [columns, page, size, variables, queryKey, onEdit]
  );

  const table = useReactTable({
    data: query.data?.items ?? [],
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const colCount = columnDefs.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading>{variables.TITLE}</Heading>
        <Button onClick={onAdd}>
          <Plus className="mr-1 size-4" />
          Nuevo
        </Button>
      </div>

      {extraFilters ?? <CrudTableFilters filters={filters} onChange={updateFilters} />}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn("uppercase", ALIGN_CLASS[meta?.align ?? "left"])}
                      style={meta?.width ? { width: meta.width } : undefined}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colCount}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-32 text-center">
                  <p className="mb-3 text-sm text-destructive">{query.error.message}</p>
                  <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                    <RefreshCw className="mr-1 size-4" />
                    Reintentar
                  </Button>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-32 text-center text-muted-foreground">
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(row.original.Eliminado === "1" && "opacity-60")}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                    return (
                      <TableCell key={cell.id} className={ALIGN_CLASS[meta?.align ?? "left"]}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CrudTablePagination
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        total={query.data?.total ?? 0}
        size={size}
        setPage={setPage}
        setSize={setSize}
      />
    </div>
  );
}
