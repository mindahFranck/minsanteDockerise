import api from "./api"
import type { Equipement, PaginatedResponse } from "../types"

export const equipementService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; serviceId?: number }) => {
    const response = await api.get<PaginatedResponse<Equipement>>("/equipements", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Equipement>(`/equipements/${id}`)
    return response.data
  },

  create: async (data: Omit<Equipement, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Equipement>("/equipements", data)
    return response.data
  },

  update: async (id: number, data: Partial<Equipement>) => {
    const response = await api.put<Equipement>(`/equipements/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/equipements/${id}`)
  },
}
