/**
 * Service de cache pour optimiser les appels API
 * Utilise la mémoire comme cache principal et localStorage comme backup
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

interface CacheConfig {
  useLocalStorage?: boolean;
  defaultTTL?: number; // TTL par défaut en millisecondes
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.config = {
      useLocalStorage: config.useLocalStorage ?? true,
      defaultTTL: config.defaultTTL ?? 5 * 60 * 1000, // 5 minutes par défaut
    };

    // Charger le cache depuis localStorage au démarrage
    if (this.config.useLocalStorage) {
      this.loadFromLocalStorage();
    }

    // Nettoyer le cache expiré toutes les minutes
    setInterval(() => this.cleanExpiredEntries(), 60 * 1000);
  }

  /**
   * Obtenir une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromLocalStorage(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocker une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL!,
    };

    this.cache.set(key, entry);

    // Sauvegarder dans localStorage si activé
    if (this.config.useLocalStorage) {
      this.saveToLocalStorage(key, entry);
    }
  }

  /**
   * Vérifier si une clé existe et est valide
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.removeFromLocalStorage(key);
  }

  /**
   * Invalider toutes les entrées correspondant à un pattern
   */
  invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    Array.from(this.cache.keys()).forEach((key) => {
      if (regex.test(key)) {
        this.delete(key);
      }
    });
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
    if (this.config.useLocalStorage) {
      this.clearLocalStorage();
    }
  }

  /**
   * Obtenir ou créer une valeur dans le cache
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Vérifier le cache d'abord
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Sinon, récupérer les données
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.delete(key));
  }

  /**
   * Sauvegarder dans localStorage
   */
  private saveToLocalStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const cacheKey = `cache_${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }

  /**
   * Supprimer de localStorage
   */
  private removeFromLocalStorage(key: string): void {
    try {
      const cacheKey = `cache_${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Erreur lors de la suppression de localStorage:', error);
    }
  }

  /**
   * Charger depuis localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith('cache_'));

      cacheKeys.forEach((cacheKey) => {
        const key = cacheKey.replace('cache_', '');
        const item = localStorage.getItem(cacheKey);

        if (item) {
          try {
            const entry: CacheEntry<any> = JSON.parse(item);

            // Vérifier si l'entrée n'a pas expiré
            if (Date.now() - entry.timestamp <= entry.ttl) {
              this.cache.set(key, entry);
            } else {
              // Supprimer les entrées expirées
              localStorage.removeItem(cacheKey);
            }
          } catch (parseError) {
            console.warn('Erreur lors du parsing du cache:', parseError);
            localStorage.removeItem(cacheKey);
          }
        }
      });
    } catch (error) {
      console.warn('Erreur lors du chargement depuis localStorage:', error);
    }
  }

  /**
   * Vider localStorage
   */
  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith('cache_'));
      cacheKeys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Erreur lors du vidage de localStorage:', error);
    }
  }

  /**
   * Obtenir des statistiques sur le cache
   */
  getStats(): {
    size: number;
    keys: string[];
    expired: number;
  } {
    const now = Date.now();
    let expired = 0;

    this.cache.forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    });

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expired,
    };
  }
}

// Créer une instance singleton avec configuration par défaut
export const cacheService = new CacheService({
  useLocalStorage: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
});

// Configuration des TTL par type de données
export const CacheTTL = {
  // Données géographiques (rarement modifiées) - 30 minutes
  REGIONS: 30 * 60 * 1000,
  DEPARTEMENTS: 30 * 60 * 1000,
  COMMUNES: 30 * 60 * 1000,
  ARRONDISSEMENTS: 30 * 60 * 1000,
  DISTRICTS: 30 * 60 * 1000,
  AIRESANTES: 30 * 60 * 1000,
  CAMEROON: 60 * 60 * 1000, // 1 heure (très stable)

  // Données de santé (mises à jour fréquemment) - 5 minutes
  FOSAS: 5 * 60 * 1000,
  FOSAS_LIST: 2 * 60 * 1000, // 2 minutes pour les listes

  // Données de map avec géométrie (volumineuses) - 15 minutes
  MAP_REGIONS: 15 * 60 * 1000,
  MAP_DISTRICTS: 15 * 60 * 1000,
  MAP_AIRESANTES: 15 * 60 * 1000,
};

// Clés de cache
export const CacheKeys = {
  regions: () => 'regions_all',
  departements: () => 'departements_all',
  communes: () => 'communes_all',
  arrondissements: () => 'arrondissements_all',
  districts: () => 'districts_all',
  airesantes: () => 'airesantes_all',
  fosas: () => 'fosas_all',
  cameroon: () => 'cameroon_data',

  // Clés pour les données de map
  mapDistricts: () => 'map_districts_all',
  mapAiresantes: () => 'map_airesantes_all',

  // Clés avec ID
  region: (id: number) => `region_${id}`,
  departement: (id: number) => `departement_${id}`,
  commune: (id: number) => `commune_${id}`,
  arrondissement: (id: number) => `arrondissement_${id}`,
  district: (id: number) => `district_${id}`,
  airesante: (id: number) => `airesante_${id}`,
  fosa: (id: number) => `fosa_${id}`,

  // Clés avec relations
  departementsByRegion: (regionId: number) => `departements_region_${regionId}`,
  districtsByRegion: (regionId: number) => `districts_region_${regionId}`,
  airesantesByDistrict: (districtId: number) => `airesantes_district_${districtId}`,
};

export default cacheService;
