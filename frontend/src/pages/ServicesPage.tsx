"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { serviceService } from "../services/serviceService"
import { fosaService } from "../services/fosaService"
import { batimentService } from "../services/batimentService"
import type { Service, Fosa, Batiment } from "../types"

export default function ServicesPage() {
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
    } catch (error) {
      console.error("Error saving service:", error)
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
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom du service" },
    { key: "fosa", label: "FOSA", render: (s: Service) => s.fosa?.nom || "N/A" },
    { key: "batiment", label: "Bâtiment", render: (s: Service) => s.batiment?.nom || "N/A" },
    { key: "capacite", label: "Capacité", render: (s: Service) => s.capacite || "N/A" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <button
          onClick={() => {
            if (!filterFosaId) {
              alert("Veuillez d'abord sélectionner une FOSA dans le filtre pour ajouter un service")
              return
            }
            setEditingService(null)
            setFormData({
              nom: "",
              fosaId: filterFosaId,
              batimentId: null,
              capacite: 0,
              description: "",
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!filterFosaId}
          title={!filterFosaId ? "Sélectionnez d'abord une FOSA dans le filtre" : ""}
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
          value={filterFosaId || ""}
          onChange={(e) => setFilterFosaId(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les FOSA</option>
          {fosas.map((fosa) => (
            <option key={fosa.id} value={fosa.id}>
              {fosa.nom}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={services}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Modifier le service" : "Ajouter un service"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du service *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FOSA *</label>
            <select
              required
              value={formData.fosaId}
              onChange={(e) => setFormData({ ...formData, fosaId: Number(e.target.value), batimentId: null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Sélectionner une FOSA</option>
              {fosas.map((fosa) => (
                <option key={fosa.id} value={fosa.id}>
                  {fosa.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bâtiment</label>
            <select
              value={formData.batimentId || ""}
              onChange={(e) => setFormData({ ...formData, batimentId: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!formData.fosaId}
            >
              <option value="">Sélectionner un bâtiment</option>
              {batiments.map((batiment) => (
                <option key={batiment.id} value={batiment.id}>
                  {batiment.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
            <input
              type="number"
              min="0"
              value={formData.capacite}
              onChange={(e) => setFormData({ ...formData, capacite: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
