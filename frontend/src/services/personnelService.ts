import api from "./api"
import type { Personnel, PaginatedResponse } from "../types"

export const personnelService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; fosaId?: number }) => {
    const response = await api.get<PaginatedResponse<Personnel>>("/personnels", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Personnel>(`/personnels/${id}`)
    return response.data
  },

  create: async (data: Omit<Personnel, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Personnel>("/personnels", data)
    return response.data
  },

  update: async (id: number, data: Partial<Personnel>) => {
    const response = await api.put<Personnel>(`/personnels/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/personnels/${id}`)
  },
}
