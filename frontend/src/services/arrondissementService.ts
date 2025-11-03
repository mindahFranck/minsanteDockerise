import api from "./api"
import type { Arrondissement, PaginatedResponse } from "../types"

export const arrondissementService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; departementId?: number }) => {
    const response = await api.get<PaginatedResponse<Arrondissement>>("/arrondissements", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Arrondissement>(`/arrondissements/${id}`)
    return response.data
  },

  create: async (data: Omit<Arrondissement, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Arrondissement>("/arrondissements", data)
    return response.data
  },

  update: async (id: number, data: Partial<Arrondissement>) => {
    const response = await api.put<Arrondissement>(`/arrondissements/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/arrondissements/${id}`)
  },
}
