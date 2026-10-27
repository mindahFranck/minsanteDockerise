"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { batimentService } from "../services/batimentService"
import { fosaService } from "../services/fosaService"
import SearchableSelect from "../components/SearchableSelect"
import type { Batiment, Fosa } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import { exportBatimentsToPDF, exportBatimentsToExcel } from "../utils/pageExports"
import { PageHeader, StatCard, Badge, SearchInput, FilterBar, formatNumber, type BadgeVariant, toast } from "../components/ui"

/** Couleur de la pastille selon l'état du bâtiment. */
function etatVariant(etat?: string): BadgeVariant {
  if (etat === "Bon") return "success"
  if (etat === "Moyen") return "warning"
  return "danger"
}

export default function BatimentsPage() {
  const permissions = usePermissions()

  const [batiments, setBatiments] = useState<Batiment[]>([])
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBatiment, setEditingBatiment] = useState<Batiment | null>(null)
  const [search, setSearch] = useState("")
  const [filterFosaId, setFilterFosaId] = useState<number | null>(null)
  const [filterEtat, setFilterEtat] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    batiment: Batiment | null
  }>({ isOpen: false, batiment: null })

  const [formData, setFormData] = useState({
    nom: "",
    fosaId: 0,
    superficie: 0,
    etat: "Bon",
    anneConstruction: new Date().getFullYear(),
    description: "",
  })

  useEffect(() => {
    loadBatiments()
    loadFosas()
  }, [page, search, filterFosaId, filterEtat])

  const loadBatiments = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterFosaId) params.fosaId = filterFosaId
      if (filterEtat) params.etat = filterEtat

      const response = await batimentService.getAll(params)
      setBatiments(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading batiments:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadFosas = async () => {
    try {
      const response = await fosaService.getAll({ limit: 1000 })
      setFosas(response.data)
    } catch (error) {
      console.error("Error loading fosas:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fosaId) {
      toast.warning("Veuillez sélectionner une FOSA.")
      return
    }
    setSubmitting(true)
    try {
      if (editingBatiment) {
        await batimentService.update(editingBatiment.id, formData)
      } else {
        await batimentService.create(formData)
      }
      setIsModalOpen(false)
      setEditingBatiment(null)
      resetForm()
      loadBatiments()
    } catch (error: any) {
      console.error("Error saving batiment:", error)
      // Le message d'erreur est affiché par l'intercepteur de l'API (toast).
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      fosaId: 0,
      superficie: 0,
      etat: "Bon",
      anneConstruction: new Date().getFullYear(),
      description: "",
    })
  }

  const handleEdit = (batiment: Batiment) => {
    setEditingBatiment(batiment)
    setFormData({
      nom: batiment.nom,
      fosaId: batiment.fosaId,
      superficie: Number(batiment.superficie) || 0,
      etat: batiment.etat || "Bon",
      anneConstruction: Number(batiment.anneConstruction) || new Date().getFullYear(),
      description: batiment.description || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (batiment: Batiment) => {
    setConfirmDialog({ isOpen: true, batiment })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.batiment) return

    setSubmitting(true)
    try {
      await batimentService.delete(confirmDialog.batiment.id)
      setConfirmDialog({ isOpen: false, batiment: null })
      loadBatiments()
    } catch (error) {
      console.error("Error deleting batiment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID", render: (b: Batiment) => <span className="font-mono text-xs text-gray-500">{b.id}</span> },
    { key: "nom", label: "Nom du bâtiment", render: (b: Batiment) => <span className="font-semibold text-gray-900">{b.nom || "-"}</span> },
    { key: "fosa", label: "FOSA", render: (b: Batiment) => <span className="text-gray-700">{b.fosa?.nom || "N/A"}</span> },
    {
      key: "superficie",
      label: "Superficie (m²)",
      // L'API renvoie les DECIMAL en chaîne ("2000.00") : on convertit avant toFixed
      render: (b: Batiment) => {
        const n = Number(b.superficie)
        return b.superficie != null && b.superficie !== ("" as any) && !Number.isNaN(n)
          ? n.toFixed(2)
          : "N/A"
      },
    },
    {
      key: "etat",
      label: "État",
      render: (b: Batiment) => (
        <Badge variant={etatVariant(b.etat)} withDot>
          {b.etat}
        </Badge>
      )
    },
    { key: "anneConstruction", label: "Année" },
  ]

  // Fonctions d'export
  const handleExportPDF = () => {
    exportBatimentsToPDF(batiments)
  }

  const handleExportExcel = () => {
    exportBatimentsToExcel(batiments)
  }


  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Infrastructures"
        title="Bâtiments"
        description="Bâtiments des formations sanitaires : superficie, état et année de construction."
        actions={
          permissions.canCreate && permissions.canManageBuildings ? (
            <button
              onClick={() => {
                setEditingBatiment(null)
                setFormData({
                  nom: "",
                  fosaId: filterFosaId ?? 0,
                  superficie: 0,
                  etat: "Bon",
                  anneConstruction: new Date().getFullYear(),
                  description: "",
                })
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bâtiments" value={formatNumber(pagination.total)} hint="selon les filtres actifs" />
      </div>

      <FilterBar
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={batiments.length === 0}
          />
        }
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="w-full sm:w-72" />
        <SearchableSelect
          options={fosas.map(f => ({ id: f.id, label: f.nom }))}
          value={filterFosaId}
          onChange={(v) => setFilterFosaId(v ? Number(v) : null)}
          placeholder="Toutes les FOSA"
          className="w-full sm:w-auto sm:min-w-[250px]"
        />
        <select
          value={filterEtat}
          onChange={(e) => setFilterEtat(e.target.value)}
          className="input w-full sm:w-auto"
        >
          <option value="">Tous les états</option>
          <option value="Bon">Bon</option>
          <option value="Moyen">Moyen</option>
          <option value="Mauvais">Mauvais</option>
          <option value="En ruine">En ruine</option>
        </select>
      </FilterBar>

      <DataTable
        data={batiments}
        columns={columns}
        onEdit={permissions.canEdit && permissions.canManageBuildings ? handleEdit : undefined}
        onDelete={permissions.canDelete && permissions.canManageBuildings ? handleDelete : undefined}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBatiment ? "Modifier le bâtiment" : "Ajouter un bâtiment"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nom du bâtiment *</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">FOSA *</label>
              <SearchableSelect
                options={fosas.map(f => ({ id: f.id, label: f.nom }))}
                value={formData.fosaId || null}
                onChange={(v) => setFormData({ ...formData, fosaId: v ? Number(v) : 0 })}
                placeholder="Rechercher et sélectionner une FOSA"
                required
              />
            </div>

            <div>
              <label className="label">Superficie (m²)</label>
              <input
                type="number"
                step="0.01"
                value={formData.superficie}
                onChange={(e) => setFormData({ ...formData, superficie: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="label">État</label>
              <select
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                className="input"
              >
                <option value="Bon">Bon</option>
                <option value="Moyen">Moyen</option>
                <option value="Mauvais">Mauvais</option>
                <option value="En ruine">En ruine</option>
              </select>
            </div>

            <div>
              <label className="label">Année de construction</label>
              <input
                type="number"
                min="1800"
                max="2100"
                value={formData.anneConstruction}
                onChange={(e) => setFormData({ ...formData, anneConstruction: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
              />
            </div>
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
                editingBatiment ? "Modifier" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, batiment: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le bâtiment "${confirmDialog.batiment?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
