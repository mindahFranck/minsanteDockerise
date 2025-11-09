"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search, Settings } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { parametreService } from "../services/parametreService"
import type { Parametre } from "../types"

export default function ParametresPage() {
  const [parametres, setParametres] = useState<Parametre[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParametre, setEditingParametre] = useState<Parametre | null>(null)
  const [search, setSearch] = useState("")
  const [filterCategorie, setFilterCategorie] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    parametre: Parametre | null
  }>({ isOpen: false, parametre: null })

  const [formData, setFormData] = useState({
    cle: "",
    valeur: "",
    categorie: "",
    description: "",
  })

  const categories = ["Système", "Sécurité", "Email", "API", "Interface", "Autre"]

  useEffect(() => {
    loadParametres()
  }, [page, search, filterCategorie])

  const loadParametres = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterCategorie) params.categorie = filterCategorie

      const response = await parametreService.getAll(params)
      setParametres(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading parametres:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingParametre) {
        await parametreService.update(editingParametre.id, formData)
      } else {
        await parametreService.create(formData)
      }
      setIsModalOpen(false)
      setEditingParametre(null)
      resetForm()
      loadParametres()
    } catch (error) {
      console.error("Error saving parametre:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      cle: "",
      valeur: "",
      categorie: "",
      description: "",
    })
  }

  const handleEdit = (parametre: Parametre) => {
    setEditingParametre(parametre)
    setFormData({
      cle: parametre.cle,
      valeur: parametre.valeur,
      categorie: parametre.categorie || "",
      description: parametre.description || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (parametre: Parametre) => {
    setConfirmDialog({ isOpen: true, parametre })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.parametre) return

    setSubmitting(true)
    try {
      await parametreService.delete(confirmDialog.parametre.id)
      setConfirmDialog({ isOpen: false, parametre: null })
      loadParametres()
    } catch (error) {
      console.error("Error deleting parametre:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "cle", label: "Clé" },
    { key: "valeur", label: "Valeur", render: (p: Parametre) => (
      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{p.valeur}</span>
    )},
    {
      key: "categorie",
      label: "Catégorie",
      render: (p: Parametre) => (
        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
          {p.categorie || "N/A"}
        </span>
      )
    },
    { key: "description", label: "Description", render: (p: Parametre) => p.description || "N/A" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Paramètres Système</h1>
        </div>
        <button
          onClick={() => {
            setEditingParametre(null)
            resetForm()
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Attention : La modification des paramètres système peut affecter le fonctionnement de l'application. Effectuez les changements avec précaution.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par clé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterCategorie}
          onChange={(e) => setFilterCategorie(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={parametres}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingParametre ? "Modifier le paramètre" : "Ajouter un paramètre"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clé *</label>
            <input
              type="text"
              required
              value={formData.cle}
              onChange={(e) => setFormData({ ...formData, cle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Ex: app.name, max.file.size..."
              disabled={!!editingParametre}
            />
            {editingParametre && (
              <p className="mt-1 text-xs text-gray-500">La clé ne peut pas être modifiée</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur *</label>
            <input
              type="text"
              required
              value={formData.valeur}
              onChange={(e) => setFormData({ ...formData, valeur: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Valeur du paramètre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              value={formData.categorie}
              onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Description du paramètre et son utilité..."
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
                editingParametre ? "Modifier" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, parametre: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le paramètre "${confirmDialog.parametre?.cle}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
