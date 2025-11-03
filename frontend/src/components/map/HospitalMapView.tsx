/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Hospital } from '../../types';
import { mockHospitals } from '../../data/mockData';
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
              {mapStyles.map(style => (
                <option key={style.id} value={style.id}>{style.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{filteredHospitals.length} hôpital(s)</span>
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
            {filteredHospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                position={hospital.coordinates}
                icon={getHospitalIcon(hospital)}
              >
                <Popup className="custom-popup" maxWidth={500}>
                  <div className="p-4 min-w-[450px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{hospital.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        hospital.status === 'operational' ? 'bg-green-100 text-green-800' :
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
                            <span className={`font-medium ${
                              hospital.maintenance.priority === 'urgent' ? 'text-red-600' :
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