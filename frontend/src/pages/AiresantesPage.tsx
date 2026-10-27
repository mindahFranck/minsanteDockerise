"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { MapPin, Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { PageHeader, StatCard, FilterBar, SearchInput, EmptyState, formatNumber } from "../components/ui"
import { airesanteService } from "../services/airesanteService"
import { districtService } from "../services/districtService"
import type { Airesante, District } from "../types"

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

export default function AiresantesPage() {
  const [airesantes, setAiresantes] = useState<Airesante[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Airesante | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    airesante: Airesante | null
  }>({ isOpen: false, airesante: null })

  const [formData, setFormData] = useState({
    nom_as: "",
    code_as: "",
    area: 0,
    population: 0,
    districtId: 0
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [airesResponse, distResponse] = await Promise.all([
        airesanteService.getAll({ page, limit: 10, search }),
        districtService.getAll({ limit: 100 }),
      ])
      setAiresantes(airesResponse.data)
      setPagination(airesResponse.pagination)
      setDistricts(distResponse.data)
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
        await airesanteService.update(editingItem.id, formData)
      } else {
        await airesanteService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({
        nom_as: "",
        code_as: "",
        area: 0,
        population: 0,
        districtId: 0
      })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Airesante) => {
    setEditingItem(item)
    setFormData({
      nom_as: item.nom_as || "",
      code_as: item.code_as || "",
      area: item.area || 0,
      population: item.population || 0,
      districtId: item.districtId
    })
    setIsModalOpen(true)
  }

  const handleDelete = (item: Airesante) => {
    setConfirmDialog({ isOpen: true, airesante: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.airesante) return

    setSubmitting(true)
    try {
      await airesanteService.delete(confirmDialog.airesante.id)
      setConfirmDialog({ isOpen: false, airesante: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom_as", label: "Nom de l'Aire de Santé" },
    { key: "code_as", label: "Code" },
    { key: "area", label: "Superficie (km²)" },
    { key: "population", label: "Population" },
    {
      key: "district",
      label: "District",
      render: (a: Airesante) => a.district?.nom_ds || "-"
    },
  ]

  const openCreate = () => {
    setEditingItem(null)
    setFormData({
      nom_as: "",
      code_as: "",
      area: 0,
      population: 0,
      districtId: 0
    })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Géographie"
        title="Aires de Santé"
        description="Aires de santé, leur district, leur superficie et leur population."
        actions={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="size-4" />
            Ajouter
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Aires de santé"
          value={loading && (pagination?.total ?? 0) === 0 ? "…" : formatNumber((pagination?.total ?? 0))}
          hint={search ? `Pour « ${search} »` : "Enregistrées"}
          icon={<MapPin />}
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="w-full sm:w-72" />
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : airesantes.length === 0 && (pagination?.total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<MapPin />}
            title={search ? "Aucune aire de santé trouvée" : "Aucune aire de santé enregistrée"}
            description={search ? "Aucun résultat ne correspond à votre recherche." : "Ajoutez une première aire de santé pour commencer."}
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
          data={airesantes}
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
              <label className="label">Nom de l'Aire de Santé</label>
              <input
                type="text"
                value={formData.nom_as}
                onChange={(e) => setFormData({ ...formData, nom_as: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Code de l'Aire de Santé</label>
              <input
                type="text"
                value={formData.code_as}
                onChange={(e) => setFormData({ ...formData, code_as: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Superficie (km²)</label>
              <input
                type="number"
                step="0.01"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: Number.parseFloat(e.target.value) || 0 })}
                required
                className="input tabular-nums"
              />
            </div>
            <div>
              <label className="label">Population</label>
              <input
                type="number"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: Number.parseInt(e.target.value) || 0 })}
                className="input tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="label">District</label>
            <select
              value={formData.districtId}
              onChange={(e) => setFormData({ ...formData, districtId: Number.parseInt(e.target.value) })}
              required
              className="input"
            >
              <option value="">Sélectionner...</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom_ds}
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
        onClose={() => setConfirmDialog({ isOpen: false, airesante: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'aire de santé "${confirmDialog.airesante?.nom_as}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
