/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { Hospital, Region, Departement, Arrondissement } from '../../types';
import { mockHospitals } from '../../data/mockData';
import { regionService } from '../../services/regionService';
import { departementService } from '../../services/departementService';
import { arrondissementService } from '../../services/arrondissementService';
import { Filter, Layers, Search, MapPin, Users, Bed, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const HospitalMapView: React.FC = () => {
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>(mockHospitals);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapStyle, setMapStyle] = useState('osm');

  // Geographic zone state
  const [regions, setRegions] = useState<Region[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [arrondissements, setArrondissements] = useState<Arrondissement[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedDepartementId, setSelectedDepartementId] = useState<number | null>(null);
  const [selectedArrondissementId, setSelectedArrondissementId] = useState<number | null>(null);
  const [showRegions, setShowRegions] = useState(true);
  const [showDepartements, setShowDepartements] = useState(false);
  const [showArrondissements, setShowArrondissements] = useState(false);

  // Load geographic data on mount
  useEffect(() => {
    const loadGeographicData = async () => {
      try {
        // Load regions with geographic data
        const regionsData = await regionService.getAllForMap();
        setRegions(regionsData);
      } catch (error) {
        console.error('Error loading geographic data:', error);
      }
    };

    loadGeographicData();
  }, []);

  // Load departements when region is selected
  useEffect(() => {
    if (selectedRegionId) {
      const loadDepartements = async () => {
        try {
          const response = await departementService.getAll({ regionId: selectedRegionId, limit: 1000 });
          setDepartements(response.data);
        } catch (error) {
          console.error('Error loading departements:', error);
        }
      };
      loadDepartements();
    } else {
      setDepartements([]);
      setSelectedDepartementId(null);
    }
  }, [selectedRegionId]);

  // Load arrondissements when departement is selected
  useEffect(() => {
    if (selectedDepartementId) {
      const loadArrondissements = async () => {
        try {
          const response = await arrondissementService.getAll({ departementId: selectedDepartementId, limit: 1000 });
          setArrondissements(response.data);
        } catch (error) {
          console.error('Error loading arrondissements:', error);
        }
      };
      loadArrondissements();
    } else {
      setArrondissements([]);
      setSelectedArrondissementId(null);
    }
  }, [selectedDepartementId]);

  useEffect(() => {
    let filtered = mockHospitals;

    if (selectedType !== 'all') {
      filtered = filtered.filter(hospital => hospital.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(hospital => hospital.status === selectedStatus);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hospital => hospital.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.region.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHospitals(filtered);
  }, [selectedType, selectedStatus, selectedCategory, searchTerm]);

  const getHospitalIcon = (hospital: Hospital) => {
    const statusColors = {
      operational: '#10B981',
      maintenance: '#F59E0B',
      construction: '#3B82F6',
      closed: '#6B7280'
    };

    const categoryIcons = {
      CHU: '🏥',
      CHR: '🏥',
      CHD: '🏥',
      CMA: '⚕️',
      CSI: '⚕️',
      dispensaire: '💊'
    };

    return new L.DivIcon({
      html: `<div style="background-color: ${statusColors[hospital.status]}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">
        ${categoryIcons[hospital.category] || '🏥'}
      </div>`,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'maintenance': return 'En maintenance';
      case 'construction': return 'En construction';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'public': return 'Public';
      case 'private': return 'Privé';
      case 'confessional': return 'Confessionnel';
      case 'military': return 'Militaire';
      default: return type;
    }
  };


  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'fair': return 'Correct';
      case 'poor': return 'Mauvais';
      case 'critical': return 'Critique';
      default: return condition;
    }
  };

  const mapStyles = [
    { id: 'osm', name: 'Standard', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { id: 'satellite', name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { id: 'terrain', name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' }
  ];

  // GeoJSON styling functions
  const getRegionStyle = (feature: any) => {
    const isSelected = selectedRegionId === feature.properties?.id;
    return {
      fillColor: isSelected ? '#FBBF24' : '#93C5FD',  // Jaune pour sélection
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#D97706' : '#60A5FA',  // Bordure orange foncé pour sélection
      fillOpacity: isSelected ? 0.65 : 0.2
    };
  };

  const getDepartementStyle = (feature: any) => {
    const isSelected = selectedDepartementId === feature.properties?.id;
    return {
      fillColor: isSelected ? '#EF4444' : '#6EE7B7',  // Rouge pour sélection
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#991B1B' : '#34D399',  // Bordure rouge foncé pour sélection
      fillOpacity: isSelected ? 0.65 : 0.2
    };
  };

  const getArrondissementStyle = (feature: any) => {
    const isSelected = selectedArrondissementId === feature.properties?.id;
    return {
      fillColor: isSelected ? '#F97316' : '#FCD34D',  // Orange pour sélection
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#9A3412' : '#FBBF24',  // Bordure orange foncé pour sélection
      fillOpacity: isSelected ? 0.65 : 0.2
    };
  };

  // GeoJSON event handlers
  const onRegionClick = (feature: any, layer: any) => {
    if (feature.properties?.id) {
      setSelectedRegionId(feature.properties.id);
      setShowDepartements(true);
      setShowArrondissements(false);
    }
  };

  const onDepartementClick = (feature: any, layer: any) => {
    if (feature.properties?.id) {
      setSelectedDepartementId(feature.properties.id);
      setShowArrondissements(true);
    }
  };

  const onArrondissementClick = (feature: any, layer: any) => {
    if (feature.properties?.id) {
      setSelectedArrondissementId(feature.properties.id);
    }
  };

  const onEachRegion = (feature: any, layer: any) => {
    layer.on({
      click: () => onRegionClick(feature, layer),
      mouseover: (e: any) => {
        e.target.setStyle({
          weight: 3,
          fillOpacity: 0.4
        });
      },
      mouseout: (e: any) => {
        e.target.setStyle(getRegionStyle(feature));
      }
    });

    if (feature.properties?.nom) {
      layer.bindTooltip(feature.properties.nom, {
        permanent: false,
        direction: 'center',
        className: 'bg-white px-2 py-1 rounded shadow-lg text-sm font-medium'
      });
    }
  };

  const onEachDepartement = (feature: any, layer: any) => {
    layer.on({
      click: () => onDepartementClick(feature, layer),
      mouseover: (e: any) => {
        e.target.setStyle({
          weight: 3,
          fillOpacity: 0.4
        });
      },
      mouseout: (e: any) => {
        e.target.setStyle(getDepartementStyle(feature));
      }
    });

    if (feature.properties?.departement || feature.properties?.nom) {
      layer.bindTooltip(feature.properties.departement || feature.properties.nom, {
        permanent: false,
        direction: 'center',
        className: 'bg-white px-2 py-1 rounded shadow-lg text-sm font-medium'
      });
    }
  };

  const onEachArrondissement = (feature: any, layer: any) => {
    layer.on({
      click: () => onArrondissementClick(feature, layer),
      mouseover: (e: any) => {
        e.target.setStyle({
          weight: 3,
          fillOpacity: 0.4
        });
      },
      mouseout: (e: any) => {
        e.target.setStyle(getArrondissementStyle(feature));
      }
    });

    if (feature.properties?.nom) {
      layer.bindTooltip(feature.properties.nom, {
        permanent: false,
        direction: 'center',
        className: 'bg-white px-2 py-1 rounded shadow-lg text-sm font-medium'
      });
    }
  };

  return (
    <div className="space-y-6">


      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un hôpital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="CHU">CHU</option>
              <option value="CHR">CHR</option>
              <option value="CHD">CHD</option>
              <option value="CMA">CMA</option>
              <option value="CSI">CSI</option>
              <option value="dispensaire">Dispensaire</option>
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="public">Public</option>
              <option value="private">Privé</option>
              <option value="confessional">Confessionnel</option>
              <option value="military">Militaire</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="operational">Opérationnel</option>
              <option value="maintenance">Maintenance</option>
              <option value="construction">Construction</option>
              <option value="closed">Fermé</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {mapStyles.map((style, index) => (
                <option key={index} value={style.id}>{style.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{filteredHospitals.length} hôpital(s)</span>
          </div>
        </div>

        {/* Geographic zone controls */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRegions}
                  onChange={(e) => {
                    setShowRegions(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedRegionId(null);
                      setShowDepartements(false);
                      setShowArrondissements(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Régions</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-300 border-2 border-blue-600 rounded" title="Non sélectionné"></div>
                  <span className="text-xs text-gray-500">/</span>
                  <div className="w-4 h-4 bg-yellow-400 border-2 border-yellow-700 rounded" title="Sélectionné"></div>
                </div>
              </label>
            </div>

            {selectedRegionId && (
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDepartements}
                    onChange={(e) => {
                      setShowDepartements(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedDepartementId(null);
                        setShowArrondissements(false);
                      }
                    }}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Départements</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-300 border-2 border-green-600 rounded" title="Non sélectionné"></div>
                    <span className="text-xs text-gray-500">/</span>
                    <div className="w-4 h-4 bg-red-500 border-2 border-red-900 rounded" title="Sélectionné"></div>
                  </div>
                </label>
              </div>
            )}

            {selectedDepartementId && (
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArrondissements}
                    onChange={(e) => {
                      setShowArrondissements(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedArrondissementId(null);
                      }
                    }}
                    className="w-4 h-4 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Arrondissements</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-300 border-2 border-yellow-600 rounded" title="Non sélectionné"></div>
                    <span className="text-xs text-gray-500">/</span>
                    <div className="w-4 h-4 bg-orange-500 border-2 border-orange-900 rounded" title="Sélectionné"></div>
                  </div>
                </label>
              </div>
            )}

            {selectedRegionId && (
              <button
                onClick={() => {
                  setSelectedRegionId(null);
                  setSelectedDepartementId(null);
                  setSelectedArrondissementId(null);
                  setShowDepartements(false);
                  setShowArrondissements(false);
                }}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Réinitialiser la sélection
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-[700px]">
          <MapContainer
            center={[7.3697, 12.3547]} // Centre du Cameroun
            zoom={6}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={mapStyles.find(style => style.id === mapStyle)?.url || mapStyles[0].url}
            />

            {/* GeoJSON layers for geographic zones */}
            {showRegions && regions.map((region) => (
              region.geom && (
                <GeoJSON
                  key={`region-${region.id}`}
                  data={region.geom}
                  style={getRegionStyle}
                  onEachFeature={(feature, layer) => {
                    // Add region id to feature properties for styling
                    if (!feature.properties) feature.properties = {};
                    feature.properties.id = region.id;
                    feature.properties.nom = region.nom;
                    onEachRegion(feature, layer);
                  }}
                />
              )
            ))}

            {showDepartements && departements.map((dept) => (
              dept.geom && (
                <GeoJSON
                  key={`dept-${dept.id}`}
                  data={dept.geom}
                  style={getDepartementStyle}
                  onEachFeature={(feature, layer) => {
                    if (!feature.properties) feature.properties = {};
                    feature.properties.id = dept.id;
                    feature.properties.departement = dept.departement;
                    feature.properties.nom = dept.nom || dept.departement;
                    onEachDepartement(feature, layer);
                  }}
                />
              )
            ))}

            {showArrondissements && arrondissements.map((arr) => (
              arr.geom && (
                <GeoJSON
                  key={`arr-${arr.id}`}
                  data={arr.geom}
                  style={getArrondissementStyle}
                  onEachFeature={(feature, layer) => {
                    if (!feature.properties) feature.properties = {};
                    feature.properties.id = arr.id;
                    feature.properties.nom = arr.nom;
                    onEachArrondissement(feature, layer);
                  }}
                />
              )
            ))}

            {filteredHospitals.map((hospital, index) => (
              <Marker
                key={index}
                position={hospital.coordinates}
                icon={getHospitalIcon(hospital)}
              >
                <Popup className="custom-popup" maxWidth={500}>
                  <div className="p-4 min-w-[450px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{hospital.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${hospital.status === 'operational' ? 'bg-green-100 text-green-800' :
                        hospital.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          hospital.status === 'construction' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {getStatusText(hospital.status)}
                      </span>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-2">{hospital.address}</p>
                        <p className="text-gray-500">{hospital.city}, {hospital.region}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <span className="ml-1">{getTypeText(hospital.type)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Catégorie:</span>
                          <span className="ml-1">{hospital.category}</span>
                        </div>
                      </div>

                      {/* Capacité */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                          <Bed className="w-4 h-4 mr-1" />
                          Capacité d'accueil
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-600">Lits totaux:</span>
                            <div className="font-bold text-blue-700">{hospital.capacity.totalBeds}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Lits occupés:</span>
                            <div className="font-bold text-blue-700">{hospital.capacity.occupiedBeds}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Blocs opératoires:</span>
                            <div className="font-bold text-blue-700">{hospital.capacity.operatingRooms}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Urgences:</span>
                            <div className="font-bold text-blue-700">{hospital.capacity.emergencyBeds}</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Taux d'occupation</span>
                            <span className="font-bold">{hospital.performance.occupancyRate}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${hospital.performance.occupancyRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Personnel */}
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Personnel
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-600">Médecins:</span>
                            <div className="font-bold text-green-700">{hospital.staff.doctors}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Infirmiers:</span>
                            <div className="font-bold text-green-700">{hospital.staff.nurses}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Techniciens:</span>
                            <div className="font-bold text-green-700">{hospital.staff.technicians}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Administratif:</span>
                            <div className="font-bold text-green-700">{hospital.staff.administrative}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs">
                          <span className="text-gray-600">Total personnel: </span>
                          <span className="font-bold text-green-700">
                            {hospital.staff.doctors + hospital.staff.nurses + hospital.staff.technicians + hospital.staff.administrative}
                          </span>
                        </div>
                      </div>

                      {/* Patrimoine */}
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">Patrimoine immobilier</h4>
                        <div className="space-y-1 text-xs">
                          {hospital.buildings.slice(0, 3).map((building, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-gray-600">{building.name}:</span>
                              <span className={`font-medium ${getConditionColor(building.condition)}`}>
                                {getConditionText(building.condition)}
                              </span>
                            </div>
                          ))}
                          {hospital.buildings.length > 3 && (
                            <div className="text-gray-500 text-center">
                              +{hospital.buildings.length - 3} autres bâtiments
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs">
                          <span className="text-gray-600">Surface totale: </span>
                          <span className="font-bold text-purple-700">
                            {hospital.buildings.reduce((sum, b) => sum + b.surface, 0).toLocaleString()} m²
                          </span>
                        </div>
                      </div>

                      {/* Équipements */}
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-orange-900 mb-2">Équipements médicaux</h4>
                        <div className="space-y-1 text-xs">
                          {hospital.equipment.slice(0, 2).map((category, index) => (
                            <div key={index}>
                              <span className="font-medium text-orange-800">{category.category}:</span>
                              <div className="ml-2">
                                {category.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="text-gray-600">{item.name}:</span>
                                    <span className="text-orange-700">{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Budget annuel:</span>
                          <span className="font-bold text-green-600">{formatCurrency(hospital.budget.annual)}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Personnel: {formatCurrency(hospital.budget.personnel)} |
                          Équipements: {formatCurrency(hospital.budget.equipment)}
                        </div>
                      </div>

                      {/* Maintenance */}
                      {hospital.maintenance.issues.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Points d'attention
                          </h4>
                          <ul className="space-y-1">
                            {hospital.maintenance.issues.slice(0, 2).map((issue, index) => (
                              <li key={index} className="text-xs text-red-700">• {issue}</li>
                            ))}
                          </ul>
                          <div className="mt-2 text-xs">
                            <span className="text-gray-600">Priorité: </span>
                            <span className={`font-medium ${hospital.maintenance.priority === 'urgent' ? 'text-red-600' :
                              hospital.maintenance.priority === 'high' ? 'text-orange-600' :
                                hospital.maintenance.priority === 'medium' ? 'text-yellow-600' :
                                  'text-green-600'
                              }`}>
                              {hospital.maintenance.priority === 'urgent' ? 'Urgente' :
                                hospital.maintenance.priority === 'high' ? 'Haute' :
                                  hospital.maintenance.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      <div>
                        <span className="font-medium text-gray-700">Services disponibles:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {hospital.services.slice(0, 4).map((service, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {service}
                            </span>
                          ))}
                          {hospital.services.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                              +{hospital.services.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {hospital.photos && hospital.photos.length > 0 && (
                      <div className="mt-4">
                        <img
                          src={hospital.photos[0]}
                          alt={hospital.name}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default HospitalMapView;