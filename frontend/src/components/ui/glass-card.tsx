import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "light" | "dark"
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = "light", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    variant === "light" ? "glass" : "glass-dark",
                    "rounded-3xl",
                    className
                )}
                {...props}
            />
        )
    }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
