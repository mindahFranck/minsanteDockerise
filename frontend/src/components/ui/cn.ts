/** Concatène des classes en ignorant les valeurs vides. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ")
}

const numberFormat = new Intl.NumberFormat("fr-FR")

/** 12 345 — espaces fines, comme sur les maquettes BAOBAB. */
export function formatNumber(value: number | null | undefined): string {
  return numberFormat.format(Math.round(value ?? 0))
}

/** Part en pourcentage, une décimale : 61,3 %. Zéro si le total est nul. */
export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
}
