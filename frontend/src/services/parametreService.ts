import api from "./api"
import type { Parametre, PaginatedResponse, ApiResponse } from "../types"

export const parametreService = {
  async getAll(params?: {
    page?: number
    limit?: number
    categorie?: string
  }): Promise<PaginatedResponse<Parametre>> {
    const response = await api.get("/parametres", { params })
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<Parametre>> {
    const response = await api.get(`/parametres/${id}`)
    return response.data
  },

  async create(data: Partial<Parametre>): Promise<ApiResponse<Parametre>> {
    const response = await api.post("/parametres", data)
    return response.data
  },

  async update(id: number, data: Partial<Parametre>): Promise<ApiResponse<Parametre>> {
    const response = await api.put(`/parametres/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/parametres/${id}`)
    return response.data
  },

  async getByCategorie(categorie: string): Promise<PaginatedResponse<Parametre>> {
    const response = await api.get("/parametres", { params: { categorie } })
    return response.data
  },
}
