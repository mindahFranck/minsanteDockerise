import api from "./api"
import type { Airesante, PaginatedResponse } from "../types"
import { cacheService, CacheTTL, CacheKeys } from "./cacheService"

export const airesanteService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; districtId?: number }) => {
    // Ne pas cacher les résultats paginés ou avec recherche
    const response = await api.get<PaginatedResponse<Airesante>>("/airesantes", { params })
    return response.data
  },

  getById: async (id: number) => {
    return cacheService.getOrFetch(
      CacheKeys.airesante(id),
      async () => {
        const response = await api.get<Airesante>(`/airesantes/${id}`)
        return response.data
      },
      CacheTTL.AIRESANTES
    )
  },

  create: async (data: Omit<Airesante, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<Airesante>("/airesantes", data)
    // Invalider le cache après création
    cacheService.invalidate(/^airesantes_/)
    cacheService.invalidate(/^map_airesantes_/)
    return response.data
  },

  update: async (id: number, data: Partial<Airesante>) => {
    const response = await api.put<Airesante>(`/airesantes/${id}`, data)
    // Invalider le cache après mise à jour
    cacheService.delete(CacheKeys.airesante(id))
    cacheService.invalidate(/^airesantes_/)
    cacheService.invalidate(/^map_airesantes_/)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/airesantes/${id}`)
    // Invalider le cache après suppression
    cacheService.delete(CacheKeys.airesante(id))
    cacheService.invalidate(/^airesantes_/)
    cacheService.invalidate(/^map_airesantes_/)
  },

  // Méthodes pour la carte (avec geom)
  getAllForMap: async () => {
    return cacheService.getOrFetch(
      CacheKeys.mapAiresantes(),
      async () => {
        const response = await api.get<{ success: boolean; data: Airesante[] }>("/airesantes/map/all")
        return response.data
      },
      CacheTTL.MAP_AIRESANTES
    )
  },

  getByIdForMap: async (id: number) => {
    return cacheService.getOrFetch(
      `map_airesante_${id}`,
      async () => {
        const response = await api.get<{ success: boolean; data: Airesante }>(`/airesantes/map/${id}`)
        return response.data
      },
      CacheTTL.MAP_AIRESANTES
    )
  },

  getByDistrictForMap: async (districtId: number) => {
    return cacheService.getOrFetch(
      CacheKeys.airesantesByDistrict(districtId),
      async () => {
        const response = await api.get<{ success: boolean; data: Airesante[] }>(`/airesantes/map/district/${districtId}`)
        return response.data
      },
      CacheTTL.MAP_AIRESANTES
    )
  },
}
