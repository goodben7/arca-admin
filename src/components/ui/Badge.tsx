import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
    {
        variants: {
            variant: {
                default: "bg-primary-100 text-primary-800 border border-primary-300",
                secondary: "bg-secondary-100 text-secondary-700 border border-secondary-300",
                success: "bg-emerald-100 text-emerald-800 border border-emerald-300",
                warning: "bg-amber-100 text-amber-800 border border-amber-300",
                destructive: "bg-rose-100 text-rose-800 border border-rose-300",
                info: "bg-sky-100 text-sky-800 border border-sky-300",
                outline: "text-secondary-700 border border-secondary-300 bg-white",
            },
            size: {
                sm: "px-2 py-0.5 text-[10px]",
                default: "px-2.5 py-0.5 text-[11px]",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
