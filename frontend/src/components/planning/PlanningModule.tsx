/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Plus, TrendingUp, Calendar, Target, BarChart3, DollarSign, Users, Bed } from 'lucide-react';
import {  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { Forecast } from '../../types';
import { mockForecasts } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const PlanningModule: React.FC = () => {
  const { user } = useAuth();
  const [forecasts] = useState<Forecast[]>(mockForecasts);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(forecasts[0]);
  const [viewMode, setViewMode] = useState<'overview' | 'comparison' | 'details'>('overview');

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'draft': return 'Brouillon';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'agent';

  const comparisonData = forecasts.map(forecast => {
    const finalProjection = forecast.projections[forecast.projections.length - 1];
    return {
      name: forecast.name.substring(0, 20) + '...',
      finalBudget: finalProjection?.budget || 0,
      totalMaintenance: forecast.projections.reduce((sum, p) => sum + p.maintenance, 0),
      finalCapacity: finalProjection?.capacity || 0,
      finalStaff: finalProjection?.staff || 0
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planification et Prévisions</h1>
          <p className="text-gray-600 mt-1">Scénarios d'évolution et projections du patrimoine hospitalier</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'comparison' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Comparaison
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'details' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Détails
            </button>
          </div>
          {canEdit && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nouvelle Prévision</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forecasts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Plans de Développement</h3>
              </div>
              <div className="p-4 space-y-3">
                {forecasts.map((forecast) => (
                  <div
                    key={forecast.id}
                    onClick={() => setSelectedForecast(forecast)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedForecast?.id === forecast.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{forecast.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(forecast.status)}`}>
                        {getStatusText(forecast.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{forecast.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Début:</span>
                        <div>{new Date(forecast.startDate).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div>
                        <span className="font-medium">Fin:</span>
                        <div>{new Date(forecast.endDate).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Forecast Details */}
          <div className="lg:col-span-2">
            {selectedForecast ? (
              <div className="space-y-6">
                {/* Forecast Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{selectedForecast.name}</h2>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(selectedForecast.startDate).toLocaleDateString('fr-FR')} - 
                        {new Date(selectedForecast.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{selectedForecast.description}</p>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedForecast.hospitals.length}
                      </div>
                      <div className="text-sm text-gray-600">Hôpitaux</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {formatValue(selectedForecast.projections[selectedForecast.projections.length - 1]?.budget || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Budget final</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {selectedForecast.projections[selectedForecast.projections.length - 1]?.capacity || 0}
                      </div>
                      <div className="text-sm text-gray-600">Capacité (lits)</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedForecast.projections[selectedForecast.projections.length - 1]?.staff || 0}
                      </div>
                      <div className="text-sm text-gray-600">Personnel</div>
                    </div>
                  </div>
                </div>

                {/* Projections Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Évolution du Budget
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={selectedForecast.projections}>
                      <defs>
                        <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}Md XAF`} />
                      <Tooltip 
                        formatter={(value: any) => [`${(value / 1000000000).toFixed(1)}Md XAF`, 'Budget']}
                        labelFormatter={(label) => `Année ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="budget" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorBudget)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Multi-metric Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs Combinés</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={selectedForecast.projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}Md`} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value : any, name) => {
                          if (name === 'maintenance') return [`${(value / 1000000000).toFixed(1)}Md XAF`, 'Maintenance'];
                          if (name === 'capacity') return [`${value}`, 'Capacité (lits)'];
                          if (name === 'staff') return [`${value}`, 'Personnel'];
                          return [value, name];
                        }}
                      />
                      <Bar yAxisId="left" dataKey="maintenance" fill="#F59E0B" name="maintenance" />
                      <Line yAxisId="right" type="monotone" dataKey="capacity" stroke="#10B981" strokeWidth={3} name="capacity" />
                      <Line yAxisId="right" type="monotone" dataKey="staff" stroke="#8B5CF6" strokeWidth={3} name="staff" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un plan</h3>
                <p className="text-gray-600">Choisissez un plan de développement dans la liste pour voir ses détails et projections.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Comparaison des Plans de Développement
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}Md`} />
                <Tooltip formatter={(value: any) => [`${(value / 1000000000).toFixed(1)}Md XAF`, 'Budget final']} />
                <Bar dataKey="finalBudget" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Coûts de Maintenance
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}Md`} />
                  <Tooltip formatter={(value: any) => [`${(value / 1000000000).toFixed(1)}Md XAF`, 'Maintenance totale']} />
                  <Bar dataKey="totalMaintenance" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bed className="w-5 h-5 mr-2" />
                Capacité d'Accueil
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}`, 'Capacité finale (lits)']} />
                  <Bar dataKey="finalCapacity" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Personnel
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}`, 'Personnel final']} />
                  <Bar dataKey="finalStaff" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'details' && selectedForecast && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du Plan: {selectedForecast.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Créé par:</dt>
                    <dd className="font-medium">{selectedForecast.createdBy}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Date de création:</dt>
                    <dd className="font-medium">{new Date(selectedForecast.createdAt).toLocaleDateString('fr-FR')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Durée:</dt>
                    <dd className="font-medium">
                      {Math.ceil((new Date(selectedForecast.endDate).getTime() - new Date(selectedForecast.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} ans
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Hôpitaux concernés:</dt>
                    <dd className="font-medium">{selectedForecast.hospitals.length}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Projections clés</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Croissance budgétaire:</dt>
                    <dd className="font-medium text-green-600">
                      +{(((selectedForecast.projections[selectedForecast.projections.length - 1]?.budget || 0) / (selectedForecast.projections[0]?.budget || 1) - 1) * 100).toFixed(1)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Économies maintenance:</dt>
                    <dd className="font-medium text-blue-600">
                      {formatValue((selectedForecast.projections[0]?.maintenance || 0) - (selectedForecast.projections[selectedForecast.projections.length - 1]?.maintenance || 0))}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Augmentation capacité:</dt>
                    <dd className="font-medium text-purple-600">
                      +{((selectedForecast.projections[selectedForecast.projections.length - 1]?.capacity || 0) - (selectedForecast.projections[0]?.capacity || 0))} lits
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Croissance personnel:</dt>
                    <dd className="font-medium text-yellow-600">
                      +{((selectedForecast.projections[selectedForecast.projections.length - 1]?.staff || 0) - (selectedForecast.projections[0]?.staff || 0))} personnes
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tableau des Projections</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capacité</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Personnel</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Maintenance</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Équipements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedForecast.projections.map((projection, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{projection.year}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{formatValue(projection.budget)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{projection.capacity} lits</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{projection.staff}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{formatValue(projection.maintenance)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{formatValue(projection.equipment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningModule;