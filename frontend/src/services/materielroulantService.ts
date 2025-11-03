import api from "./api"
import type { Materielroulant, PaginatedResponse } from "../types"

export const materielroulantService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; fosaId?: number }) => {
    const response = await api.get<PaginatedResponse<Materielroulant>>("/materielroulants", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Materielroulant>(`/materielroulants/${id}`)
    return response.data
  },

  create: async (data: Omit<Materielroulant, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Materielroulant>("/materielroulants", data)
    return response.data
  },

  update: async (id: number, data: Partial<Materielroulant>) => {
    const response = await api.put<Materielroulant>(`/materielroulants/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/materielroulants/${id}`)
  },
}
