import { cn, formatNumber, formatPercent, percent } from "./cn"

export interface RankItem {
  label: string
  value: number
  /** Deuxième ligne sous le libellé. */
  sub?: string
}

interface RankBarsProps {
  items: RankItem[]
  /** Total servant au pourcentage ; par défaut la somme des valeurs. */
  total?: number
  /** Afficher la part en % plutôt que la valeur brute à droite. */
  showPercent?: boolean
  limit?: number
  emptyLabel?: string
  /** Rang du premier élément moins un (liste coupée en colonnes). */
  offset?: number
  /** Valeur pleine échelle, partagée entre colonnes d'un même classement. */
  maxValue?: number
}

/**
 * Classement en barres horizontales, à la manière de l'explorateur de
 * distribution de BAOBAB : rang, libellé, barre, valeur.
 */
export default function RankBars({ items, total, showPercent, limit, emptyLabel = "Aucune donnée", offset = 0, maxValue }: RankBarsProps) {
  const rows = limit ? items.slice(0, limit) : items
  const sum = total ?? items.reduce((acc, item) => acc + item.value, 0)
  const max = maxValue ?? Math.max(1, ...rows.map((item) => item.value))

  if (rows.length === 0) return <p className="py-8 text-center text-sm text-gray-400">{emptyLabel}</p>

  return (
    <ol className="divide-y divide-gray-100">
      {rows.map((item, index) => {
        const width = (item.value / max) * 100
        return (
          <li key={item.label + index} className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(5rem,40%)_4.5rem] items-center gap-3 py-2.5">
            <span className="text-xs tabular-nums text-gray-400">{offset + index + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium uppercase text-gray-900" title={item.label}>{item.label}</p>
              {item.sub && <p className="truncate text-xs text-gray-500">{item.sub}</p>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-track">
              <div
                className={cn("h-full rounded-full", offset + index < 3 ? "bg-brand-500" : "bg-brand-300")}
                style={{ width: `${Math.max(width, 2)}%` }}
              />
            </div>
            <span className="text-right text-sm font-semibold tabular-nums text-gray-900">
              {showPercent ? formatPercent(percent(item.value, sum)) : formatNumber(item.value)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
