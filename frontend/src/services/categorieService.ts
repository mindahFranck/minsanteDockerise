import api from "./api"
import type { Categorie, PaginatedResponse, ApiResponse } from "../types"

export const categorieService = {
  async getAll(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Categorie>> {
    const response = await api.get("/categories", { params })
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<Categorie>> {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },

  async create(data: Partial<Categorie>): Promise<ApiResponse<Categorie>> {
    const response = await api.post("/categories", data)
    return response.data
  },

  async update(id: number, data: Partial<Categorie>): Promise<ApiResponse<Categorie>> {
    const response = await api.put(`/categories/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },
}
