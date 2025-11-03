"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search, ImageIcon } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { fosaService } from "../services/fosaService"
import { arrondissementService } from "../services/arrondissementService"
import { airesanteService } from "../services/airesanteService"
import type { Fosa, Arrondissement, Airesante } from "../types"

export default function FosasPage() {
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [arrondissements, setArrondissements] = useState<Arrondissement[]>([])
  const [airesantes, setAiresantes] = useState<Airesante[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Fosa | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [formData, setFormData] = useState({
    nom: "",
    type: "",
    latitude: 0,
    longitude: 0,
    capacite: 0,
    fermeture: false,
    situation: "",
    arrondissementId: 0,
    airesanteId: 0,
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [fosaResponse, arrResponse, airesResponse] = await Promise.all([
        fosaService.getAll({ page, limit: 10, search }),
        arrondissementService.getAll({ limit: 100 }),
        airesanteService.getAll({ limit: 100 }),
      ])
      setFosas(fosaResponse.data)
      setPagination(fosaResponse.pagination)
      setArrondissements(arrResponse.data)
      setAiresantes(airesResponse.data)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await fosaService.update(editingItem.id, formData, imageFile || undefined)
      } else {
        await fosaService.create(formData, imageFile || undefined)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setImageFile(null)
      setImagePreview("")
      setFormData({
        nom: "",
        type: "",
        latitude: 0,
        longitude: 0,
        capacite: 0,
        fermeture: false,
        situation: "",
        arrondissementId: 0,
        airesanteId: 0,
      })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    }
  }

  const handleEdit = (item: Fosa) => {
    setEditingItem(item)
    setFormData({
      nom: item.nom,
      type: item.type,
      latitude: item.latitude,
      longitude: item.longitude,
      capacite: item.capacite,
      fermeture: item.fermeture,
      situation: item.situation,
      arrondissementId: item.arrondissementId,
      airesanteId: item.airesanteId,
    })
    if (item.image) {
      setImagePreview(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${item.image}`)
    }
    setIsModalOpen(true)
  }

  const handleDelete = async (item: Fosa) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${item.nom}?`)) {
      try {
        await fosaService.delete(item.id)
        loadData()
      } catch (error) {
        console.error("Error deleting:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "image",
      label: "Image",
      render: (f: Fosa) =>
        f.image ? (
          <img
            src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${f.image}`}
            alt={f.nom}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        ),
    },
    { key: "nom", label: "Nom" },
    { key: "type", label: "Type" },
    { key: "capacite", label: "Capacité" },
    {
      key: "fermeture",
      label: "Statut",
      render: (f: Fosa) => (
        <span
          className={`px-2 py-1 rounded text-xs ${f.fermeture ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {f.fermeture ? "Fermé" : "Ouvert"}
        </span>
      ),
    },
    { key: "arrondissement", label: "Arrondissement", render: (f: Fosa) => f.arrondissement?.nom || "-" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Formations Sanitaires (FOSA)</h1>
        <button
          onClick={() => {
            setEditingItem(null)
            setImageFile(null)
            setImagePreview("")
            setFormData({
              nom: "",
              type: "",
              latitude: 0,
              longitude: 0,
              capacite: 0,
              fermeture: false,
              situation: "",
              arrondissementId: 0,
              airesanteId: 0,
            })
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
          data={fosas}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Modifier FOSA" : "Ajouter FOSA"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                <option value="Hôpital">Hôpital</option>
                <option value="Centre de Santé">Centre de Santé</option>
                <option value="Dispensaire">Dispensaire</option>
                <option value="Clinique">Clinique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacité</label>
              <input
                type="number"
                value={formData.capacite}
                onChange={(e) => setFormData({ ...formData, capacite: Number.parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number.parseFloat(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number.parseFloat(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Situation</label>
            <textarea
              value={formData.situation}
              onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arrondissement</label>
              <select
                value={formData.arrondissementId}
                onChange={(e) => setFormData({ ...formData, arrondissementId: Number.parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {arrondissements.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aire de Santé</label>
              <select
                value={formData.airesanteId}
                onChange={(e) => setFormData({ ...formData, airesanteId: Number.parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {airesantes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fermeture"
              checked={formData.fermeture}
              onChange={(e) => setFormData({ ...formData, fermeture: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="fermeture" className="ml-2 text-sm text-gray-700">
              Formation fermée
            </label>
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
