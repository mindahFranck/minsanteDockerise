"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Info, Key, Loader2, Plus, Shield, UserCog, Users } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { userService } from "../services/userService"
import type { User, Region, Departement, Arrondissement } from "../types"
import api from "../services/api"
import { usePermissions } from "../hooks/usePermissions"
import { exportUsersToPDF, exportUsersToExcel } from "../utils/exportUtils"
import { PageHeader, FilterBar, SearchInput, Badge } from "../components/ui"
import type { BadgeVariant } from "../components/ui"

/** Initiales pour l'avatar de la liste. */
function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}` || "?"
}

/** Squelette du tableau pendant le chargement. */
function TableSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-11 bg-table-head" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-gray-100 px-4 py-3.5">
          <div className="h-3 w-1/6 rounded bg-gray-200" />
          <div className="h-3 w-1/4 rounded bg-gray-100" />
          <div className="h-3 w-1/5 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export default function UsersPage() {
  // Permissions
  const permissions = usePermissions()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    user: User | null
  }>({ isOpen: false, user: null })

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

  const roles: { value: string; label: string; variant: BadgeVariant; icon: typeof Users; description: string }[] = [
    { value: "user", label: "Utilisateur", variant: "neutral", icon: Users, description: "Accès en lecture seule aux données" },
    { value: "manager", label: "Gestionnaire", variant: "info", icon: UserCog, description: "Peut gérer les données de sa FOSA" },
    { value: "admin", label: "Administrateur", variant: "warning", icon: Shield, description: "Peut gérer toutes les données du système" },
    { value: "super_admin", label: "Super Admin", variant: "danger", icon: Key, description: "Accès complet incluant la gestion des utilisateurs" },
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
    setSubmitting(true)
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
    } finally {
      setSubmitting(false)
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

  const handleDelete = (user: User) => {
    setConfirmDialog({ isOpen: true, user })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.user) return

    setSubmitting(true)
    try {
      await userService.delete(confirmDialog.user.id)
      setConfirmDialog({ isOpen: false, user: null })
      loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Erreur lors de la suppression de l'utilisateur")
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    return roles.find(r => r.value === role)?.label || role
  }

  const getRoleVariant = (role: string): BadgeVariant => {
    return roles.find(r => r.value === role)?.variant || "neutral"
  }

  const getRoleIcon = (role: string) => {
    const RoleIcon = roles.find(r => r.value === role)?.icon || Users
    return <RoleIcon className="size-3.5" />
  }

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "name",
      label: "Nom complet",
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold uppercase text-brand-600">
            {initials(u.firstName, u.lastName)}
          </div>
          <span className="font-medium text-gray-900">{u.firstName} {u.lastName}</span>
        </div>
      )
    },
    { key: "email", label: "Email", render: (u: User) => <span className="text-gray-500">{u.email || "-"}</span> },
    {
      key: "role",
      label: "Rôle",
      render: (u: User) => (
        <Badge variant={getRoleVariant(u.role)}>
          {getRoleIcon(u.role)}
          {getRoleLabel(u.role)}
        </Badge>
      )
    },
    {
      key: "isActive",
      label: "Statut",
      render: (u: User) => (
        <Badge variant={u.isActive ? "success" : "danger"} withDot>
          {u.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: "lastLogin",
      label: "Dernière connexion",
      render: (u: User) => (
        <span className={u.lastLogin ? "font-mono text-xs text-gray-500" : "text-gray-400"}>
          {u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
        </span>
      )
    },
  ]

  // Fonctions d'export
  const handleExportPDF = () => {
    exportUsersToPDF(users)
  }

  const handleExportExcel = () => {
    exportUsersToExcel(users)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Gestion des utilisateurs"
        description={`${pagination.total} utilisateur${pagination.total > 1 ? 's' : ''} au total`}
        actions={
          permissions.canManageUsers ? (
            <button
              onClick={() => {
                setEditingUser(null)
                resetForm()
                setIsModalOpen(true)
              }}
              className="btn btn-primary"
            >
              <Plus className="size-4" />
              Nouvel utilisateur
            </button>
          ) : undefined
        }
      />

      <section className="card px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
            <Info className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="card-title">Gestion des comptes utilisateurs</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {roles.map((role) => (
                <li key={role.value} className="space-y-1.5">
                  <Badge variant={role.variant}>
                    {getRoleIcon(role.value)}
                    {role.label}
                  </Badge>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FilterBar
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={users.length === 0}
          />
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par nom ou email..."
          className="w-full sm:w-80"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input w-auto"
        >
          <option value="">Tous les rôles</option>
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={users}
          columns={columns}
          onEdit={permissions.canManageUsers ? handleEdit : undefined}
          onDelete={permissions.canManageUsers ? handleDelete : undefined}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Prénom *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                placeholder="Jean"
              />
            </div>

            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="jean.dupont@health.cm"
            />
          </div>

          <div>
            <label className="label">
              Mot de passe {editingUser ? "(laisser vide pour ne pas modifier)" : "*"}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              minLength={6}
              placeholder={editingUser ? "Nouveau mot de passe (optionnel)" : "Minimum 6 caractères"}
            />
            {!editingUser && (
              <p className="mt-1.5 text-xs text-gray-500">
                Le mot de passe doit contenir au moins 6 caractères
              </p>
            )}
          </div>

          <div>
            <label className="label">Rôle *</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="input"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <div className="mt-2 rounded-xl bg-surface px-3 py-2.5">
              <p className="text-xs text-gray-600">
                {formData.role === "user" && "✓ Accès en lecture seule aux données"}
                {formData.role === "manager" && "✓ Peut créer et modifier les données de sa FOSA"}
                {formData.role === "admin" && "✓ Peut gérer toutes les données du système"}
                {formData.role === "super_admin" && "✓ Accès complet incluant gestion des utilisateurs et paramètres système"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="kicker mb-3">Portée géographique</p>

            <div className="space-y-4">
              <div>
                <label className="label">Type de portée *</label>
                <select
                  required
                  value={formData.scopeType}
                  onChange={(e) => handleScopeTypeChange(e.target.value)}
                  className="input"
                >
                  <option value="national">National (toutes les données)</option>
                  <option value="regional">Régional</option>
                  <option value="departemental">Départemental</option>
                  <option value="arrondissement">Arrondissement</option>
                </select>
              </div>

              {formData.scopeType === "regional" && (
                <div>
                  <label className="label">Région *</label>
                  <select
                    required
                    value={formData.regionId || ""}
                    onChange={(e) => handleRegionChange(Number(e.target.value))}
                    className="input"
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Région *</label>
                    <select
                      required
                      value={formData.regionId || ""}
                      onChange={(e) => handleRegionChange(Number(e.target.value))}
                      className="input"
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
                    <label className="label">Département *</label>
                    <select
                      required
                      value={formData.departementId || ""}
                      onChange={(e) => handleDepartementChange(Number(e.target.value))}
                      className="input"
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
                </div>
              )}

              {formData.scopeType === "arrondissement" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Région *</label>
                    <select
                      required
                      value={formData.regionId || ""}
                      onChange={(e) => handleRegionChange(Number(e.target.value))}
                      className="input"
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
                    <label className="label">Département *</label>
                    <select
                      required
                      value={formData.departementId || ""}
                      onChange={(e) => handleDepartementChange(Number(e.target.value))}
                      className="input"
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
                  <div className="sm:col-span-2">
                    <label className="label">Arrondissement *</label>
                    <select
                      required
                      value={formData.arrondissementId || ""}
                      onChange={(e) => setFormData({ ...formData, arrondissementId: Number(e.target.value) })}
                      className="input"
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
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-brand-600">
                <Info className="mt-px size-4 shrink-0" />
                <p className="text-xs">
                  {formData.scopeType === "national" && "Cet utilisateur aura accès à toutes les données du système"}
                  {formData.scopeType === "regional" && "Cet utilisateur aura accès uniquement aux données de la région sélectionnée"}
                  {formData.scopeType === "departemental" && "Cet utilisateur aura accès uniquement aux données du département sélectionné"}
                  {formData.scopeType === "arrondissement" && "Cet utilisateur aura accès uniquement aux données de l'arrondissement sélectionné"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              disabled={submitting}
              className="btn btn-outline"
            >
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                editingUser ? "Enregistrer les modifications" : "Créer l'utilisateur"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, user: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${confirmDialog.user?.firstName} ${confirmDialog.user?.lastName}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
