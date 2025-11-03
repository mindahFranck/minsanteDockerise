import api from "./api"
import type { Departement, PaginatedResponse } from "../types"

export const departementService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; regionId?: number }) => {
    const response = await api.get<PaginatedResponse<Departement>>("/departements", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Departement>(`/departements/${id}`)
    return response.data
  },

  create: async (data: Omit<Departement, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Departement>("/departements", data)
    return response.data
  },

  update: async (id: number, data: Partial<Departement>) => {
    const response = await api.put<Departement>(`/departements/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/departements/${id}`)
  },
}
