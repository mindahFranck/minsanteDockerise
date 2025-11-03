"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { regionService } from "../services/regionService"
import type { Region } from "../types"

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({ nom: "", population: 0 })

  useEffect(() => {
    loadRegions()
  }, [page, search])

  const loadRegions = async () => {
    try {
      setLoading(true)
      const response = await regionService.getAll({ page, limit: 10, search })
      setRegions(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading regions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRegion) {
        await regionService.update(editingRegion.id, formData)
      } else {
        await regionService.create(formData)
      }
      setIsModalOpen(false)
      setEditingRegion(null)
      setFormData({ nom: "", population: 0 })
      loadRegions()
    } catch (error) {
      console.error("Error saving region:", error)
    }
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    setFormData({ nom: region.nom, population: region.population })
    setIsModalOpen(true)
  }

  const handleDelete = async (region: Region) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${region.nom}?`)) {
      try {
        await regionService.delete(region.id)
        loadRegions()
      } catch (error) {
        console.error("Error deleting region:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "population", label: "Population", render: (r: Region) => r.population.toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Régions</h1>
        <button
          onClick={() => {
            setEditingRegion(null)
            setFormData({ nom: "", population: 0 })
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Chargement...</div>
      ) : (
        <DataTable
          data={regions}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRegion ? "Modifier" : "Ajouter"}>
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
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingRegion ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
