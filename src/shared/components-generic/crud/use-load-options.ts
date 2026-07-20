"use client";

import { useQuery } from "@tanstack/react-query";
import { getService } from "@/actions/global-service";
import type { OptionItem } from "@/lib/types/select.model";

/** Carga las opciones de combo de un endpoint. No corre si el endpoint es undefined. */
export function useLoadOptions<T = Record<string, OptionItem[]>>(endpoint?: string) {
  return useQuery({
    queryKey: ["options", endpoint],
    queryFn: async () => {
      const res = await getService<T>(endpoint!);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    enabled: !!endpoint,
    staleTime: 5 * 60 * 1000, // los combos casi no cambian
  });
}
