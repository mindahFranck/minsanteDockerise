"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search, ImageIcon, Filter, X as XIcon } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { fosaService, type Fosa as FosaServiceType } from "../services/fosaService"
import { arrondissementService } from "../services/arrondissementService"
import { airesanteService } from "../services/airesanteService"
import { regionService } from "../services/regionService"
import { departementService } from "../services/departementService"
import type { Arrondissement, Airesante, Region, Departement } from "../types"

type Fosa = FosaServiceType

export default function FosasPage() {
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
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

  // Filtres
  const [showFilters, setShowFilters] = useState(false)
  const [filterRegion, setFilterRegion] = useState("")
  const [filterDepartement, setFilterDepartement] = useState("")
  const [filterArrondissement, setFilterArrondissement] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterCategorie, setFilterCategorie] = useState("")
  const [filterStatut, setFilterStatut] = useState("all") // all, ouvert, fermé
  const [filterFonctionnel, setFilterFonctionnel] = useState("all") // all, oui, non
  const [filterSecurite, setFilterSecurite] = useState("all") // all, titre_foncier, cloture, both, none

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
    // Nouveaux champs (Page 4 du document)
    orgUnit: "",
    fonction: true,
    statutRec: "",
    catRec: "",
    nomDirect: "",
  })

  useEffect(() => {
    loadData()
  }, [page, search, filterRegion, filterDepartement, filterArrondissement])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load reference data first
      const [regionResponse, deptResponse, arrResponse, airesResponse] = await Promise.all([
        regionService.getAll({ limit: 1000 }),
        departementService.getAll({ limit: 1000 }),
        arrondissementService.getAll({ limit: 1000 }),
        airesanteService.getAll({ limit: 2000 }),
      ])

      setRegions(regionResponse.data)
      setDepartements(deptResponse.data)
      setArrondissements(arrResponse.data)
      setAiresantes(airesResponse.data)

      // Determine which spatial endpoint to call based on active geographic filters
      let fosasData: any[] = []

      if (filterArrondissement) {
        // Get FOSA by arrondissement (spatial)
        const arrondissement = arrResponse.data.find((a: Arrondissement) => a.nom === filterArrondissement)
        if (arrondissement) {
          fosasData = await fosaService.getByArrondissementSpatial(arrondissement.id)
        }
      } else if (filterDepartement) {
        // Get FOSA by departement (spatial)
        const departement = deptResponse.data.find((d: Departement) => d.departement === filterDepartement)
        if (departement) {
          fosasData = await fosaService.getByDepartementSpatial(departement.id)
        }
      } else if (filterRegion) {
        // Get FOSA by region (spatial)
        const region = regionResponse.data.find((r: Region) => r.nom === filterRegion)
        if (region) {
          fosasData = await fosaService.getByRegionSpatial(region.id)
        }
      } else {
        // No geographic filter - use standard pagination endpoint
        const fosaResponse = await fosaService.getAll({ page, limit: 10, search })
        fosasData = fosaResponse.data
        setPagination(fosaResponse.pagination)
      }

      setFosas(fosasData)

      // If using spatial query, update pagination to show all results
      if (filterRegion || filterDepartement || filterArrondissement) {
        setPagination({
          page: 1,
          limit: fosasData.length,
          total: fosasData.length,
          totalPages: 1
        })
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Appliquer les filtres côté client
  const filteredFosas = fosas.filter((fosa) => {
    // Les filtres géographiques (région, département, arrondissement) sont déjà appliqués par l'API spatiale
    // On ne les applique plus côté client

    // Filtre Type
    if (filterType && fosa.type !== filterType) return false

    // Filtre Catégorie
    if (filterCategorie && (fosa as any).catRec !== filterCategorie) return false

    // Filtre Statut (Ouvert/Fermé)
    if (filterStatut !== "all") {
      if (filterStatut === "ouvert" && fosa.estFerme) return false
      if (filterStatut === "fermé" && !fosa.estFerme) return false
    }

    // Filtre Fonctionnel
    if (filterFonctionnel !== "all") {
      const isFonctionnel = (fosa as any).fonction
      if (filterFonctionnel === "oui" && !isFonctionnel) return false
      if (filterFonctionnel === "non" && isFonctionnel) return false
    }

    // Filtre Sécurité
    if (filterSecurite !== "all") {
      const hasTF = fosa.aTitreFoncier
      const hasCloture = fosa.aCloture
      if (filterSecurite === "titre_foncier" && !hasTF) return false
      if (filterSecurite === "cloture" && !hasCloture) return false
      if (filterSecurite === "both" && (!hasTF || !hasCloture)) return false
      if (filterSecurite === "none" && (hasTF || hasCloture)) return false
    }

    return true
  })

  // Fonction pour réinitialiser tous les filtres
  const clearFilters = () => {
    setFilterRegion("")
    setFilterDepartement("")
    setFilterArrondissement("")
    setFilterType("")
    setFilterCategorie("")
    setFilterStatut("all")
    setFilterFonctionnel("all")
    setFilterSecurite("all")
  }

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filterRegion || filterDepartement || filterArrondissement || filterType || filterCategorie || filterStatut !== "all" || filterFonctionnel !== "all" || filterSecurite !== "all"

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
      orgUnit: "",
      fonction: true,
      statutRec: "",
      catRec: "",
      nomDirect: "",
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
      orgUnit: (item as any).orgUnit || "",
      fonction: (item as any).fonction !== undefined ? (item as any).fonction : true,
      statutRec: (item as any).statutRec || "",
      catRec: (item as any).catRec || "",
      nomDirect: (item as any).nomDirect || "",
    })
    if (item.image) {
      setImagePreview(`${(import.meta as any).env?.VITE_API_URL || "http://localhost:5000"}${item.image}`)
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
            src={`${(import.meta as any).env?.VITE_API_URL || "http://localhost:5000"}${f.image}`}
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
      key: "statutRec",
      label: "Statut",
      render: (f: Fosa) => (f as any).statutRec || "-"
    },
    {
      key: "catRec",
      label: "Catégorie",
      render: (f: Fosa) => (f as any).catRec || "-"
    },
    {
      key: "nomDirect",
      label: "Directeur",
      render: (f: Fosa) => (f as any).nomDirect || "-"
    },
    {
      key: "fonction",
      label: "Fonctionnel",
      render: (f: Fosa) => (
        <span className={`px-2 py-1 rounded text-xs ${(f as any).fonction ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
          {(f as any).fonction ? "Oui" : "Non"}
        </span>
      ),
    },
    {
      key: "securite",
      label: "Sécurité",
      render: (f: Fosa) => (
        <div className="flex gap-1">
          {f.aTitreFoncier && <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">TF</span>}
          {f.aCloture && <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Clôture</span>}
          {!f.aTitreFoncier && !f.aCloture && <span className="text-gray-400 text-xs">-</span>}
        </div>
      ),
    },
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

      <div className="space-y-4">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                Actifs
              </span>
            )}
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Filtres</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <XIcon className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              {/* Filtre Région */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                <select
                  value={filterRegion}
                  onChange={(e) => {
                    setFilterRegion(e.target.value)
                    setFilterDepartement("")
                    setFilterArrondissement("")
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les régions</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.nom}>
                      {r.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Département */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                <select
                  value={filterDepartement}
                  onChange={(e) => {
                    setFilterDepartement(e.target.value)
                    setFilterArrondissement("")
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!filterRegion}
                >
                  <option value="">Tous les départements</option>
                  {departements
                    .filter((d) => {
                      if (!filterRegion) return true
                      const region = regions.find((r) => r.nom === filterRegion)
                      return region && d.regionId === region.id
                    })
                    .map((d) => (
                      <option key={d.id} value={d.departement}>
                        {d.departement}
                      </option>
                    ))}
                </select>
              </div>

              {/* Filtre Arrondissement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arrondissement</label>
                <select
                  value={filterArrondissement}
                  onChange={(e) => setFilterArrondissement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!filterDepartement}
                >
                  <option value="">Tous les arrondissements</option>
                  {arrondissements
                    .filter((a) => {
                      if (!filterDepartement) return true
                      const departement = departements.find((d) => d.departement === filterDepartement)
                      return departement && a.departementId === departement.id
                    })
                    .map((a) => (
                      <option key={a.id} value={a.nom}>
                        {a.nom}
                      </option>
                    ))}
                </select>
              </div>

              {/* Filtre Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="Public">Public</option>
                  <option value="Parapublic">Parapublic</option>
                  <option value="Privé laïc">Privé laïc</option>
                  <option value="Privé confessionnel">Privé confessionnel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">

              {/* Filtre Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={filterCategorie}
                  onChange={(e) => setFilterCategorie(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes</option>
                  <option value="CHU">CHU</option>
                  <option value="CHR">CHR</option>
                  <option value="CHD">CHD</option>
                  <option value="CMA">CMA</option>
                  <option value="CSI">CSI</option>
                </select>
              </div>

              {/* Filtre Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="ouvert">Ouvert</option>
                  <option value="fermé">Fermé</option>
                </select>
              </div>

              {/* Filtre Fonctionnel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fonctionnel</label>
                <select
                  value={filterFonctionnel}
                  onChange={(e) => setFilterFonctionnel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </div>

              {/* Filtre Sécurité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sécurité</label>
                <select
                  value={filterSecurite}
                  onChange={(e) => setFilterSecurite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="titre_foncier">Titre Foncier</option>
                  <option value="cloture">Clôture</option>
                  <option value="both">TF + Clôture</option>
                  <option value="none">Aucun</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Chargement...</div>
      ) : (
        <DataTable
          data={filteredFosas}
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
        size="xlarge"
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Public">Public</option>
                    <option value="Parapublic">Parapublic</option>
                    <option value="Privé laïc">Privé laïc</option>
                    <option value="Privé confessionnel">Privé confessionnel</option>
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
              </div>
              <div className="grid grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Situation</label>
                <textarea
                  value={formData.situation}
                  onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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

              {/* Nouveaux champs (Page 4) */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Org Unit (Nom officiel)
                  </label>
                  <input
                    type="text"
                    value={formData.orgUnit}
                    onChange={(e) => setFormData({ ...formData, orgUnit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.statutRec}
                    onChange={(e) => setFormData({ ...formData, statutRec: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Formation Sanitaire">Formation Sanitaire</option>
                    <option value="Centre de Formation">Centre de Formation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={formData.catRec}
                    onChange={(e) => setFormData({ ...formData, catRec: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: CHU, CHR, CHD, CMA, CSI"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Directeur
                  </label>
                  <input
                    type="text"
                    value={formData.nomDirect}
                    onChange={(e) => setFormData({ ...formData, nomDirect: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="fonction"
                    checked={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="fonction" className="ml-2 text-sm text-gray-700">
                    Fonctionnel
                  </label>
                </div>
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
