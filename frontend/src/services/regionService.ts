import api from "./api"
import type { Region, PaginatedResponse } from "../types"

export const regionService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<PaginatedResponse<Region>>("/regions", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Region>(`/regions/${id}`)
    return response.data
  },

  create: async (data: Omit<Region, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Region>("/regions", data)
    return response.data
  },

  update: async (id: number, data: Partial<Region>) => {
    const response = await api.put<Region>(`/regions/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/regions/${id}`)
  },
}
