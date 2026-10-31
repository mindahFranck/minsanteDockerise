import axios from "axios";
import { cacheService, CacheTTL, CacheKeys } from "./cacheService";
import { attachNotifications } from "./apiNotifications";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Erreurs explicites ; pas de toast de succès (client surtout utilisé en lecture par la carte)
attachNotifications(apiClient, { success: false });

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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

/* --- Carte : fiche FOSA et analyse thématique ------------------------------ */

export interface GeoRef {
  id: number;
  nom: string;
  code?: string | null;
}

export interface LabelTotal {
  label: string;
  total: number;
}

export interface FosaDetails {
  id: number;
  nom: string;
  type: string | null;
  categorie: string | null;
  statut: string | null;
  estFerme: boolean;
  fonctionnelle: boolean | null;
  situation: string | null;
  orgUnit: string | null;
  image: string | null;
  localisation: {
    region: GeoRef | null;
    departement: GeoRef | null;
    arrondissement: GeoRef | null;
    district: GeoRef | null;
    airesante: GeoRef | null;
    latitude: number | null;
    longitude: number | null;
    geolocalisee: boolean;
  };
  capaciteLits: number | null;
  securite: { titreFoncier: boolean | null; cloture: boolean | null };
  energie: { connecteeElectricite: boolean | null; typeCourant: string | null };
  contact: {
    telephone: string | null;
    email: string | null;
    responsableNom: string | null;
    responsableTelephone: string | null;
    nomDirecteur: string | null;
  };
  maintenance: {
    derniereInspection: string | null;
    prochaineInspection: string | null;
    priorite: string | null;
    problemes: string[] | null;
  };
  batiments: { total: number; superficie: number; parEtat: LabelTotal[] };
  services: {
    total: number;
    liste: { id: number; nom: string; responsable: string | null; capacite: number | null; equipementsBiomedicaux: number }[];
  };
  personnel: { total: number; parCategorie: LabelTotal[] };
  equipements: { biomedicaux: number; biomedicauxParEtat: LabelTotal[]; autres: number };
  vehicules: { total: number; ambulances: number };
  patients: { total: number | null; ambulants: number | null; date: string | null } | null;
}

export type ThematicLevel = "region" | "departement" | "arrondissement" | "district" | "airesante";

export interface ThematicIndicator {
  oui: number;
  non: number;
  nonRenseigne: number;
  /** Part des FOSA de l'entité avec « oui », en % ; null si l'entité n'a aucune FOSA. */
  taux: number | null;
}

export interface ThematicEntity {
  id: number;
  nom: string;
  total: number;
  ouvertes: number;
  titreFoncier: ThematicIndicator;
  cloture: ThematicIndicator;
  electricite: ThematicIndicator;
}

export interface ThematicData {
  level: ThematicLevel;
  parentId: number | null;
  entities: ThematicEntity[];
  totals: { total: number; ouvertes: number; titreFoncier: ThematicIndicator; cloture: ThematicIndicator; electricite: ThematicIndicator };
  source: string;
  genereLe: string;
}

export const apiService = {
  // Regions (include_geom pour la carte)
  async getRegions(includeGeom = true): Promise<Region[]> {
    return cacheService.getOrFetch(
      CacheKeys.regions() + (includeGeom ? ':geom' : ''),
      async () => {
        const response = await apiClient.get("/regions", { params: includeGeom ? { include_geom: true } : {} });
        return response.data.data;
      },
      CacheTTL.REGIONS
    );
  },

  // Departements (include_geom pour la carte)
  async getDepartements(includeGeom = true): Promise<Departement[]> {
    return cacheService.getOrFetch(
      CacheKeys.departements() + (includeGeom ? ':geom' : ''),
      async () => {
        const response = await apiClient.get("/departements", { params: includeGeom ? { include_geom: true } : {} });
        return response.data.data;
      },
      CacheTTL.DEPARTEMENTS
    );
  },

  // Arrondissements (sans geom par défaut - trop lourd)
  async getArrondissements(includeGeom = true): Promise<Arrondissement[]> {
    return cacheService.getOrFetch(
      CacheKeys.arrondissements() + (includeGeom ? ':geom' : ''),
      async () => {
        const response = await apiClient.get("/arrondissements", { params: includeGeom ? { include_geom: true } : {} });
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
        const response = await apiClient.get("/fosas");
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

  /** Fiche détaillée d'une FOSA pour la carte (GET /fosas/{id}/details). */
  async getFosaDetails(id: number | string): Promise<FosaDetails> {
    const response = await apiClient.get(`/fosas/${id}/details`);
    return response.data.data;
  },

  /** Analyse thématique de la carte (GET /fosas/thematic), calculée en base. */
  async getThematic(level: ThematicLevel, parent?: { param: string; id: number }): Promise<ThematicData> {
    const params: Record<string, string | number> = { level };
    if (parent) params[parent.param] = parent.id;
    const response = await apiClient.get("/fosas/thematic", { params });
    return response.data.data;
  },

  // Communes
  async getCommunes(): Promise<Commune[]> {
    return cacheService.getOrFetch(
      CacheKeys.communes(),
      async () => {
        const response = await apiClient.get("/communes");
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
        const response = await apiClient.get("/cameroun");
        return response.data.data;
      },
      CacheTTL.CAMEROON
    );
  },

  // Districts
  async getDistricts(includeGeom = false): Promise<District[]> {
    return cacheService.getOrFetch(
      CacheKeys.districts() + (includeGeom ? ':geom' : ''),
      async () => {
        const response = await apiClient.get("/districts", { params: includeGeom ? { include_geom: true } : {} });
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
        const response = await apiClient.get("/airesantes");
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
