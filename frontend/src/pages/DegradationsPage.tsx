"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { degradationService } from "../services/degradationService"
import type { Degradation } from "../types"

export default function DegradationsPage() {
  const [degradations, setDegradations] = useState<Degradation[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDegradation, setEditingDegradation] = useState<Degradation | null>(null)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({ nom: "", type: "" })

  useEffect(() => {
    loadDegradations()
  }, [page, search, filterType])

  const loadDegradations = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterType) params.type = filterType

      const response = await degradationService.getAll(params)
      setDegradations(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading degradations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDegradation) {
        await degradationService.update(editingDegradation.id, formData)
      } else {
        await degradationService.create(formData)
      }
      setIsModalOpen(false)
      setEditingDegradation(null)
      setFormData({ nom: "", type: "" })
      loadDegradations()
    } catch (error) {
      console.error("Error saving degradation:", error)
    }
  }

  const handleEdit = (degradation: Degradation) => {
    setEditingDegradation(degradation)
    setFormData({ nom: degradation.nom, type: degradation.type || "" })
    setIsModalOpen(true)
  }

  const handleDelete = async (degradation: Degradation) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${degradation.nom}?`)) {
      try {
        await degradationService.delete(degradation.id)
        loadDegradations()
      } catch (error) {
        console.error("Error deleting degradation:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "type", label: "Type", render: (d: Degradation) => d.type || "N/A" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Types de Dégradation</h1>
        <button
          onClick={() => {
            setEditingDegradation(null)
            setFormData({ nom: "", type: "" })
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
        <input
          type="text"
          placeholder="Filtrer par type..."
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <DataTable
        data={degradations}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDegradation ? "Modifier la dégradation" : "Ajouter une dégradation"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Fissures, Infiltration d'eau..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Structurelle, Électrique, Plomberie..."
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
              {editingDegradation ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
