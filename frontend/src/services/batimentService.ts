import api from "./api"
import type { Batiment, PaginatedResponse, ApiResponse } from "../types"

export const batimentService = {
  async getAll(params?: {
    page?: number
    limit?: number
    fosaId?: number
  }): Promise<PaginatedResponse<Batiment>> {
    const response = await api.get("/batiments", { params })
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<Batiment>> {
    const response = await api.get(`/batiments/${id}`)
    return response.data
  },

  async create(data: Partial<Batiment>): Promise<ApiResponse<Batiment>> {
    const response = await api.post("/batiments", data)
    return response.data
  },

  async update(id: number, data: Partial<Batiment>): Promise<ApiResponse<Batiment>> {
    const response = await api.put(`/batiments/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/batiments/${id}`)
    return response.data
  },

  async getByFosa(fosaId: number): Promise<PaginatedResponse<Batiment>> {
    const response = await api.get("/batiments", { params: { fosaId } })
    return response.data
  },
}
