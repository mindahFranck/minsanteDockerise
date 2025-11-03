import React, { useState } from 'react';
import { Building, Eye, Edit, Trash2, Plus, Filter, MapPin, Calendar, Zap } from 'lucide-react';
import { Building as BuildingType } from '../../types';
import { mockBuildings } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const BuildingsModule: React.FC = () => {
  const { user } = useAuth();
  const [buildings] = useState<BuildingType[]>(mockBuildings);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredBuildings = buildings.filter(building => {
    const matchesType = filterType === 'all' || building.type === filterType;
    const matchesStatus = filterStatus === 'all' || building.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'vacant': return 'bg-gray-100 text-gray-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'maintenance': return 'Maintenance';
      case 'vacant': return 'Vacant';
      case 'planned': return 'Planifié';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'residential': return 'Résidentiel';
      case 'commercial': return 'Commercial';
      case 'industrial': return 'Industriel';
      case 'institutional': return 'Institutionnel';
      default: return type;
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'agent';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Bâtiments</h1>
          <p className="text-gray-600 mt-1">Consultation et gestion détaillée du patrimoine immobilier</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Liste
            </button>
          </div>
          {canEdit && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nouveau Bâtiment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="residential">Résidentiel</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industriel</option>
              <option value="institutional">Institutionnel</option>
            </select>
          </div>
          
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="maintenance">Maintenance</option>
              <option value="vacant">Vacant</option>
              <option value="planned">Planifié</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredBuildings.length} bâtiment(s) trouvé(s)
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings.map((building) => (
            <div key={building.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {building.photos && building.photos.length > 0 && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={building.photos[0]} 
                    alt={building.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{building.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(building.status)}`}>
                    {getStatusText(building.status)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{building.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{getTypeText(building.type)} • {building.surface.toLocaleString()} m²</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Construit en {building.yearBuilt}</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    <span>Classe énergétique {building.energy.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-gray-500">Occupation</div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${building.occupancy.rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{building.occupancy.rate}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Valeur</div>
                    <div className="text-lg font-bold text-green-600">{formatValue(building.value)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedBuilding(building)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Voir détails
                  </button>
                  {canEdit && (
                    <div className="flex items-center space-x-2">
                      <button className="text-green-600 hover:text-green-800 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bâtiment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surface</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Énergie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBuildings.map((building) => (
                  <tr key={building.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {building.photos && building.photos.length > 0 && (
                          <img 
                            src={building.photos[0]} 
                            alt={building.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{building.name}</div>
                          <div className="text-sm text-gray-500">{building.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeText(building.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(building.status)}`}>
                        {getStatusText(building.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {building.surface.toLocaleString()} m²
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${building.occupancy.rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{building.occupancy.rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        building.energy.rating === 'A' ? 'bg-green-100 text-green-800' :
                        building.energy.rating === 'B' ? 'bg-blue-100 text-blue-800' :
                        building.energy.rating === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {building.energy.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatValue(building.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setSelectedBuilding(building)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button className="text-green-600 hover:text-green-900 p-1">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Building Detail Modal */}
      {selectedBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedBuilding.name}</h2>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {selectedBuilding.photos && selectedBuilding.photos.length > 0 && (
                    <img 
                      src={selectedBuilding.photos[0]} 
                      alt={selectedBuilding.name}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations générales</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Adresse:</dt>
                          <dd className="font-medium">{selectedBuilding.address}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Type:</dt>
                          <dd className="font-medium">{getTypeText(selectedBuilding.type)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Surface:</dt>
                          <dd className="font-medium">{selectedBuilding.surface.toLocaleString()} m²</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Étages:</dt>
                          <dd className="font-medium">{selectedBuilding.floors}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Année de construction:</dt>
                          <dd className="font-medium">{selectedBuilding.yearBuilt}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Valeur:</dt>
                          <dd className="font-medium text-green-600">{formatValue(selectedBuilding.value)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Occupation</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span>Taux d'occupation</span>
                        <span className="font-bold">{selectedBuilding.occupancy.rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className="bg-blue-600 h-3 rounded-full" 
                          style={{ width: `${selectedBuilding.occupancy.rate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Occupé: {selectedBuilding.occupancy.current}</span>
                        <span>Capacité: {selectedBuilding.occupancy.capacity}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance énergétique</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span>Classe énergétique</span>
                        <span className={`px-3 py-1 rounded font-bold ${
                          selectedBuilding.energy.rating === 'A' ? 'bg-green-100 text-green-800' :
                          selectedBuilding.energy.rating === 'B' ? 'bg-blue-100 text-blue-800' :
                          selectedBuilding.energy.rating === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedBuilding.energy.rating}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Consommation:</span>
                          <span>{selectedBuilding.energy.consumption} kWh/m²/an</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Émissions CO2:</span>
                          <span>{selectedBuilding.energy.emissions} kg CO2/m²/an</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Maintenance</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Dernière inspection:</span>
                          <span>{selectedBuilding.maintenance.lastInspection ? new Date(selectedBuilding.maintenance.lastInspection).toLocaleDateString('fr-FR') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prochaine inspection:</span>
                          <span>{new Date(selectedBuilding.maintenance.nextInspection).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Priorité:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedBuilding.maintenance.priority === 'high' ? 'bg-red-100 text-red-800' :
                            selectedBuilding.maintenance.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {selectedBuilding.maintenance.priority === 'high' ? 'Haute' :
                             selectedBuilding.maintenance.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </span>
                        </div>
                      </div>
                      {selectedBuilding.maintenance.issues.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium">Points d'attention:</span>
                          <ul className="mt-1 space-y-1">
                            {selectedBuilding.maintenance.issues.map((issue, index) => (
                              <li key={index} className="text-sm text-gray-600">• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedBuilding.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedBuilding.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingsModule;