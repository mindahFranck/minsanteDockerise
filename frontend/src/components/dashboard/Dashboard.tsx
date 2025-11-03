/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Guitar as Hospital, TrendingUp, AlertTriangle, MapPin, Users, Bed } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import StatCard from './StatCard';
import { mockStatistics, mockMaintenanceTasks, mockHospitals } from '../../data/mockData';

const Dashboard: React.FC = () => {
  const { totalHospitals, totalBeds, averageOccupancy, totalStaff, budgetTotal, maintenanceAlerts, hospitalsByRegion, hospitalsByCategory } = mockStatistics;

  const regionData = hospitalsByRegion.map(item => ({
    name: item.region,
    hospitals: item.count,
    beds: item.beds,
    color: '#3B82F6'
  }));

  const categoryData = hospitalsByCategory.map(item => ({
    name: item.category,
    value: item.count,
    color: item.category === 'CHU' ? '#EF4444' :
           item.category === 'CHR' ? '#3B82F6' :
           item.category === 'CHD' ? '#10B981' :
           item.category === 'CMA' ? '#F59E0B' : '#8B5CF6'
  }));

  const budgetData = [
    { year: 2020, budget: 15000000000 },
    { year: 2021, budget: 16500000000 },
    { year: 2022, budget: 17800000000 },
    { year: 2023, budget: 18900000000 },
    { year: 2024, budget: budgetTotal }
  ];

  const performanceData = mockHospitals.map(hospital => ({
    name: hospital.name.substring(0, 15) + '...',
    occupancy: hospital.performance.occupancyRate,
    satisfaction: hospital.performance.patientSatisfaction,
    beds: hospital.capacity.totalBeds
  }));

  const recentActivities = [
    { action: 'Inspection maintenance', hospital: 'CHU de Yaoundé', date: '2024-02-01', status: 'completed', priority: 'high' },
    { action: 'Mise à jour équipements', hospital: 'Hôpital Général de Douala', date: '2024-01-30', status: 'completed', priority: 'medium' },
    { action: 'Planification rénovation', hospital: 'Hôpital Provincial de Bafoussam', date: '2024-01-28', status: 'pending', priority: 'high' },
    { action: 'Audit budgétaire', hospital: 'Hôpital Régional de Garoua', date: '2024-01-25', status: 'completed', priority: 'low' },
    { action: 'Formation personnel', hospital: 'CMA de Kribi', date: '2024-01-22', status: 'in-progress', priority: 'medium' }
  ];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble du patrimoine hospitalier du Cameroun</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Hôpitaux"
          value={totalHospitals}
          icon={Hospital}
          color="blue"
          subtitle="Toutes catégories"
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Budget Total"
          value={`${(budgetTotal / 1000000000).toFixed(1)}Md XAF`}
          icon={TrendingUp}
          color="green"
          subtitle="Budget annuel"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Capacité Totale"
          value={`${totalBeds.toLocaleString()}`}
          icon={Bed}
          color="yellow"
          subtitle="Lits d'hospitalisation"
          trend={{ value: 2.1, isPositive: true }}
        />
        <StatCard
          title="Alertes Maintenance"
          value={maintenanceAlerts}
          icon={AlertTriangle}
          color="red"
          subtitle="Interventions requises"
          trend={{ value: 15.3, isPositive: false }}
        />
        <StatCard
          title="Personnel Total"
          value={totalStaff.toLocaleString()}
          icon={Users}
          color="purple"
          subtitle="Tous corps confondus"
          trend={{ value: 5.7, isPositive: true }}
        />
        <StatCard
          title="Taux d'Occupation"
          value={`${averageOccupancy}%`}
          icon={MapPin}
          color="indigo"
          subtitle="Moyenne nationale"
          trend={{ value: 8.9, isPositive: true }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du Budget Hospitalier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={budgetData}>
              <defs>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `${value / 1000000000}Md XAF`} />
              <Tooltip formatter={(value: any) => [`${value / 1000000000}Md XAF`, 'Budget']} />
              <Area type="monotone" dataKey="budget" stroke="#3B82F6" fillOpacity={1} fill="url(#colorBudget)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Catégorie d'Hôpital</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Région</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name === 'hospitals' ? 'Hôpitaux' : 'Lits']} />
              <Bar dataKey="hospitals" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des Hôpitaux</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.slice(0, 4)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value, name) => [`${value}%`, name === 'occupancy' ? 'Occupation' : 'Satisfaction']} />
              <Bar dataKey="occupancy" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâches de Maintenance Urgentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockMaintenanceTasks.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  task.priority === 'urgent' ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-orange-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.assignedTo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Échéance</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques Rapides</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Médecins:</span>
              <span className="font-bold text-blue-600">{mockHospitals.reduce((sum, h) => sum + h.staff.doctors, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Infirmiers:</span>
              <span className="font-bold text-green-600">{mockHospitals.reduce((sum, h) => sum + h.staff.nurses, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blocs opératoires:</span>
              <span className="font-bold text-purple-600">{mockHospitals.reduce((sum, h) => sum + h.capacity.operatingRooms, 0)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Régions</h3>
          <div className="space-y-2">
            {hospitalsByRegion.slice(0, 4).map((region, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{region.region}:</span>
                <span className="font-medium">{region.count} hôpital(s)</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Personnel:</span>
              <span className="font-medium">{((mockHospitals.reduce((sum, h) => sum + h.budget.personnel, 0)) / 1000000000).toFixed(1)}Md</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Équipements:</span>
              <span className="font-medium">{((mockHospitals.reduce((sum, h) => sum + h.budget.equipment, 0)) / 1000000000).toFixed(1)}Md</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maintenance:</span>
              <span className="font-medium">{((mockHospitals.reduce((sum, h) => sum + h.budget.maintenance, 0)) / 1000000000).toFixed(1)}Md</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Satisfaction moyenne:</span>
              <span className="font-medium">{(mockHospitals.reduce((sum, h) => sum + h.performance.patientSatisfaction, 0) / mockHospitals.length).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Séjour moyen:</span>
              <span className="font-medium">{(mockHospitals.reduce((sum, h) => sum + h.performance.averageStayDuration, 0) / mockHospitals.length).toFixed(1)} jours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mortalité moyenne:</span>
              <span className="font-medium">{(mockHospitals.reduce((sum, h) => sum + h.performance.mortalityRate, 0) / mockHospitals.length).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activités Récentes</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-500' : 
                    activity.status === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.hospital}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.priority === 'high' ? 'bg-red-100 text-red-800' :
                    activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {activity.priority === 'high' ? 'Haute' :
                     activity.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;