import api from "./api"
import type { Degradation, PaginatedResponse, ApiResponse } from "../types"

export const degradationService = {
  async getAll(params?: {
    page?: number
    limit?: number
    type?: string
  }): Promise<PaginatedResponse<Degradation>> {
    const response = await api.get("/degradations", { params })
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<Degradation>> {
    const response = await api.get(`/degradations/${id}`)
    return response.data
  },

  async create(data: Partial<Degradation>): Promise<ApiResponse<Degradation>> {
    const response = await api.post("/degradations", data)
    return response.data
  },

  async update(id: number, data: Partial<Degradation>): Promise<ApiResponse<Degradation>> {
    const response = await api.put(`/degradations/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/degradations/${id}`)
    return response.data
  },
}
