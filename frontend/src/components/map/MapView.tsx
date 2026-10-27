/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Tooltip, useMap } from "react-leaflet";
import {
  Filter,
  Layers,
  Search,
  MapPin,
  X,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  Building,
} from "lucide-react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { apiService } from "../../services/apiService";
import { districtService } from "../../services/districtService";
import { airesanteService } from "../../services/airesanteService";
import ThematicAnalysis, { ThematicTheme } from "./ThematicAnalysis";
import MapLegend from "./MapLegend";
import TilePreloader from "./TilePreloader";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CAMEROON_CENTER = [5.6919, 12.7289] as [number, number];
// Définir les bounds comme coordonnées brutes, pas comme objet Leaflet
const CAMEROON_BOUNDS_COORDS: [[number, number], [number, number]] = [[1.6546, 8.4948], [13.0783, 16.1921]];

// Fonction helper pour créer des bounds sûrs
const createSafeBounds = (coords: [[number, number], [number, number]]) => {
  try {
    const bounds = L.latLngBounds(coords[0], coords[1]);
    if (bounds.isValid()) {
      return bounds;
    }
  } catch (e) {
    console.warn('⚠️ Erreur création bounds:', e);
  }
  // Fallback: créer des bounds manuellement
  return L.latLngBounds(
    L.latLng(1.6546, 8.4948),
    L.latLng(13.0783, 16.1921)
  );
};

interface Hospital {
  image: any;
  batimentsCount: number;
  vehiculesCount: number;
  ambulancesCount: number;
  personnelByCategory: Array<{ category: string; count: number }>;
  aTitreFoncier: any;
  aCloture: any;
  id: string;
  name: string;
  type: 'public' | 'parapublic' | 'prive_laic' | 'prive_confessionnel';
  fosaType?: string;
  category: string;
  status: 'operational' | 'maintenance' | 'construction' | 'closed';
  coordinates: [number, number];
  address: string;
  city: string;
  region: string;
  budget: {
    annual: number;
    personnel: number;
    equipment: number;
    maintenance: number;
  };
  capacity: {
    beds: number;
    staff: number;
    doctors: number;
  };
  services: string[];
  equipment: Array<{
    category: string;
    items: Array<{
      name: string;
      quantity: number;
      condition: string;
    }>;
  }>;
  maintenance: {
    lastInspection: string;
    nextInspection: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    issues: string[];
  };
  contact: {
    phone: string;
    email: string;
  };
}

const MapRefBridge: React.FC<{ onReady: (m: L.Map) => void }> = ({ onReady }) => {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
};

const MapController: React.FC<{
  selectedRegion: string;
  selectedDepartement: string;
  selectedArrondissement: string;
  selectedDistrict: string;
  selectedAiresante: string;
  regionsPolygons: { [key: string]: [number, number][] };
  departementsPolygons: { [key: string]: [number, number][] };
  districtsPolygons: { [key: string]: [number, number][] };
  airesantesPolygons: { [key: string]: [number, number][] };
  hospitals: Hospital[];
}> = ({
  selectedRegion,
  selectedDepartement,
  selectedArrondissement,
  selectedDistrict,
  selectedAiresante,
  regionsPolygons,
  departementsPolygons,
  districtsPolygons,
  airesantesPolygons,
}) => {
    const map = useMap();
    const previousSelectionRef = useRef<string>("all");

    useEffect(() => {
      const isValidPolygon = (polygon: [number, number][]): boolean => {
        if (!polygon || polygon.length === 0) return false;
        return polygon.every(([lat, lng]) =>
          !isNaN(lat) && !isNaN(lng) &&
          typeof lat === 'number' && typeof lng === 'number' &&
          lat >= 1.0 && lat <= 13.0 &&
          lng >= 8.0 && lng <= 17.0
        );
      };

      const currentSelection = `${selectedRegion}|${selectedDepartement}|${selectedArrondissement}|${selectedDistrict}|${selectedAiresante}`;

      if (currentSelection === previousSelectionRef.current) {
        return;
      }

      try {
        let boundsSet = false;

        if (selectedAiresante !== 'all' && airesantesPolygons[selectedAiresante]) {
          const polygon = airesantesPolygons[selectedAiresante];
          if (isValidPolygon(polygon)) {
            try {
              const bounds = L.latLngBounds(polygon);
              if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
                boundsSet = true;
              }
            } catch (e) {
              console.warn('⚠️ Bounds invalides pour aire de santé:', selectedAiresante);
            }
          }
        } else if (selectedDistrict !== 'all' && districtsPolygons[selectedDistrict]) {
          const polygon = districtsPolygons[selectedDistrict];
          if (isValidPolygon(polygon)) {
            try {
              const bounds = L.latLngBounds(polygon);
              if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [40, 40] });
                boundsSet = true;
              }
            } catch (e) {
              console.warn('⚠️ Bounds invalides pour district:', selectedDistrict);
            }
          }
        } else if (selectedDepartement !== 'all' && departementsPolygons[selectedDepartement]) {
          const polygon = departementsPolygons[selectedDepartement];
          if (isValidPolygon(polygon)) {
            try {
              const bounds = L.latLngBounds(polygon);
              if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [35, 35] });
                boundsSet = true;
              }
            } catch (e) {
              console.warn('⚠️ Bounds invalides pour département:', selectedDepartement);
            }
          }
        } else if (selectedRegion !== 'all' && regionsPolygons[selectedRegion]) {
          const polygon = regionsPolygons[selectedRegion];
          if (isValidPolygon(polygon)) {
            try {
              const bounds = L.latLngBounds(polygon);
              if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [30, 30] });
                boundsSet = true;
              }
            } catch (e) {
              console.warn('⚠️ Bounds invalides pour région:', selectedRegion);
            }
          }
        }

        // Si aucun bounds n'a été défini, revenir à la vue Cameroun
        if (!boundsSet) {
          const cameroonBounds = createSafeBounds(CAMEROON_BOUNDS_COORDS);
          map.fitBounds(cameroonBounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('💥 Erreur lors du zoom:', error);
        try {
          const cameroonBounds = createSafeBounds(CAMEROON_BOUNDS_COORDS);
          map.fitBounds(cameroonBounds, { padding: [20, 20] });
        } catch (e) {
          console.error('💥 Impossible de revenir à la vue Cameroun:', e);
          // Dernier recours: setView sur le centre du Cameroun
          map.setView(CAMEROON_CENTER, 6);
        }
      }

      previousSelectionRef.current = currentSelection;
    }, [selectedRegion, selectedDepartement, selectedArrondissement, selectedDistrict, selectedAiresante, regionsPolygons, departementsPolygons, districtsPolygons, airesantesPolygons, map]);

    return null;
  };

const MapView: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTitreFoncier, setSelectedTitreFoncier] = useState<string>("all");
  const [selectedCloture, setSelectedCloture] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedDepartement, setSelectedDepartement] = useState<string>("all");
  const [selectedArrondissement, setSelectedArrondissement] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedAiresante, setSelectedAiresante] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mapStyle, setMapStyle] = useState("osm");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const [cameroonPolygon, setCameroonPolygon] = useState<[number, number][]>([]);
  const [regionsPolygons, setRegionsPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [departementsPolygons, setDepartementsPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [arrondissementsPolygons, setArrondissementsPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [districtsPolygons, setDistrictsPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [airesantesPolygons, setAiresantesPolygons] = useState<{ [key: string]: [number, number][] }>({});

  // Données complètes stockées en background
  const [allRegionsData, setAllRegionsData] = useState<any[]>([]);
  const [allDepartementsData, setAllDepartementsData] = useState<any[]>([]);
  const [allArrondissementsData, setAllArrondissementsData] = useState<any[]>([]);
  const [allDistrictsData, setAllDistrictsData] = useState<any[]>([]);
  const [allAiresantesData, setAllAiresantesData] = useState<any[]>([]);
  const [allFosasData, setAllFosasData] = useState<any[]>([]);

  // Données filtrées pour l'affichage
  const [regionsData, setRegionsData] = useState<any[]>([]);
  const [departementsData, setDepartementsData] = useState<any[]>([]);
  const [arrondissementsData, setArrondissementsData] = useState<any[]>([]);
  const [districtsData, setDistrictsData] = useState<any[]>([]);
  const [airesantesData, setAiresantesData] = useState<any[]>([]);
  const [fosasData, setFosasData] = useState<any[]>([]);

  const [loadingProgress, setLoadingProgress] = useState({
    cameroonPolygon: false,
    regionsData: false,
    departementsData: false,
    arrondissementsData: false,
    districtsData: false,
    airesantesData: false,
    hospitalsData: false
  });

  const [progressMessage, setProgressMessage] = useState<string>('');
  const [loadingFosas, setLoadingFosas] = useState(false);
  const [showFosaLoader, setShowFosaLoader] = useState(false);

  const [layersVisibility, setLayersVisibility] = useState({
    cameroon: true,
    regions: true,
    departements: true,
    arrondissements: true,
    communes: true,
    districts: true,
    airesantes: true,
    hospitals: true
  });

  const [activeTheme, setActiveTheme] = useState<ThematicTheme | null>(null);

  // Référence pour suivre la sélection précédente
  const previousSelectionRef = useRef<string>("all");

  const toggleLayer = (layer: keyof typeof layersVisibility) => {
    setLayersVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const updateLoadingProgress = (key: keyof typeof loadingProgress, value: boolean) => {
    setLoadingProgress(prev => ({ ...prev, [key]: value }));
  };

  // Fonction pour transformer les FOSA en format Hospital
  const transformFosasToHospitals = async (fosas: any[]): Promise<Hospital[]> => {
    const arrondissements = allArrondissementsData.length > 0 ? allArrondissementsData : await apiService.getArrondissements();
    const departements = allDepartementsData.length > 0 ? allDepartementsData : await apiService.getDepartements();
    const regions = allRegionsData.length > 0 ? allRegionsData : await apiService.getRegions();

    return fosas.map((fosa: any) => {
      const arrond = arrondissements.find(a => a.id === fosa.arrondissementId);
      const departement = arrond ? departements.find(d => d.id === arrond.departementId) : null;
      const region = departement ? regions.find(r => r.id === departement.regionId) : null;

      const airesante = fosa.airesante || (fosa.airesanteId ? { id: fosa.airesanteId, nom_as: fosa.airesante?.nom_as || fosa.airesante?.nom } : null);
      const district = airesante?.district || null;

      const fosaLat = fosa.latitude !== undefined && fosa.latitude !== null ? parseFloat(fosa.latitude) : null;
      const fosaLng = fosa.longitude !== undefined && fosa.longitude !== null ? parseFloat(fosa.longitude) : null;

      const coordinates: [number, number] = (fosaLat !== null && fosaLng !== null && !isNaN(fosaLat) && !isNaN(fosaLng))
        ? [fosaLat, fosaLng]
        : (arrond && arrond.latitude && arrond.longitude)
          ? [arrond.latitude, arrond.longitude]
          : [3.8667, 11.5167];

      return {
        id: fosa.id.toString(),
        name: fosa.nom,
        _district: district?.nom_ds || district?.nom || null,
        _airesante: airesante?.nom_as || airesante?.nom || null,
        // CORRECTION: Normaliser statutRec pour gérer les variations de casse et d'accents
        type: (() => {
          const statut = (fosa.statutRec || '').toLowerCase().trim();
          if (statut === 'public') return 'public';
          if (statut === 'parapublic') return 'parapublic';
          if (statut === 'privé laïc' || statut === 'prive laic') return 'prive_laic';
          if (statut === 'privé confessionnel' || statut === 'prive confessionnel') return 'prive_confessionnel';
          return 'public'; // Par défaut
        })(),
        category: fosa.catRec || fosa.statutRec || 'FOSA',
        fosaType: fosa.type || '',
        status: fosa.estFerme ? 'closed' :
          fosa.situation?.toLowerCase().includes('maintenance') ? 'maintenance' :
            fosa.situation?.toLowerCase().includes('construction') ? 'construction' : 'operational',
        coordinates,
        address: arrond?.nom || 'Non spécifié',
        city: arrond?.nom || 'Non spécifié',
        region: region?.nom || 'Non spécifié',
        image: fosa.image ? (() => {
          const img = fosa.image;
          if (img.startsWith('http')) return img;
          const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '') || '';
          return img.startsWith('/') ? `${base}${img}` : `${base}/storage/${img}`;
        })() : null,
        aTitreFoncier: fosa.aTitreFoncier === true || fosa.aTitreFoncier === 1,
        aCloture: fosa.aCloture === true || fosa.aCloture === 1,
        batimentsCount: fosa.batiments?.length || 0,
        vehiculesCount: fosa.materielroulants?.length || 0,
        ambulancesCount: fosa.materielroulants?.filter((v: any) => v.type?.toLowerCase().includes('ambulance')).length || 0,
        personnelByCategory: fosa.personnels ?
          Object.values(fosa.personnels.reduce((acc: any, p: any) => {
            const cat = p.categorie || 'Autre';
            if (!acc[cat]) acc[cat] = { category: cat, count: 0 };
            acc[cat].count++;
            return acc;
          }, {})) : [],
        capacity: {
          beds: fosa.capaciteLits || 0,
          staff: 0,
          doctors: 0
        },
        services: ['Urgences', 'Consultation', 'Chirurgie', 'Pédiatrie', 'Maternité', 'Radiologie', 'Laboratoire', 'Pharmacie'].slice(0, Math.floor(Math.random() * 4) + 3),
        equipment: [
          {
            category: 'Imagerie médicale',
            items: [
              { name: 'Scanner', quantity: Math.floor(Math.random() * 2) + 1, condition: "excellent" },
              { name: 'IRM', quantity: Math.floor(Math.random() * 2), condition: "excellent" },
              { name: 'Échographe', quantity: Math.floor(Math.random() * 3) + 1, condition: "excellent" }
            ]
          }
        ],
        maintenance: {
          lastInspection: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          nextInspection: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
          issues: ['Équipement vieillissant', 'Besoin de maintenance préventive', 'Matériel obsolète'].slice(0, Math.floor(Math.random() * 2) + 1),
        },
        contact: {
          phone: fosa.telephone || fosa.responsableTelephone || '',
          email: '',
        },
        responsableNom: fosa.responsableNom || '',
        budget: {
          annual: 0,
          personnel: 0,
          equipment: 0,
          maintenance: 0
        }
      };
    });
  };

  // Fonction pour nettoyer complètement les données FOSA
  const clearFosaData = () => {
    setHospitals([]);
    setFilteredHospitals([]);
    setFosasData([]);
  };

  // Fonction pour charger les FOSA avec filtres spatiaux
  const fetchFosasBySpatialFilter = async () => {
    try {
      setLoadingFosas(true);
      setShowFosaLoader(true);

      // Nettoyer les données précédentes avant de charger les nouvelles
      clearFosaData();

      let endpoint = '';
      let spatialData: any[] = [];

      if (selectedAiresante !== 'all') {
        const airesante = allAiresantesData.find(a => a.nom_as === selectedAiresante || a.nom === selectedAiresante);
        if (airesante) {
          endpoint = `/fosas/spatial/airesante/${airesante.id}`;
        }
      } else if (selectedDistrict !== 'all') {
        const district = allDistrictsData.find(d => (d.nom_ds || d.nom) === selectedDistrict);
        if (district) {
          endpoint = `/fosas/spatial/district/${district.id}`;
        }
      } else if (selectedArrondissement !== 'all') {
        const arrondissement = allArrondissementsData.find(a => a.nom === selectedArrondissement);
        if (arrondissement) {
          endpoint = `/fosas/spatial/arrondissement/${arrondissement.id}`;
        }
      } else if (selectedDepartement !== 'all') {
        const departement = allDepartementsData.find(d => d.departement === selectedDepartement);
        if (departement) {
          endpoint = `/fosas/spatial/departement/${departement.id}`;
        }
      } else if (selectedRegion !== 'all') {
        const region = allRegionsData.find(r => r.nom === selectedRegion);
        if (region) {
          endpoint = `/fosas/spatial/region/${region.id}`;
        }
      }

      if (endpoint) {
        const apiBase = (import.meta as any).env?.VITE_API_URL || 'https://minsante.vps.it-grafik.com/api/v1';
        const response: any = await axios.get(`${apiBase}${endpoint}`);

        if (response.data && response.data.data) {
          spatialData = response.data.data;

          const transformedHospitals = await transformFosasToHospitals(spatialData);
          setHospitals(transformedHospitals);
          setFosasData(spatialData);
          // CORRECTION: Initialiser filteredHospitals pour permettre le filtrage local
          // Les filtres locaux (type, catégorie, etc.) seront appliqués par le useEffect qui suit
          setFilteredHospitals(transformedHospitals);
          setLoadingFosas(false);
          setShowFosaLoader(false);
          return;
        }
      }

      // Si aucun filtre spatial, charger toutes les FOSA
      console.log('🌍 Chargement de toutes les FOSA');
      fetchHospitalsData();

    } catch (err) {
      console.error('❌ Erreur chargement FOSA spatial:', err);
      // En cas d'erreur, charger toutes les FOSA
      fetchHospitalsData();
    } finally {
      setLoadingFosas(false);
      setTimeout(() => setShowFosaLoader(false), 500);
    }
  };

  // Fonction pour charger toutes les FOSA
  const fetchHospitalsData = async () => {
    try {
      updateLoadingProgress('hospitalsData', true);
      const fosas = await apiService.getFosas();
      setAllFosasData(fosas);
      setFosasData(fosas);
      const transformedHospitals = await transformFosasToHospitals(fosas);
      setHospitals(transformedHospitals);
      setFilteredHospitals(transformedHospitals);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement hôpitaux:', err);
      try {
        const response = await fetch('/data/hospitals.json');
        if (response.ok) {
          const jsonData = await response.json();
          setHospitals(jsonData);
          setFilteredHospitals(jsonData);
          setError(null);
        } else {
          setError('Impossible de charger les données');
        }
      } catch (fallbackErr) {
        console.error('❌ Erreur fallback hôpitaux:', fallbackErr);
        setError('Impossible de charger les données');
      }
    } finally {
      updateLoadingProgress('hospitalsData', false);
    }
  };

  const fetchCameroonPolygon = async () => {
    try {
      updateLoadingProgress('cameroonPolygon', true);
      const apiBase = (import.meta as any).env?.VITE_API_URL || 'https://minsante.vps.it-grafik.com/api/v1';
      const response: any = await axios.get(`${apiBase}/cameroun`);

      if (response.data && response.data.data && response.data.data.length > 0) {
        const camerounData = response.data.data[0];
        if (camerounData.geom) {
          try {
            let geojson = camerounData.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }
            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];
              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              setCameroonPolygon(transformed);
              return;
            }
          } catch (parseErr) {
            console.warn('⚠️ Erreur parsing GeoJSON Cameroun:', parseErr);
          }
        }
      }
    } catch (err) {
      console.error('❌ Erreur polygone Cameroun:', err);
    } finally {
      updateLoadingProgress('cameroonPolygon', false);
    }
  };

  const fetchRegionsData = async () => {
    try {
      updateLoadingProgress('regionsData', true);
      const regions = await apiService.getRegions();
      setAllRegionsData(regions);
      setRegionsData(regions);
      const regionsMap: { [key: string]: [number, number][] } = {};
      regions.forEach((region: any) => {
        if (region.geom) {
          try {
            let geojson = region.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }
            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];
              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              regionsMap[region.nom] = transformed;
            }
          } catch (parseErr) {
            console.warn(`⚠️ Erreur parsing polygon pour région ${region.nom}:`, parseErr);
          }
        }
      });
      setRegionsPolygons(regionsMap);
    } catch (err) {
      console.error('❌ Erreur chargement régions:', err);
      setRegionsPolygons({});
    } finally {
      updateLoadingProgress('regionsData', false);
    }
  };

  const fetchDepartementsData = async () => {
    try {
      updateLoadingProgress('departementsData', true);
      const departements = await apiService.getDepartements();
      setAllDepartementsData(departements);
      setDepartementsData([]);
      const departementsMap: { [key: string]: [number, number][] } = {};
      departements.forEach((departement: any) => {
        if (departement.geom) {
          try {
            let geojson = departement.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }
            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];
              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              departementsMap[departement.departement] = transformed;
            }
          } catch (parseErr) {
            console.warn(`⚠️ Erreur parsing polygon pour département ${departement.departement}:`, parseErr);
          }
        }
      });
      setDepartementsPolygons(departementsMap);
    } catch (err) {
      console.error('❌ Erreur chargement départements:', err);
      setDepartementsPolygons({});
    } finally {
      updateLoadingProgress('departementsData', false);
    }
  };

  const fetchArrondissementsData = async () => {
    try {
      updateLoadingProgress('arrondissementsData', true);
      const arrondissements = await apiService.getArrondissements();
      setAllArrondissementsData(arrondissements);
      setArrondissementsData([]);
      const arrondissementsMap: { [key: string]: [number, number][] } = {};
      arrondissements.forEach((arrondissement: any) => {
        if (arrondissement.geom) {
          try {
            let geojson = arrondissement.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }
            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];
              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              arrondissementsMap[arrondissement.nom] = transformed;
            }
          } catch (parseErr) {
            console.warn(`⚠️ Erreur parsing polygon pour arrondissement ${arrondissement.nom}:`, parseErr);
          }
        }
      });
      setArrondissementsPolygons(arrondissementsMap);
    } catch (err) {
      console.error('❌ Erreur chargement arrondissements:', err);
      setArrondissementsPolygons({});
    } finally {
      updateLoadingProgress('arrondissementsData', false);
    }
  };

  // Chargement initial
  useEffect(() => {
    const checkAllDataLoaded = () => {
      const criticalDataLoaded =
        !loadingProgress.cameroonPolygon &&
        !loadingProgress.regionsData &&
        !loadingProgress.departementsData &&
        !loadingProgress.arrondissementsData &&
        allRegionsData.length > 0 &&
        allDepartementsData.length > 0 &&
        allArrondissementsData.length > 0;
      // Ne plus attendre les FOSA au chargement initial

      if (criticalDataLoaded && !allDataLoaded) {
        setAllDataLoaded(true);
        setLoading(false);
      }
    };

    checkAllDataLoaded();
  }, [loadingProgress, allRegionsData, allDepartementsData, allArrondissementsData, allDataLoaded]);
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setAllDataLoaded(false);

      try {
        // Charger les données critiques en parallèle (sans les FOSA)
        await Promise.all([
          fetchCameroonPolygon(),
          fetchRegionsData(),
          fetchDepartementsData(),
          fetchArrondissementsData()
          // Ne plus charger fetchHospitalsData() au démarrage
        ]);

      } catch (err) {
        console.error('💥 Erreur de chargement:', err);
        setError('Erreur de chargement des données principales');
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  // Filtrer les départements quand une région est sélectionnée
  useEffect(() => {
    if (selectedRegion === 'all') {
      setDepartementsData([]);
      setSelectedDepartement('all');
      setSelectedArrondissement('all');
    } else {
      const filteredDepartements = allDepartementsData.filter(d => {
        const region = allRegionsData.find(r => r.nom === selectedRegion);
        return region && d.regionId === region.id;
      });
      setDepartementsData(filteredDepartements);
      setSelectedDepartement('all');
      setSelectedArrondissement('all');
    }
  }, [selectedRegion, allRegionsData, allDepartementsData]);

  // Filtrer les arrondissements quand un département est sélectionné
  useEffect(() => {
    if (selectedDepartement === 'all') {
      setArrondissementsData([]);
      setSelectedArrondissement('all');
    } else {
      const filteredArrondissements = allArrondissementsData.filter(a => {
        const departement = allDepartementsData.find(d => d.departement === selectedDepartement);
        return departement && a.departementId === departement.id;
      });
      setArrondissementsData(filteredArrondissements);
      setSelectedArrondissement('all');
    }
  }, [selectedDepartement, allDepartementsData, allArrondissementsData]);

  // Charger les districts quand une région est sélectionnée
  useEffect(() => {
    // Toujours effacer d'abord les anciens districts
    setDistrictsPolygons({});
    setDistrictsData([]);
    setAllDistrictsData([]);

    if (selectedRegion === 'all') {
      return;
    }

    const loadDistrictsByRegion = async () => {
      try {
        updateLoadingProgress('districtsData', true);
        setProgressMessage(`Chargement des districts de ${selectedRegion}...`);
        const region = allRegionsData.find(r => r.nom === selectedRegion);
        if (!region) {
          updateLoadingProgress('districtsData', false);
          return;
        }

        const response = await districtService.getByRegionForMap(region.id);
        const districts = response.data;
        setAllDistrictsData(districts);
        setDistrictsData(districts);

        const districtsMap: { [key: string]: [number, number][] } = {};
        districts.forEach((district: any) => {
          const geomData = district.geojson || district.geom;
          if (geomData) {
            try {
              let geojson = geomData;
              if (typeof geojson === 'string') {
                geojson = JSON.parse(geojson);
              }
              if (geojson.coordinates && geojson.coordinates.length > 0) {
                const coords = geojson.type === 'MultiPolygon'
                  ? geojson.coordinates[0][0]
                  : geojson.coordinates[0];
                const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
                const nom = district.nom || district.nom_ds;
                if (nom) {
                  districtsMap[nom] = transformed;
                }
              }
            } catch (parseErr) {
              console.warn(`⚠️ Erreur parsing polygon pour district ${district.nom_ds || district.nom}:`, parseErr);
            }
          }
        });
        setDistrictsPolygons(districtsMap);
        setProgressMessage('');
      } catch (err) {
        console.error('❌ Erreur chargement districts:', err);
        setProgressMessage('Erreur lors du chargement des districts');
      } finally {
        updateLoadingProgress('districtsData', false);
      }
    };

    loadDistrictsByRegion();
  }, [selectedRegion, allRegionsData]);

  // Charger les aires de santé quand un district est sélectionné
  useEffect(() => {
    // Toujours effacer d'abord les anciennes aires de santé
    setAiresantesPolygons({});
    setAiresantesData([]);
    setAllAiresantesData([]);

    if (selectedDistrict === 'all') {
      return;
    }

    const loadAiresantesByDistrict = async () => {
      try {
        updateLoadingProgress('airesantesData', true);
        setProgressMessage(`Chargement des aires de santé de ${selectedDistrict}...`);
        const district = allDistrictsData.find(d => (d.nom_ds || d.nom) === selectedDistrict);
        if (!district) {
          updateLoadingProgress('airesantesData', false);
          return;
        }

        const response = await airesanteService.getByDistrictForMap(district.id);
        const airesantes = response.data;
        setAllAiresantesData(airesantes);
        setAiresantesData(airesantes);

        const airesantesMap: { [key: string]: [number, number][] } = {};
        airesantes.forEach((airesante: any) => {
          const geomData = airesante.geojson || airesante.geom;
          if (geomData) {
            try {
              let geojson = geomData;
              if (typeof geojson === 'string') {
                geojson = JSON.parse(geojson);
              }
              if (geojson.coordinates && geojson.coordinates.length > 0) {
                const coords = geojson.type === 'MultiPolygon'
                  ? geojson.coordinates[0][0]
                  : geojson.coordinates[0];
                const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
                const nom = airesante.nom || airesante.nom_as || airesante.nom_aire;
                if (nom) {
                  airesantesMap[nom] = transformed;
                }
              }
            } catch (parseErr) {
              console.warn(`⚠️ Erreur parsing polygon pour aire de santé:`, parseErr);
            }
          }
        });
        setAiresantesPolygons(airesantesMap);
        setProgressMessage('');
      } catch (err) {
        console.error('❌ Erreur chargement aires de santé:', err);
        setProgressMessage('Erreur lors du chargement des aires de santé');
      } finally {
        updateLoadingProgress('airesantesData', false);
      }
    };

    loadAiresantesByDistrict();
  }, [selectedDistrict, allDistrictsData]);

  // Recharger les FOSA quand la sélection géographique change - CORRIGÉ
  useEffect(() => {
    const currentSelection = `${selectedRegion}|${selectedDepartement}|${selectedArrondissement}|${selectedDistrict}|${selectedAiresante}`;

    // Éviter les appels inutiles si la sélection n'a pas changé
    if (currentSelection === previousSelectionRef.current) {
      return;
    }

    if (selectedRegion !== 'all' || selectedDepartement !== 'all' || selectedArrondissement !== 'all' ||
      selectedDistrict !== 'all' || selectedAiresante !== 'all') {
      fetchFosasBySpatialFilter();
    } else {
      // Si on revient à "all", vider les FOSA (ne plus charger toutes les FOSA)
      clearFosaData();
    }

    // Mettre à jour la référence
    previousSelectionRef.current = currentSelection;
  }, [selectedRegion, selectedDepartement, selectedArrondissement, selectedDistrict, selectedAiresante]);

  // Filtrer les FOSA par type, titre foncier, clôture, catégorie et recherche
  useEffect(() => {
    if (hospitals.length === 0) return;

    let filtered = hospitals;

    if (selectedType !== 'all') filtered = filtered.filter(h => h.type === selectedType);
    if (selectedCategory !== 'all') {
      const target = selectedCategory.toUpperCase().trim();
      filtered = filtered.filter(h => {
        const fosaType = (h.fosaType || '').toUpperCase().trim();
        const cat = (h.category || '').toUpperCase().trim();
        // Matching sur fosaType (le type de la FOSA: CSI, HD, CMA, SSD, EF...)
        if (fosaType === target) return true;
        if (cat === target) return true;
        // Matching partiel
        if (fosaType.includes(target) || target.includes(fosaType)) return true;
        if (cat.includes(target) || target.includes(cat)) return true;
        return false;
      });
    }

    // Filtre sur le titre foncier
    if (selectedTitreFoncier !== 'all') {
      filtered = filtered.filter(h => {
        if (selectedTitreFoncier === 'yes') return h.aTitreFoncier === true;
        if (selectedTitreFoncier === 'no') return h.aTitreFoncier === false;
        return true;
      });
    }

    // Filtre sur la clôture
    if (selectedCloture !== 'all') {
      filtered = filtered.filter(h => {
        if (selectedCloture === 'yes') return h.aCloture === true;
        if (selectedCloture === 'no') return h.aCloture === false;
        return true;
      });
    }

    if (searchTerm) filtered = filtered.filter(h =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.region.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredHospitals(filtered);
  }, [selectedType, selectedTitreFoncier, selectedCloture, selectedCategory, searchTerm, hospitals]);

  useEffect(() => {
    const allLoaded = !loadingProgress.cameroonPolygon &&
      !loadingProgress.regionsData &&
      !loadingProgress.departementsData &&
      !loadingProgress.arrondissementsData;
    // Ne plus attendre hospitalsData
    if (allLoaded) setLoading(false);
  }, [loadingProgress]);

  // Listes pour les dropdowns (filtrées côté client)
  // Filtrer les valeurs invalides (null, undefined, chaînes vides, noms tronqués < 3 caractères)
  const regions = Array.from(new Set(regionsData.map(r => r.nom)))
    .filter(r => r && typeof r === 'string' && r.trim().length >= 3)
    .sort();
  const departements = Array.from(new Set(departementsData.map(d => d.departement)))
    .filter(d => d && typeof d === 'string' && d.trim().length >= 3)
    .sort();
  const arrondissements = Array.from(new Set(arrondissementsData.map(a => a.nom)))
    .filter(a => a && typeof a === 'string' && a.trim().length >= 3)
    .sort();
  const districts = Array.from(new Set(districtsData.map(d => d.nom_ds || d.nom)))
    .filter(d => d && typeof d === 'string' && d.trim().length >= 3)
    .sort();
  const airesantes = Array.from(new Set(airesantesData.map(a => a.nom || a.nom_as)))
    .filter(a => a && typeof a === 'string' && a.trim().length >= 3)
    .sort();

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getHospitalIcon = (hospital: Hospital) => {
    // Symbologie MINSANTE par catégorie
    const fosaType = (hospital.fosaType || hospital.category || '').toUpperCase().trim();
    let color = '#FFFFFF'; // blanc par défaut (autres)
    let borderColor = '#374151';
    if (['HD', 'CMA', 'CSI', 'HR', 'HC', 'HG', 'CHU', 'CHR', 'CHD'].includes(fosaType)) {
      color = '#EF4444'; // rouge
      borderColor = '#FFFFFF';
    } else if (fosaType === 'SSD') {
      color = '#10B981'; // vert
      borderColor = '#FFFFFF';
    } else if (fosaType === 'EF') {
      color = '#3B82F6'; // bleu
      borderColor = '#FFFFFF';
    } else if (fosaType === 'PRG') {
      color = '#000000'; // noir
      borderColor = '#FFFFFF';
    } else if (fosaType === 'DRS') {
      color = '#FACC15'; // jaune
      borderColor = '#FFFFFF';
    } else if (fosaType.includes('CENTRE DE SANTÉ') || fosaType.includes('CENTRE DE SANTE')) {
      color = '#EF4444'; // rouge (catégorie hospitalière)
      borderColor = '#FFFFFF';
    }
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${borderColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
      className: 'custom-marker',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  };

  const getStatusText = (s: string) => ({ operational: 'Opérationnel', maintenance: 'En maintenance', construction: 'En construction', closed: 'Fermé' }[s] || s);
  const getTypeText = (t: string) => ({ public: 'Public', parapublic: 'Parapublic', prive_laic: 'Privé laïc', prive_confessionnel: 'Privé confessionnel' }[t] || t);

  const mapStyles = [
    { id: "osm", name: "Standard", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    { id: "satellite", name: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" },
    { id: "cameroon", name: "Cameroun", url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" },
  ];

  const CollapsibleSection = ({ id, title, icon: Icon, children, defaultExpanded = false }: any) => {
    const isExpanded = expandedSections[id] ?? defaultExpanded;
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <button onClick={(e) => toggleSection(id, e)} className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
              <Icon className="size-4" />
            </span>
            <span className="text-sm font-semibold text-gray-900">{title}</span>
          </div>
          {isExpanded ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />}
        </button>
        {isExpanded && <div className="border-t border-gray-100 p-4">{children}</div>}
      </div>
    );
  };

  // Loader pour le filtrage des FOSA
  // Ajouter ces fonctions utilitaires pour le loader
  const calculateLoadingProgress = () => {
    const totalItems = 4; // Sans les FOSA maintenant
    const loadedItems = [
      !loadingProgress.cameroonPolygon,
      !loadingProgress.regionsData && allRegionsData.length > 0,
      !loadingProgress.departementsData && allDepartementsData.length > 0,
      !loadingProgress.arrondissementsData && allArrondissementsData.length > 0
      // Ne plus inclure hospitalsData
    ].filter(Boolean).length;

    return (loadedItems / totalItems) * 100;
  };

  const DataLoadingIndicator = ({ label, isLoading, isLoaded }: {
    label: string;
    isLoading: boolean;
    isLoaded: boolean
  }) => (
    <div className="flex items-center gap-2">
      <div className={`size-2 rounded-full ${isLoading ? 'bg-warning animate-pulse' :
        isLoaded ? 'bg-success' : 'bg-gray-300'
        }`}></div>
      <span className="text-xs text-gray-500">{label}</span>
      {isLoading && (
        <svg className="animate-spin size-3 text-brand-500 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
    </div>
  );

  const getLoadingDetails = () => {
    if (loadingProgress.regionsData) return "Chargement des régions...";
    if (loadingProgress.departementsData) return "Chargement des départements...";
    if (loadingProgress.arrondissementsData) return "Chargement des arrondissements...";
    if (loadingProgress.cameroonPolygon) return "Chargement de la carte...";
    return "Finalisation...";
  };

  const FosaLoader = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="card mx-4 w-full max-w-md p-8 text-center shadow-lg">
        <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <Activity className="size-7 animate-spin" />
        </div>
        <h2 className="mb-1 text-xl font-bold tracking-tight text-gray-900">Chargement des FOSA</h2>
        <p className="mb-6 text-sm text-gray-500">Filtrage des formations sanitaires...</p>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-track">
          <div className="h-2 rounded-full bg-brand-500 animate-pulse"></div>
        </div>
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-brand-500 animate-pulse"></div>
            <span className="text-xs text-gray-500">Récupération des données</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-brand-500 animate-pulse"></div>
            <span className="text-xs text-gray-500">Filtrage spatial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-brand-500 animate-pulse"></div>
            <span className="text-xs text-gray-500">Affichage sur la carte</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && !allDataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="card mx-4 w-full max-w-md p-8 text-center">
          <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <Activity className="size-7 animate-spin" />
          </div>
          <h2 className="mb-1 text-xl font-bold tracking-tight text-gray-900">Chargement des données</h2>
          <p className="mb-6 text-sm text-gray-500">Préparation de la cartographie...</p>

          {progressMessage && (
            <p className="mb-4 text-sm font-semibold text-brand-500 animate-pulse">
              {progressMessage}
            </p>
          )}

          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-track">
            <div
              className="h-2 rounded-full bg-brand-500 transition-all duration-500"
              style={{
                width: `${calculateLoadingProgress()}%`
              }}
            ></div>
          </div>

          <div className="space-y-2 text-left">
            <DataLoadingIndicator
              label="Cameroun"
              isLoading={loadingProgress.cameroonPolygon}
              isLoaded={cameroonPolygon.length > 0}
            />
            <DataLoadingIndicator
              label="Régions"
              isLoading={loadingProgress.regionsData}
              isLoaded={allRegionsData.length > 0}
            />
            <DataLoadingIndicator
              label="Départements"
              isLoading={loadingProgress.departementsData}
              isLoaded={allDepartementsData.length > 0}
            />
            <DataLoadingIndicator
              label="Arrondissements"
              isLoading={loadingProgress.arrondissementsData}
              isLoaded={allArrondissementsData.length > 0}
            />
            {/* FOSA ne sont plus chargées au démarrage */}
          </div>

          <div className="mt-4 font-mono text-xs text-gray-500">
            {getLoadingDetails()}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="card mx-4 max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle className="size-7" />
          </div>
          <h2 className="mb-1 text-xl font-bold tracking-tight text-gray-900">Erreur de chargement</h2>
          <p className="mb-5 text-sm text-gray-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-surface">
      {showFosaLoader && <FosaLoader />}

      <header className="relative z-50 bg-header text-white">
        <div className="mx-auto max-w-full px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/favicon.svg" alt="" className="size-9 rounded-xl" />
              <span className="border-l border-white/25 pl-3">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-white/60">MINSANTÉ</span>
                <span className="block text-base font-bold leading-tight">IMMOSANTECam</span>
              </span>
              <div className="ml-2 hidden border-l border-white/25 pl-4 md:block">
                <h1 className="text-sm font-semibold leading-tight">MAP</h1>
                <p className="text-xs text-white/60">Cartographie des établissements de santé</p>
              </div>
            </div>
            {/* Connecté : on renvoie vers le tableau de bord plutôt que vers la connexion */}
            <Link
              to={localStorage.getItem("token") ? "/dashboard" : "/login"}
              className="inline-flex h-9 shrink-0 items-center rounded-lg bg-white px-4 text-sm font-semibold text-brand-900 transition-colors hover:bg-white/90"
            >
              {localStorage.getItem("token") ? "Tableau de bord" : "Connexion"}
            </Link>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-56px)] flex flex-col px-3 py-3 gap-3">
        <div className="card p-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input h-9 pl-9" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="kicker flex items-center gap-1.5"><Filter className="size-3.5" />Filtres</span>
              <select value={selectedRegion} onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedDepartement('all');
                setSelectedArrondissement('all');
                setSelectedDistrict('all');
                setSelectedAiresante('all');
              }} className="input h-9 w-auto">
                <option value="all">Toutes régions</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select value={selectedDepartement} onChange={(e) => {
                setSelectedDepartement(e.target.value);
                setSelectedArrondissement('all');
              }} className="input h-9 w-auto" disabled={departements.length === 0}>
                <option value="all">Tous départements</option>
                {departements.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={selectedArrondissement} onChange={(e) => setSelectedArrondissement(e.target.value)} className="input h-9 w-auto" disabled={arrondissements.length === 0}>
                <option value="all">Tous arrondissements</option>
                {arrondissements.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <div className="relative">
                <select value={selectedDistrict} onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedAiresante('all');
                }} className="input h-9 w-auto" disabled={loadingProgress.districtsData || districts.length === 0}>
                  <option value="all">Tous districts</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {loadingProgress.districtsData && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin size-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>

              <div className="relative">
                <select value={selectedAiresante} onChange={(e) => setSelectedAiresante(e.target.value)} className="input h-9 w-auto" disabled={loadingProgress.airesantesData || airesantes.length === 0}>
                  <option value="all">Toutes aires de santé</option>
                  {airesantes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {loadingProgress.airesantesData && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin size-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>

              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input h-9 w-auto">
                <option value="all">Toutes catégories</option>
                <option value="CHU">CHU</option>
                <option value="CHR">CHR</option>
                <option value="CHD">CHD</option>
                <option value="HG">HG</option>
                <option value="HC">HC</option>
                <option value="HR">HR</option>
                <option value="HD">HD</option>
                <option value="CMA">CMA</option>
                <option value="CSI">CSI</option>
                <option value="SSD">SSD</option>
                <option value="EF">EF</option>
                <option value="DRS">DRS</option>
                <option value="PRG">PRG</option>
                <option value="Centre de santé">Centre de santé</option>
              </select>

              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="input h-9 w-auto">
                <option value="all">Tous types</option>
                <option value="public">Public</option>
                <option value="parapublic">Parapublic</option>
                <option value="prive_laic">Privé laïc</option>
                <option value="prive_confessionnel">Privé confessionnel</option>
              </select>

              {/* Nouveaux filtres pour titre foncier et clôture */}
              <select value={selectedTitreFoncier} onChange={(e) => setSelectedTitreFoncier(e.target.value)} className="input h-9 w-auto">
                <option value="all">Titre foncier</option>
                <option value="yes">Avec titre</option>
                <option value="no">Sans titre</option>
              </select>

              <select value={selectedCloture} onChange={(e) => setSelectedCloture(e.target.value)} className="input h-9 w-auto">
                <option value="all">Clôture</option>
                <option value="yes">Avec clôture</option>
                <option value="no">Sans clôture</option>
              </select>

              <div className="flex items-center gap-2">
                <Layers className="size-4 text-gray-400" />
                <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)} className="input h-9 w-auto">
                  {mapStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex h-9 items-center gap-2 rounded-lg border border-brand-500 bg-brand-50 px-3">
                <MapPin className="size-4 text-brand-500" />
                {loadingFosas ? (
                  <div className="size-4 animate-spin rounded-full border-b-2 border-brand-500"></div>
                ) : (
                  <span className="text-sm font-semibold tabular-nums text-brand-600">{filteredHospitals.length}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card flex-1 overflow-hidden">
          <div className="h-full relative flex">
            {selectedHospital && (
              <div className="w-[420px] h-full bg-surface border-r border-gray-200 overflow-y-auto custom-scrollbar z-[1000]">
                <div className="sticky top-0 z-10 bg-header p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/60">Formation sanitaire</p>
                      <h3 className="text-lg font-bold leading-tight">{selectedHospital.name}</h3>
                    </div>
                    <button onClick={() => setSelectedHospital(null)} className="rounded-lg p-1.5 text-white/85 transition-colors hover:bg-white/10" aria-label="Fermer">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${selectedHospital.status === "operational" ? "bg-success text-white" : selectedHospital.status === "maintenance" ? "bg-warning text-white" : selectedHospital.status === "construction" ? "bg-brand-500 text-white" : "bg-gray-500 text-white"}`}>
                      <span className="size-1.5 rounded-full bg-white" />
                      {getStatusText(selectedHospital.status)}
                    </span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1"><strong>Type:</strong> {getTypeText(selectedHospital.type)}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1"><strong>Catégorie:</strong> {selectedHospital.category}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {selectedHospital?.image && (
                    <div className="h-48 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      <img
                        src={selectedHospital.image}
                        alt={selectedHospital.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-hospital.jpg';
                        }}
                      />
                    </div>
                  )}
                  {!selectedHospital.image && (
                    <div className="flex h-48 w-full items-center justify-center rounded-xl border border-gray-200 bg-white">
                      <div className="text-center text-gray-400">
                        <Building className="mx-auto mb-2 size-12" />
                        <p className="text-sm">Image non disponible</p>
                      </div>
                    </div>
                  )}

                  <CollapsibleSection id={`capacity-${selectedHospital.id}`} title="Capacité" icon={Activity} defaultExpanded={true}>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-gray-200 bg-surface p-3">
                        <p className="kicker">Lits</p>
                        <p className="mt-1.5 text-2xl font-bold leading-none tabular-nums text-gray-900">{selectedHospital.capacity?.beds || 0}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-surface p-3">
                        <p className="kicker">Bâtiments</p>
                        <p className="mt-1.5 text-2xl font-bold leading-none tabular-nums text-gray-900">{selectedHospital.batimentsCount || 0}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-surface p-3">
                        <p className="kicker">Véhicules</p>
                        <p className="mt-1.5 text-2xl font-bold leading-none tabular-nums text-gray-900">{selectedHospital.vehiculesCount || 0}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-surface p-3">
                        <p className="kicker">Ambulances</p>
                        <p className="mt-1.5 text-2xl font-bold leading-none tabular-nums text-gray-900">{selectedHospital.ambulancesCount || 0}</p>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`personnel-${selectedHospital.id}`} title="Personnel" icon={Users} defaultExpanded={true}>
                    <div className="space-y-2">
                      {selectedHospital.personnelByCategory && (selectedHospital as any).personnelByCategory?.length > 0 ? (
                        (selectedHospital as any).personnelByCategory?.map((cat: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg px-2 py-1.5 even:bg-row-alt">
                            <span className="text-xs text-gray-700">{cat.category}</span>
                            <span className="text-sm font-bold tabular-nums text-gray-900">{cat.count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 text-xs py-4">
                          Aucune donnée de personnel disponible
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`security-${selectedHospital.id}`} title="Sécurité" icon={Shield} defaultExpanded={false}>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`rounded-xl p-3 ${selectedHospital.aTitreFoncier ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                        <p className="kicker mb-1">Titre Foncier</p>
                        <p className={`text-lg font-bold ${selectedHospital.aTitreFoncier ? 'text-success' : 'text-danger'}`}>
                          {selectedHospital.aTitreFoncier ? 'Oui' : 'Non'}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 ${selectedHospital.aCloture ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                        <p className="kicker mb-1">Clôture</p>
                        <p className={`text-lg font-bold ${selectedHospital.aCloture ? 'text-success' : 'text-danger'}`}>
                          {selectedHospital.aCloture ? 'Oui' : 'Non'}
                        </p>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`services-${selectedHospital.id}`} title="Services Disponibles" icon={Activity} defaultExpanded={false}>
                    <div className="flex flex-wrap gap-2">
                      {selectedHospital.services.map((service, idx) => (
                        <span key={idx} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
                          {service}
                        </span>
                      ))}
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`maintenance-${selectedHospital.id}`} title="État de Maintenance" icon={AlertTriangle} defaultExpanded={false}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-surface p-3">
                          <p className="kicker mb-1">Dernière inspection</p>
                          <p className="text-xs font-semibold text-gray-900">{new Date(selectedHospital.maintenance.lastInspection).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="rounded-xl bg-surface p-3">
                          <p className="kicker mb-1">Prochaine inspection</p>
                          <p className="text-xs font-semibold text-gray-900">{new Date(selectedHospital.maintenance.nextInspection).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      {selectedHospital.maintenance.issues.length > 0 && (
                        <div className="rounded-xl border border-danger/20 bg-danger-soft p-3">
                          <p className="mb-2 text-xs font-semibold text-danger">Problèmes identifiés:</p>
                          <ul className="space-y-1 text-xs text-danger">
                            {selectedHospital.maintenance.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="kicker mb-2">Contact</p>
                    <div className="space-y-1 text-xs text-gray-700">
                      {selectedHospital.contact.phone && (
                        <p><strong>Téléphone:</strong> {selectedHospital.contact.phone}</p>
                      )}
                      {(selectedHospital as any).responsableNom && (
                        <p><strong>Responsable:</strong> {(selectedHospital as any).responsableNom}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 relative">
              <MapContainer center={CAMEROON_CENTER} zoom={6} minZoom={6} maxBounds={createSafeBounds(CAMEROON_BOUNDS_COORDS)} style={{ height: "100%", width: "100%" }} className="rounded-2xl">
                <MapRefBridge onReady={setMapInstance} />
                <MapController
                  selectedRegion={selectedRegion}
                  selectedDepartement={selectedDepartement}
                  selectedArrondissement={selectedArrondissement}
                  selectedDistrict={selectedDistrict}
                  selectedAiresante={selectedAiresante}
                  regionsPolygons={regionsPolygons}
                  departementsPolygons={departementsPolygons}
                  districtsPolygons={districtsPolygons}
                  airesantesPolygons={airesantesPolygons}
                  hospitals={hospitals}
                />
                <TileLayer url={mapStyles.find(s => s.id === mapStyle)?.url || mapStyles[0].url} />

                {layersVisibility.cameroon && cameroonPolygon.length > 0 && (
                  <Polygon positions={cameroonPolygon} pathOptions={{ fillColor: '#007ac3', fillOpacity: 0.05, color: '#007ac3', weight: 2, opacity: 0.6 }} />
                )}

                {layersVisibility.regions && selectedRegion && regionsPolygons[selectedRegion] && (
                  <Polygon
                    positions={regionsPolygons[selectedRegion]}
                    pathOptions={{
                      fillColor: '#FBBF24',
                      fillOpacity: 0.15,
                      color: '#D97706',
                      weight: 2,
                      opacity: 0.6
                    }}
                  />
                )}

                {layersVisibility.departements && selectedDepartement && departementsPolygons[selectedDepartement] && (
                  <Polygon
                    positions={departementsPolygons[selectedDepartement]}
                    pathOptions={{
                      fillColor: '#EF4444',
                      fillOpacity: 0.12,
                      color: '#991B1B',
                      weight: 2,
                      opacity: 1
                    }}
                  />
                )}

                {layersVisibility.arrondissements && selectedArrondissement && arrondissementsPolygons[selectedArrondissement] && (
                  <Polygon
                    positions={arrondissementsPolygons[selectedArrondissement]}
                    pathOptions={{
                      fillColor: '#F97316',
                      fillOpacity: 0.12,
                      color: '#9A3412',
                      weight: 2,
                      opacity: 0.6
                    }}
                  />
                )}

                {layersVisibility.districts && Object.entries(districtsPolygons).map(([districtName, polygon], index) => {
                  const fillColor = activeTheme ? activeTheme.getColor(districtName) : '#8b5cf6';
                  const fillOpacity = activeTheme ? 0.6 : 0.1;
                  return (
                    <Polygon
                      key={index}
                      positions={polygon}
                      pathOptions={{
                        fillColor,
                        fillOpacity,
                        color: activeTheme ? '#ffffff' : '#8b5cf6',
                        weight: activeTheme ? 2 : 1.5,
                        opacity: activeTheme ? 0.8 : 0.5
                      }}
                    />
                  );
                })}

                {layersVisibility.airesantes && Object.entries(airesantesPolygons).map(([airesanteName, polygon], index) => (
                  <Polygon
                    key={index}
                    positions={polygon}
                    pathOptions={{
                      fillColor: '#ec4899',
                      fillOpacity: 0.08,
                      color: '#ec4899',
                      weight: 1,
                      opacity: 0.4
                    }}
                  />
                ))}

                {layersVisibility.hospitals && filteredHospitals.map((h, index) => (
                  <Marker key={index} position={h.coordinates} icon={getHospitalIcon(h)} eventHandlers={{ click: () => setSelectedHospital(h) }}>
                    {selectedHospital?.id === h.id && (
                      <Tooltip permanent direction="top" offset={[0, -20]} className="permanent-tooltip">
                        <div className="font-semibold text-sm">{h.name}</div>
                      </Tooltip>
                    )}
                  </Marker>
                ))}
              </MapContainer>

              <TilePreloader
                map={mapInstance}
                tileUrlTemplate={mapStyles.find(s => s.id === mapStyle)?.url || mapStyles[0].url}
                extraZoomLevels={2}
                className="bottom-8 right-4"
              />

              <div className="absolute bottom-8 left-20 z-[1000] max-w-sm space-y-3">
                <ThematicAnalysis
                  entitiesData={
                    selectedDistrict !== 'all' ? airesantesData :
                      selectedDepartement !== 'all' ? arrondissementsData :
                        selectedRegion !== 'all' ? districtsData :
                          districtsData
                  }
                  fosasData={fosasData}
                  airesantesData={airesantesData}
                  onThemeChange={setActiveTheme}
                  entityType={
                    selectedDistrict !== 'all' ? 'airesante' :
                      selectedDepartement !== 'all' ? 'arrondissement' :
                        selectedRegion !== 'all' ? 'district' :
                          'district'
                  }
                />

                {activeTheme && (
                  <MapLegend theme={activeTheme} />
                )}
              </div>

              <div className="absolute top-4 right-4 z-[1000] max-h-[80vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm custom-scrollbar">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                    <Layers className="size-4" />
                  </span>
                  Couches de la carte
                </h4>
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="border-b border-gray-100 pb-3">
                    <p className="kicker mb-2">Divisions géographiques</p>
                    <div className="space-y-0.5">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={layersVisibility.cameroon}
                          onChange={() => toggleLayer('cameroon')}
                          className="size-4 rounded accent-brand-500"
                        />
                        <div className="size-3.5 rounded border-2" style={{ borderColor: '#007ac3', backgroundColor: 'rgba(0,122,195,0.08)' }}></div>
                        <span>Cameroun</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={layersVisibility.regions}
                          onChange={() => toggleLayer('regions')}
                          className="size-4 rounded accent-brand-500"
                        />
                        <div className="size-3.5 rounded border-2" style={{ borderColor: '#D97706', backgroundColor: 'rgba(251,191,36,0.25)' }}></div>
                        <span>Régions</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={layersVisibility.departements}
                          onChange={() => toggleLayer('departements')}
                          className="size-4 rounded accent-brand-500"
                        />
                        <div className="size-3.5 rounded border-2" style={{ borderColor: '#991B1B', backgroundColor: 'rgba(239,68,68,0.2)' }}></div>
                        <span>Départements</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={layersVisibility.arrondissements}
                          onChange={() => toggleLayer('arrondissements')}
                          className="size-4 rounded accent-brand-500"
                        />
                        <div className="size-3.5 rounded border-2" style={{ borderColor: '#9A3412', backgroundColor: 'rgba(249,115,22,0.2)' }}></div>
                        <span>Arrondissements</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={layersVisibility.districts}
                          onChange={() => toggleLayer('districts')}
                          className="size-4 rounded accent-brand-500"
                        />
                        <div className="size-3.5 rounded border-2" style={{ borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)' }}></div>
                        <span>Districts sanitaires</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={layersVisibility.airesantes}
                          onChange={() => toggleLayer('airesantes')}
                          className="size-4 rounded accent-brand-500"
                        />
                        <div className="size-3.5 rounded border-2" style={{ borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.12)' }}></div>
                        <span>Aires de santé</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <p className="kicker mb-2">Formations sanitaires</p>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50 mb-1.5">
                      <input
                        type="checkbox"
                        checked={layersVisibility.hospitals}
                        onChange={() => toggleLayer('hospitals')}
                        className="size-4 rounded accent-brand-500"
                      />
                      <span className="font-semibold text-gray-900">Afficher les FOSA</span>
                    </label>
                    <div className="ml-7 space-y-1.5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="size-3.5 shrink-0 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#EF4444' }}></div>
                        <span>HD, CMA, CSI, HR, HC, HG, CHU, CHR, CHD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-3.5 shrink-0 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#10B981' }}></div>
                        <span>SSD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-3.5 shrink-0 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#3B82F6' }}></div>
                        <span>EF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-3.5 shrink-0 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#000000' }}></div>
                        <span>PRG</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-3.5 shrink-0 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#FACC15' }}></div>
                        <span>DRS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-3.5 shrink-0 rounded-full border-2 border-gray-700 shadow" style={{ backgroundColor: '#FFFFFF' }}></div>
                        <span>Autre</span>
                      </div>
                    </div>
                  </div>

                  {(selectedRegion !== 'all' || selectedDepartement !== 'all' || selectedArrondissement !== 'all' || selectedDistrict !== 'all' || selectedAiresante !== 'all') && (
                    <div>
                      <p className="kicker mb-2">Sélection active</p>
                      <div className="space-y-1">
                        {selectedRegion !== 'all' && (
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded border-2" style={{ borderColor: '#D97706', backgroundColor: 'rgba(251,191,36,0.25)' }}></div>
                            <span className="text-xs font-semibold text-gray-900">{selectedRegion}</span>
                          </div>
                        )}
                        {selectedDepartement !== 'all' && (
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded border-2" style={{ borderColor: '#991B1B', backgroundColor: 'rgba(239,68,68,0.2)' }}></div>
                            <span className="text-xs font-semibold text-gray-900">{selectedDepartement}</span>
                          </div>
                        )}
                        {selectedArrondissement !== 'all' && (
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded border-2" style={{ borderColor: '#9A3412', backgroundColor: 'rgba(249,115,22,0.2)' }}></div>
                            <span className="text-xs font-semibold text-gray-900">{selectedArrondissement}</span>
                          </div>
                        )}
                        {selectedDistrict !== 'all' && (
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded border-2" style={{ borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)' }}></div>
                            <span className="text-xs font-semibold text-gray-900">{selectedDistrict}</span>
                          </div>
                        )}
                        {selectedAiresante !== 'all' && (
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded border-2" style={{ borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.12)' }}></div>
                            <span className="text-xs font-semibold text-gray-900">{selectedAiresante}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 16px;
          box-shadow: 0 10px 30px -8px rgba(0, 55, 88, 0.25);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.5;
          width: 100% !important;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          box-shadow: 0 3px 14px rgba(0,0,0,0.15);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2dc;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #007ac3;
        }
      `}</style>
    </div>
  );
};

export default MapView;