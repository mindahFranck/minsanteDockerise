import api from "./api"
import type { User, PaginatedResponse, ApiResponse } from "../types"

export const userService = {
  async getAll(params?: {
    page?: number
    limit?: number
    role?: string
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get("/users", { params })
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  async create(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.post("/users", data)
    return response.data
  },

  async update(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    const response = await api.put("/auth/password", { oldPassword, newPassword })
    return response.data
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put("/auth/me", data)
    return response.data
  },
}
