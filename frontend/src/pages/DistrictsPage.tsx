"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { MapPin, Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { PageHeader, StatCard, FilterBar, SearchInput, EmptyState, formatNumber } from "../components/ui"
import { districtService } from "../services/districtService"
import type { District } from "../types"

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

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<District | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    district: District | null
  }>({ isOpen: false, district: null })

  const [formData, setFormData] = useState({
    region: "",
    nom_ds: "",
    code_ds: 0,
    area: 0,
    regionId: 0,
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await districtService.getAll({ page, limit: 10, search })
      setDistricts(response.data)
      setPagination(response.pagination)
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
        await districtService.update(editingItem.id, formData)
      } else {
        await districtService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({
        region: "",
        nom_ds: "",
        code_ds: 0,
        area: 0,
        regionId: 0
      })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: District) => {
    setEditingItem(item)
    setFormData({
      region: item.region || "",
      nom_ds: item.nom_ds || "",
      code_ds: item.code_ds || 0,
      area: item.area || 0,
      regionId: item.regionId || 0,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (item: District) => {
    setConfirmDialog({ isOpen: true, district: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.district) return

    setSubmitting(true)
    try {
      await districtService.delete(confirmDialog.district.id)
      setConfirmDialog({ isOpen: false, district: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "code_ds", label: "Code" },
    { key: "nom_ds", label: "Nom du District" },
    { key: "region", label: "Région" },
    { key: "area", label: "Superficie (km²)" },
  ]

  const openCreate = () => {
    setEditingItem(null)
    setFormData({
      region: "",
      nom_ds: "",
      code_ds: 0,
      area: 0,
      regionId: 0
    })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Géographie"
        title="Districts"
        description="Districts de santé, leur région et leur superficie."
        actions={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="size-4" />
            Ajouter
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Districts"
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
      ) : districts.length === 0 && (pagination?.total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<MapPin />}
            title={search ? "Aucun district trouvé" : "Aucun district enregistré"}
            description={search ? "Aucun résultat ne correspond à votre recherche." : "Ajoutez un premier district pour commencer."}
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
          data={districts}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nom du District</label>
              <input
                type="text"
                value={formData.nom_ds}
                onChange={(e) => setFormData({ ...formData, nom_ds: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Région</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Code District</label>
              <input
                type="number"
                value={formData.code_ds}
                onChange={(e) => setFormData({ ...formData, code_ds: Number.parseInt(e.target.value) || 0 })}
                required
                className="input tabular-nums"
              />
            </div>
            <div>
              <label className="label">Superficie (km²)</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: Number.parseFloat(e.target.value) || 0 })}
                required
                className="input tabular-nums"
              />
            </div>
            <div>
              <label className="label">ID de la Région</label>
              <input
                type="number"
                value={formData.regionId}
                onChange={(e) => setFormData({ ...formData, regionId: Number.parseInt(e.target.value) || 0 })}
                className="input tabular-nums"
              />
            </div>
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
        onClose={() => setConfirmDialog({ isOpen: false, district: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le district "${confirmDialog.district?.nom_ds}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
