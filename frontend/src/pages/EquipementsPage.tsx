"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { equipementService } from "../services/equipementService"
import type { Equipement } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import { useFosaServices, useServicesForFosa } from "../hooks/useFosaServices"
import SearchableSelect from "../components/SearchableSelect"
import { exportEquipementsToPDF, exportEquipementsToExcel } from "../utils/pageExports"
import { PageHeader, FilterBar, SearchInput, toast } from "../components/ui"

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

export default function EquipementsPage() {
  const permissions = usePermissions()

  const { fosas, services: formServices, loadServicesForFosa } = useFosaServices()

  const [equipements, setEquipements] = useState<Equipement[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipement | null>(null)
  const [search, setSearch] = useState("")
  const [filterFosaId, setFilterFosaId] = useState<number | null>(null)
  const [filterServiceId, setFilterServiceId] = useState<number | null>(null)
  const { services: filterServices, loadServicesForFosa: loadFilterServices } = useServicesForFosa()
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    equipement: Equipement | null
  }>({ isOpen: false, equipement: null })

  const [formData, setFormData] = useState({
    nom: "",
    type: "",
    dateAcquisition: "",
    fosaId: 0,
    serviceId: 0,
  })

  useEffect(() => {
    loadData()
  }, [page, search, filterFosaId, filterServiceId])

  // Recharge les services quand la FOSA du formulaire change
  useEffect(() => {
    loadServicesForFosa(formData.fosaId)
  }, [formData.fosaId, loadServicesForFosa])

  // Recharge les services du filtre quand la FOSA du filtre change
  useEffect(() => {
    loadFilterServices(filterFosaId)
  }, [filterFosaId, loadFilterServices])

  const loadData = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10, search }
      if (filterFosaId) params.fosaId = filterFosaId
      if (filterServiceId) params.serviceId = filterServiceId
      const equipResponse = await equipementService.getAll(params)
      setEquipements(equipResponse.data)
      setPagination(equipResponse.pagination)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fosaId) {
      toast.warning("Veuillez d'abord sélectionner une FOSA.")
      return
    }
    if (!formData.serviceId) {
      toast.warning("Veuillez sélectionner un service.")
      return
    }
    setSubmitting(true)
    try {
      if (editingItem) {
        await equipementService.update(editingItem.id, formData)
      } else {
        await equipementService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ nom: "", type: "", dateAcquisition: "", fosaId: 0, serviceId: 0 })
      loadData()
    } catch (error: any) {
      console.error("Error saving:", error)
      // Le message d'erreur est affiché par l'intercepteur de l'API (toast).
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Equipement) => {
    setEditingItem(item)
    const svc = (item as any).service
    setFormData({
      nom: item.nom || "",
      type: item.type,
      dateAcquisition: item.dateAcquisition.split("T")[0],
      fosaId: svc?.fosaId ?? svc?.fosa_id ?? 0,
      serviceId: item.serviceId,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (item: Equipement) => {
    setConfirmDialog({ isOpen: true, equipement: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.equipement) return

    setSubmitting(true)
    try {
      await equipementService.delete(confirmDialog.equipement.id)
      setConfirmDialog({ isOpen: false, equipement: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "type", label: "Type" },
    {
      key: "dateAcquisition",
      label: "Date d'acquisition",
      render: (e: Equipement) => new Date(e.dateAcquisition).toLocaleDateString("fr-FR"),
    },
    { key: "service", label: "Service", render: (e: Equipement) => e.service?.nom || "-" },
  ]

  // Fonctions d'export
  const handleExportPDF = () => {
    exportEquipementsToPDF(equipements)
  }

  const handleExportExcel = () => {
    exportEquipementsToExcel(equipements)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Équipements"
        title="Équipements"
        description="Équipements non biomédicaux rattachés aux services des formations sanitaires."
        actions={
          permissions.canCreate && permissions.canManageEquipments ? (
            <button
              onClick={() => {
                setEditingItem(null)
                setFormData({ nom: "", type: "", dateAcquisition: "", fosaId: 0, serviceId: 0 })
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
            disabled={equipements.length === 0}
          />
        }
      >
        <SearchInput value={search} onChange={setSearch} className="w-full sm:w-72" />
        <div className="w-full sm:w-56">
          <SearchableSelect
            options={fosas.map((f) => ({ id: f.id, label: f.nom }))}
            value={filterFosaId}
            onChange={(v) => {
              setFilterFosaId(v ? Number(v) : null)
              setFilterServiceId(null)
            }}
            placeholder="Toutes les FOSA"
          />
        </div>
        <div className="w-full sm:w-56">
          <SearchableSelect
            options={filterServices.map((s) => ({ id: s.id, label: s.nom }))}
            value={filterServiceId}
            onChange={(v) => setFilterServiceId(v ? Number(v) : null)}
            placeholder={filterFosaId ? "Tous les services" : "Choisir une FOSA d'abord"}
            disabled={!filterFosaId}
          />
        </div>
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={equipements}
          columns={columns}
          onEdit={permissions.canEdit && permissions.canManageEquipments ? handleEdit : undefined}
          onDelete={permissions.canDelete && permissions.canManageEquipments ? handleDelete : undefined}
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
              className="input"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Date d'acquisition</label>
              <input
                type="date"
                value={formData.dateAcquisition}
                onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">FOSA *</label>
            <SearchableSelect
              options={fosas.map((f) => ({ id: f.id, label: f.nom }))}
              value={formData.fosaId || null}
              onChange={(v) => setFormData({ ...formData, fosaId: v ? Number(v) : 0, serviceId: 0 })}
              placeholder="Rechercher et sélectionner une FOSA"
              required
            />
          </div>
          <div>
            <label className="label">Service *</label>
            <SearchableSelect
              options={formServices.map((s) => ({ id: s.id, label: s.nom }))}
              value={formData.serviceId || null}
              onChange={(v) => setFormData({ ...formData, serviceId: v ? Number(v) : 0 })}
              placeholder={
                formData.fosaId
                  ? formServices.length
                    ? "Sélectionner un service"
                    : "Aucun service pour cette FOSA"
                  : "Choisissez d'abord une FOSA"
              }
              disabled={!formData.fosaId}
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
        onClose={() => setConfirmDialog({ isOpen: false, equipement: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'équipement "${confirmDialog.equipement?.type}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
