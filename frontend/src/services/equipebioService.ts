import api from "./api"
import type { Equipebio, PaginatedResponse, ApiResponse } from "../types"

export const equipebioService = {
  async getAll(params?: {
    page?: number
    limit?: number
    fosaId?: number
    etat?: string
  }): Promise<PaginatedResponse<Equipebio>> {
    const response = await api.get("/equipebios", { params })
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<Equipebio>> {
    const response = await api.get(`/equipebios/${id}`)
    return response.data
  },

  async create(data: Partial<Equipebio>): Promise<ApiResponse<Equipebio>> {
    const response = await api.post("/equipebios", data)
    return response.data
  },

  async update(id: number, data: Partial<Equipebio>): Promise<ApiResponse<Equipebio>> {
    const response = await api.put(`/equipebios/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/equipebios/${id}`)
    return response.data
  },

  async getByFosa(fosaId: number): Promise<PaginatedResponse<Equipebio>> {
    const response = await api.get("/equipebios", { params: { fosaId } })
    return response.data
  },
}
