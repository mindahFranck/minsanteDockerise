import type { ReactNode } from "react"

/**
 * Barre de filtres blanche posée sous l'en-tête de page, comme la rangée
 * « FILTRES » de BAOBAB : recherche, sélecteurs, puis actions à droite.
 */
export default function FilterBar({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="kicker hidden sm:inline">Filtres</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
