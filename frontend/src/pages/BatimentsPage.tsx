"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { batimentService } from "../services/batimentService"
import { fosaService } from "../services/fosaService"
import type { Batiment, Fosa } from "../types"

export default function BatimentsPage() {
  const [batiments, setBatiments] = useState<Batiment[]>([])
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBatiment, setEditingBatiment] = useState<Batiment | null>(null)
  const [search, setSearch] = useState("")
  const [filterFosaId, setFilterFosaId] = useState<number | null>(null)
  const [filterEtat, setFilterEtat] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    batiment: Batiment | null
  }>({ isOpen: false, batiment: null })

  const [formData, setFormData] = useState({
    nom: "",
    fosaId: 0,
    superficie: 0,
    etat: "Bon",
    anneConstruction: new Date().getFullYear(),
    description: "",
  })

  useEffect(() => {
    loadBatiments()
    loadFosas()
  }, [page, search, filterFosaId, filterEtat])

  const loadBatiments = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterFosaId) params.fosaId = filterFosaId
      if (filterEtat) params.etat = filterEtat

      const response = await batimentService.getAll(params)
      setBatiments(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading batiments:", error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingBatiment) {
        await batimentService.update(editingBatiment.id, formData)
      } else {
        await batimentService.create(formData)
      }
      setIsModalOpen(false)
      setEditingBatiment(null)
      resetForm()
      loadBatiments()
    } catch (error) {
      console.error("Error saving batiment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      fosaId: 0,
      superficie: 0,
      etat: "Bon",
      anneConstruction: new Date().getFullYear(),
      description: "",
    })
  }

  const handleEdit = (batiment: Batiment) => {
    setEditingBatiment(batiment)
    setFormData({
      nom: batiment.nom,
      fosaId: batiment.fosaId,
      superficie: batiment.superficie || 0,
      etat: batiment.etat || "Bon",
      anneConstruction: batiment.anneConstruction || new Date().getFullYear(),
      description: batiment.description || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (batiment: Batiment) => {
    setConfirmDialog({ isOpen: true, batiment })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.batiment) return

    setSubmitting(true)
    try {
      await batimentService.delete(confirmDialog.batiment.id)
      setConfirmDialog({ isOpen: false, batiment: null })
      loadBatiments()
    } catch (error) {
      console.error("Error deleting batiment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom du bâtiment" },
    { key: "fosa", label: "FOSA", render: (b: Batiment) => b.fosa?.nom || "N/A" },
    { key: "superficie", label: "Superficie (m²)", render: (b: Batiment) => b.superficie?.toFixed(2) || "N/A" },
    {
      key: "etat",
      label: "État",
      render: (b: Batiment) => (
        <span className={`px-2 py-1 rounded text-xs ${b.etat === "Bon" ? "bg-green-100 text-green-800" :
            b.etat === "Moyen" ? "bg-yellow-100 text-yellow-800" :
              b.etat === "Mauvais" ? "bg-orange-100 text-orange-800" :
                "bg-red-100 text-red-800"
          }`}>
          {b.etat}
        </span>
      )
    },
    { key: "anneConstruction", label: "Année" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bâtiments</h1>
        <button
          onClick={() => {
            setEditingBatiment(null)
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
        <select
          value={filterEtat}
          onChange={(e) => setFilterEtat(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les états</option>
          <option value="Bon">Bon</option>
          <option value="Moyen">Moyen</option>
          <option value="Mauvais">Mauvais</option>
          <option value="En ruine">En ruine</option>
        </select>
      </div>

      <DataTable
        data={batiments}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBatiment ? "Modifier le bâtiment" : "Ajouter un bâtiment"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du bâtiment *</label>
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
              onChange={(e) => setFormData({ ...formData, fosaId: Number(e.target.value) })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²)</label>
            <input
              type="number"
              step="0.01"
              value={formData.superficie}
              onChange={(e) => setFormData({ ...formData, superficie: Number(e.target.value) })}
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
              <option value="En ruine">En ruine</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année de construction</label>
            <input
              type="number"
              min="1800"
              max="2100"
              value={formData.anneConstruction}
              onChange={(e) => setFormData({ ...formData, anneConstruction: Number(e.target.value) })}
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
                editingBatiment ? "Modifier" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, batiment: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le bâtiment "${confirmDialog.batiment?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
