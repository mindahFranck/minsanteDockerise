"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Tag, Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { PageHeader, StatCard, FilterBar, SearchInput, EmptyState, formatNumber } from "../components/ui"
import { categorieService } from "../services/categorieService"
import type { Categorie } from "../types"

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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Categorie[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategorie, setEditingCategorie] = useState<Categorie | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    categorie: Categorie | null
  }>({ isOpen: false, categorie: null })

  const [formData, setFormData] = useState({ nom: "", description: "" })

  useEffect(() => {
    loadCategories()
  }, [page, search])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categorieService.getAll({ page, limit: 10 })
      setCategories(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingCategorie) {
        await categorieService.update(editingCategorie.id, formData)
      } else {
        await categorieService.create(formData)
      }
      setIsModalOpen(false)
      setEditingCategorie(null)
      setFormData({ nom: "", description: "" })
      loadCategories()
    } catch (error) {
      console.error("Error saving categorie:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (categorie: Categorie) => {
    setEditingCategorie(categorie)
    setFormData({ nom: categorie.nom, description: categorie.description || "" })
    setIsModalOpen(true)
  }

  const handleDelete = (categorie: Categorie) => {
    setConfirmDialog({ isOpen: true, categorie })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.categorie) return

    setSubmitting(true)
    try {
      await categorieService.delete(confirmDialog.categorie.id)
      setConfirmDialog({ isOpen: false, categorie: null })
      loadCategories()
    } catch (error) {
      console.error("Error deleting categorie:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "description", label: "Description", render: (c: Categorie) => c.description || "N/A" },
  ]

  const openCreate = () => {
    setEditingCategorie(null)
    setFormData({ nom: "", description: "" })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Personnel"
        title="Catégories de Personnel"
        description="Catégories professionnelles utilisées pour classer le personnel des FOSA."
        actions={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="size-4" />
            Ajouter
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Catégories"
          value={loading && (pagination?.total ?? 0) === 0 ? "…" : formatNumber((pagination?.total ?? 0))}
          hint="Enregistrées"
          icon={<Tag />}
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="w-full sm:w-72" />
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : categories.length === 0 && (pagination?.total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Tag />}
            title="Aucune catégorie enregistrée"
            description="Ajoutez une première catégorie de personnel pour commencer."
            action={<button onClick={openCreate} className="btn btn-primary"><Plus className="size-4" />Ajouter</button>}
          />
        </div>
      ) : (
        <DataTable
          data={categories}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategorie ? "Modifier la catégorie" : "Ajouter une catégorie"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="input"
              placeholder="Ex: Médecin, Infirmier, Technicien..."
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Description de la catégorie..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <SubmitLabel submitting={submitting} label={editingCategorie ? "Modifier" : "Ajouter"} />
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, categorie: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${confirmDialog.categorie?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
