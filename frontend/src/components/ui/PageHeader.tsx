import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  /** Petite ligne en capitales au-dessus du titre (rubrique). */
  kicker?: string
  description?: ReactNode
  /** Boutons d'action, alignés à droite. */
  actions?: ReactNode
}

/** En-tête commun à toutes les pages : rubrique, titre, description, actions. */
export default function PageHeader({ title, kicker, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-1">{kicker}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
