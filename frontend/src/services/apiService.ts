import axios from 'axios';
import { cacheService, CacheTTL, CacheKeys } from './cacheService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Region {
  id: number;
  nom: string;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  geom: any;
  createdAt: string;
  updatedAt: string;
}

export interface Departement {
  id: number;
  regionId: number;
  departement: string;
  fit1: number;
  fit2: number;
  fit3: number;
  fit4: number;
  geom: any;
  createdAt: string;
  updatedAt: string;
}

export interface Commune {
  id: number;
  departementId: number;
  commune: string;
  superficie: number | null;
  fit1: number;
  fit2: number;
  fit3: number;
  fit4: number;
  division: string;
  geom: any;
  createdAt: string;
  updatedAt: string;
}

export interface Cameroun {
  id: number;
  forme: string;
  geom: any;
  createdAt: string;
  updatedAt: string;
}

export interface Arrondissement {
  id: number;
  nom: string;
  population: number | null;
  zone: string | null;
  latitude: number | null;
  longitude: number | null;
  geometry: any;
  departementId: number;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: number;
  region?: string;
  area?: number;
  code_ds?: string;
  nom_ds?: string;
  geom?: any;
  nom?: string;
  responsable?: string;
  population?: number;
  superficie?: number;
  sitesDisponibles?: number;
  sitesTotaux?: number;
  regionId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Airesante {
  id: number;
  nom_as?: string;
  nom_dist?: string;
  code_as?: string;
  area?: number;
  geom?: any;
  nom?: string;
  responsable?: string;
  contact?: string;
  districtId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Fosa {
  id: number;
  nom: string;
  type: string;
  capaciteLits: number | null;
  estFerme: boolean;
  situation: string | null;
  arrondissementId: number;
  airesanteId: number | null;
  createdAt: string;
  updatedAt: string;
  arrondissement?: Arrondissement;
  airesante?: {
    id: number;
    nom: string;
    district?: {
      id: number;
      nom: string;
      region?: Region;
    };
  };
}

export const apiService = {
  // Regions
  async getRegions(): Promise<Region[]> {
    return cacheService.getOrFetch(
      CacheKeys.regions(),
      async () => {
        const response = await apiClient.get('/regions');
        return response.data.data;
      },
      CacheTTL.REGIONS
    );
  },

  // Departements
  async getDepartements(): Promise<Departement[]> {
    return cacheService.getOrFetch(
      CacheKeys.departements(),
      async () => {
        const response = await apiClient.get('/departements');
        return response.data.data;
      },
      CacheTTL.DEPARTEMENTS
    );
  },

  // Arrondissements
  async getArrondissements(): Promise<Arrondissement[]> {
    return cacheService.getOrFetch(
      CacheKeys.arrondissements(),
      async () => {
        const response = await apiClient.get('/arrondissements');
        return response.data.data;
      },
      CacheTTL.ARRONDISSEMENTS
    );
  },

  // FOSA
  async getFosas(): Promise<Fosa[]> {
    return cacheService.getOrFetch(
      CacheKeys.fosas(),
      async () => {
        const response = await apiClient.get('/fosas');
        return response.data.data;
      },
      CacheTTL.FOSAS
    );
  },

  async getFosaById(id: number): Promise<Fosa> {
    return cacheService.getOrFetch(
      CacheKeys.fosa(id),
      async () => {
        const response = await apiClient.get(`/fosas/${id}`);
        return response.data.data;
      },
      CacheTTL.FOSAS
    );
  },

  // Communes
  async getCommunes(): Promise<Commune[]> {
    return cacheService.getOrFetch(
      CacheKeys.communes(),
      async () => {
        const response = await apiClient.get('/communes');
        return response.data.data;
      },
      CacheTTL.COMMUNES
    );
  },

  // Cameroun
  async getCameroun(): Promise<Cameroun[]> {
    return cacheService.getOrFetch(
      CacheKeys.cameroon(),
      async () => {
        const response = await apiClient.get('/cameroun');
        return response.data.data;
      },
      CacheTTL.CAMEROON
    );
  },

  // Districts
  async getDistricts(): Promise<District[]> {
    return cacheService.getOrFetch(
      CacheKeys.districts(),
      async () => {
        const response = await apiClient.get('/districts');
        return response.data.data;
      },
      CacheTTL.DISTRICTS
    );
  },

  // Aires de santé
  async getAiresantes(): Promise<Airesante[]> {
    return cacheService.getOrFetch(
      CacheKeys.airesantes(),
      async () => {
        const response = await apiClient.get('/airesantes');
        return response.data.data;
      },
      CacheTTL.AIRESANTES
    );
  },

  // Méthodes utilitaires pour gérer le cache
  clearCache(): void {
    cacheService.clear();
  },

  invalidateCache(pattern: string | RegExp): void {
    cacheService.invalidate(pattern);
  },

  getCacheStats() {
    return cacheService.getStats();
  },
};

export default apiService;
