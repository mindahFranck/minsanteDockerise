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

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CAMEROON_CENTER = [5.6919, 12.7289] as [number, number];
const CAMEROON_BOUNDS = L.latLngBounds([1.6546, 8.4948], [13.0783, 16.1921]);

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
        if (selectedAiresante !== 'all' && airesantesPolygons[selectedAiresante] && isValidPolygon(airesantesPolygons[selectedAiresante])) {
          const polygon = airesantesPolygons[selectedAiresante];
          const bounds = L.latLngBounds(polygon);
          map.fitBounds(bounds, { padding: [50, 50] });
        } else if (selectedDistrict !== 'all' && districtsPolygons[selectedDistrict] && isValidPolygon(districtsPolygons[selectedDistrict])) {
          const polygon = districtsPolygons[selectedDistrict];
          const bounds = L.latLngBounds(polygon);
          map.fitBounds(bounds, { padding: [40, 40] });
        } else if (selectedDepartement !== 'all' && departementsPolygons[selectedDepartement] && isValidPolygon(departementsPolygons[selectedDepartement])) {
          const polygon = departementsPolygons[selectedDepartement];
          const bounds = L.latLngBounds(polygon);
          map.fitBounds(bounds, { padding: [35, 35] });
        } else if (selectedRegion !== 'all' && regionsPolygons[selectedRegion] && isValidPolygon(regionsPolygons[selectedRegion])) {
          const polygon = regionsPolygons[selectedRegion];
          const bounds = L.latLngBounds(polygon);
          map.fitBounds(bounds, { padding: [30, 30] });
        } else {
          map.fitBounds(CAMEROON_BOUNDS, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('💥 Erreur lors du zoom:', error);
        map.fitBounds(CAMEROON_BOUNDS, { padding: [20, 20] });
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
        status: fosa.estFerme ? 'closed' :
          fosa.situation?.toLowerCase().includes('maintenance') ? 'maintenance' :
            fosa.situation?.toLowerCase().includes('construction') ? 'construction' : 'operational',
        coordinates,
        address: arrond?.nom || 'Non spécifié',
        city: arrond?.nom || 'Non spécifié',
        region: region?.nom || 'Non spécifié',
        image: fosa.image || null,
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
          phone: `+237 6${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 1000)} ${Math.floor(Math.random() * 1000)}`,
          email: `${fosa.nom.toLowerCase().replace(/\s+/g, '.')}@sante.cm`,
        },
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
    if (selectedRegion === 'all') {
      setDistrictsPolygons({});
      setDistrictsData([]);
      setAllDistrictsData([]);
      return;
    }

    const loadDistrictsByRegion = async () => {
      try {
        updateLoadingProgress('districtsData', true);
        setProgressMessage(`Chargement des districts de ${selectedRegion}...`);
        const region = allRegionsData.find(r => r.nom === selectedRegion);
        if (!region) return;

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
    if (selectedDistrict === 'all') {
      setAiresantesPolygons({});
      setAiresantesData([]);
      setAllAiresantesData([]);
      return;
    }

    const loadAiresantesByDistrict = async () => {
      try {
        updateLoadingProgress('airesantesData', true);
        setProgressMessage(`Chargement des aires de santé de ${selectedDistrict}...`);
        const district = allDistrictsData.find(d => (d.nom_ds || d.nom) === selectedDistrict);
        if (!district) return;

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
    if (selectedCategory !== 'all') filtered = filtered.filter(h => h.category === selectedCategory);

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
    const colors = { operational: '#10B981', maintenance: '#F59E0B', construction: '#3B82F6', closed: '#6B7280' };
    const icons: any = { CHU: '🏥', CHR: '🏥', CHD: '🏥', CMA: '⚕️', CSI: '⚕️', dispensaire: '💊', HR: '🏥', HD: '🏥', HC: '⚕️' };
    return L.divIcon({
      html: `<div style="background-color: ${colors[hospital.status]}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">${icons[hospital.category] || '🏥'}</div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
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
      <div className="border border-emerald-100 rounded-lg overflow-hidden shadow-sm">
        <button onClick={(e) => toggleSection(id, e)} className="w-full px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 flex items-center justify-between text-left transition-colors">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-gray-700">{title}</span>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5 text-emerald-600" />}
        </button>
        {isExpanded && <div className="p-4 bg-white">{children}</div>}
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
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' :
        isLoaded ? 'bg-green-500' : 'bg-gray-300'
        }`}></div>
      <span className="text-xs text-gray-500">{label}</span>
      {isLoading && (
        <svg className="animate-spin h-3 w-3 text-emerald-600 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div className="text-center bg-white p-8 rounded-2xl shadow-2xl border border-emerald-200 max-w-md w-full mx-4">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl inline-block mb-6 shadow-lg">
          <Activity className="w-12 h-12 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Chargement des FOSA</h2>
        <p className="text-gray-600 mb-6">Filtrage des formations sanitaires...</p>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-3 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-2 text-left">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-gray-500">Récupération des données</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-gray-500">Filtrage spatial</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-gray-500">Affichage sur la carte</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && !allDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl border border-emerald-200 max-w-md w-full mx-4">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl inline-block mb-6 shadow-lg">
            <Activity className="w-12 h-12 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Chargement des données</h2>
          <p className="text-gray-600 mb-6">Préparation de la cartographie...</p>

          {progressMessage && (
            <p className="text-sm text-emerald-600 font-semibold mb-4 animate-pulse">
              {progressMessage}
            </p>
          )}

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-600 to-teal-600 h-3 rounded-full transition-all duration-500"
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

          <div className="mt-4 text-xs text-gray-500">
            {getLoadingDetails()}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-emerald-200">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
      {showFosaLoader && <FosaLoader />}

      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-emerald-200 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-2 rounded-xl shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">MAP</h1>
                <p className="text-xs text-gray-500">Cartographie des établissements de santé</p>
              </div>
            </div>
            <Link to={"/login"} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium shadow-lg">
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-56px)] flex flex-col px-3 py-3 gap-3">
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-emerald-100">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-4 h-4" />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white/70" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <select value={selectedRegion} onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedDepartement('all');
                setSelectedArrondissement('all');
                setSelectedDistrict('all');
                setSelectedAiresante('all');
              }} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Toutes régions</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select value={selectedDepartement} onChange={(e) => {
                setSelectedDepartement(e.target.value);
                setSelectedArrondissement('all');
              }} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70" disabled={departements.length === 0}>
                <option value="all">Tous départements</option>
                {departements.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={selectedArrondissement} onChange={(e) => setSelectedArrondissement(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70" disabled={arrondissements.length === 0}>
                <option value="all">Tous arrondissements</option>
                {arrondissements.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <div className="relative">
                <select value={selectedDistrict} onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedAiresante('all');
                }} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70" disabled={loadingProgress.districtsData || districts.length === 0}>
                  <option value="all">Tous districts</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {loadingProgress.districtsData && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>

              <div className="relative">
                <select value={selectedAiresante} onChange={(e) => setSelectedAiresante(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70" disabled={loadingProgress.airesantesData || airesantes.length === 0}>
                  <option value="all">Toutes aires de santé</option>
                  {airesantes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {loadingProgress.airesantesData && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>

              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Toutes catégories</option>
                <option value="HR">HR</option>
                <option value="HD">HD</option>
                <option value="HC">HC</option>
                <option value="CMA">CMA</option>
                <option value="CSI">CSI</option>
              </select>

              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Tous types</option>
                <option value="public">Public</option>
                <option value="parapublic">Parapublic</option>
                <option value="prive_laic">Privé laïc</option>
                <option value="prive_confessionnel">Privé confessionnel</option>
              </select>

              {/* Nouveaux filtres pour titre foncier et clôture */}
              <select value={selectedTitreFoncier} onChange={(e) => setSelectedTitreFoncier(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Titre foncier</option>
                <option value="yes">Avec titre</option>
                <option value="no">Sans titre</option>
              </select>

              <select value={selectedCloture} onChange={(e) => setSelectedCloture(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Clôture</option>
                <option value="yes">Avec clôture</option>
                <option value="no">Sans clôture</option>
              </select>

              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                  {mapStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {loadingFosas ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                ) : (
                  <span className="text-emerald-800 font-medium text-sm">{filteredHospitals.length}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden">
          <div className="h-full relative flex">
            {selectedHospital && (
              <div className="w-[420px] h-full bg-white border-r border-emerald-200 overflow-y-auto custom-scrollbar z-[1000]">
                <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{selectedHospital.name}</h3>
                    </div>
                    <button onClick={() => setSelectedHospital(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex gap-3 text-sm flex-wrap">
                    <span className={`px-3 py-1 rounded-lg font-semibold ${selectedHospital.status === "operational" ? "bg-green-500" : selectedHospital.status === "maintenance" ? "bg-yellow-500" : selectedHospital.status === "construction" ? "bg-blue-500" : "bg-gray-500"}`}>
                      {getStatusText(selectedHospital.status)}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-lg"><strong>Type:</strong> {getTypeText(selectedHospital.type)}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-lg"><strong>Catégorie:</strong> {selectedHospital.category}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {selectedHospital?.image && (
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-emerald-200">
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
                    <div className="w-full h-48 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg flex items-center justify-center border border-emerald-200">
                      <div className="text-center text-gray-400">
                        <Building className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-sm">Image non disponible</p>
                      </div>
                    </div>
                  )}

                  <CollapsibleSection id={`capacity-${selectedHospital.id}`} title="Capacité" icon={Activity} defaultExpanded={true}>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 p-3 rounded-lg text-center border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-600">{selectedHospital.capacity?.beds || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Lits</p>
                      </div>
                      <div className="bg-teal-50 p-3 rounded-lg text-center border border-teal-200">
                        <p className="text-2xl font-bold text-teal-600">{selectedHospital.batimentsCount || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Bâtiments</p>
                      </div>
                      <div className="bg-cyan-50 p-3 rounded-lg text-center border border-cyan-200">
                        <p className="text-2xl font-bold text-cyan-600">{selectedHospital.vehiculesCount || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Véhicules</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{selectedHospital.ambulancesCount || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Ambulances</p>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`personnel-${selectedHospital.id}`} title="Personnel" icon={Users} defaultExpanded={true}>
                    <div className="space-y-2">
                      {selectedHospital.personnelByCategory && (selectedHospital as any).personnelByCategory?.length > 0 ? (
                        (selectedHospital as any).personnelByCategory?.map((cat: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="text-xs text-gray-700">{cat.category}</span>
                            <span className="text-sm font-bold text-emerald-600">{cat.count}</span>
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
                      <div className={`p-3 rounded-lg text-center border ${selectedHospital.aTitreFoncier ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-xs text-gray-600 mb-1">Titre Foncier</p>
                        <p className={`text-lg font-bold ${selectedHospital.aTitreFoncier ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedHospital.aTitreFoncier ? 'Oui' : 'Non'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg text-center border ${selectedHospital.aCloture ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-xs text-gray-600 mb-1">Clôture</p>
                        <p className={`text-lg font-bold ${selectedHospital.aCloture ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedHospital.aCloture ? 'Oui' : 'Non'}
                        </p>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`services-${selectedHospital.id}`} title="Services Disponibles" icon={Activity} defaultExpanded={false}>
                    <div className="flex flex-wrap gap-2">
                      {selectedHospital.services.map((service, idx) => (
                        <span key={idx} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium border border-emerald-200">
                          {service}
                        </span>
                      ))}
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`maintenance-${selectedHospital.id}`} title="État de Maintenance" icon={AlertTriangle} defaultExpanded={false}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Dernière inspection</p>
                          <p className="font-semibold text-xs">{new Date(selectedHospital.maintenance.lastInspection).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Prochaine inspection</p>
                          <p className="font-semibold text-xs">{new Date(selectedHospital.maintenance.nextInspection).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      {selectedHospital.maintenance.issues.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                          <p className="text-xs font-semibold text-red-700 mb-2">Problèmes identifiés:</p>
                          <ul className="space-y-1 text-xs text-red-600">
                            {selectedHospital.maintenance.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Contact</p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Téléphone:</strong> {selectedHospital.contact.phone}</p>
                      <p><strong>Email:</strong> {selectedHospital.contact.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 relative">
              <MapContainer center={CAMEROON_CENTER} zoom={6} minZoom={6} maxBounds={CAMEROON_BOUNDS} style={{ height: "100%", width: "100%" }} className="rounded-2xl">
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
                  <Polygon positions={cameroonPolygon} pathOptions={{ fillColor: '#10b981', fillOpacity: 0.05, color: '#10b981', weight: 2, opacity: 0.6 }} />
                )}

                {layersVisibility.regions && Object.entries(regionsPolygons).map(([regionName, polygon]) => (
                  <Polygon
                    key={`region-${regionName}`}
                    positions={polygon}
                    pathOptions={{
                      fillColor: selectedRegion === regionName ? '#14b8a6' : '#10b981',
                      fillOpacity: selectedRegion === regionName ? 0.15 : 0.05,
                      color: selectedRegion === regionName ? '#14b8a6' : '#10b981',
                      weight: selectedRegion === regionName ? 3 : 1.5,
                      opacity: selectedRegion === regionName ? 0.8 : 0.4
                    }}
                  />
                ))}

                {layersVisibility.departements && Object.entries(departementsPolygons).map(([deptName, polygon]) => (
                  <Polygon
                    key={`dept-${deptName}`}
                    positions={polygon}
                    pathOptions={{
                      fillColor: selectedDepartement === deptName ? '#0891b2' : '#06b6d4',
                      fillOpacity: selectedDepartement === deptName ? 0.2 : 0.05,
                      color: selectedDepartement === deptName ? '#0891b2' : '#06b6d4',
                      weight: selectedDepartement === deptName ? 3 : 1,
                      opacity: selectedDepartement === deptName ? 0.9 : 0.3
                    }}
                  />
                ))}

                {layersVisibility.arrondissements && Object.entries(arrondissementsPolygons).map(([arrondName, polygon]) => (
                  <Polygon
                    key={`arrond-${arrondName}`}
                    positions={polygon}
                    pathOptions={{
                      fillColor: selectedArrondissement === arrondName ? '#3b82f6' : '#60a5fa',
                      fillOpacity: selectedArrondissement === arrondName ? 0.25 : 0.08,
                      color: selectedArrondissement === arrondName ? '#3b82f6' : '#60a5fa',
                      weight: selectedArrondissement === arrondName ? 3 : 1.2,
                      opacity: selectedArrondissement === arrondName ? 0.9 : 0.35
                    }}
                  />
                ))}

                {layersVisibility.districts && Object.entries(districtsPolygons).map(([districtName, polygon]) => {
                  const fillColor = activeTheme ? activeTheme.getColor(districtName) : '#8b5cf6';
                  const fillOpacity = activeTheme ? 0.6 : 0.1;
                  return (
                    <Polygon
                      key={`district-${districtName}`}
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

                {layersVisibility.airesantes && Object.entries(airesantesPolygons).map(([airesanteName, polygon]) => (
                  <Polygon
                    key={`airesante-${airesanteName}`}
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

                {layersVisibility.hospitals && filteredHospitals.map(h => (
                  <Marker key={h.id} position={h.coordinates} icon={getHospitalIcon(h)} eventHandlers={{ click: () => setSelectedHospital(h) }}>
                    {selectedHospital?.id === h.id && (
                      <Tooltip permanent direction="top" offset={[0, -20]} className="permanent-tooltip">
                        <div className="font-semibold text-sm">{h.name}</div>
                      </Tooltip>
                    )}
                  </Marker>
                ))}
              </MapContainer>

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

              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-emerald-200 z-[1000] max-h-[80vh] overflow-y-auto custom-scrollbar">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Couches de la carte
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="pb-2 border-b border-emerald-100">
                    <p className="font-semibold text-gray-700 mb-2">Divisions géographiques</p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer hover:bg-emerald-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={layersVisibility.cameroon}
                          onChange={() => toggleLayer('cameroon')}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div className="w-4 h-4 border-2 border-emerald-600 bg-emerald-50"></div>
                        <span>Cameroun</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer hover:bg-emerald-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={layersVisibility.regions}
                          onChange={() => toggleLayer('regions')}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div className="w-4 h-4 border-2 border-emerald-600 bg-emerald-100"></div>
                        <span>Régions</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer hover:bg-cyan-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={layersVisibility.departements}
                          onChange={() => toggleLayer('departements')}
                          className="w-4 h-4 text-cyan-600 rounded"
                        />
                        <div className="w-4 h-4 border-2 border-cyan-600 bg-cyan-50"></div>
                        <span>Départements</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={layersVisibility.arrondissements}
                          onChange={() => toggleLayer('arrondissements')}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="w-4 h-4 border-2 border-blue-600 bg-blue-50"></div>
                        <span>Arrondissements</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer hover:bg-purple-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={layersVisibility.districts}
                          onChange={() => toggleLayer('districts')}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <div className="w-4 h-4 border-2 border-purple-600 bg-purple-50"></div>
                        <span>Districts sanitaires</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer hover:bg-pink-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={layersVisibility.airesantes}
                          onChange={() => toggleLayer('airesantes')}
                          className="w-4 h-4 text-pink-600 rounded"
                        />
                        <div className="w-4 h-4 border-2 border-pink-600 bg-pink-50"></div>
                        <span>Aires de santé</span>
                      </label>
                    </div>
                  </div>

                  <div className="pb-2 border-b border-emerald-100">
                    <p className="font-semibold text-gray-700 mb-2">Formations sanitaires</p>
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded mb-2">
                      <input
                        type="checkbox"
                        checked={layersVisibility.hospitals}
                        onChange={() => toggleLayer('hospitals')}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="font-medium">Afficher les FOSA</span>
                    </label>
                    <div className="space-y-1 ml-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full shadow"></div>
                        <span>Opérationnel</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full shadow"></div>
                        <span>Maintenance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full shadow"></div>
                        <span>Construction</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-500 rounded-full shadow"></div>
                        <span>Fermé</span>
                      </div>
                    </div>
                  </div>

                  {(selectedRegion !== 'all' || selectedDepartement !== 'all' || selectedArrondissement !== 'all' || selectedDistrict !== 'all' || selectedAiresante !== 'all') && (
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="font-semibold text-gray-700 mb-2">Sélection active</p>
                      <div className="space-y-1">
                        {selectedRegion !== 'all' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-teal-500 bg-teal-100"></div>
                            <span className="text-teal-600 font-medium text-xs">{selectedRegion}</span>
                          </div>
                        )}
                        {selectedDepartement !== 'all' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-cyan-600 bg-cyan-100"></div>
                            <span className="text-cyan-700 font-medium text-xs">{selectedDepartement}</span>
                          </div>
                        )}
                        {selectedArrondissement !== 'all' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-600 bg-blue-100"></div>
                            <span className="text-blue-700 font-medium text-xs">{selectedArrondissement}</span>
                          </div>
                        )}
                        {selectedDistrict !== 'all' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-purple-600 bg-purple-100"></div>
                            <span className="text-purple-700 font-medium text-xs">{selectedDistrict}</span>
                          </div>
                        )}
                        {selectedAiresante !== 'all' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-pink-600 bg-pink-100"></div>
                            <span className="text-pink-700 font-medium text-xs">{selectedAiresante}</span>
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
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          border: 2px solid rgba(16, 185, 129, 0.2);
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
          background: #f0fdf4;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #14b8a6);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0d9488);
        }
      `}</style>
    </div>
  );
};

export default MapView;