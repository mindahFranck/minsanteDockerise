import api from "./api"
import { resolveImageUrl } from "../utils/imageUrl"
import type { Materielroulant, PaginatedResponse } from "../types"

/** Construit un FormData à partir des données + image (upload véhicule). */
function toFormData(data: Record<string, any>, image?: File | null): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    fd.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value))
  }
  if (image) fd.append("image", image)
  return fd
}

export const materielroulantService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; fosaId?: number }) => {
    const response = await api.get<PaginatedResponse<Materielroulant>>("/materielroulants", { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Materielroulant>(`/materielroulants/${id}`)
    return response.data
  },

  create: async (data: Partial<Materielroulant>, image?: File | null) => {
    if (image) {
      const response = await api.post<Materielroulant>("/materielroulants", toFormData(data, image), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
    }
    const response = await api.post<Materielroulant>("/materielroulants", data)
    return response.data
  },

  update: async (id: number, data: Partial<Materielroulant>, image?: File | null) => {
    if (image) {
      // Laravel : POST avec _method=PUT pour supporter multipart/form-data
      const fd = toFormData(data, image)
      fd.append("_method", "PUT")
      const response = await api.post<Materielroulant>(`/materielroulants/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
    }
    const response = await api.put<Materielroulant>(`/materielroulants/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/materielroulants/${id}`)
  },

  /** URL absolue de l'image d'un véhicule (placeholder si absente). */
  getImageUrl: (imagePath?: string): string =>
    resolveImageUrl(imagePath, api.defaults.baseURL || undefined) ?? "/placeholder-hospital.png",
}
