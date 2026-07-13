import { fontHeading } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export function Heading({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(fontHeading.className, "text-2xl font-semibold", className)}
      {...props}
    />
  )
}
