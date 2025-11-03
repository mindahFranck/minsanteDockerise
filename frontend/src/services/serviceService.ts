import api from "./api"
import type { Service, PaginatedResponse, ApiResponse } from "../types"

export const serviceService = {
  async getAll(params?: {
    page?: number
    limit?: number
    fosaId?: number
    batimentId?: number
  }): Promise<PaginatedResponse<Service>> {
    const response = await api.get("/services", { params })
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<Service>> {
    const response = await api.get(`/services/${id}`)
    return response.data
  },

  async create(data: Partial<Service>): Promise<ApiResponse<Service>> {
    const response = await api.post("/services", data)
    return response.data
  },

  async update(id: number, data: Partial<Service>): Promise<ApiResponse<Service>> {
    const response = await api.put(`/services/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/services/${id}`)
    return response.data
  },

  async getByFosa(fosaId: number): Promise<PaginatedResponse<Service>> {
    const response = await api.get("/services", { params: { fosaId } })
    return response.data
  },

  async getByBatiment(batimentId: number): Promise<PaginatedResponse<Service>> {
    const response = await api.get("/services", { params: { batimentId } })
    return response.data
  },
}
