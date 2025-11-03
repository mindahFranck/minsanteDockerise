import axios from 'axios';

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
    const response = await apiClient.get('/regions');
    return response.data.data;
  },

  // Departements
  async getDepartements(): Promise<Departement[]> {
    const response = await apiClient.get('/departements');
    return response.data.data;
  },

  // Arrondissements
  async getArrondissements(): Promise<Arrondissement[]> {
    const response = await apiClient.get('/arrondissements');
    return response.data.data;
  },

  // FOSA
  async getFosas(): Promise<Fosa[]> {
    const response = await apiClient.get('/fosas');
    return response.data.data;
  },

  async getFosaById(id: number): Promise<Fosa> {
    const response = await apiClient.get(`/fosas/${id}`);
    return response.data.data;
  },

  // Communes
  async getCommunes(): Promise<Commune[]> {
    const response = await apiClient.get('/communes');
    return response.data.data;
  },

  // Cameroun
  async getCameroun(): Promise<Cameroun[]> {
    const response = await apiClient.get('/cameroun');
    return response.data.data;
  },
};

export default apiService;
