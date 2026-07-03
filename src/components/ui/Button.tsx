import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-primary-500 text-white shadow-card hover:bg-primary-600 hover:shadow-float",
                destructive: "bg-destructive text-white shadow-card hover:bg-destructive/90",
                outline: "border border-border-subtle bg-surface text-foreground hover:bg-muted",
                secondary: "bg-muted text-foreground hover:bg-secondary-200",
                ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
                link: "text-primary-500 underline-offset-4 hover:underline hover:text-primary-600",
                pill: "rounded-full bg-primary-500 text-white shadow-card hover:bg-primary-600",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 px-4 text-xs rounded-xl",
                lg: "h-12 px-8 text-base",
                icon: "h-10 w-10 rounded-xl",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
