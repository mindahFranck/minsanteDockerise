"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search, Shield, Users, Key, UserCog } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { userService } from "../services/userService"
import type { User, Region, Departement, Arrondissement } from "../types"
import api from "../services/api"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [regions, setRegions] = useState<Region[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [arrondissements, setArrondissements] = useState<Arrondissement[]>([])
  const [filteredDepartements, setFilteredDepartements] = useState<Departement[]>([])
  const [filteredArrondissements, setFilteredArrondissements] = useState<Arrondissement[]>([])

  const [formData, setFormData] = useState<{
    firstName: string
    lastName: string
    email: string
    password: string
    role: 'super_admin' | 'admin' | 'manager' | 'user'
    scopeType?: 'national' | 'regional' | 'departemental' | 'arrondissement'
    regionId?: number
    departementId?: number
    arrondissementId?: number
  }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user",
    scopeType: "national",
    regionId: undefined,
    departementId: undefined,
    arrondissementId: undefined,
  })

  const roles = [
    { value: "user", label: "Utilisateur", color: "bg-gray-100 text-gray-800", icon: Users },
    { value: "manager", label: "Gestionnaire", color: "bg-blue-100 text-blue-800", icon: UserCog },
    { value: "admin", label: "Administrateur", color: "bg-purple-100 text-purple-800", icon: Shield },
    { value: "super_admin", label: "Super Admin", color: "bg-red-100 text-red-800", icon: Key },
  ]

  useEffect(() => {
    loadUsers()
    loadGeographicData()
  }, [page, search, filterRole])

  const loadGeographicData = async () => {
    try {
      const [regionsRes, departementsRes, arrondissementsRes] = await Promise.all([
        api.get("/regions"),
        api.get("/departements"),
        api.get("/arrondissements")
      ])
      setRegions(regionsRes.data.data || [])
      setDepartements(departementsRes.data.data || [])
      setArrondissements(arrondissementsRes.data.data || [])
    } catch (error) {
      console.error("Error loading geographic data:", error)
    }
  }

  const handleScopeTypeChange = (scopeType: string) => {
    setFormData({
      ...formData,
      scopeType: scopeType as any,
      regionId: undefined,
      departementId: undefined,
      arrondissementId: undefined,
    })
    setFilteredDepartements([])
    setFilteredArrondissements([])
  }

  const handleRegionChange = (regionId: number) => {
    setFormData({
      ...formData,
      regionId,
      departementId: undefined,
      arrondissementId: undefined,
    })
    const filtered = departements.filter(d => d.regionId === regionId)
    setFilteredDepartements(filtered)
    setFilteredArrondissements([])
  }

  const handleDepartementChange = (departementId: number) => {
    setFormData({
      ...formData,
      departementId,
      arrondissementId: undefined,
    })
    const filtered = arrondissements.filter(a => a.departementId === departementId)
    setFilteredArrondissements(filtered)
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterRole) params.role = filterRole

      const response = await userService.getAll(params)
      setUsers(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        const updateData: any = { ...formData }
        if (!formData.password) {
          delete updateData.password
        }
        await userService.update(editingUser.id, updateData)
      } else {
        await userService.create(formData)
      }
      setIsModalOpen(false)
      setEditingUser(null)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Erreur lors de la sauvegarde de l'utilisateur")
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "user",
      scopeType: "national",
      regionId: undefined,
      departementId: undefined,
      arrondissementId: undefined,
    })
    setFilteredDepartements([])
    setFilteredArrondissements([])
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      scopeType: user.scopeType || "national",
      regionId: user.regionId,
      departementId: user.departementId,
      arrondissementId: user.arrondissementId,
    })

    // Set filtered lists based on user's current scope
    if (user.regionId) {
      const filtered = departements.filter(d => d.regionId === user.regionId)
      setFilteredDepartements(filtered)
    }
    if (user.departementId) {
      const filtered = arrondissements.filter(a => a.departementId === user.departementId)
      setFilteredArrondissements(filtered)
    }

    setIsModalOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName}?`)) {
      try {
        await userService.delete(user.id)
        loadUsers()
      } catch (error) {
        console.error("Error deleting user:", error)
        alert("Erreur lors de la suppression de l'utilisateur")
      }
    }
  }

  const getRoleLabel = (role: string) => {
    return roles.find(r => r.value === role)?.label || role
  }

  const getRoleColor = (role: string) => {
    return roles.find(r => r.value === role)?.color || "bg-gray-100 text-gray-800"
  }

  const getRoleIcon = (role: string) => {
    const RoleIcon = roles.find(r => r.value === role)?.icon || Users
    return <RoleIcon className="w-4 h-4" />
  }

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "name",
      label: "Nom complet",
      render: (u: User) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">{u.firstName} {u.lastName}</span>
        </div>
      )
    },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Rôle",
      render: (u: User) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getRoleColor(u.role)}`}>
          {getRoleIcon(u.role)}
          {getRoleLabel(u.role)}
        </span>
      )
    },
    {
      key: "isActive",
      label: "Statut",
      render: (u: User) => (
        <span className={`px-2 py-1 rounded text-xs ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {u.isActive ? 'Actif' : 'Inactif'}
        </span>
      )
    },
    {
      key: "lastLogin",
      label: "Dernière connexion",
      render: (u: User) => u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR') : 'Jamais'
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-sm text-gray-500 mt-1">{pagination.total} utilisateur{pagination.total > 1 ? 's' : ''} au total</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            resetForm()
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Gestion des comptes utilisateurs</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Utilisateur</strong> : Accès en lecture seule aux données</li>
                <li><strong>Gestionnaire</strong> : Peut gérer les données de sa FOSA</li>
                <li><strong>Administrateur</strong> : Peut gérer toutes les données du système</li>
                <li><strong>Super Admin</strong> : Accès complet incluant la gestion des utilisateurs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les rôles</option>
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Jean"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="jean.dupont@health.cm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe {editingUser ? "(laisser vide pour ne pas modifier)" : "*"}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              minLength={6}
              placeholder={editingUser ? "Nouveau mot de passe (optionnel)" : "Minimum 6 caractères"}
            />
            {!editingUser && (
              <p className="mt-1 text-xs text-gray-500">
                Le mot de passe doit contenir au moins 6 caractères
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                {formData.role === "user" && "✓ Accès en lecture seule aux données"}
                {formData.role === "manager" && "✓ Peut créer et modifier les données de sa FOSA"}
                {formData.role === "admin" && "✓ Peut gérer toutes les données du système"}
                {formData.role === "super_admin" && "✓ Accès complet incluant gestion des utilisateurs et paramètres système"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Portée géographique</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de portée *</label>
                <select
                  required
                  value={formData.scopeType}
                  onChange={(e) => handleScopeTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="national">National (toutes les données)</option>
                  <option value="regional">Régional</option>
                  <option value="departemental">Départemental</option>
                  <option value="arrondissement">Arrondissement</option>
                </select>
              </div>

              {formData.scopeType === "regional" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
                  <select
                    required
                    value={formData.regionId || ""}
                    onChange={(e) => handleRegionChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une région</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.scopeType === "departemental" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
                    <select
                      required
                      value={formData.regionId || ""}
                      onChange={(e) => handleRegionChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une région</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                    <select
                      required
                      value={formData.departementId || ""}
                      onChange={(e) => handleDepartementChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.regionId}
                    >
                      <option value="">Sélectionner un département</option>
                      {filteredDepartements.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {formData.scopeType === "arrondissement" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
                    <select
                      required
                      value={formData.regionId || ""}
                      onChange={(e) => handleRegionChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une région</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                    <select
                      required
                      value={formData.departementId || ""}
                      onChange={(e) => handleDepartementChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.regionId}
                    >
                      <option value="">Sélectionner un département</option>
                      {filteredDepartements.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrondissement *</label>
                    <select
                      required
                      value={formData.arrondissementId || ""}
                      onChange={(e) => setFormData({ ...formData, arrondissementId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.departementId}
                    >
                      <option value="">Sélectionner un arrondissement</option>
                      {filteredArrondissements.map((arr) => (
                        <option key={arr.id} value={arr.id}>
                          {arr.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  {formData.scopeType === "national" && "ℹ️ Cet utilisateur aura accès à toutes les données du système"}
                  {formData.scopeType === "regional" && "ℹ️ Cet utilisateur aura accès uniquement aux données de la région sélectionnée"}
                  {formData.scopeType === "departemental" && "ℹ️ Cet utilisateur aura accès uniquement aux données du département sélectionné"}
                  {formData.scopeType === "arrondissement" && "ℹ️ Cet utilisateur aura accès uniquement aux données de l'arrondissement sélectionné"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingUser ? "Enregistrer les modifications" : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
