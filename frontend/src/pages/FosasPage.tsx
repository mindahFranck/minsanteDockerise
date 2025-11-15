"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search, ImageIcon } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { fosaService } from "../services/fosaService"
import { arrondissementService } from "../services/arrondissementService"
import { airesanteService } from "../services/airesanteService"
import type { Fosa, Arrondissement, Airesante } from "../types"

export default function FosasPage() {
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [arrondissements, setArrondissements] = useState<Arrondissement[]>([])
  const [airesantes, setAiresantes] = useState<Airesante[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Fosa | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  // Tabs removed - single simple form now
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    fosa: Fosa | null
  }>({ isOpen: false, fosa: null })

  const [formData, setFormData] = useState({
    nom: "",
    type: "",
    capaciteLits: 0,
    estFerme: false,
    situation: "",
    arrondissementId: 0,
    airesanteId: 0,
    longitude: 0,
    latitude: 0,
    aCloture: false,
    aTitreFoncier: false,
    connecteeElectricite: false,
    typeCourant: "",
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [fosaResponse, arrResponse, airesResponse] = await Promise.all([
        fosaService.getAll({ page, limit: 10, search }),
        arrondissementService.getAll({ limit: 1000 }),
        airesanteService.getAll({ limit: 2000 }),
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

  const resetForm = () => {
    setFormData({
      nom: "",
      type: "",
      capaciteLits: 0,
      estFerme: false,
      situation: "",
      arrondissementId: 0,
      airesanteId: 0,
      longitude: 0,
      latitude: 0,
      aCloture: false,
      aTitreFoncier: false,
      connecteeElectricite: false,
      typeCourant: "",
    })
    setImageFile(null)
    setImagePreview("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingItem) {
        await fosaService.update(editingItem.id, formData, imageFile || undefined)
      } else {
        await fosaService.create(formData, imageFile || undefined)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Fosa) => {
    setEditingItem(item)
    setFormData({
      nom: item.nom,
      type: item.type,
      capaciteLits: item.capaciteLits || 0,
      estFerme: item.estFerme,
      situation: item.situation,
      arrondissementId: item.arrondissementId,
      airesanteId: item.airesanteId,
      longitude: item.longitude || 0,
      latitude: item.latitude || 0,
      aCloture: item.aCloture || false,
      aTitreFoncier: item.aTitreFoncier || false,
      connecteeElectricite: item.connecteeElectricite || false,
      typeCourant: item.typeCourant || "",
    })
    if (item.image) {
      setImagePreview(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${item.image}`)
    }
    setIsModalOpen(true)
  }

  const handleDelete = (item: Fosa) => {
    setConfirmDialog({ isOpen: true, fosa: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.fosa) return

    setSubmitting(true)
    try {
      await fosaService.delete(confirmDialog.fosa.id)
      setConfirmDialog({ isOpen: false, fosa: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
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
    { key: "capaciteLits", label: "Capacité Lits" },
    {
      key: "estFerme",
      label: "Statut",
      render: (f: Fosa) => (
        <span
          className={`px-2 py-1 rounded text-xs ${f.estFerme ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {f.estFerme ? "Fermé" : "Ouvert"}
        </span>
      ),
    },
    { key: "situation", label: "Situation" },
    {
      key: "arrondissement",
      label: "Arrondissement",
      render: (f: Fosa) => f.arrondissement?.nom || "-"
    },
    {
      key: "airesante",
      label: "Aire de Santé",
      render: (f: Fosa) => f.airesante?.nom_as || "-"
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Formations Sanitaires (FOSA)</h1>
        <button
          onClick={() => {
            setEditingItem(null)
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
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-96 overflow-y-auto p-4">
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
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
                      <option value="Poste de Santé">Poste de Santé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacité Lits</label>
                    <input
                      type="number"
                      value={formData.capaciteLits}
                      onChange={(e) => setFormData({ ...formData, capaciteLits: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 11.5021"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 3.8480"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Situation</label>
                  <textarea
                    value={formData.situation}
                    onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arrondissement *</label>
                    <select
                      value={formData.arrondissementId}
                      onChange={(e) => setFormData({ ...formData, arrondissementId: Number(e.target.value) })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aire de Santé *</label>
                    <select
                      value={formData.airesanteId}
                      onChange={(e) => setFormData({ ...formData, airesanteId: Number(e.target.value) })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner...</option>
                      {airesantes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nom_as}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Questions OUI/NON */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Questions sur les infrastructures</h3>

                  <div className="space-y-3">
                    {/* Question Clôture */}
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="aCloture"
                        checked={formData.aCloture}
                        onChange={(e) => setFormData({ ...formData, aCloture: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="aCloture" className="ml-3 text-sm font-medium text-gray-700">
                        La FOSA a-t-elle une clôture ?
                      </label>
                    </div>

                    {/* Question Titre Foncier */}
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="aTitreFoncier"
                        checked={formData.aTitreFoncier}
                        onChange={(e) => setFormData({ ...formData, aTitreFoncier: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="aTitreFoncier" className="ml-3 text-sm font-medium text-gray-700">
                        La FOSA a-t-elle un titre foncier ?
                      </label>
                    </div>

                    {/* Question Électricité */}
                    <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="connecteeElectricite"
                          checked={formData.connecteeElectricite}
                          onChange={(e) => setFormData({ ...formData, connecteeElectricite: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="connecteeElectricite" className="ml-3 text-sm font-medium text-gray-700">
                          La FOSA est-elle connectée au réseau national d'électricité ?
                        </label>
                      </div>

                      {/* Type de courant - affiché seulement si connectée */}
                      {formData.connecteeElectricite && (
                        <div className="ml-7 mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type de courant *
                          </label>
                          <select
                            value={formData.typeCourant}
                            onChange={(e) => setFormData({ ...formData, typeCourant: e.target.value })}
                            required={formData.connecteeElectricite}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="monophase">Monophasé</option>
                            <option value="triphase">Triphasé</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center pt-4 border-t mt-4">
                  <input
                    type="checkbox"
                    id="estFerme"
                    checked={formData.estFerme}
                    onChange={(e) => setFormData({ ...formData, estFerme: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="estFerme" className="ml-2 text-sm text-gray-700">
                    Formation fermée
                  </label>
                </div>
              </div>
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
                editingItem ? "Modifier" : "Créer"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, fosa: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDialog.fosa?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
