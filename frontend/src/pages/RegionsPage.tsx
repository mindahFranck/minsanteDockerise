"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { MapPin, Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { PageHeader, StatCard, FilterBar, SearchInput, EmptyState, formatNumber } from "../components/ui"
import { regionService } from "../services/regionService"
import type { Region } from "../types"

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

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    region: Region | null
  }>({ isOpen: false, region: null })

  const [formData, setFormData] = useState({ nom: "", population: 0 })

  useEffect(() => {
    loadRegions()
  }, [page, search])

  const loadRegions = async () => {
    try {
      setLoading(true)
      const response = await regionService.getAll({ page, limit: 10, search })
      setRegions(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading regions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingRegion) {
        await regionService.update(editingRegion.id, formData)
      } else {
        await regionService.create(formData)
      }
      setIsModalOpen(false)
      setEditingRegion(null)
      setFormData({ nom: "", population: 0 })
      loadRegions()
    } catch (error) {
      console.error("Error saving region:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    setFormData({ nom: region.nom, population: region.population })
    setIsModalOpen(true)
  }

  const handleDelete = (region: Region) => {
    setConfirmDialog({ isOpen: true, region })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.region) return

    setSubmitting(true)
    try {
      await regionService.delete(confirmDialog.region.id)
      setConfirmDialog({ isOpen: false, region: null })
      loadRegions()
    } catch (error) {
      console.error("Error deleting region:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "population", label: "Population", render: (r: Region) => r.population.toLocaleString() },
  ]

  const openCreate = () => {
    setEditingRegion(null)
    setFormData({ nom: "", population: 0 })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Géographie"
        title="Régions"
        description="Régions administratives et leur population."
        actions={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="size-4" />
            Ajouter
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Régions"
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
      ) : regions.length === 0 && (pagination?.total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<MapPin />}
            title={search ? "Aucune région trouvée" : "Aucune région enregistrée"}
            description={search ? "Aucun résultat ne correspond à votre recherche." : "Ajoutez une première région pour commencer."}
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
          data={regions}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRegion ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <SubmitLabel submitting={submitting} label={editingRegion ? "Modifier" : "Créer"} />
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, region: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDialog.region?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
