"use client"

import { useEffect, useState } from "react"
import { statisticsService } from "../services/statisticsService"
import type { Statistics } from "../types"
import { apiService } from "../services/apiService"
import { Building2, Users, Package, Activity, MapPin, HeartPulse, AlertCircle, CheckCircle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import Loader, { CardSkeleton } from "../components/common/Loader"

export default function Dashboard() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [additionalStats, setAdditionalStats] = useState<any>(null)
  const [comparativeStats, setComparativeStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Charger les statistiques de l'API
      const response = await statisticsService.getOverview()
      setStats(response.data)

      // Charger les statistiques comparatives
      const comparativeResponse = await statisticsService.getComparativeStats()
      setComparativeStats(comparativeResponse.data)

      // Charger des statistiques additionnelles
      const [regions, fosas, districts, airesantes] = await Promise.all([
        apiService.getRegions(),
        apiService.getFosas(),
        apiService.getDistricts(),
        apiService.getAiresantes(),
      ])

      // Calculer des statistiques supplémentaires
      const fosasOperational = fosas.filter(f => !f.estFerme).length
      const fosasClosed = fosas.filter(f => f.estFerme).length

      // Grouper les FOSA par type
      const fosasByType = fosas.reduce((acc: any, fosa) => {
        const type = fosa.type || 'Non spécifié'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})

      setAdditionalStats({
        totalRegions: regions.length,
        totalDistricts: districts.length,
        totalAiresantes: airesantes.length,
        fosasOperational,
        fosasClosed,
        fosasByTypeData: Object.entries(fosasByType).map(([type, count]) => ({
          type,
          count
        })),
      })
    } catch (error: any) {
      console.error("Error loading statistics:", error)
      setError(error.message || "Erreur lors du chargement des statistiques")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="bg-gray-200 h-8 w-48 rounded animate-pulse mb-4"></div>
        </div>
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow h-96 animate-pulse">
            <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
            <div className="bg-gray-100 h-full rounded"></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow h-96 animate-pulse">
            <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
            <div className="bg-gray-100 h-full rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadStatistics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!stats && !additionalStats) {
    return <div className="text-center text-gray-600">Aucune donnée disponible</div>
  }

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <button
          onClick={loadStatistics}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats Cards - Ligne 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total FOSA</p>
              <p className="text-3xl font-bold text-blue-900">{stats?.totalFosas || additionalStats?.fosasOperational + additionalStats?.fosasClosed || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Formations sanitaires</p>
            </div>
            <Building2 className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">FOSA Opérationnelles</p>
              <p className="text-3xl font-bold text-green-900">{additionalStats?.fosasOperational || 0}</p>
              <p className="text-xs text-green-600 mt-1">En activité</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6 border border-red-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">FOSA Fermées</p>
              <p className="text-3xl font-bold text-red-900">{additionalStats?.fosasClosed || 0}</p>
              <p className="text-xs text-red-600 mt-1">Non opérationnelles</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Régions</p>
              <p className="text-3xl font-bold text-purple-900">{additionalStats?.totalRegions || 0}</p>
              <p className="text-xs text-purple-600 mt-1">Couverture nationale</p>
            </div>
            <MapPin className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Stats Cards - Ligne 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-lg p-6 border border-teal-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-700 font-medium">Districts Sanitaires</p>
              <p className="text-3xl font-bold text-teal-900">{additionalStats?.totalDistricts || 0}</p>
              <p className="text-xs text-teal-600 mt-1">Districts de santé</p>
            </div>
            <HeartPulse className="w-12 h-12 text-teal-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Aires de Santé</p>
              <p className="text-3xl font-bold text-orange-900">{additionalStats?.totalAiresantes || 0}</p>
              <p className="text-xs text-orange-600 mt-1">Zones de couverture</p>
            </div>
            <MapPin className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl shadow-lg p-6 border border-pink-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-700 font-medium">Taux d'Opérationnalité</p>
              <p className="text-3xl font-bold text-pink-900">
                {additionalStats ? Math.round((additionalStats.fosasOperational / (additionalStats.fosasOperational + additionalStats.fosasClosed)) * 100) : 0}%
              </p>
              <p className="text-xs text-pink-600 mt-1">FOSA actives</p>
            </div>
            <Activity className="w-12 h-12 text-pink-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            FOSA par Type
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={additionalStats?.fosasByTypeData || stats?.fosasByType || []}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.type}: ${entry.count}`}
              >
                {(additionalStats?.fosasByTypeData || stats?.fosasByType || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Top 5 FOSA par Nombre de Bâtiments
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(comparativeStats?.buildingsByFosa || []).slice(0, 5)}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="fosaName"
                angle={-30}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value} bâtiment${value > 1 ? 's' : ''}`, 'Nombre']}
                labelFormatter={(label) => `FOSA: ${label}`}
              />
              <Bar
                dataKey="buildingCount"
                fill="#6366F1"
                name="Nombre de bâtiments"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats?.fosasByRegion && stats.fosasByRegion.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            FOSA par Région
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.fosasByRegion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8B5CF6" name="Nombre de FOSA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats?.personnelByCategory && stats.personnelByCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Personnel par Catégorie
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.personnelByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#14B8A6" name="Nombre de personnel" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* STATISTIQUES COMPARATIVES */}
      {comparativeStats && (
        <>
          {/* Titre Section */}
          <div className="col-span-full">
            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2">
              Analyses Comparatives
            </h2>
          </div>

          {/* Tableau: FOSA par Catégorie avec TF/Clôture */}
          {comparativeStats.fosasByCategory && comparativeStats.fosasByCategory.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                FOSA par Catégorie (avec sécurisation)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avec TF</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avec Clôture</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Opérationnelles</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparativeStats.fosasByCategory.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{item.total}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{item.withTF}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">{item.withCloture}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{item.operational}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Graphique: Sécurité des FOSA (TF/Clôture) */}
          {comparativeStats.securityStats && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Sécurisation des FOSA
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'TF + Clôture', value: Number(comparativeStats.securityStats.both) || 0 },
                      { name: 'TF seulement', value: Number(comparativeStats.securityStats.tfOnly) || 0 },
                      { name: 'Clôture seulement', value: Number(comparativeStats.securityStats.clotureOnly) || 0 },
                      { name: 'Aucune', value: Number(comparativeStats.securityStats.neither) || 0 }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#3B82F6" />
                    <Cell fill="#8B5CF6" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tableau: FOSA par Statut */}
          {comparativeStats.fosasByStatus && comparativeStats.fosasByStatus.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-pink-600" />
                FOSA par Statut
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avec TF</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avec Clôture</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparativeStats.fosasByStatus.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.status}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{item.total}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{item.withTF}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">{item.withCloture}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Graphique: Top 10 FOSA par Nombre de Bâtiments */}
          {comparativeStats.buildingsByFosa && comparativeStats.buildingsByFosa.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Top 10 FOSA par Nombre de Bâtiments
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparativeStats.buildingsByFosa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fosaName" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="buildingCount" fill="#6366F1" name="Nombre de bâtiments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Graphique: Véhicules par Type et Énergie */}
          {comparativeStats.vehiclesByTypeEnergy && comparativeStats.vehiclesByTypeEnergy.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-600" />
                Véhicules par Type et Source d'Énergie
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type Véhicule</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Énergie</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantité Totale</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparativeStats.vehiclesByTypeEnergy.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.vehicleType}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.energy}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded">{item.count}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{item.totalQuantity || item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Graphique: Distribution du Personnel */}
          {comparativeStats.personnelDistribution && comparativeStats.personnelDistribution.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Distribution du Personnel
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparativeStats.personnelDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#14B8A6" name="Nombre total" />
                  <Bar dataKey="fosasCount" fill="#F59E0B" name="Nombre de FOSA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
