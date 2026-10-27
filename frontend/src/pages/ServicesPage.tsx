"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { serviceService } from "../services/serviceService"
import { fosaService } from "../services/fosaService"
import { batimentService } from "../services/batimentService"
import type { Service, Fosa, Batiment } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import SearchableSelect from "../components/SearchableSelect"
import { exportGenericToPDF, exportGenericToExcel } from "../utils/exportUtils"
import { PageHeader, StatCard, SearchInput, FilterBar, formatNumber, toast } from "../components/ui"

export default function ServicesPage() {
  const permissions = usePermissions()

  const [services, setServices] = useState<Service[]>([])
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [batiments, setBatiments] = useState<Batiment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [search, setSearch] = useState("")
  const [filterFosaId, setFilterFosaId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    service: Service | null
  }>({ isOpen: false, service: null })

  const [formData, setFormData] = useState({
    nom: "",
    fosaId: 0,
    batimentId: null as number | null,
    capacite: 0,
    description: "",
  })

  useEffect(() => {
    loadServices()
    loadFosas()
  }, [page, search, filterFosaId])

  useEffect(() => {
    if (formData.fosaId) {
      loadBatimentsByFosa(formData.fosaId)
    }
  }, [formData.fosaId])

  const loadServices = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterFosaId) params.fosaId = filterFosaId

      const response = await serviceService.getAll(params)
      setServices(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading services:", error)
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

  const loadBatimentsByFosa = async (fosaId: number) => {
    try {
      const response = await batimentService.getByFosa(fosaId)
      setBatiments(response.data)
    } catch (error) {
      console.error("Error loading batiments:", error)
      setBatiments([])
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
      if (editingService) {
        await serviceService.update(editingService.id, formData)
      } else {
        await serviceService.create(formData)
      }
      setIsModalOpen(false)
      setEditingService(null)
      resetForm()
      loadServices()
    } catch (error: any) {
      console.error("Error saving service:", error)
      // Le message d'erreur est affiché par l'intercepteur de l'API (toast).
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      fosaId: 0,
      batimentId: null,
      capacite: 0,
      description: "",
    })
    setBatiments([])
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      nom: service.nom,
      fosaId: service.fosaId,
      batimentId: service.batimentId || null,
      capacite: service.capacite || 0,
      description: service.description || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (service: Service) => {
    setConfirmDialog({ isOpen: true, service })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.service) return

    setSubmitting(true)
    try {
      await serviceService.delete(confirmDialog.service.id)
      setConfirmDialog({ isOpen: false, service: null })
      loadServices()
    } catch (error) {
      console.error("Error deleting service:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID", render: (s: Service) => <span className="font-mono text-xs text-gray-500">{s.id}</span> },
    { key: "nom", label: "Nom du service", render: (s: Service) => <span className="font-semibold text-gray-900">{s.nom || "-"}</span> },
    { key: "fosa", label: "FOSA", render: (s: Service) => <span className="text-gray-700">{s.fosa?.nom || "N/A"}</span> },
    {
      key: "batiment",
      label: "Bâtiment",
      render: (s: Service) =>
        s.batiment?.nom ? <span className="text-gray-700">{s.batiment.nom}</span> : <span className="text-gray-400">N/A</span>,
    },
    { key: "capacite", label: "Capacité", render: (s: Service) => s.capacite || "N/A" },
  ]

  const handleExportPDF = () => {
    exportGenericToPDF(
      services,
      [
        { header: 'ID', dataKey: 'id' },
        { header: 'Nom', dataKey: 'nom' },
        { header: 'Capacité', dataKey: 'capacite' },
        { header: 'FOSA', dataKey: 'fosaName' },
        { header: 'Bâtiment', dataKey: 'batimentName' },
      ],
      'Liste des Services',
      `services_${new Date().toISOString().split('T')[0]}`
    )
  }

  const handleExportExcel = () => {
    exportGenericToExcel(
      services.map(s => ({
        ...s,
        fosaName: s.fosa?.nom || '-',
        batimentName: s.batiment?.nom || '-'
      })),
      [
        { header: 'ID', key: 'id' },
        { header: 'Nom', key: 'nom' },
        { header: 'Capacité', key: 'capacite' },
        { header: 'FOSA', key: 'fosaName' },
        { header: 'Bâtiment', key: 'batimentName' },
        { header: 'Description', key: 'description' },
      ],
      `services_${new Date().toISOString().split('T')[0]}`,
      'Services'
    )
  }


  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Infrastructures"
        title="Services"
        description="Services des formations sanitaires, leur bâtiment de rattachement et leur capacité."
        actions={
          permissions.canCreate ? (
            <button
              onClick={() => {
                setEditingService(null)
                setFormData({
                  nom: "",
                  fosaId: filterFosaId ?? 0,
                  batimentId: null,
                  capacite: 0,
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
        <StatCard label="Services" value={formatNumber(pagination.total)} hint="selon les filtres actifs" />
      </div>

      <FilterBar
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={services.length === 0}
          />
        }
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="w-full sm:w-72" />
        <select
          value={filterFosaId || ""}
          onChange={(e) => setFilterFosaId(e.target.value ? Number(e.target.value) : null)}
          className="input w-full sm:w-auto sm:max-w-xs"
        >
          <option value="">Toutes les FOSA</option>
          {fosas.map((fosa) => (
            <option key={fosa.id} value={fosa.id}>
              {fosa.nom}
            </option>
          ))}
        </select>
      </FilterBar>

      <DataTable
        data={services}
        columns={columns}
        onEdit={permissions.canEdit ? handleEdit : undefined}
        onDelete={permissions.canDelete ? handleDelete : undefined}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Modifier le service" : "Ajouter un service"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nom du service *</label>
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
                options={fosas.map((fosa) => ({ id: fosa.id, label: fosa.nom }))}
                value={formData.fosaId || null}
                onChange={(v) => setFormData({ ...formData, fosaId: v ? Number(v) : 0, batimentId: null })}
                placeholder="Rechercher et sélectionner une FOSA"
                required
              />
            </div>

            <div>
              <label className="label">Bâtiment</label>
              <SearchableSelect
                options={batiments.map((batiment) => ({ id: batiment.id, label: batiment.nom }))}
                value={formData.batimentId || null}
                onChange={(v) => setFormData({ ...formData, batimentId: v ? Number(v) : null })}
                placeholder={
                  formData.fosaId
                    ? batiments.length
                      ? "Sélectionner un bâtiment"
                      : "Aucun bâtiment pour cette FOSA"
                    : "Choisissez d'abord une FOSA"
                }
                disabled={!formData.fosaId}
              />
            </div>

            <div>
              <label className="label">Capacité</label>
              <input
                type="number"
                min="0"
                value={formData.capacite}
                onChange={(e) => setFormData({ ...formData, capacite: Number(e.target.value) })}
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
                editingService ? "Modifier" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, service: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le service "${confirmDialog.service?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
