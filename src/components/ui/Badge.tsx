import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "bg-primary-50 text-primary-700 border border-primary-100",
                secondary: "bg-secondary-100 text-secondary-700 border border-secondary-200",
                success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
                warning: "bg-amber-50 text-amber-700 border border-amber-100",
                destructive: "bg-rose-50 text-rose-700 border border-rose-100",
                outline: "text-secondary-600 border border-secondary-200 bg-white",
            },
            size: {
                sm: "px-2 py-0.5 text-[10px]",
                default: "px-2.5 py-1 text-xs",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
