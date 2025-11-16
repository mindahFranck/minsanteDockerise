import api from "./api"
import type { District, PaginatedResponse } from "../types"
import { cacheService, CacheTTL, CacheKeys } from "./cacheService"

export const districtService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    // Ne pas cacher les résultats paginés ou avec recherche
    const response = await api.get<PaginatedResponse<District>>("/districts", { params })
    return response.data
  },

  getById: async (id: number) => {
    return cacheService.getOrFetch(
      CacheKeys.district(id),
      async () => {
        const response = await api.get<District>(`/districts/${id}`)
        return response.data
      },
      CacheTTL.DISTRICTS
    )
  },

  create: async (data: Omit<District, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<District>("/districts", data)
    // Invalider le cache des districts après création
    cacheService.invalidate(/^districts_/)
    cacheService.invalidate(/^map_districts_/)
    return response.data
  },

  update: async (id: number, data: Partial<District>) => {
    const response = await api.put<District>(`/districts/${id}`, data)
    // Invalider le cache après mise à jour
    cacheService.delete(CacheKeys.district(id))
    cacheService.invalidate(/^districts_/)
    cacheService.invalidate(/^map_districts_/)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/districts/${id}`)
    // Invalider le cache après suppression
    cacheService.delete(CacheKeys.district(id))
    cacheService.invalidate(/^districts_/)
    cacheService.invalidate(/^map_districts_/)
  },

  // Méthodes pour la carte (avec geom)
  getAllForMap: async (params?: { limit?: number; offset?: number }) => {
    // Ne pas cacher les requêtes paginées
    if (params?.limit !== undefined || params?.offset !== undefined) {
      const response = await api.get<{ success: boolean; data: District[] }>("/districts/map/all", { params })
      return response.data
    }

    // Cacher uniquement les requêtes complètes (sans pagination)
    return cacheService.getOrFetch(
      CacheKeys.mapDistricts(),
      async () => {
        const response = await api.get<{ success: boolean; data: District[] }>("/districts/map/all")
        return response.data
      },
      CacheTTL.MAP_DISTRICTS
    )
  },

  getByIdForMap: async (id: number) => {
    return cacheService.getOrFetch(
      `map_district_${id}`,
      async () => {
        const response = await api.get<{ success: boolean; data: District }>(`/districts/map/${id}`)
        return response.data
      },
      CacheTTL.MAP_DISTRICTS
    )
  },

  getByRegionForMap: async (regionId: number) => {
    return cacheService.getOrFetch(
      CacheKeys.districtsByRegion(regionId),
      async () => {
        const response = await api.get<{ success: boolean; data: District[] }>(`/districts/map/region/${regionId}`)
        return response.data
      },
      CacheTTL.MAP_DISTRICTS
    )
  },
}
