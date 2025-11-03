"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { personnelService } from "../services/personnelService"
import { fosaService } from "../services/fosaService"
import type { Personnel, Fosa, Categorie } from "../types"
import api from "../services/api"

export default function PersonnelsPage() {
  const [personnels, setPersonnels] = useState<Personnel[]>([])
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Personnel | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    matricule: "",
    grade: "",
    fosaId: 0,
    categorieId: 0,
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [persResponse, fosaResponse, catResponse] = await Promise.all([
        personnelService.getAll({ page, limit: 10, search }),
        fosaService.getAll({ limit: 100 }),
        api.get("/categories?limit=100"),
      ])
      setPersonnels(persResponse.data)
      setPagination(persResponse.pagination)
      setFosas(fosaResponse.data)
      setCategories(catResponse.data.data)
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
        await personnelService.update(editingItem.id, formData)
      } else {
        await personnelService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ nom: "", prenom: "", matricule: "", grade: "", fosaId: 0, categorieId: 0 })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    }
  }

  const handleEdit = (item: Personnel) => {
    setEditingItem(item)
    setFormData({
      nom: item.nom,
      prenom: item.prenom,
      matricule: item.matricule,
      grade: item.grade,
      fosaId: item.fosaId,
      categorieId: item.categorieId,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (item: Personnel) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${item.prenom} ${item.nom}?`)) {
      try {
        await personnelService.delete(item.id)
        loadData()
      } catch (error) {
        console.error("Error deleting:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "matricule", label: "Matricule" },
    { key: "prenom", label: "Prénom" },
    { key: "nom", label: "Nom" },
    { key: "grade", label: "Grade" },
    { key: "categorie", label: "Catégorie", render: (p: Personnel) => p.categorie?.nom || "-" },
    { key: "fosa", label: "FOSA", render: (p: Personnel) => p.fosa?.nom || "-" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Personnel</h1>
        <button
          onClick={() => {
            setEditingItem(null)
            setFormData({ nom: "", prenom: "", matricule: "", grade: "", fosaId: 0, categorieId: 0 })
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
          data={personnels}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matricule</label>
              <input
                type="text"
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={formData.categorieId}
              onChange={(e) => setFormData({ ...formData, categorieId: Number.parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">FOSA</label>
            <select
              value={formData.fosaId}
              onChange={(e) => setFormData({ ...formData, fosaId: Number.parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {fosas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
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
