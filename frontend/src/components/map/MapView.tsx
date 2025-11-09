/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polygon, useMap } from "react-leaflet";
import {
  Filter,
  Layers,
  Search,
  MapPin,
  X,
  AlertTriangle,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { apiService } from "../../services/apiService";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CAMEROON_CENTER = [5.6919, 12.7289] as [number, number];
const CAMEROON_BOUNDS = L.latLngBounds([1.6546, 8.4948], [13.0783, 16.1921]);

interface Hospital {
  id: string;
  name: string;
  type: 'public' | 'private' | 'confessional' | 'military';
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
  regionsPolygons: { [key: string]: [number, number][] };
  hospitals: Hospital[];
}> = ({ selectedRegion, regionsPolygons }) => {
  const map = useMap();
  const previousRegionRef = useRef<string>("all");

  useEffect(() => {
    if (selectedRegion === "all") {
      if (previousRegionRef.current !== "all") {
        map.fitBounds(CAMEROON_BOUNDS, { padding: [20, 20] });
        previousRegionRef.current = "all";
      }
    } else if (regionsPolygons[selectedRegion]) {
      const regionPolygon = regionsPolygons[selectedRegion];
      const bounds = L.latLngBounds(regionPolygon);
      map.fitBounds(bounds, { padding: [30, 30] });
      previousRegionRef.current = selectedRegion;
    }
  }, [selectedRegion, regionsPolygons, map]);

  return null;
};

const MapView: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedDepartement, setSelectedDepartement] = useState<string>("all");
  const [selectedArrondissement, setSelectedArrondissement] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedAiresante, setSelectedAiresante] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mapStyle, setMapStyle] = useState("osm");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const [cameroonPolygon, setCameroonPolygon] = useState<[number, number][]>([]);
  const [regionsPolygons, setRegionsPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [departementsPolygons, setDepartementsPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [communesPolygons, setCommunesPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [districtsPolygons, setDistrictsPolygons] = useState<{ [key: string]: [number, number][] }>({});
  const [airesantesPolygons, setAiresantesPolygons] = useState<{ [key: string]: [number, number][] }>({});

  // Stocker les données brutes pour les filtres
  const [regionsData, setRegionsData] = useState<any[]>([]);
  const [departementsData, setDepartementsData] = useState<any[]>([]);
  const [arrondissementsData, setArrondissementsData] = useState<any[]>([]);
  const [districtsData, setDistrictsData] = useState<any[]>([]);
  const [airesantesData, setAiresantesData] = useState<any[]>([]);

  const [loadingProgress, setLoadingProgress] = useState({
    cameroonPolygon: false,
    regionsData: false,
    departementsData: false,
    communesData: false,
    districtsData: false,
    airesantesData: false,
    hospitalsData: false
  });

  // États pour contrôler la visibilité des couches
  const [layersVisibility, setLayersVisibility] = useState({
    cameroon: true,
    regions: true,
    departements: true,
    communes: true,
    districts: true,
    airesantes: true,
    hospitals: true
  });

  const toggleLayer = (layer: keyof typeof layersVisibility) => {
    setLayersVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const updateLoadingProgress = (key: keyof typeof loadingProgress, value: boolean) => {
    setLoadingProgress(prev => ({ ...prev, [key]: value }));
  };

  const fetchCameroonPolygon = async () => {
    try {
      updateLoadingProgress('cameroonPolygon', true);
      // Charger les données du Cameroun depuis notre API backend
      const response: any = await axios.get(`${import.meta.env.VITE_API_URL || 'https://minsante.vps.it-grafik.com/api/v1'}/cameroun`);

      if (response.data && response.data.data && response.data.data.length > 0) {
        const camerounData = response.data.data[0];

        if (camerounData.geom) {
          try {
            let geojson = camerounData.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }

            // GeoJSON MultiPolygon format
            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];

              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              setCameroonPolygon(transformed);
              return;
            }
          } catch (parseErr) {
            console.warn('Erreur parsing GeoJSON Cameroun:', parseErr);
          }
        }
      }
    } catch (err) {
      console.error('Erreur polygone Cameroun:', err);
    } finally {
      updateLoadingProgress('cameroonPolygon', false);
    }
  };

  const fetchRegionsData = async () => {
    try {
      updateLoadingProgress('regionsData', true);
      const regions = await apiService.getRegions();

      // Stocker les données brutes
      setRegionsData(regions);

      const regionsMap: { [key: string]: [number, number][] } = {};

      // Parser les polygones GeoJSON depuis le champ geom
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
            console.warn(`Erreur parsing polygon pour région ${region.nom}:`, parseErr);
          }
        }
      });

      setRegionsPolygons(regionsMap);
    } catch (err) {
      console.error('Erreur chargement régions:', err);
      setRegionsPolygons({});
    } finally {
      updateLoadingProgress('regionsData', false);
    }
  };

  const fetchDepartementsData = async () => {
    try {
      updateLoadingProgress('departementsData', true);
      const departements = await apiService.getDepartements();

      // Stocker les données brutes
      setDepartementsData(departements);

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
            console.warn(`Erreur parsing polygon pour département ${departement.departement}:`, parseErr);
          }
        }
      });

      setDepartementsPolygons(departementsMap);
    } catch (err) {
      console.error('Erreur chargement départements:', err);
      setDepartementsPolygons({});
    } finally {
      updateLoadingProgress('departementsData', false);
    }
  };

  const fetchCommunesData = async () => {
    try {
      updateLoadingProgress('communesData', true);
      const communes = await apiService.getCommunes();

      const communesMap: { [key: string]: [number, number][] } = {};

      communes.forEach((commune: any) => {
        if (commune.geom) {
          try {
            let geojson = commune.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }

            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];

              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              communesMap[commune.commune] = transformed;
            }
          } catch (parseErr) {
            console.warn(`Erreur parsing polygon pour commune ${commune.commune}:`, parseErr);
          }
        }
      });

      setCommunesPolygons(communesMap);
    } catch (err) {
      console.error('Erreur chargement communes:', err);
      setCommunesPolygons({});
    } finally {
      updateLoadingProgress('communesData', false);
    }
  };

  const fetchDistrictsData = async () => {
    try {
      updateLoadingProgress('districtsData', true);
      const districts = await apiService.getDistricts();

      setDistrictsData(districts);

      const districtsMap: { [key: string]: [number, number][] } = {};

      districts.forEach((district: any) => {
        if (district.geom) {
          try {
            let geojson = district.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }

            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];

              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              const nom = district.nom_ds || district.nom;
              if (nom) {
                districtsMap[nom] = transformed;
              }
            }
          } catch (parseErr) {
            console.warn(`Erreur parsing polygon pour district ${district.nom_ds || district.nom}:`, parseErr);
          }
        }
      });

      setDistrictsPolygons(districtsMap);
    } catch (err) {
      console.error('Erreur chargement districts:', err);
      setDistrictsPolygons({});
    } finally {
      updateLoadingProgress('districtsData', false);
    }
  };

  const fetchAiresantesData = async () => {
    try {
      updateLoadingProgress('airesantesData', true);
      const airesantes = await apiService.getAiresantes();

      setAiresantesData(airesantes);

      const airesantesMap: { [key: string]: [number, number][] } = {};

      airesantes.forEach((airesante: any) => {
        if (airesante.geom) {
          try {
            let geojson = airesante.geom;
            if (typeof geojson === 'string') {
              geojson = JSON.parse(geojson);
            }

            if (geojson.coordinates && geojson.coordinates.length > 0) {
              const coords = geojson.type === 'MultiPolygon'
                ? geojson.coordinates[0][0]
                : geojson.coordinates[0];

              const transformed: [number, number][] = coords.map((coord: any) => [coord[1], coord[0]]);
              const nom = airesante.nom_as || airesante.nom;
              if (nom) {
                airesantesMap[nom] = transformed;
              }
            }
          } catch (parseErr) {
            console.warn(`Erreur parsing polygon pour aire de santé ${airesante.nom_as || airesante.nom}:`, parseErr);
          }
        }
      });

      setAiresantesPolygons(airesantesMap);
    } catch (err) {
      console.error('Erreur chargement aires de santé:', err);
      setAiresantesPolygons({});
    } finally {
      updateLoadingProgress('airesantesData', false);
    }
  };

  const loadHospitalsData = async () => {
    try {
      updateLoadingProgress('hospitalsData', true);

      // Charger les FOSA depuis notre API backend
      const fosas = await apiService.getFosas();

      // Charger aussi les arrondissements, départements et régions pour avoir les données complètes
      const arrondissements = await apiService.getArrondissements();
      const departements = await apiService.getDepartements();
      const regions = await apiService.getRegions();

      // Stocker les arrondissements
      setArrondissementsData(arrondissements);

      const transformed: Hospital[] = fosas.map((fosa) => {
        // Trouver l'arrondissement, le département et la région
        const arrond = arrondissements.find(a => a.id === fosa.arrondissementId);
        const departement = arrond ? departements.find(d => d.id === arrond.departementId) : null;
        const region = departement ? regions.find(r => r.id === departement.regionId) : null;

        // Utiliser les coordonnées de l'arrondissement si disponibles
        const coordinates: [number, number] = arrond && arrond.latitude && arrond.longitude
          ? [arrond.latitude, arrond.longitude]
          : [3.8667, 11.5167]; // Coordonnées par défaut (Yaoundé)

        return {
          id: fosa.id.toString(),
          name: fosa.nom,
          type: fosa.type?.toLowerCase().includes('public') ? 'public' :
            fosa.type?.toLowerCase().includes('privé') ? 'private' :
              fosa.type?.toLowerCase().includes('confessionnel') ? 'confessional' : 'public',
          category: fosa.type || 'FOSA',
          status: fosa.estFerme ? 'closed' :
            fosa.situation?.toLowerCase().includes('maintenance') ? 'maintenance' :
              fosa.situation?.toLowerCase().includes('construction') ? 'construction' : 'operational',
          coordinates,
          address: arrond?.nom || 'Non spécifié',
          city: arrond?.nom || 'Non spécifié',
          region: region?.nom || 'Non spécifié',
          budget: {
            annual: Math.floor(Math.random() * 50000000) + 10000000,
            personnel: Math.floor(Math.random() * 30000000) + 6000000,
            equipment: Math.floor(Math.random() * 15000000) + 2500000,
            maintenance: Math.floor(Math.random() * 8000000) + 1500000,
          },
          capacity: {
            beds: fosa.capaciteLits || Math.floor(Math.random() * 200) + 50,
            staff: Math.floor(Math.random() * 100) + 20,
            doctors: Math.floor(Math.random() * 30) + 10,
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
            },
            {
              category: 'Chirurgie',
              items: [
                { name: 'Tables opératoires', quantity: Math.floor(Math.random() * 5) + 1, condition: "excellent" },
                { name: 'Ventilateurs', quantity: Math.floor(Math.random() * 4) + 2, condition: "excellent" }
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
          }
        };
      });

      setHospitals(transformed);
      setFilteredHospitals(transformed);
      setError(null);
    } catch (err) {
      console.error('Erreur hôpitaux:', err);
      // Fallback vers les données JSON locales si l'API échoue
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
        console.error('Erreur fallback hôpitaux:', fallbackErr);
        setError('Impossible de charger les données');
      }
    } finally {
      updateLoadingProgress('hospitalsData', false);
    }
  };

  useEffect(() => {
    const allLoaded = !loadingProgress.cameroonPolygon &&
      !loadingProgress.regionsData &&
      !loadingProgress.departementsData &&
      !loadingProgress.communesData &&
      !loadingProgress.districtsData &&
      !loadingProgress.airesantesData &&
      !loadingProgress.hospitalsData;
    if (allLoaded) setLoading(false);
  }, [loadingProgress]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCameroonPolygon(),
          fetchRegionsData(),
          fetchDepartementsData(),
          fetchCommunesData(),
          fetchDistrictsData(),
          fetchAiresantesData(),
          loadHospitalsData()
        ]);
      } catch (err) {
        setError('Erreur de chargement');
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (hospitals.length === 0) return;
    let filtered = hospitals;
    if (selectedType !== 'all') filtered = filtered.filter(h => h.type === selectedType);
    if (selectedStatus !== 'all') filtered = filtered.filter(h => h.status === selectedStatus);
    if (selectedCategory !== 'all') filtered = filtered.filter(h => h.category === selectedCategory);
    if (selectedRegion !== 'all') filtered = filtered.filter(h => h.region === selectedRegion);
    if (searchTerm) filtered = filtered.filter(h =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHospitals(filtered);
  }, [selectedType, selectedStatus, selectedCategory, selectedRegion, searchTerm, hospitals]);

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getHospitalIcon = (hospital: Hospital) => {
    const colors = { operational: '#10B981', maintenance: '#F59E0B', construction: '#3B82F6', closed: '#6B7280' };
    const icons: any = { CHU: '🏥', CHR: '🏥', CHD: '🏥', CMA: '⚕️', CSI: '⚕️', dispensaire: '💊', HR: '🏥', HD: '🏥', HC: '⚕️' };
    return L.divIcon({
      html: `<div style="background-color: ${colors[hospital.status]}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">${icons[hospital.category] || '🏥'}</div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(value);
  const getStatusText = (s: string) => ({ operational: 'Opérationnel', maintenance: 'En maintenance', construction: 'En construction', closed: 'Fermé' }[s] || s);
  const getTypeText = (t: string) => ({ public: 'Public', private: 'Privé', confessional: 'Confessionnel', military: 'Militaire' }[t] || t);

  const mapStyles = [
    { id: "osm", name: "Standard", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    { id: "satellite", name: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" },
    { id: "cameroon", name: "Cameroun", url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" },
  ];

  // Listes pour les dropdowns de filtres géographiques
  const regions = Array.from(new Set(regionsData.map(r => r.nom))).filter(r => r).sort();

  // Filtrer les départements selon la région sélectionnée
  const availableDepartements = selectedRegion === 'all'
    ? departementsData
    : departementsData.filter(d => {
      const region = regionsData.find(r => r.id === d.regionId);
      return region?.nom === selectedRegion;
    });
  const departements = Array.from(new Set(availableDepartements.map(d => d.departement))).filter(d => d).sort();

  // Filtrer les arrondissements selon le département sélectionné
  const availableArrondissements = selectedDepartement === 'all'
    ? arrondissementsData
    : arrondissementsData.filter(a => {
      const dept = departementsData.find(d => d.id === a.departementId);
      return dept?.departement === selectedDepartement;
    });
  const arrondissements = Array.from(new Set(availableArrondissements.map(a => a.nom))).filter(a => a).sort();

  // Filtrer les districts selon la région sélectionnée
  const availableDistricts = selectedRegion === 'all'
    ? districtsData
    : districtsData.filter(d => d.region === selectedRegion);
  const districts = Array.from(new Set(availableDistricts.map(d => d.nom_ds || d.nom))).filter(d => d).sort();

  // Filtrer les aires de santé selon le district sélectionné
  const availableAiresantes = selectedDistrict === 'all'
    ? airesantesData
    : airesantesData.filter(a => a.nom_dist === selectedDistrict);
  const airesantes = Array.from(new Set(availableAiresantes.map(a => a.nom_as || a.nom))).filter(a => a).sort();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl border border-emerald-200 max-w-md w-full mx-4">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl inline-block mb-6 shadow-lg">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Chargement des données</h2>
          <p className="text-gray-600 mb-6">Récupération des informations...</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-3 rounded-full transition-all duration-500" style={{ width: `${(!loadingProgress.cameroonPolygon ? 14 : 0) + (!loadingProgress.regionsData ? 14 : 0) + (!loadingProgress.departementsData ? 14 : 0) + (!loadingProgress.communesData ? 14 : 0) + (!loadingProgress.districtsData ? 15 : 0) + (!loadingProgress.airesantesData ? 15 : 0) + (!loadingProgress.hospitalsData ? 14 : 0)}%` }}></div>
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
              }} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Tous départements</option>
                {departements.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={selectedArrondissement} onChange={(e) => setSelectedArrondissement(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Tous arrondissements</option>
                {arrondissements.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={selectedDistrict} onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedAiresante('all');
              }} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Tous districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={selectedAiresante} onChange={(e) => setSelectedAiresante(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Toutes aires de santé</option>
                {airesantes.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
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
                <option value="private">Privé</option>
                <option value="confessional">Confessionnel</option>
              </select>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                <option value="all">Tous statuts</option>
                <option value="operational">Opérationnel</option>
                <option value="maintenance">Maintenance</option>
                <option value="construction">Construction</option>
                <option value="closed">Fermé</option>
              </select>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 bg-white/70">
                  {mapStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-800 font-medium text-sm">{filteredHospitals.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden">
          <div className="h-full relative flex">
            {/* Panneau d'information à gauche */}
            {selectedHospital && (
              <div className="w-[420px] h-full bg-white border-r border-emerald-200 overflow-y-auto custom-scrollbar z-[1000]">
                <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{selectedHospital.name}</h3>
                      <div className="text-emerald-50 text-sm space-y-1">
                        <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{selectedHospital.address}</p>
                        <p className="ml-6">{selectedHospital.city}, {selectedHospital.region}</p>
                      </div>
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
                  <CollapsibleSection id={`budget-${selectedHospital.id}`} title="Budget Annuel" icon={DollarSign} defaultExpanded={true}>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">Budget Total</p>
                          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedHospital.budget.annual)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                          <p className="text-xs text-gray-600 mb-1">Personnel</p>
                          <p className="text-xs font-semibold text-emerald-600">{formatCurrency(selectedHospital.budget.personnel)}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                          <p className="text-xs text-gray-600 mb-1">Équipements</p>
                          <p className="text-xs font-semibold text-teal-600">{formatCurrency(selectedHospital.budget.equipment)}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                          <p className="text-xs text-gray-600 mb-1">Maintenance</p>
                          <p className="text-xs font-semibold text-cyan-600">{formatCurrency(selectedHospital.budget.maintenance)}</p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection id={`capacity-${selectedHospital.id}`} title="Capacité et Personnel" icon={Activity} defaultExpanded={true}>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-emerald-50 p-3 rounded-lg text-center border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-600">{selectedHospital.capacity.beds}</p>
                        <p className="text-xs text-gray-600 mt-1">Lits</p>
                      </div>
                      <div className="bg-teal-50 p-3 rounded-lg text-center border border-teal-200">
                        <p className="text-2xl font-bold text-teal-600">{selectedHospital.capacity.staff}</p>
                        <p className="text-xs text-gray-600 mt-1">Personnel</p>
                      </div>
                      <div className="bg-cyan-50 p-3 rounded-lg text-center border border-cyan-200">
                        <p className="text-2xl font-bold text-cyan-600">{selectedHospital.capacity.doctors}</p>
                        <p className="text-xs text-gray-600 mt-1">Médecins</p>
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

            {/* Carte */}
            <div className="flex-1 relative">
              <MapContainer center={CAMEROON_CENTER} zoom={6} minZoom={6} maxBounds={CAMEROON_BOUNDS} style={{ height: "100%", width: "100%" }} className="rounded-2xl">
                <MapController selectedRegion={selectedRegion} regionsPolygons={regionsPolygons} hospitals={hospitals} />
                <TileLayer url={mapStyles.find(s => s.id === mapStyle)?.url || mapStyles[0].url} />

                {/* Polygone du Cameroun */}
                {layersVisibility.cameroon && cameroonPolygon.length > 0 && (
                  <Polygon positions={cameroonPolygon} pathOptions={{ fillColor: '#10b981', fillOpacity: 0.05, color: '#10b981', weight: 2, opacity: 0.6 }} />
                )}

                {/* Afficher tous les polygones des régions */}
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

                {/* Afficher tous les polygones des départements */}
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

                {/* Afficher tous les polygones des districts */}
                {layersVisibility.districts && Object.entries(districtsPolygons).map(([districtName, polygon]) => (
                  <Polygon
                    key={`district-${districtName}`}
                    positions={polygon}
                    pathOptions={{
                      fillColor: '#8b5cf6',
                      fillOpacity: 0.1,
                      color: '#8b5cf6',
                      weight: 1.5,
                      opacity: 0.5
                    }}
                  />
                ))}

                {/* Afficher tous les polygones des aires de santé */}
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

                {/* Marqueurs des hôpitaux */}
                {layersVisibility.hospitals && filteredHospitals.map(h => (
                  <Marker key={h.id} position={h.coordinates} icon={getHospitalIcon(h)} eventHandlers={{ click: () => setSelectedHospital(h) }}>
                  </Marker>
                ))}
              </MapContainer>

              {/* Contrôle des couches */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-emerald-200 z-[1000] max-h-[80vh] overflow-y-auto custom-scrollbar">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Couches de la carte
                </h4>
                <div className="space-y-2 text-xs">
                  {/* Contrôle de visibilité des couches */}
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

                  {/* Statuts des formations sanitaires */}
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

                  {/* Zones géographiques sélectionnées */}
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