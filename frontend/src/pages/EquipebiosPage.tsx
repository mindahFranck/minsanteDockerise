"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { equipebioService } from "../services/equipebioService"
import api from "../services/api"
import type { Equipebio, Service } from "../types"

export default function EquipebiosPage() {
  const [equipebios, setEquipebios] = useState<Equipebio[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEquipebio, setEditingEquipebio] = useState<Equipebio | null>(null)
  const [search, setSearch] = useState("")
  const [filterServiceId, setFilterServiceId] = useState<number | null>(null)
  const [filterEtat, setFilterEtat] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    equipebio: Equipebio | null
  }>({ isOpen: false, equipebio: null })

  const [formData, setFormData] = useState({
    nom: "",
    serviceId: 0,
    type: "",
    quantite: 1,
    etat: "Bon",
    dateAcquisition: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    loadEquipebios()
    loadServices()
  }, [page, search, filterServiceId, filterEtat])

  const loadEquipebios = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterServiceId) params.serviceId = filterServiceId
      if (filterEtat) params.etat = filterEtat

      const response = await equipebioService.getAll(params)
      setEquipebios(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading equipebios:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const response = await api.get("/services?limit=1000")
      setServices(response.data.data)
    } catch (error) {
      console.error("Error loading services:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingEquipebio) {
        await equipebioService.update(editingEquipebio.id, formData)
      } else {
        await equipebioService.create(formData)
      }
      setIsModalOpen(false)
      setEditingEquipebio(null)
      resetForm()
      loadEquipebios()
    } catch (error) {
      console.error("Error saving equipebio:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      serviceId: 0,
      type: "",
      quantite: 1,
      etat: "Bon",
      dateAcquisition: new Date().toISOString().split("T")[0],
    })
  }

  const handleEdit = (equipebio: Equipebio) => {
    setEditingEquipebio(equipebio)
    setFormData({
      nom: equipebio.nom || "",
      serviceId: equipebio.serviceId,
      type: equipebio.type || "",
      quantite: equipebio.quantite || 1,
      etat: equipebio.etat || "Bon",
      dateAcquisition: equipebio.dateAcquisition?.split("T")[0] || new Date().toISOString().split("T")[0],
    })
    setIsModalOpen(true)
  }

  const handleDelete = (equipebio: Equipebio) => {
    setConfirmDialog({ isOpen: true, equipebio })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.equipebio) return

    setSubmitting(true)
    try {
      await equipebioService.delete(confirmDialog.equipebio.id)
      setConfirmDialog({ isOpen: false, equipebio: null })
      loadEquipebios()
    } catch (error) {
      console.error("Error deleting equipebio:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "type", label: "Type" },
    { key: "service", label: "Service", render: (e: Equipebio) => e.service?.nom || "N/A" },
    { key: "quantite", label: "Quantité" },
    {
      key: "etat",
      label: "État",
      render: (e: Equipebio) => (
        <span className={`px-2 py-1 rounded text-xs ${
          e.etat === "Bon" ? "bg-green-100 text-green-800" :
          e.etat === "Moyen" ? "bg-yellow-100 text-yellow-800" :
          e.etat === "Mauvais" ? "bg-orange-100 text-orange-800" :
          "bg-red-100 text-red-800"
        }`}>
          {e.etat}
        </span>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Équipements Biomédicaux</h1>
        <button
          onClick={() => {
            setEditingEquipebio(null)
            resetForm()
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterServiceId || ""}
          onChange={(e) => setFilterServiceId(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nom}
            </option>
          ))}
        </select>
        <select
          value={filterEtat}
          onChange={(e) => setFilterEtat(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les états</option>
          <option value="Bon">Bon</option>
          <option value="Moyen">Moyen</option>
          <option value="Mauvais">Mauvais</option>
          <option value="Hors service">Hors service</option>
        </select>
      </div>

      <DataTable
        data={equipebios}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEquipebio ? "Modifier l'équipement biomédical" : "Ajouter un équipement biomédical"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
            <select
              required
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Sélectionner un service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Scanner, IRM, Échographe..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input
              type="number"
              min="1"
              value={formData.quantite}
              onChange={(e) => setFormData({ ...formData, quantite: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select
              value={formData.etat}
              onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Bon">Bon</option>
              <option value="Moyen">Moyen</option>
              <option value="Mauvais">Mauvais</option>
              <option value="Hors service">Hors service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'acquisition</label>
            <input
              type="date"
              value={formData.dateAcquisition}
              onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Enregistrement...</span>
                </>
              ) : (
                editingEquipebio ? "Modifier" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, equipebio: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'équipement biomédical "${confirmDialog.equipebio?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
