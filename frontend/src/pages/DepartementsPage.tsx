"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { MapPin, Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { PageHeader, StatCard, FilterBar, SearchInput, EmptyState, formatNumber } from "../components/ui"
import { departementService } from "../services/departementService"
import { regionService } from "../services/regionService"
import type { Departement, Region } from "../types"

/* --- Briques locales de présentation ---------------------------------------- */

/** Squelette du tableau pendant le chargement. */
function TableSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden" aria-busy="true">
      <div className="h-11 bg-table-head" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-t border-gray-100 px-4 py-4">
          <div className="h-3 w-10 rounded bg-gray-200" />
          <div className="h-3 flex-1 rounded bg-gray-200" />
          <div className="h-3 w-28 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

/** Libellé du bouton d'enregistrement, avec indicateur pendant l'envoi. */
function SubmitLabel({ submitting, label }: { submitting: boolean; label: string }) {
  return submitting ? (
    <>
      <Loader2 className="size-4 animate-spin" />
      <span>Enregistrement...</span>
    </>
  ) : (
    <>{label}</>
  )
}

export default function DepartementsPage() {
  const [departements, setDepartements] = useState<Departement[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Departement | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    departement: Departement | null
  }>({ isOpen: false, departement: null })

  const [formData, setFormData] = useState({ nom: "", population: 0, chefLieu: "", regionId: 0 })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [deptResponse, regionsResponse] = await Promise.all([
        departementService.getAll({ page, limit: 10, search }),
        regionService.getAll({ limit: 100 }),
      ])
      setDepartements(deptResponse.data)
      setPagination(deptResponse.pagination)
      setRegions(regionsResponse.data)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingItem) {
        await departementService.update(editingItem.id, formData)
      } else {
        await departementService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ nom: "", population: 0, chefLieu: "", regionId: 0 })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Departement) => {
    setEditingItem(item)
    setFormData({ nom: item.departement || item.nom || '', population: item.population || 0, chefLieu: item.chefLieu || '', regionId: item.regionId })
    setIsModalOpen(true)
  }

  const handleDelete = (item: Departement) => {
    setConfirmDialog({ isOpen: true, departement: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.departement) return

    setSubmitting(true)
    try {
      await departementService.delete(confirmDialog.departement.id)
      setConfirmDialog({ isOpen: false, departement: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "departement", label: "Département", render: (d: Departement) => d.departement || d.nom || "-" },
    { key: "region", label: "Région", render: (d: Departement) => d.region?.nom || "-" },
  ]

  const openCreate = () => {
    setEditingItem(null)
    setFormData({ nom: "", population: 0, chefLieu: "", regionId: 0 })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Géographie"
        title="Départements"
        description="Départements et leur région de rattachement."
        actions={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="size-4" />
            Ajouter
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Départements"
          value={loading && (pagination?.total ?? 0) === 0 ? "…" : formatNumber((pagination?.total ?? 0))}
          hint={search ? `Pour « ${search} »` : "Enregistrés"}
          icon={<MapPin />}
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="w-full sm:w-72" />
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : departements.length === 0 && (pagination?.total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<MapPin />}
            title={search ? "Aucun département trouvé" : "Aucun département enregistré"}
            description={search ? "Aucun résultat ne correspond à votre recherche." : "Ajoutez un premier département pour commencer."}
            action={
              search ? (
                <button onClick={() => setSearch("")} className="btn btn-outline">Effacer la recherche</button>
              ) : (
                <button onClick={openCreate} className="btn btn-primary"><Plus className="size-4" />Ajouter</button>
              )
            }
          />
        </div>
      ) : (
        <DataTable
          data={departements}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              className="input"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Population</label>
              <input
                type="number"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: Number.parseInt(e.target.value) })}
                required
                className="input tabular-nums"
              />
            </div>
            <div>
              <label className="label">Chef-lieu</label>
              <input
                type="text"
                value={formData.chefLieu}
                onChange={(e) => setFormData({ ...formData, chefLieu: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Région</label>
            <select
              value={formData.regionId}
              onChange={(e) => setFormData({ ...formData, regionId: Number.parseInt(e.target.value) })}
              required
              className="input"
            >
              <option value="">Sélectionner...</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <SubmitLabel submitting={submitting} label={editingItem ? "Modifier" : "Créer"} />
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, departement: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDialog.departement?.departement || confirmDialog.departement?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
