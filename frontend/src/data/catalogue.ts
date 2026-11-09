/**
 * Catalogue des équipements standard par catégorie de FOSA.
 * Issu des documents « LISTE STANDARD DES EQUIPEMENTS » (MINSANTÉ), chargé à la
 * demande (import dynamique) pour ne pas alourdir le bundle principal.
 */
export type CatalogueItem = { code: string; designation: string; service: string }
export type CatalogueCategorie = { label: string; equipements: CatalogueItem[] }
export type Catalogue = Record<string, CatalogueCategorie>

/** Catégories de FOSA reconnues par le catalogue. */
export const CATEGORIES_FOSA: { code: string; label: string }[] = [
  { code: "HR", label: "Hôpital Régional" },
  { code: "HD", label: "Hôpital de District" },
  { code: "CMA", label: "Centre Médical d'Arrondissement" },
  { code: "CSI", label: "Centre de Santé Intégré" },
]

/** Devine la catégorie du catalogue à partir du type/catRec d'une FOSA. */
export function devinerCategorie(valeur?: string | null): string | null {
  if (!valeur) return null
  const v = valeur.toLowerCase()
  if (v.includes("régional") || v.includes("regional")) return "HR"
  if (v.includes("district")) return "HD"
  if (v.includes("arrondissement") || v.includes("cma")) return "CMA"
  if (v.includes("intégré") || v.includes("integre") || v.includes("csi") || v.includes("centre de santé")) return "CSI"
  return null
}

let cache: Catalogue | null = null

/** Charge (une seule fois) le catalogue compact. */
export async function loadCatalogue(): Promise<Catalogue> {
  if (cache) return cache
  const mod = await import("./catalogue-equipements.json")
  cache = ((mod as any).default ?? mod) as Catalogue
  return cache
}
