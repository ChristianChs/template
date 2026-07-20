"use client";

import { CalendarIcon } from "lucide-react";
import { es } from "date-fns/locale";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fromApiDate, toApiDate } from "@/lib/date";

interface DatePickerFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/** Campo de fecha para react-hook-form. El valor del form es siempre string en formato API. */
export function DatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder = "dd/mm/aaaa",
  className,
}: DatePickerFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          <FormLabel>
            {label} {required && <span className="text-destructive">*</span>}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn("justify-start font-normal", !field.value && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {field.value || placeholder}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                locale={es}
                selected={fromApiDate(field.value)}
                onSelect={(d) => field.onChange(toApiDate(d))}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
