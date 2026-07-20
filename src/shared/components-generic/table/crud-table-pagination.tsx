"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHARED_VAR } from "@/shared/shared-variables";

interface CrudTablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  size: number;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
}

/** Barra de paginación: navegación, total de registros y tamaño de página. */
export function CrudTablePagination({
  page,
  totalPages,
  total,
  size,
  setPage,
  setSize,
}: CrudTablePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {total} registro{total === 1 ? "" : "s"} · Página {page} de {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-2">
        <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHARED_VAR.PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(1)}>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
