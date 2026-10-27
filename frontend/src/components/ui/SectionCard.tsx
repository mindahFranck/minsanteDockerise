import type { ReactNode } from "react"
import { cn } from "./cn"

interface SectionCardProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  /** Retire le padding du contenu (tableaux, cartes plein cadre). */
  flush?: boolean
  className?: string
}

/** Carte de section : titre, sous-titre, actions à droite, contenu. */
export default function SectionCard({ title, subtitle, actions, children, flush, className }: SectionCardProps) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {(title || actions) && (
        <div className="card-header">
          <div className="min-w-0">
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? "" : cn("px-6 pb-6", !(title || actions) && "pt-6")}>{children}</div>
    </section>
  )
}
