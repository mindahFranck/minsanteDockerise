/**
 * Catalogue des équipements standard par catégorie de FOSA.
 * Issu des documents « LISTE STANDARD DES EQUIPEMENTS » (MINSANTÉ), chargé à la
 * demande (import dynamique) pour ne pas alourdir le bundle principal.
 */
import api from "../services/api"

export type CatalogueItem = { code: string; designation: string; service: string; specifications?: string }
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

/** Catalogue depuis le JSON statique embarqué (secours hors-ligne). */
async function fromStaticJson(): Promise<Catalogue> {
  const mod = await import("./catalogue-equipements.json")
  return ((mod as any).default ?? mod) as Catalogue
}

/** Catalogue depuis l'API serveur (table equipements_standard). */
async function fromApi(): Promise<Catalogue | null> {
  try {
    const res = await api.get("/equipements-standard")
    const rows: any[] = res.data?.data ?? []
    if (!rows.length) return null
    const out: Catalogue = {}
    for (const { code, label } of CATEGORIES_FOSA) out[code] = { label, equipements: [] }
    const seen: Record<string, Set<string>> = {}
    for (const r of rows) {
      const cat = r.categorieFosa
      if (!out[cat]) out[cat] = { label: cat, equipements: [] }
      seen[cat] ??= new Set<string>()
      const key = String(r.designation).toLowerCase()
      if (seen[cat].has(key)) continue
      seen[cat].add(key)
      out[cat].equipements.push({ code: r.code ?? "", designation: r.designation, service: r.service ?? "" })
    }
    return out
  } catch {
    return null
  }
}

/** Charge (une seule fois) le catalogue : API serveur, sinon JSON statique. */
export async function loadCatalogue(): Promise<Catalogue> {
  if (cache) return cache
  cache = (await fromApi()) ?? (await fromStaticJson())
  return cache
}

const catItemsCache: Record<string, CatalogueItem[]> = {}

/**
 * Équipements d'une catégorie (avec spécifications), pour le choix dans le
 * formulaire. API serveur d'abord (inclut les specs), repli sur le JSON statique.
 */
export async function loadCategorieItems(code: string): Promise<CatalogueItem[]> {
  if (!code) return []
  if (catItemsCache[code]) return catItemsCache[code]
  // 1) API serveur (avec specifications)
  try {
    const res = await api.get("/equipements-standard", { params: { categorie: code } })
    const rows: any[] = res.data?.data ?? []
    if (rows.length) {
      const seen = new Set<string>()
      const items: CatalogueItem[] = []
      for (const r of rows) {
        const key = String(r.designation).toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        items.push({
          code: r.code ?? "",
          designation: r.designation,
          service: r.service ?? "",
          specifications: r.specifications ?? "",
        })
      }
      catItemsCache[code] = items
      return items
    }
  } catch {
    /* repli ci-dessous */
  }
  // 2) Repli : JSON statique (sans specifications)
  const cat = await loadCatalogue()
  catItemsCache[code] = cat[code]?.equipements ?? []
  return catItemsCache[code]
}
