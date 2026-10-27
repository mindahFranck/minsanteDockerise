"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { personnelService } from "../services/personnelService"
import { fosaService } from "../services/fosaService"
import type { Personnel, Fosa, Categorie } from "../types"
import api from "../services/api"
import { usePermissions } from "../hooks/usePermissions"
import SearchableSelect from "../components/SearchableSelect"
import { exportPersonnelsToPDF, exportPersonnelsToExcel } from "../utils/pageExports"
import { PageHeader, FilterBar, SearchInput, formatNumber } from "../components/ui"

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

export default function PersonnelsPage() {
  const permissions = usePermissions()
  const [personnels, setPersonnels] = useState<Personnel[]>([])
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Personnel | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    personnel: Personnel | null
  }>({ isOpen: false, personnel: null })

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    matricule: "",
    grade: "",
    fosaId: 0,
    categorieId: 0,
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [persResponse, fosaResponse, catResponse] = await Promise.all([
        personnelService.getAll({ page, limit: 10, search }),
        fosaService.getAll({ limit: 100 }),
        api.get("/categories?limit=100"),
      ])
      setPersonnels(persResponse.data)
      setPagination(persResponse.pagination)
      setFosas(fosaResponse.data)
      setCategories(catResponse.data.data)
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
        await personnelService.update(editingItem.id, formData)
      } else {
        await personnelService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ nom: "", prenom: "", matricule: "", grade: "", fosaId: 0, categorieId: 0 })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Personnel) => {
    setEditingItem(item)
    setFormData({
      nom: item.nom,
      prenom: item.prenom,
      matricule: item.matricule,
      grade: item.grade,
      fosaId: item.fosaId,
      categorieId: item.categorieId,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (item: Personnel) => {
    setConfirmDialog({ isOpen: true, personnel: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.personnel) return

    setSubmitting(true)
    try {
      await personnelService.delete(confirmDialog.personnel.id)
      setConfirmDialog({ isOpen: false, personnel: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "matricule", label: "Matricule" },
    { key: "prenom", label: "Prénom" },
    { key: "nom", label: "Nom" },
    { key: "grade", label: "Grade" },
    { key: "categorie", label: "Catégorie", render: (p: Personnel) => p.categorie?.nom || "-" },
    { key: "fosa", label: "FOSA", render: (p: Personnel) => p.fosa?.nom || "-" },
  ]

  const handleExportPDF = () => exportPersonnelsToPDF(personnels)
  const handleExportExcel = () => exportPersonnelsToExcel(personnels)

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Personnel"
        title="Personnel"
        description="Agents affectés aux formations sanitaires : matricule, grade, catégorie et FOSA."
        actions={
          permissions.canCreate && permissions.canManagePersonnel ? (
            <button
              onClick={() => {
                setEditingItem(null)
                setFormData({ nom: "", prenom: "", matricule: "", grade: "", fosaId: 0, categorieId: 0 })
                setIsModalOpen(true)
              }}
              className="btn btn-primary"
            >
              <Plus className="size-4" />
              Ajouter
            </button>
          ) : undefined
        }
      />

      <FilterBar
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={personnels.length === 0}
          />
        }
      >
        <SearchInput value={search} onChange={setSearch} className="w-full sm:w-80" />
        {!loading && (
          <span className="font-mono text-xs text-gray-500">{formatNumber(pagination.total)} agent(s)</span>
        )}
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={personnels}
          columns={columns}
          onEdit={permissions.canEdit && permissions.canManagePersonnel ? handleEdit : undefined}
          onDelete={permissions.canDelete && permissions.canManagePersonnel ? handleDelete : undefined}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Prénom</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
                className="input"
              />
            </div>
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Matricule</label>
              <input
                type="text"
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Grade</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <SearchableSelect
              options={categories.map((c) => ({ id: c.id, label: c.nom }))}
              value={formData.categorieId || null}
              onChange={(v) => setFormData({ ...formData, categorieId: v ? Number(v) : 0 })}
              placeholder="Rechercher et sélectionner une catégorie"
              required
            />
          </div>
          <div>
            <label className="label">FOSA</label>
            <SearchableSelect
              options={fosas.map((f) => ({ id: f.id, label: f.nom }))}
              value={formData.fosaId || null}
              onChange={(v) => setFormData({ ...formData, fosaId: v ? Number(v) : 0 })}
              placeholder="Rechercher et sélectionner une FOSA"
              required
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
                editingItem ? "Modifier" : "Créer"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, personnel: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDialog.personnel?.prenom} ${confirmDialog.personnel?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
