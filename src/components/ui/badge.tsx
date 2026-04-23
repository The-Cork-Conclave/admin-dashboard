import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-50 text-green-700 border-green-200/60",
        warning: "bg-amber-50 text-amber-700 border-amber-200/60",
        error: "bg-red-50 text-red-700 border-red-200/60",
        info: "bg-blue-50 text-blue-700 border-blue-200/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

function EventStatusBadge({ status }: { status: string }) {
  switch (status) {

    case 'active':
      return <span
        className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200/60 px-2 py-0.5 text-xs font-medium text-green-700">
        Active
      </span>

    case 'closed':
      return <span
        className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200/60 px-2 py-0.5 text-xs font-medium text-red-700">
        Closed
      </span>

    case 'completed':
      return <span
        className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-xs font-medium text-blue-700">
        Completed
      </span>
    case 'cancelled':
      return <span
        className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200/60 px-2 py-0.5 text-xs font-medium text-red-700">
        Cancelled
      </span>

    case 'draft':
    default:
      return <span
        className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 border border-gray-200/60 px-2 py-0.5 text-xs font-medium text-gray-700">
        Draft
      </span>

  }
}

export { Badge, badgeVariants, EventStatusBadge }
