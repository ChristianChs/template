"use client";

import { Info } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { OptionItem } from "@/lib/types/select.model";
import type { ClientesFormValues } from "./clientes.model";

interface Props {
  form: UseFormReturn<ClientesFormValues>;
  documentTypes: OptionItem[];
}

/** Formulario de clientes, campo por campo. */
export function ClientesForm({ form, documentTypes }: Props) {
  return (
    <Form {...form}>
      <fieldset className="rounded-lg border-2 px-3 pb-3">
        <legend className="px-2 text-sm font-semibold text-primary">
          <Info className="mr-2 inline size-4" />
          Información del cliente
        </legend>

        <div className="grid grid-cols-12 gap-3">
          <FormField
            control={form.control}
            name="Denominacion"
            render={({ field }) => (
              <FormItem className="col-span-12 md:col-span-8">
                <FormLabel>
                  Denominación <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input maxLength={150} placeholder="Ingresa la denominación" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="IdTipoDocumento"
            render={({ field }) => (
              <FormItem className="col-span-12 md:col-span-4">
                <FormLabel>
                  Tipo de documento <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {documentTypes.map((opt) => (
                      <SelectItem key={opt.VALUE} value={opt.VALUE}>
                        {opt.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Observacion"
            render={({ field }) => (
              <FormItem className="col-span-12">
                <FormLabel>Observación</FormLabel>
                <FormControl>
                  <Textarea
                    maxLength={500}
                    rows={3}
                    placeholder="Observaciones (opcional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Activo"
            render={({ field }) => (
              <FormItem className="col-span-12 flex items-center gap-3">
                <FormControl>
                  <Switch
                    checked={field.value === "1"}
                    onCheckedChange={(checked) => field.onChange(checked ? "1" : "0")}
                  />
                </FormControl>
                <FormLabel className="!mt-0">
                  {field.value === "1" ? "Activo" : "Desactivo"}
                </FormLabel>
              </FormItem>
            )}
          />
        </div>
      </fieldset>
    </Form>
  );
}
