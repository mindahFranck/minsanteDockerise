"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { departementService } from "../services/departementService"
import { regionService } from "../services/regionService"
import type { Departement, Region } from "../types"

export default function DepartementsPage() {
  const [departements, setDepartements] = useState<Departement[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Departement | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({ nom: "", population: 0, chefLieu: "", regionId: 0 })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [deptResponse, regionsResponse] = await Promise.all([
        departementService.getAll({ page, limit: 10, search }),
        regionService.getAll({ limit: 100 }),
      ])
      setDepartements(deptResponse.data)
      setPagination(deptResponse.pagination)
      setRegions(regionsResponse.data)
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
        await departementService.update(editingItem.id, formData)
      } else {
        await departementService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ nom: "", population: 0, chefLieu: "", regionId: 0 })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    }
  }

  const handleEdit = (item: Departement) => {
    setEditingItem(item)
    setFormData({ nom: item.departement || item.nom || '', population: item.population || 0, chefLieu: item.chefLieu || '', regionId: item.regionId })
    setIsModalOpen(true)
  }

  const handleDelete = async (item: Departement) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${item.departement || item.nom}?`)) {
      try {
        await departementService.delete(item.id)
        loadData()
      } catch (error) {
        console.error("Error deleting:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "departement", label: "Département", render: (d: Departement) => d.departement || d.nom || "-" },
    { key: "region", label: "Région", render: (d: Departement) => d.region?.nom || "-" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Départements</h1>
        <button
          onClick={() => {
            setEditingItem(null)
            setFormData({ nom: "", population: 0, chefLieu: "", regionId: 0 })
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
          data={departements}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Population</label>
            <input
              type="number"
              value={formData.population}
              onChange={(e) => setFormData({ ...formData, population: Number.parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chef-lieu</label>
            <input
              type="text"
              value={formData.chefLieu}
              onChange={(e) => setFormData({ ...formData, chefLieu: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
            <select
              value={formData.regionId}
              onChange={(e) => setFormData({ ...formData, regionId: Number.parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
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
