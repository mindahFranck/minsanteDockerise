import type { ReactNode } from "react"
import { cn } from "./cn"

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger"

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-gray-100 text-gray-600",
  info: "bg-brand-50 text-brand-600",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
}

const dots: Record<BadgeVariant, string> = {
  neutral: "bg-gray-400",
  info: "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
}

interface BadgeProps {
  variant?: BadgeVariant
  withDot?: boolean
  children: ReactNode
  className?: string
}

/** Pastille de statut : « ● Ouverte », « Fermée », « Urgent »… */
export default function Badge({ variant = "neutral", withDot, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        variants[variant],
        className,
      )}
    >
      {withDot && <span className={cn("size-1.5 shrink-0 rounded-full", dots[variant])} />}
      {children}
    </span>
  )
}
