import api from "./api";
import { offlineCache } from "./offlineCache";

export interface Fosa {
  id: number;
  nom: string;
  type: string;
  capaciteLits?: number | null;
  estFerme: boolean;
  situation: string;
  image?: string | null;
  airesanteId: number;
  arrondissementId: number;
  statutRec?: string;
  categorieRec?: string;
  // Coordonnées
  longitude?: number;
  latitude?: number;

  // Questions OUI/NON
  aCloture?: boolean;
  aTitreFoncier?: boolean;
  connecteeElectricite?: boolean;
  typeCourant?: string;

  // Relations
  arrondissement?: any;
  airesante?: any;

  createdAt?: string;
  updatedAt?: string;
}

export interface FosaCreateData {
  nom: string;
  type: string;
  capaciteLits?: number;
  estFerme?: boolean;
  situation?: string;
  airesanteId: number;
  arrondissementId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class FosaService {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }): Promise<PaginatedResponse<Fosa>> {
    try {
      const response = await api.get<PaginatedResponse<Fosa>>("/fosas", {
        params,
      });
      // Mémoriser pour usage hors ligne (uniquement en lecture sans filtre)
      if (!params || (!params.page && !params.search && !params.type)) {
        try {
          await offlineCache.saveFosas(response.data.data || []);
        } catch {
          // ignore cache write failures
        }
      }
      return response.data;
    } catch (err) {
      if (!navigator.onLine) {
        const cached = await offlineCache.getFosas();
        if (cached.length) {
          return {
            success: true,
            data: cached,
            pagination: {
              page: 1,
              limit: cached.length,
              total: cached.length,
              totalPages: 1,
            },
          };
        }
      }
      throw err;
    }
  }

  async getById(id: number): Promise<ApiResponse<Fosa>> {
    try {
      const response = await api.get<ApiResponse<Fosa>>(`/fosas/${id}`);
      return response.data;
    } catch (err) {
      if (!navigator.onLine) {
        const cached = await offlineCache.getFosaById(id);
        if (cached) return { success: true, data: cached };
      }
      throw err;
    }
  }

  async create(data: FosaCreateData, image?: File): Promise<ApiResponse<Fosa>> {
    const formData = new FormData();

    // Append all fosa data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Append image if provided
    if (image) {
      formData.append("image", image);
    }

    const response = await api.post<ApiResponse<Fosa>>("/fosas", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async update(
    id: number,
    data: Partial<FosaCreateData>,
    image?: File
  ): Promise<ApiResponse<Fosa>> {
    const formData = new FormData();

    // Exclure les champs non modifiables
    const excludeFields = ['latitude', 'longitude', 'arrondissementId', 'airesanteId'];
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && !excludeFields.includes(key)) {
        formData.append(key, value.toString());
      }
    });

    if (image) {
      formData.append("image", image);
    }

    // Laravel: POST avec _method=PUT pour supporter multipart/form-data
    formData.append("_method", "PUT");
    const response = await api.post<ApiResponse<Fosa>>(
      `/fosas/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/fosas/${id}`);
    return response.data;
  }

  // Spatial queries
  async getByRegionSpatial(regionId: number): Promise<Fosa[]> {
    const cacheKey = `spatial:region:${regionId}`;
    try {
      const response = await api.get<{
        success: boolean;
        data: Fosa[];
        count: number;
      }>(`/fosas/spatial/region/${regionId}`);
      try { await offlineCache.saveGeoData(cacheKey, response.data.data); } catch {}
      return response.data.data;
    } catch (err) {
      if (!navigator.onLine) {
        const cached = await offlineCache.getGeoData<Fosa[]>(cacheKey);
        if (cached) return cached;
      }
      throw err;
    }
  }

  async getByDepartementSpatial(departementId: number): Promise<Fosa[]> {
    const cacheKey = `spatial:departement:${departementId}`;
    try {
      const response = await api.get<{
        success: boolean;
        data: Fosa[];
        count: number;
      }>(`/fosas/spatial/departement/${departementId}`);
      try { await offlineCache.saveGeoData(cacheKey, response.data.data); } catch {}
      return response.data.data;
    } catch (err) {
      if (!navigator.onLine) {
        const cached = await offlineCache.getGeoData<Fosa[]>(cacheKey);
        if (cached) return cached;
      }
      throw err;
    }
  }

  async getByArrondissementSpatial(arrondissementId: number): Promise<Fosa[]> {
    const cacheKey = `spatial:arrondissement:${arrondissementId}`;
    try {
      const response = await api.get<{
        success: boolean;
        data: Fosa[];
        count: number;
      }>(`/fosas/spatial/arrondissement/${arrondissementId}`);
      try { await offlineCache.saveGeoData(cacheKey, response.data.data); } catch {}
      return response.data.data;
    } catch (err) {
      if (!navigator.onLine) {
        const cached = await offlineCache.getGeoData<Fosa[]>(cacheKey);
        if (cached) return cached;
      }
      throw err;
    }
  }

  getImageUrl(imagePath?: string): string {
    if (!imagePath) return "/placeholder-hospital.png";
    if (imagePath.startsWith("http")) return imagePath;
    // Extraire le domaine depuis baseURL (enlever /api/v1 à la fin)
    const baseUrl = (api.defaults.baseURL || "").replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
    if (imagePath.startsWith("/")) return `${baseUrl}${imagePath}`;
    return `${baseUrl}/storage/${imagePath}`;
  }
}

const fosaService = new FosaService();

export { fosaService };
export default fosaService;
