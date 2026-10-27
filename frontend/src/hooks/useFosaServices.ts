import { useCallback, useEffect, useState } from "react"
import api from "../services/api"

export interface RefOption {
  id: number
  nom: string
}

/**
 * Gère la cascade FOSA → Services :
 * - `fosas` : liste complète des FOSA (pour le 1er dropdown)
 * - `services` : services de la FOSA sélectionnée (chargés à la demande)
 * - `loadServicesForFosa(fosaId)` : recharge la liste des services d'une FOSA
 *
 * Un même nom de service pouvant exister dans plusieurs FOSA, on ne propose
 * que les services rattachés à la FOSA choisie.
 */
/** Charge une fois la liste complète des FOSA. */
export function useFosas() {
  const [fosas, setFosas] = useState<RefOption[]>([])
  useEffect(() => {
    let active = true
    api
      .get("/fosas")
      .then((res) => {
        if (active) setFosas((res.data.data || []).map((f: any) => ({ id: f.id, nom: f.nom })))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return fosas
}

/** Gère une liste de services rechargée en fonction d'une FOSA. */
export function useServicesForFosa() {
  const [services, setServices] = useState<RefOption[]>([])
  const loadServicesForFosa = useCallback(async (fosaId?: number | null) => {
    if (!fosaId) {
      setServices([])
      return
    }
    try {
      // On envoie fosa_id (filtre backend) ET fosaId pour être robuste.
      const res = await api.get("/services", { params: { fosa_id: fosaId, fosaId } })
      setServices((res.data.data || []).map((s: any) => ({ id: s.id, nom: s.nom })))
    } catch {
      setServices([])
    }
  }, [])
  return { services, setServices, loadServicesForFosa }
}

/** Combo : FOSA + services d'une FOSA (utilisé par les formulaires). */
export function useFosaServices() {
  const fosas = useFosas()
  const { services, setServices, loadServicesForFosa } = useServicesForFosa()
  return { fosas, services, setServices, loadServicesForFosa }
}
