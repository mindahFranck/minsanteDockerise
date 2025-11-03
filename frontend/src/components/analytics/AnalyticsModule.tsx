import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';
import { mockBuildings, mockStatistics } from '../../data/mockData';

const AnalyticsModule: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedMetric, setSelectedMetric] = useState('value');

  const buildingAnalytics = mockBuildings.map(building => ({
    name: building.name.substring(0, 20) + (building.name.length > 20 ? '...' : ''),
    value: building.value / 1000000,
    surface: building.surface,
    occupancy: building.occupancy.rate,
    energyRating: building.energy.rating,
    maintenanceCost: Math.random() * 100000 + 50000,
    type: building.type
  }));

  const energyData = [
    { rating: 'A', count: 2, efficiency: 95, color: '#10B981' },
    { rating: 'B', count: 1, efficiency: 85, color: '#3B82F6' },
    { rating: 'C', count: 2, efficiency: 70, color: '#F59E0B' },
    { rating: 'D', count: 1, efficiency: 55, color: '#EF4444' },
    { rating: 'E', count: 0, efficiency: 40, color: '#6B7280' },
    { rating: 'F', count: 0, efficiency: 25, color: '#6B7280' },
    { rating: 'G', count: 0, efficiency: 10, color: '#6B7280' }
  ];

  const typeAnalytics = [
    { type: 'Institutionnel', count: 3, value: 173500000, avgOccupancy: 93, color: '#EF4444' },
    { type: 'Industriel', count: 1, value: 35000000, avgOccupancy: 0, color: '#F59E0B' },
    { type: 'Commercial', count: 1, value: 25000000, avgOccupancy: 78, color: '#10B981' },
    { type: 'Résidentiel', count: 1, value: 18000000, avgOccupancy: 95, color: '#3B82F6' }
  ];

  const monthlyTrends = [
    { month: 'Jan', maintenance: 450000, occupancy: 89, energy: 180, incidents: 12 },
    { month: 'Fév', maintenance: 520000, occupancy: 91, energy: 175, incidents: 8 },
    { month: 'Mar', maintenance: 380000, occupancy: 93, energy: 170, incidents: 15 },
    { month: 'Avr', maintenance: 620000, occupancy: 92, energy: 165, incidents: 6 },
    { month: 'Mai', maintenance: 340000, occupancy: 94, energy: 160, incidents: 10 },
    { month: 'Jun', maintenance: 480000, occupancy: 96, energy: 155, incidents: 4 }
  ];

  const performanceMetrics = {
    totalValue: mockBuildings.reduce((sum, b) => sum + b.value, 0),
    avgOccupancy: mockBuildings.reduce((sum, b) => sum + b.occupancy.rate, 0) / mockBuildings.length,
    totalSurface: mockBuildings.reduce((sum, b) => sum + b.surface, 0),
    avgEnergyRating: 'B+',
    maintenanceBudget: 2500000,
    roi: 8.5
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analyses et Rapports</h1>
          <p className="text-gray-600 mt-1">Tableaux de bord analytiques et indicateurs de performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
            <option value="custom">Période personnalisée</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur Totale</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(performanceMetrics.totalValue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupation Moy.</p>
              <p className="text-xl font-bold text-blue-600">{performanceMetrics.avgOccupancy.toFixed(1)}%</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Surface Totale</p>
              <p className="text-xl font-bold text-purple-600">{performanceMetrics.totalSurface.toLocaleString()} m²</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Classe Énergie</p>
              <p className="text-xl font-bold text-yellow-600">{performanceMetrics.avgEnergyRating}</p>
            </div>
            <PieChart className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget Maintenance</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(performanceMetrics.maintenanceBudget)}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-xl font-bold text-indigo-600">{performanceMetrics.roi}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Valeur par Bâtiment (M€)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buildingAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}M€`, 'Valeur']} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={typeAnalytics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type} (${count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {typeAnalytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Énergétique</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="count" fill="#10B981" name="Nombre de bâtiments" />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#F59E0B" strokeWidth={3} name="Efficacité %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendances Mensuelles</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrends}>
              <defs>
                <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `€${value / 1000}k`} />
              <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, 'Maintenance']} />
              <Area type="monotone" dataKey="maintenance" stroke="#F59E0B" fillOpacity={1} fill="url(#colorMaintenance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Analyse Détaillée par Bâtiment</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bâtiment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surface</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Énergie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buildingAnalytics.map((building, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {building.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {building.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(building.value * 1000000)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {building.surface.toLocaleString()} m²
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${building.occupancy}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{building.occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      building.energyRating === 'A' ? 'bg-green-100 text-green-800' :
                      building.energyRating === 'B' ? 'bg-blue-100 text-blue-800' :
                      building.energyRating === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {building.energyRating}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(building.maintenanceCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {(Math.random() * 10 + 5).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Recommandations</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Optimiser l'occupation des bâtiments commerciaux</li>
            <li>• Planifier la rénovation énergétique des classes C et D</li>
            <li>• Réduire les coûts de maintenance préventive</li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-semibold text-green-900 mb-2">Points Forts</h4>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• Excellent taux d'occupation résidentiel (95%)</li>
            <li>• Performance énergétique globale satisfaisante</li>
            <li>• Valorisation constante du patrimoine</li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
          <h4 className="text-lg font-semibold text-yellow-900 mb-2">Alertes</h4>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• Centre commercial en sous-occupation</li>
            <li>• Budget maintenance dépassé de 15%</li>
            <li>• 3 bâtiments nécessitent une inspection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModule;