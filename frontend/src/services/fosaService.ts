import api from "./api"

export interface Fosa {
  id: number
  nom: string
  type: string
  latitude?: number
  longitude?: number
  capacite?: number
  etatFermeture?: string
  situation?: string
  image?: string
  airesanteId?: number
  arrondissementId?: number
  createdAt?: string
  updatedAt?: string
}

export interface FosaCreateData {
  nom: string
  type: string
  latitude?: number
  longitude?: number
  capacite?: number
  etatFermeture?: string
  situation?: string
  airesanteId?: number
  arrondissementId?: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class FosaService {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
  }): Promise<PaginatedResponse<Fosa>> {
    const response = await api.get<PaginatedResponse<Fosa>>("/fosas", { params })
    return response.data
  }

  async getById(id: number): Promise<ApiResponse<Fosa>> {
    const response = await api.get<ApiResponse<Fosa>>(`/fosas/${id}`)
    return response.data
  }

  async create(data: FosaCreateData, image?: File): Promise<ApiResponse<Fosa>> {
    const formData = new FormData()

    // Append all fosa data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    // Append image if provided
    if (image) {
      formData.append("image", image)
    }

    const response = await api.post<ApiResponse<Fosa>>("/fosas", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  }

  async update(id: number, data: Partial<FosaCreateData>, image?: File): Promise<ApiResponse<Fosa>> {
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    if (image) {
      formData.append("image", image)
    }

    const response = await api.put<ApiResponse<Fosa>>(`/fosas/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/fosas/${id}`)
    return response.data
  }

  getImageUrl(imagePath?: string): string {
    if (!imagePath) return "/placeholder-hospital.png"
    return `${api.defaults.baseURL?.replace("/api", "")}${imagePath}`
  }
}

const fosaService = new FosaService()

export { fosaService }
export default fosaService
