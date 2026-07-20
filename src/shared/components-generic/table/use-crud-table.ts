"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getService } from "@/actions/global-service";
import { SHARED_VAR } from "@/shared/shared-variables";
import type { VariablesModel } from "@/lib/types/base.model";
import type { PaginatedResponse } from "@/lib/types/table.model";

interface UseCrudTableParams {
  variables: VariablesModel;
  queryKey: string;
  pageSize?: number;
  extraVariables?: Record<string, unknown>;
}

/** Omite filtros vacíos y el valor "-1" (TODOS) — reglas de §5.3 del spec. */
function cleanFilters(filters: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    const trimmed = value?.trim() ?? "";
    if (!trimmed || trimmed === "-1") continue;
    out[key] = trimmed;
  }
  return out;
}

/** Estado interno de la tabla CRUD: paginación, filtros y query de datos. */
export function useCrudTable<T>({ variables, queryKey, pageSize, extraVariables }: UseCrudTableParams) {
  const [page, setPage] = useState(1);
  const [size, setSizeState] = useState(pageSize ?? SHARED_VAR.DEFAULT_PAGE_SIZE);
  const [filters, setFiltersState] = useState<Record<string, string>>({});

  /** Mergea filtros y resetea a página 1. */
  const updateFilters = (partial: Record<string, string>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
    setPage(1);
  };

  const setSize = (n: number) => {
    setSizeState(n);
    setPage(1);
  };

  const query = useQuery({
    queryKey: [queryKey, page, size, filters, extraVariables],
    queryFn: async () => {
      const res = await getService<PaginatedResponse<T>>(variables.ENDPOINT_GET_DATA, {
        page,
        pageSize: size,
        filters: cleanFilters(filters),
        ...extraVariables,
      });
      if (!res.ok) throw new Error(res.message); // ver §4.1: ApiError no cruza la frontera server
      return res.data;
    },
    placeholderData: keepPreviousData, // paginación sin parpadeo
  });

  return { query, page, setPage, size, setSize, filters, updateFilters };
}
