import api from "./api"

/** Un équipement du catalogue standard (table equipements_standard). */
export interface EquipementStandard {
  id: number
  categorieFosa: string
  famille: string
  service?: string | null
  code?: string | null
  designation: string
  specifications?: string | null
  quantiteStandard?: string | null
  prixUnitaire?: string | null
}

type ListParams = { categorie?: string; famille?: string; search?: string }

export const equipementStandardService = {
  async list(params?: ListParams): Promise<{ success: boolean; data: EquipementStandard[]; count: number }> {
    const res = await api.get("/equipements-standard", { params })
    return res.data
  },
  async create(data: Partial<EquipementStandard>) {
    const res = await api.post("/equipements-standard", data)
    return res.data
  },
  async update(id: number, data: Partial<EquipementStandard>) {
    const res = await api.put(`/equipements-standard/${id}`, data)
    return res.data
  },
  async remove(id: number) {
    const res = await api.delete(`/equipements-standard/${id}`)
    return res.data
  },
}
