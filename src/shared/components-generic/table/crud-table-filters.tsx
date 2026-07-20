"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHARED_VAR } from "@/shared/shared-variables";

interface CrudTableFiltersProps {
  filters: Record<string, string>;
  onChange: (partial: Record<string, string>) => void;
}

/** Área de filtros default: buscador debounced + combo de estado. */
export function CrudTableFilters({ filters, onChange }: CrudTableFiltersProps) {
  const [search, setSearch] = useState(filters.search ?? "");

  useEffect(() => {
    const applied = filters.search ?? "";
    if (search === applied) return;
    const timer = setTimeout(() => onChange({ search }), SHARED_VAR.SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="pl-8"
        />
      </div>
      <Select value={filters.status ?? "-1"} onValueChange={(v) => onChange({ status: v })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {SHARED_VAR.LIST_STATUS_ALL.map((opt) => (
            <SelectItem key={opt.VALUE} value={opt.VALUE}>
              {opt.LABEL}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
