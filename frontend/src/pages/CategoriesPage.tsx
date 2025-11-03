"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { categorieService } from "../services/categorieService"
import type { Categorie } from "../types"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Categorie[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategorie, setEditingCategorie] = useState<Categorie | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({ nom: "", description: "" })

  useEffect(() => {
    loadCategories()
  }, [page, search])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categorieService.getAll({ page, limit: 10 })
      setCategories(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategorie) {
        await categorieService.update(editingCategorie.id, formData)
      } else {
        await categorieService.create(formData)
      }
      setIsModalOpen(false)
      setEditingCategorie(null)
      setFormData({ nom: "", description: "" })
      loadCategories()
    } catch (error) {
      console.error("Error saving categorie:", error)
    }
  }

  const handleEdit = (categorie: Categorie) => {
    setEditingCategorie(categorie)
    setFormData({ nom: categorie.nom, description: categorie.description || "" })
    setIsModalOpen(true)
  }

  const handleDelete = async (categorie: Categorie) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${categorie.nom}?`)) {
      try {
        await categorieService.delete(categorie.id)
        loadCategories()
      } catch (error) {
        console.error("Error deleting categorie:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "description", label: "Description", render: (c: Categorie) => c.description || "N/A" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Catégories de Personnel</h1>
        <button
          onClick={() => {
            setEditingCategorie(null)
            setFormData({ nom: "", description: "" })
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

      <DataTable
        data={categories}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategorie ? "Modifier la catégorie" : "Ajouter une catégorie"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Médecin, Infirmier, Technicien..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Description de la catégorie..."
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
              {editingCategorie ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
