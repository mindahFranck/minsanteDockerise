import api from "./api"
import type { District, PaginatedResponse } from "../types"

export const districtService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<PaginatedResponse<District>>("/districts", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<District>(`/districts/${id}`)
    return response.data
  },

  create: async (data: Omit<District, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<District>("/districts", data)
    return response.data
  },

  update: async (id: number, data: Partial<District>) => {
    const response = await api.put<District>(`/districts/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/districts/${id}`)
  },

  // Méthodes pour la carte (avec geom)
  getAllForMap: async () => {
    const response = await api.get<{ success: boolean; data: District[] }>("/districts/map/all")
    return response.data
  },

  getByIdForMap: async (id: number) => {
    const response = await api.get<{ success: boolean; data: District }>(`/districts/map/${id}`)
    return response.data
  },

  getByRegionForMap: async (regionId: number) => {
    const response = await api.get<{ success: boolean; data: District[] }>(`/districts/map/region/${regionId}`)
    return response.data
  },
}
