"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { equipementService } from "../services/equipementService"
import type { Equipement, Service } from "../types"
import api from "../services/api"

export default function EquipementsPage() {
  const [equipements, setEquipements] = useState<Equipement[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipement | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({
    type: "",
    dateAcquisition: "",
    serviceId: 0,
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [equipResponse, servResponse] = await Promise.all([
        equipementService.getAll({ page, limit: 10, search }),
        api.get("/services?limit=100"),
      ])
      setEquipements(equipResponse.data)
      setPagination(equipResponse.pagination)
      setServices(servResponse.data.data)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await equipementService.update(editingItem.id, formData)
      } else {
        await equipementService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ type: "", dateAcquisition: "", serviceId: 0 })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    }
  }

  const handleEdit = (item: Equipement) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      dateAcquisition: item.dateAcquisition.split("T")[0],
      serviceId: item.serviceId,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (item: Equipement) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cet équipement?`)) {
      try {
        await equipementService.delete(item.id)
        loadData()
      } catch (error) {
        console.error("Error deleting:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "type", label: "Type" },
    {
      key: "dateAcquisition",
      label: "Date d'acquisition",
      render: (e: Equipement) => new Date(e.dateAcquisition).toLocaleDateString("fr-FR"),
    },
    { key: "service", label: "Service", render: (e: Equipement) => e.service?.nom || "-" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Équipements</h1>
        <button
          onClick={() => {
            setEditingItem(null)
            setFormData({ type: "", dateAcquisition: "", serviceId: 0 })
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Chargement...</div>
      ) : (
        <DataTable
          data={equipements}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date d'acquisition</label>
            <input
              type="date"
              value={formData.dateAcquisition}
              onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: Number.parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingItem ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
