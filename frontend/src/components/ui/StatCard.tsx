import type { ReactNode } from "react"
import { cn } from "./cn"

type Tone = "default" | "brand" | "success" | "warning" | "danger"

const valueTone: Record<Tone, string> = {
  default: "text-gray-900",
  brand: "text-brand-500",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
}

interface StatCardProps {
  label: string
  value: ReactNode
  /** Ligne d'aide sous la valeur (« sur 5 152 FOSA », « 61,3 % du total »). */
  hint?: ReactNode
  hintTone?: "muted" | Tone
  tone?: Tone
  icon?: ReactNode
  onClick?: () => void
  className?: string
}

const hintTone: Record<NonNullable<StatCardProps["hintTone"]>, string> = {
  muted: "text-gray-500",
  ...valueTone,
}

/** Tuile de KPI : libellé en capitales, grand chiffre, ligne d'aide. */
export default function StatCard({
  label,
  value,
  hint,
  hintTone: hTone = "muted",
  tone = "default",
  icon,
  onClick,
  className,
}: StatCardProps) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "card flex flex-col p-5 text-left",
        onClick && "transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="kicker">{label}</p>
        {icon && <span className="text-gray-400 [&_svg]:size-4">{icon}</span>}
      </div>
      <p className={cn("mt-3 text-[32px] font-bold leading-none tracking-tight tabular-nums", valueTone[tone])}>
        {value}
      </p>
      {hint != null && (
        <p className={cn("mt-3 font-mono text-xs font-medium tabular-nums", hintTone[hTone])}>{hint}</p>
      )}
    </Comp>
  )
}
