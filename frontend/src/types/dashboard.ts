/* Forme de GET /statistics/dashboard (StatisticsService::getDashboard). */

export interface Breakdown {
  label: string
  total: number
  ouvertes?: number
}

export interface RegionRow {
  region: string
  total: number
  ouvertes: number
  electrifiees: number
  securisees: number
  lits: number
}

export interface DashboardData {
  fosas: {
    total: number
    ouvertes: number
    fermees: number
    fonctionnelles: number
    electrifiees: number
    titre_foncier: number
    cloturees: number
    securisees: number
    geolocalisees: number
    lits: number
    maintenance_urgente: number
    maintenance_haute: number
    inspections_en_retard: number
  }
  parRegion: RegionRow[]
  parCategorie: Breakdown[]
  parStatut: Breakdown[]
  parType: Breakdown[]
  personnel: { total: number; fosasDotees: number; parCategorie: Breakdown[] }
  batiments: { total: number; superficie: number; parEtat: Breakdown[] }
  equipements: { biomedicaux: number; autres: number }
  vehicules: { total: number; parEtat: Breakdown[]; parEnergie: Breakdown[] }
  patients: { total: number; ambulants: number }
  genereLe: string
}

export type Dimension = "categorie" | "statut" | "type" | "region"

/** Valeurs dérivées affichées par le tableau de bord (mêmes formules à l'écran et à l'export). */
export function deriveDashboard(data: DashboardData) {
  const f = data.fosas
  return {
    tfSeul: Math.max(0, f.titre_foncier - f.securisees),
    clotureSeule: Math.max(0, f.cloturees - f.securisees),
    aucune: Math.max(0, f.total - (f.titre_foncier + f.cloturees - f.securisees)),
    maintenance: f.maintenance_urgente + f.maintenance_haute,
    litsParFosa: f.ouvertes > 0 ? Math.round((f.lits / f.ouvertes) * 10) / 10 : 0,
  }
}
