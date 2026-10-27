"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AlertTriangle, Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { PageHeader, StatCard, FilterBar, SearchInput, EmptyState, formatNumber } from "../components/ui"
import { degradationService } from "../services/degradationService"
import type { Degradation } from "../types"

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

export default function DegradationsPage() {
  const [degradations, setDegradations] = useState<Degradation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDegradation, setEditingDegradation] = useState<Degradation | null>(null)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    degradation: Degradation | null
  }>({ isOpen: false, degradation: null })

  const [formData, setFormData] = useState({ nom: "", type: "" })

  useEffect(() => {
    loadDegradations()
  }, [page, search, filterType])

  const loadDegradations = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterType) params.type = filterType

      const response = await degradationService.getAll(params)
      setDegradations(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading degradations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingDegradation) {
        await degradationService.update(editingDegradation.id, formData)
      } else {
        await degradationService.create(formData)
      }
      setIsModalOpen(false)
      setEditingDegradation(null)
      setFormData({ nom: "", type: "" })
      loadDegradations()
    } catch (error) {
      console.error("Error saving degradation:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (degradation: Degradation) => {
    setEditingDegradation(degradation)
    setFormData({ nom: degradation.nom, type: degradation.type || "" })
    setIsModalOpen(true)
  }

  const handleDelete = (degradation: Degradation) => {
    setConfirmDialog({ isOpen: true, degradation })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.degradation) return

    setSubmitting(true)
    try {
      await degradationService.delete(confirmDialog.degradation.id)
      setConfirmDialog({ isOpen: false, degradation: null })
      loadDegradations()
    } catch (error) {
      console.error("Error deleting degradation:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "type", label: "Type", render: (d: Degradation) => d.type || "N/A" },
  ]

  const openCreate = () => {
    setEditingDegradation(null)
    setFormData({ nom: "", type: "" })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Types de Dégradation"
        description="Référentiel des dégradations constatées sur les bâtiments."
        actions={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="size-4" />
            Ajouter
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Dégradations"
          value={loading && (pagination?.total ?? 0) === 0 ? "…" : formatNumber((pagination?.total ?? 0))}
          hint={filterType ? `Type « ${filterType} »` : "Enregistrées"}
          icon={<AlertTriangle />}
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="w-full sm:w-72" />
        <input
          type="text"
          placeholder="Filtrer par type..."
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input w-full sm:w-56"
        />
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : degradations.length === 0 && (pagination?.total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<AlertTriangle />}
            title={filterType ? "Aucune dégradation de ce type" : "Aucune dégradation enregistrée"}
            description={filterType ? "Aucun résultat ne correspond au type saisi." : "Ajoutez un premier type de dégradation pour commencer."}
            action={
              filterType ? (
                <button onClick={() => setFilterType("")} className="btn btn-outline">Effacer le filtre</button>
              ) : (
                <button onClick={openCreate} className="btn btn-primary"><Plus className="size-4" />Ajouter</button>
              )
            }
          />
        </div>
      ) : (
        <DataTable
          data={degradations}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDegradation ? "Modifier la dégradation" : "Ajouter une dégradation"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="input"
              placeholder="Ex: Fissures, Infiltration d'eau..."
            />
          </div>

          <div>
            <label className="label">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
              placeholder="Ex: Structurelle, Électrique, Plomberie..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <SubmitLabel submitting={submitting} label={editingDegradation ? "Modifier" : "Ajouter"} />
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, degradation: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la dégradation "${confirmDialog.degradation?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
