import React, { useState } from 'react';
import { Guitar as HospitalIcon, Eye, CreditCard as Edit, Trash2, Plus, Filter, MapPin, Users, Bed } from 'lucide-react';
import { Hospital } from '../../types';
import { mockHospitals } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const HospitalsModule: React.FC = () => {
  const { user } = useAuth();
  const [hospitals] = useState<Hospital[]>(mockHospitals);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesType = filterType === 'all' || hospital.type === filterType;
    const matchesStatus = filterStatus === 'all' || hospital.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || hospital.category === filterCategory;
    return matchesType && matchesStatus && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'construction': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'CHU': return 'Centre Hospitalier Universitaire';
      case 'CHR': return 'Centre Hospitalier Régional';
      case 'CHD': return 'Centre Hospitalier de District';
      case 'CMA': return 'Centre Médical d\'Arrondissement';
      case 'CSI': return 'Centre de Santé Intégré';
      case 'dispensaire': return 'Dispensaire';
      default: return category;
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'agent';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Hôpitaux</h1>
          <p className="text-gray-600 mt-1">Consultation et gestion détaillée du patrimoine hospitalier</p>
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
              <span>Nouvel Hôpital</span>
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
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="operational">Opérationnel</option>
              <option value="maintenance">Maintenance</option>
              <option value="construction">Construction</option>
              <option value="closed">Fermé</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredHospitals.length} hôpital(s) trouvé(s)
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
            <div key={hospital.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {hospital.photos && hospital.photos.length > 0 && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={hospital.photos[0]} 
                    alt={hospital.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hospital.status)}`}>
                    {getStatusText(hospital.status)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{hospital.address}</span>
                  </div>
                  <div className="flex items-center">
                    <HospitalIcon className="w-4 h-4 mr-2" />
                    <span>{hospital.category} • {getTypeText(hospital.type)}</span>
                  </div>
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-2" />
                    <span>{hospital.capacity.totalBeds} lits • {hospital.capacity.operatingRooms} blocs op.</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{hospital.staff.doctors + hospital.staff.nurses + hospital.staff.technicians + hospital.staff.administrative} personnel</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-gray-500">Taux d'occupation</div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${hospital.performance.occupancyRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{hospital.performance.occupancyRate}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Budget annuel</div>
                    <div className="text-sm font-bold text-green-600">{formatCurrency(hospital.budget.annual)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedHospital(hospital)}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hôpital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {hospital.photos && hospital.photos.length > 0 && (
                          <img 
                            src={hospital.photos[0]} 
                            alt={hospital.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                          <div className="text-sm text-gray-500">{hospital.city}, {hospital.region}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{hospital.category}</div>
                      <div className="text-sm text-gray-500">{getTypeText(hospital.type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(hospital.status)}`}>
                        {getStatusText(hospital.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{hospital.capacity.totalBeds} lits</div>
                      <div className="text-gray-500">{hospital.capacity.operatingRooms} blocs op.</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hospital.staff.doctors + hospital.staff.nurses + hospital.staff.technicians + hospital.staff.administrative}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${hospital.performance.occupancyRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{hospital.performance.occupancyRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(hospital.budget.annual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setSelectedHospital(hospital)}
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

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedHospital.name}</h2>
                <button
                  onClick={() => setSelectedHospital(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {selectedHospital.photos && selectedHospital.photos.length > 0 && (
                    <img 
                      src={selectedHospital.photos[0]} 
                      alt={selectedHospital.name}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations générales</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Adresse:</dt>
                          <dd className="font-medium">{selectedHospital.address}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Ville:</dt>
                          <dd className="font-medium">{selectedHospital.city}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Région:</dt>
                          <dd className="font-medium">{selectedHospital.region}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Type:</dt>
                          <dd className="font-medium">{getTypeText(selectedHospital.type)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Catégorie:</dt>
                          <dd className="font-medium">{getCategoryText(selectedHospital.category)}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Patrimoine immobilier */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Patrimoine immobilier</h3>
                      <div className="space-y-2">
                        {selectedHospital.buildings.map((building, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-gray-900">{building.name}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                building.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                                building.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                                building.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                building.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {building.condition}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                              <div>Surface: {building.surface.toLocaleString()} m²</div>
                              <div>Étages: {building.floors}</div>
                              <div>Construit: {building.yearBuilt}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Capacité d'accueil</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Lits totaux:</span>
                          <div className="font-bold text-blue-700">{selectedHospital.capacity.totalBeds}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Lits occupés:</span>
                          <div className="font-bold text-blue-700">{selectedHospital.capacity.occupiedBeds}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Blocs opératoires:</span>
                          <div className="font-bold text-blue-700">{selectedHospital.capacity.operatingRooms}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Lits urgences:</span>
                          <div className="font-bold text-blue-700">{selectedHospital.capacity.emergencyBeds}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Taux d'occupation</span>
                          <span className="font-bold">{selectedHospital.performance.occupancyRate}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full" 
                            style={{ width: `${selectedHospital.performance.occupancyRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Personnel</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Médecins:</span>
                          <div className="font-bold text-green-700">{selectedHospital.staff.doctors}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Infirmiers:</span>
                          <div className="font-bold text-green-700">{selectedHospital.staff.nurses}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Techniciens:</span>
                          <div className="font-bold text-green-700">{selectedHospital.staff.technicians}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Administratif:</span>
                          <div className="font-bold text-green-700">{selectedHospital.staff.administrative}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Total: </span>
                        <span className="font-bold text-green-700">
                          {selectedHospital.staff.doctors + selectedHospital.staff.nurses + selectedHospital.staff.technicians + selectedHospital.staff.administrative}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Équipements médicaux */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Équipements médicaux</h3>
                    <div className="bg-orange-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                      <div className="space-y-3">
                        {selectedHospital.equipment.map((category, index) => (
                          <div key={index}>
                            <h4 className="font-medium text-orange-900 mb-1">{category.category}</h4>
                            <div className="space-y-1">
                              {category.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{item.name}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{item.quantity}</span>
                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                      item.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                                      item.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                                      item.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                      item.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {item.condition}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget annuel</h3>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget total:</span>
                          <span className="font-bold text-purple-700">{formatCurrency(selectedHospital.budget.annual)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Personnel:</span>
                          <span className="font-medium text-purple-600">{formatCurrency(selectedHospital.budget.personnel)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Équipements:</span>
                          <span className="font-medium text-purple-600">{formatCurrency(selectedHospital.budget.equipment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Maintenance:</span>
                          <span className="font-medium text-purple-600">{formatCurrency(selectedHospital.budget.maintenance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedHospital.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedHospital.description}</p>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Services disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedHospital.services.map((service, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Maintenance et travaux */}
              {selectedHospital.maintenance.issues.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Maintenance et travaux</h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Priorité: </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedHospital.maintenance.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        selectedHospital.maintenance.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedHospital.maintenance.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedHospital.maintenance.priority === 'urgent' ? 'Urgente' :
                         selectedHospital.maintenance.priority === 'high' ? 'Haute' :
                         selectedHospital.maintenance.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-red-900">Points d'attention:</h4>
                      {selectedHospital.maintenance.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-700">• {issue}</div>
                      ))}
                    </div>
                    {selectedHospital.maintenance.plannedWorks.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium text-red-900 mb-1">Travaux planifiés:</h4>
                        {selectedHospital.maintenance.plannedWorks.map((work, index) => (
                          <div key={index} className="text-sm bg-white p-2 rounded border">
                            <div className="font-medium">{work.description}</div>
                            <div className="text-gray-600">
                              Budget: {formatCurrency(work.budget)} | 
                              {new Date(work.startDate).toLocaleDateString('fr-FR')} - {new Date(work.endDate).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalsModule;