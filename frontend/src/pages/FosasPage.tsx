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
  const [activeTab, setActiveTab] = useState<"basic" | "frequentation" | "rh" | "infrastructures" | "budgets" | "equipements">("basic")
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
    // Coordonnées
    longitude: 0,
    latitude: 0,
    // Fréquentation
    nbreVisiteursJour: 0,
    nbrePatientsAmbulants: 0,
    nbrePatientsHospitalises: 0,
    // RH
    nbreMedecinsGeneralistes: 0,
    nbreMedecinsSpecialistes: 0,
    nbreInfirmiersSup: 0,
    nbreInfirmiersDe: 0,
    nbrePersonnelAppui: 0,
    // Infrastructures
    nbreTotalBatiments: 0,
    designationBatiments: "",
    surfaceTotaleBatie: 0,
    servicesAbrités: "",
    nbreBatimentsFonctionnels: 0,
    nbreBatimentsAbandonnes: 0,
    etatGeneralLieux: "Bon",
    nbreLitsOperationnels: 0,
    nbreTotalLitsDisponibles: 0,
    nbreLitsAAjouter: 0,
    nbreBatimentsMaintenanceLourde: 0,
    nbreBatimentsMaintenanceLegere: 0,
    connectionElectricite: false,
    connectionEauPotable: false,
    existenceForage: false,
    existenceChateauEau: false,
    existenceEnergieSolaire: false,
    existenceIncinerateur: false,
    // Budgets
    budgetTravauxNeufsAnneeMoins2: 0,
    budgetTravauxNeufsAnneeMoins1: 0,
    budgetTravauxNeufsAnneeCourante: 0,
    budgetTravauxNeufsAnneePlus1: 0,
    budgetMaintenanceAnneeMoins2: 0,
    budgetMaintenanceAnneeMoins1: 0,
    budgetMaintenanceAnneeCourante: 0,
    budgetMaintenanceAnneePlus1: 0,
    // Équipements
    etatGeneralEquipements: "Bon",
    budgetEquipementsAnneeCourante: 0,
    budgetEquipementsAnneePlus1: 0,
    budgetEquipementsMineursAnneeCourante: 0,
    budgetEquipementsMineursAnneePlus1: 0,
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
      nbreVisiteursJour: 0,
      nbrePatientsAmbulants: 0,
      nbrePatientsHospitalises: 0,
      nbreMedecinsGeneralistes: 0,
      nbreMedecinsSpecialistes: 0,
      nbreInfirmiersSup: 0,
      nbreInfirmiersDe: 0,
      nbrePersonnelAppui: 0,
      nbreTotalBatiments: 0,
      designationBatiments: "",
      surfaceTotaleBatie: 0,
      servicesAbrités: "",
      nbreBatimentsFonctionnels: 0,
      nbreBatimentsAbandonnes: 0,
      etatGeneralLieux: "Bon",
      nbreLitsOperationnels: 0,
      nbreTotalLitsDisponibles: 0,
      nbreLitsAAjouter: 0,
      nbreBatimentsMaintenanceLourde: 0,
      nbreBatimentsMaintenanceLegere: 0,
      connectionElectricite: false,
      connectionEauPotable: false,
      existenceForage: false,
      existenceChateauEau: false,
      existenceEnergieSolaire: false,
      existenceIncinerateur: false,
      budgetTravauxNeufsAnneeMoins2: 0,
      budgetTravauxNeufsAnneeMoins1: 0,
      budgetTravauxNeufsAnneeCourante: 0,
      budgetTravauxNeufsAnneePlus1: 0,
      budgetMaintenanceAnneeMoins2: 0,
      budgetMaintenanceAnneeMoins1: 0,
      budgetMaintenanceAnneeCourante: 0,
      budgetMaintenanceAnneePlus1: 0,
      etatGeneralEquipements: "Bon",
      budgetEquipementsAnneeCourante: 0,
      budgetEquipementsAnneePlus1: 0,
      budgetEquipementsMineursAnneeCourante: 0,
      budgetEquipementsMineursAnneePlus1: 0,
    })
    setImageFile(null)
    setImagePreview("")
    setActiveTab("basic")
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
      nbreVisiteursJour: item.nbreVisiteursJour || 0,
      nbrePatientsAmbulants: item.nbrePatientsAmbulants || 0,
      nbrePatientsHospitalises: item.nbrePatientsHospitalises || 0,
      nbreMedecinsGeneralistes: item.nbreMedecinsGeneralistes || 0,
      nbreMedecinsSpecialistes: item.nbreMedecinsSpecialistes || 0,
      nbreInfirmiersSup: item.nbreInfirmiersSup || 0,
      nbreInfirmiersDe: item.nbreInfirmiersDe || 0,
      nbrePersonnelAppui: item.nbrePersonnelAppui || 0,
      nbreTotalBatiments: item.nbreTotalBatiments || 0,
      designationBatiments: item.designationBatiments || "",
      surfaceTotaleBatie: item.surfaceTotaleBatie || 0,
      servicesAbrités: item.servicesAbrités || "",
      nbreBatimentsFonctionnels: item.nbreBatimentsFonctionnels || 0,
      nbreBatimentsAbandonnes: item.nbreBatimentsAbandonnes || 0,
      etatGeneralLieux: item.etatGeneralLieux || "Bon",
      nbreLitsOperationnels: item.nbreLitsOperationnels || 0,
      nbreTotalLitsDisponibles: item.nbreTotalLitsDisponibles || 0,
      nbreLitsAAjouter: item.nbreLitsAAjouter || 0,
      nbreBatimentsMaintenanceLourde: item.nbreBatimentsMaintenanceLourde || 0,
      nbreBatimentsMaintenanceLegere: item.nbreBatimentsMaintenanceLegere || 0,
      connectionElectricite: item.connectionElectricite || false,
      connectionEauPotable: item.connectionEauPotable || false,
      existenceForage: item.existenceForage || false,
      existenceChateauEau: item.existenceChateauEau || false,
      existenceEnergieSolaire: item.existenceEnergieSolaire || false,
      existenceIncinerateur: item.existenceIncinerateur || false,
      budgetTravauxNeufsAnneeMoins2: item.budgetTravauxNeufsAnneeMoins2 || 0,
      budgetTravauxNeufsAnneeMoins1: item.budgetTravauxNeufsAnneeMoins1 || 0,
      budgetTravauxNeufsAnneeCourante: item.budgetTravauxNeufsAnneeCourante || 0,
      budgetTravauxNeufsAnneePlus1: item.budgetTravauxNeufsAnneePlus1 || 0,
      budgetMaintenanceAnneeMoins2: item.budgetMaintenanceAnneeMoins2 || 0,
      budgetMaintenanceAnneeMoins1: item.budgetMaintenanceAnneeMoins1 || 0,
      budgetMaintenanceAnneeCourante: item.budgetMaintenanceAnneeCourante || 0,
      budgetMaintenanceAnneePlus1: item.budgetMaintenanceAnneePlus1 || 0,
      etatGeneralEquipements: item.etatGeneralEquipements || "Bon",
      budgetEquipementsAnneeCourante: item.budgetEquipementsAnneeCourante || 0,
      budgetEquipementsAnneePlus1: item.budgetEquipementsAnneePlus1 || 0,
      budgetEquipementsMineursAnneeCourante: item.budgetEquipementsMineursAnneeCourante || 0,
      budgetEquipementsMineursAnneePlus1: item.budgetEquipementsMineursAnneePlus1 || 0,
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
          {/* Onglets */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: "basic", label: "Informations de base" },
                { key: "frequentation", label: "Fréquentation" },
                { key: "rh", label: "Ressources Humaines" },
                { key: "infrastructures", label: "Infrastructures" },
                { key: "budgets", label: "Budgets" },
                { key: "equipements", label: "Équipements" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="max-h-96 overflow-y-auto p-4">
            {activeTab === "basic" && (
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
                <div className="flex items-center">
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
            )}

            {activeTab === "frequentation" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Fréquentation de la FOSA</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de visiteurs par jour</label>
                  <input
                    type="number"
                    value={formData.nbreVisiteursJour}
                    onChange={(e) => setFormData({ ...formData, nbreVisiteursJour: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de patients ambulants</label>
                  <input
                    type="number"
                    value={formData.nbrePatientsAmbulants}
                    onChange={(e) => setFormData({ ...formData, nbrePatientsAmbulants: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de patients hospitalisés</label>
                  <input
                    type="number"
                    value={formData.nbrePatientsHospitalises}
                    onChange={(e) => setFormData({ ...formData, nbrePatientsHospitalises: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "rh" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ressources Humaines</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de médecins généralistes</label>
                  <input
                    type="number"
                    value={formData.nbreMedecinsGeneralistes}
                    onChange={(e) => setFormData({ ...formData, nbreMedecinsGeneralistes: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de médecins spécialistes</label>
                  <input
                    type="number"
                    value={formData.nbreMedecinsSpecialistes}
                    onChange={(e) => setFormData({ ...formData, nbreMedecinsSpecialistes: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'infirmiers sup (y/c sages-femmes)</label>
                  <input
                    type="number"
                    value={formData.nbreInfirmiersSup}
                    onChange={(e) => setFormData({ ...formData, nbreInfirmiersSup: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'infirmiers DE et autres</label>
                  <input
                    type="number"
                    value={formData.nbreInfirmiersDe}
                    onChange={(e) => setFormData({ ...formData, nbreInfirmiersDe: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personnel d'appui</label>
                  <input
                    type="number"
                    value={formData.nbrePersonnelAppui}
                    onChange={(e) => setFormData({ ...formData, nbrePersonnelAppui: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "infrastructures" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Infrastructures</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre total de bâtiments</label>
                    <input
                      type="number"
                      value={formData.nbreTotalBatiments}
                      onChange={(e) => setFormData({ ...formData, nbreTotalBatiments: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Surface totale bâtie (m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.surfaceTotaleBatie}
                      onChange={(e) => setFormData({ ...formData, surfaceTotaleBatie: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Désignation des bâtiments</label>
                  <textarea
                    value={formData.designationBatiments}
                    onChange={(e) => setFormData({ ...formData, designationBatiments: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Services abrités par le bâtiment</label>
                  <textarea
                    value={formData.servicesAbrités}
                    onChange={(e) => setFormData({ ...formData, servicesAbrités: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bâtiments fonctionnels</label>
                    <input
                      type="number"
                      value={formData.nbreBatimentsFonctionnels}
                      onChange={(e) => setFormData({ ...formData, nbreBatimentsFonctionnels: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bâtiments abandonnés</label>
                    <input
                      type="number"
                      value={formData.nbreBatimentsAbandonnes}
                      onChange={(e) => setFormData({ ...formData, nbreBatimentsAbandonnes: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">État général des lieux</label>
                  <select
                    value={formData.etatGeneralLieux}
                    onChange={(e) => setFormData({ ...formData, etatGeneralLieux: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bon">Bon</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Mauvais">Mauvais</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lits opérationnels</label>
                    <input
                      type="number"
                      value={formData.nbreLitsOperationnels}
                      onChange={(e) => setFormData({ ...formData, nbreLitsOperationnels: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total lits disponibles</label>
                    <input
                      type="number"
                      value={formData.nbreTotalLitsDisponibles}
                      onChange={(e) => setFormData({ ...formData, nbreTotalLitsDisponibles: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lits à ajouter</label>
                    <input
                      type="number"
                      value={formData.nbreLitsAAjouter}
                      onChange={(e) => setFormData({ ...formData, nbreLitsAAjouter: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bâtiments - maintenance lourde</label>
                    <input
                      type="number"
                      value={formData.nbreBatimentsMaintenanceLourde}
                      onChange={(e) => setFormData({ ...formData, nbreBatimentsMaintenanceLourde: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bâtiments - maintenance légère</label>
                    <input
                      type="number"
                      value={formData.nbreBatimentsMaintenanceLegere}
                      onChange={(e) => setFormData({ ...formData, nbreBatimentsMaintenanceLegere: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <h4 className="font-semibold mt-4">Autres infrastructures</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="connectionElectricite"
                      checked={formData.connectionElectricite}
                      onChange={(e) => setFormData({ ...formData, connectionElectricite: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="connectionElectricite" className="ml-2 text-sm text-gray-700">
                      Connection électricité
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="connectionEauPotable"
                      checked={formData.connectionEauPotable}
                      onChange={(e) => setFormData({ ...formData, connectionEauPotable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="connectionEauPotable" className="ml-2 text-sm text-gray-700">
                      Connection eau potable
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="existenceForage"
                      checked={formData.existenceForage}
                      onChange={(e) => setFormData({ ...formData, existenceForage: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="existenceForage" className="ml-2 text-sm text-gray-700">
                      Forage / Puits aménagé
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="existenceChateauEau"
                      checked={formData.existenceChateauEau}
                      onChange={(e) => setFormData({ ...formData, existenceChateauEau: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="existenceChateauEau" className="ml-2 text-sm text-gray-700">
                      Château d'eau / Bâche à eau
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="existenceEnergieSolaire"
                      checked={formData.existenceEnergieSolaire}
                      onChange={(e) => setFormData({ ...formData, existenceEnergieSolaire: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="existenceEnergieSolaire" className="ml-2 text-sm text-gray-700">
                      Énergie solaire
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="existenceIncinerateur"
                      checked={formData.existenceIncinerateur}
                      onChange={(e) => setFormData({ ...formData, existenceIncinerateur: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="existenceIncinerateur" className="ml-2 text-sm text-gray-700">
                      Incinérateur
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "budgets" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Budgets (en milliers de FCFA)</h3>
                <h4 className="font-semibold mt-4">Budget des travaux neufs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année -2</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetTravauxNeufsAnneeMoins2}
                      onChange={(e) => setFormData({ ...formData, budgetTravauxNeufsAnneeMoins2: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année -1</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetTravauxNeufsAnneeMoins1}
                      onChange={(e) => setFormData({ ...formData, budgetTravauxNeufsAnneeMoins1: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année courante</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetTravauxNeufsAnneeCourante}
                      onChange={(e) => setFormData({ ...formData, budgetTravauxNeufsAnneeCourante: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année +1 (Prévision)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetTravauxNeufsAnneePlus1}
                      onChange={(e) => setFormData({ ...formData, budgetTravauxNeufsAnneePlus1: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <h4 className="font-semibold mt-4">Budget de maintenance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année -2</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetMaintenanceAnneeMoins2}
                      onChange={(e) => setFormData({ ...formData, budgetMaintenanceAnneeMoins2: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année -1</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetMaintenanceAnneeMoins1}
                      onChange={(e) => setFormData({ ...formData, budgetMaintenanceAnneeMoins1: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année courante</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetMaintenanceAnneeCourante}
                      onChange={(e) => setFormData({ ...formData, budgetMaintenanceAnneeCourante: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année +1 (Prévision)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetMaintenanceAnneePlus1}
                      onChange={(e) => setFormData({ ...formData, budgetMaintenanceAnneePlus1: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "equipements" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Équipements</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">État général des équipements</label>
                  <select
                    value={formData.etatGeneralEquipements}
                    onChange={(e) => setFormData({ ...formData, etatGeneralEquipements: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bon">Bon</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Vétuste">Vétuste</option>
                    <option value="À réformer">À réformer</option>
                  </select>
                </div>
                <h4 className="font-semibold mt-4">Budget équipements majeurs (en milliers de FCFA)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année courante</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetEquipementsAnneeCourante}
                      onChange={(e) => setFormData({ ...formData, budgetEquipementsAnneeCourante: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année +1 (Prévision)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetEquipementsAnneePlus1}
                      onChange={(e) => setFormData({ ...formData, budgetEquipementsAnneePlus1: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <h4 className="font-semibold mt-4">Budget équipements mineurs (en milliers de FCFA)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année courante</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetEquipementsMineursAnneeCourante}
                      onChange={(e) => setFormData({ ...formData, budgetEquipementsMineursAnneeCourante: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année +1 (Prévision)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budgetEquipementsMineursAnneePlus1}
                      onChange={(e) => setFormData({ ...formData, budgetEquipementsMineursAnneePlus1: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
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
