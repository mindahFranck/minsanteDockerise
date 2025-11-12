import api from "./api"
import type { Airesante, PaginatedResponse } from "../types"

export const airesanteService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; districtId?: number }) => {
    const response = await api.get<PaginatedResponse<Airesante>>("/airesantes", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Airesante>(`/airesantes/${id}`)
    return response.data
  },

  create: async (data: Omit<Airesante, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Airesante>("/airesantes", data)
    return response.data
  },

  update: async (id: number, data: Partial<Airesante>) => {
    const response = await api.put<Airesante>(`/airesantes/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/airesantes/${id}`)
  },

  // Méthodes pour la carte (avec geom)
  getAllForMap: async () => {
    const response = await api.get<{ success: boolean; data: Airesante[] }>("/airesantes/map/all")
    return response.data
  },

  getByIdForMap: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Airesante }>(`/airesantes/map/${id}`)
    return response.data
  },

  getByDistrictForMap: async (districtId: number) => {
    const response = await api.get<{ success: boolean; data: Airesante[] }>(`/airesantes/map/district/${districtId}`)
    return response.data
  },
}
