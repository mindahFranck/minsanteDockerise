"use client"

import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet"
import { Search, Filter, X as XIcon } from "lucide-react"
import { fosaService } from "../services/fosaService"
import { regionService } from "../services/regionService"
import { departementService } from "../services/departementService"
import { arrondissementService } from "../services/arrondissementService"
import type { Fosa, Region, Departement, Arrondissement } from "../types"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Normalisation des données FOSA (même logique que FosasPage)
const normalizeFosaData = (fosaData: any): any => {
  return {
    ...fosaData,
    statutRec: fosaData.statutRec || fosaData.type || '',
    catRec: fosaData.catRec || fosaData.categorieRec || '',
    fonction: Boolean(fosaData.fonction !== undefined ? fosaData.fonction : true),
    latitude: fosaData.latitude || fosaData.lat,
    longitude: fosaData.longitude || fosaData.lng || fosaData.lon,
  }
}

// Icônes personnalisées par catégorie de FOSA
const createCustomIcon = (category: string, isOpen: boolean) => {
  const colors: Record<string, string> = {
    'HD': '#EF4444',      // Rouge pour Hôpital de District
    'CSI': '#3B82F6',     // Bleu pour Centre de Santé Intégré
    'CMA': '#8B5CF6',     // Violet pour Centre Médical d'Arrondissement
    'default': '#6B7280'  // Gris par défaut
  }

  const color = colors[category] || colors.default
  const opacity = isOpen ? 1 : 0.5

  return new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      opacity: ${opacity};
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

export default function MapPage() {
  const [fosas, setFosas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(true)

  // États des filtres (synchronisés avec FosasPage)
  const [search, setSearch] = useState("")
  const [filterRegion, setFilterRegion] = useState("")
  const [filterDepartement, setFilterDepartement] = useState("")
  const [filterArrondissement, setFilterArrondissement] = useState("")
  const [filterStatutJuridique, setFilterStatutJuridique] = useState("") // Privé laïc, Public, etc.
  const [filterCategorie, setFilterCategorie] = useState("") // HD, CSI, CMA, Centre de santé, etc.
  const [filterStatut, setFilterStatut] = useState("all") // all, ouvert, fermé
  const [filterFonctionnel, setFilterFonctionnel] = useState("all") // all, oui, non

  // Données géographiques
  const [regions, setRegions] = useState<Region[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [arrondissements, setArrondissements] = useState<Arrondissement[]>([])

  // Couches GeoJSON
  const [selectedRegionGeo, setSelectedRegionGeo] = useState<any>(null)
  const [selectedDepartementGeo, setSelectedDepartementGeo] = useState<any>(null)
  const [selectedArrondissementGeo, setSelectedArrondissementGeo] = useState<any>(null)

  // Charger les données géographiques
  useEffect(() => {
    loadGeographicData()
  }, [])

  const loadGeographicData = async () => {
    try {
      const [regionsRes, deptsRes, arrsRes] = await Promise.all([
        regionService.getAll(),
        departementService.getAll(),
        arrondissementService.getAll()
      ])
      setRegions(regionsRes.data)
      setDepartements(deptsRes.data)
      setArrondissements(arrsRes.data)
    } catch (error) {
      console.error("Error loading geographic data:", error)
    }
  }

  // Charger les FOSA avec filtres
  const loadFosas = useCallback(async () => {
    setLoading(true)
    try {
      let fosasData: any[] = []

      // Appliquer les filtres géographiques côté API (comme FosasPage)
      if (filterArrondissement) {
        const arrondissement = arrondissements.find((a) => a.nom === filterArrondissement)
        if (arrondissement?.id) {
          const response = await fosaService.getByArrondissement(arrondissement.id, { limit: 10000 })
          fosasData = response.data
          // Charger le GeoJSON de l'arrondissement si disponible
          // setSelectedArrondissementGeo(arrondissement.geom)
        }
      } else if (filterDepartement) {
        const departement = departements.find((d) => d.departement === filterDepartement)
        if (departement?.id) {
          const response = await fosaService.getByDepartement(departement.id, { limit: 10000 })
          fosasData = response.data
          // setSelectedDepartementGeo(departement.geom)
        }
      } else if (filterRegion) {
        const region = regions.find((r) => r.nom === filterRegion)
        if (region?.id) {
          const response = await fosaService.getByRegion(region.id, { limit: 10000 })
          fosasData = response.data
          // setSelectedRegionGeo(region.geom)
        }
      } else {
        const response = await fosaService.getAll({ limit: 10000 })
        fosasData = response.data
      }

      // Normaliser les données
      const normalizedFosas = fosasData.map(normalizeFosaData)

      // Filtrer seulement celles qui ont des coordonnées
      setFosas(normalizedFosas.filter((f) => f.latitude && f.longitude))
    } catch (error) {
      console.error("Error loading fosas:", error)
    } finally {
      setLoading(false)
    }
  }, [filterRegion, filterDepartement, filterArrondissement, regions, departements, arrondissements])

  useEffect(() => {
    if (regions.length > 0) {
      loadFosas()
    }
  }, [loadFosas, regions])

  // Filtrer les FOSA côté client (comme FosasPage)
  const filteredFosas = fosas.filter((fosa) => {
    // Filtre de recherche
    if (search) {
      const searchLower = search.toLowerCase()
      const nomMatch = fosa.nom?.toLowerCase().includes(searchLower)
      const arrMatch = fosa.arrondissement?.nom?.toLowerCase().includes(searchLower)
      if (!nomMatch && !arrMatch) return false
    }

    // Filtre Statut Juridique
    if (filterStatutJuridique) {
      const fosaStatut = fosa.statutRec?.toLowerCase().trim() || ''
      const selectedStatut = filterStatutJuridique.toLowerCase().trim()
      if (fosaStatut !== selectedStatut) return false
    }

    // Filtre Catégorie
    if (filterCategorie) {
      const fosaCategorie = fosa.catRec?.toLowerCase().trim() || ''
      const selectedCategorie = filterCategorie.toLowerCase().trim()
      if (fosaCategorie !== selectedCategorie) return false
    }

    // Filtre Statut (Ouvert/Fermé)
    if (filterStatut !== "all") {
      if (filterStatut === "ouvert" && fosa.estFerme) return false
      if (filterStatut === "fermé" && !fosa.estFerme) return false
    }

    // Filtre Fonctionnel
    if (filterFonctionnel !== "all") {
      if (filterFonctionnel === "oui" && !fosa.fonction) return false
      if (filterFonctionnel === "non" && fosa.fonction) return false
    }

    return true
  })

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSearch("")
    setFilterRegion("")
    setFilterDepartement("")
    setFilterArrondissement("")
    setFilterStatutJuridique("")
    setFilterCategorie("")
    setFilterStatut("all")
    setFilterFonctionnel("all")
  }

  const hasActiveFilters =
    filterRegion ||
    filterDepartement ||
    filterArrondissement ||
    filterStatutJuridique ||
    filterCategorie ||
    filterStatut !== "all" ||
    filterFonctionnel !== "all" ||
    search

  // Catégories et statuts juridiques uniques pour les filtres
  const uniqueCategories = Array.from(new Set(fosas.map(f => f.catRec).filter(Boolean)))
  const uniqueStatutsJuridiques = Array.from(new Set(fosas.map(f => f.statutRec).filter(Boolean)))

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement de la carte...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Carte des Formations Sanitaires</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? "Masquer" : "Afficher"} les filtres
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Filtres</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <XIcon className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom de la FOSA..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Filtre Région */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Région
              </label>
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
                {regions.map((region, index) => (
                  <option key={index} value={region.nom}>
                    {region.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Département */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département
              </label>
              <select
                value={filterDepartement}
                onChange={(e) => {
                  setFilterDepartement(e.target.value)
                  setFilterArrondissement("")
                }}
                disabled={!filterRegion}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Tous les départements</option>
                {departements
                  .filter((dept) => {
                    if (!filterRegion) return true
                    const region = regions.find((r) => r.nom === filterRegion)
                    return region && dept.regionId === region.id
                  })
                  .map((dept, index) => (
                    <option key={index} value={dept.departement}>
                      {dept.departement}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtre Arrondissement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrondissement
              </label>
              <select
                value={filterArrondissement}
                onChange={(e) => setFilterArrondissement(e.target.value)}
                disabled={!filterDepartement}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Tous les arrondissements</option>
                {arrondissements
                  .filter((arr) => {
                    if (!filterDepartement) return true
                    const dept = departements.find((d) => d.departement === filterDepartement)
                    return dept && arr.departementId === dept.id
                  })
                  .map((arr, index) => (
                    <option key={index} value={arr.nom}>
                      {arr.nom}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtre Catégorie (HD, CSI, CMA, etc.) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={filterCategorie}
                onChange={(e) => setFilterCategorie(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les catégories</option>
                {uniqueCategories.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Statut Juridique (Public, Privé laïc, etc.) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut juridique
              </label>
              <select
                value={filterStatutJuridique}
                onChange={(e) => setFilterStatutJuridique(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                {uniqueStatutsJuridiques.map((statut, index) => (
                  <option key={index} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fonctionnel
              </label>
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
          </div>
        </div>
      )}

      {/* Carte */}
      <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "calc(100vh - 350px)" }}>
        <MapContainer center={[3.848, 11.5021]} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marqueurs FOSA */}
          {filteredFosas.map((fosa, index) => (
            <Marker
              key={index}
              position={[fosa.latitude, fosa.longitude]}
              icon={createCustomIcon(fosa.catRec || 'default', !fosa.estFerme)}
            >
              <Popup maxWidth={400} className="custom-popup">
                <div className="p-3">
                  <h3 className="font-bold text-lg mb-2">{fosa.nom}</h3>

                  {/* Informations de base */}
                  <div className="space-y-1 mb-3">
                    {fosa.catRec && (
                      <p className="text-sm">
                        <span className="font-semibold">Catégorie:</span> {fosa.catRec}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-semibold">Statut juridique:</span> {fosa.statutRec || fosa.type}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Capacité:</span> {fosa.capaciteLits || 0} lits
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Statut:</span>{" "}
                      <span className={fosa.estFerme ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                        {fosa.estFerme ? "Fermé" : "Ouvert"}
                      </span>
                    </p>
                    {fosa.fonction !== undefined && (
                      <p className="text-sm">
                        <span className="font-semibold">Fonctionnel:</span>{" "}
                        <span className={fosa.fonction ? "text-green-600" : "text-red-600"}>
                          {fosa.fonction ? "Oui" : "Non"}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Localisation */}
                  {fosa.arrondissement && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Localisation</p>
                      <p className="text-sm text-gray-600">{fosa.arrondissement.nom}</p>
                    </div>
                  )}

                  {/* Ressources */}
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Ressources</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs">
                        <span className="text-gray-600">Bâtiments:</span>{" "}
                        <span className="font-semibold">{fosa.batiments?.length || 0}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Personnel:</span>{" "}
                        <span className="font-semibold">{fosa.personnels?.length || 0}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Véhicules:</span>{" "}
                        <span className="font-semibold">{fosa.materielroulants?.length || 0}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">Ambulances:</span>{" "}
                        <span className="font-semibold">
                          {fosa.materielroulants?.filter((v: any) =>
                            v.type?.toLowerCase().includes("ambulance") ||
                            v.typeVehicule?.toLowerCase().includes("ambulance")
                          ).length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure */}
                  {(fosa.aCloture !== undefined || fosa.aTitreFoncier !== undefined || fosa.connecteeElectricite !== undefined) && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Infrastructure</p>
                      <div className="grid grid-cols-2 gap-2">
                        {fosa.aCloture !== undefined && (
                          <div className="text-xs">
                            <span className="text-gray-600">Clôture:</span>{" "}
                            <span className={fosa.aCloture ? "text-green-600" : "text-red-600"}>
                              {fosa.aCloture ? "Oui" : "Non"}
                            </span>
                          </div>
                        )}
                        {fosa.aTitreFoncier !== undefined && (
                          <div className="text-xs">
                            <span className="text-gray-600">Titre foncier:</span>{" "}
                            <span className={fosa.aTitreFoncier ? "text-green-600" : "text-red-600"}>
                              {fosa.aTitreFoncier ? "Oui" : "Non"}
                            </span>
                          </div>
                        )}
                        {fosa.connecteeElectricite !== undefined && (
                          <div className="text-xs">
                            <span className="text-gray-600">Électricité:</span>{" "}
                            <span className={fosa.connecteeElectricite ? "text-green-600" : "text-red-600"}>
                              {fosa.connecteeElectricite ? "Oui" : "Non"}
                            </span>
                          </div>
                        )}
                        {fosa.typeCourant && (
                          <div className="text-xs">
                            <span className="text-gray-600">Type courant:</span>{" "}
                            <span className="font-semibold">{fosa.typeCourant}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {fosa.image && (
                    <img
                      src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${fosa.image}`}
                      alt={fosa.nom}
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Statistiques */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total FOSA affichées</p>
            <p className="text-2xl font-bold">{filteredFosas.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ouvertes</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredFosas.filter((f) => !f.estFerme).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fermées</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredFosas.filter((f) => f.estFerme).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Capacité Totale</p>
            <p className="text-2xl font-bold">
              {filteredFosas.reduce((sum, f) => sum + (f.capaciteLits || 0), 0)} lits
            </p>
          </div>
        </div>

        {/* Légende des couleurs par catégorie */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Légende des catégories</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">HD - Hôpital de District</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">CSI - Centre de Santé Intégré</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">CMA - Centre Médical d'Arrondissement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span className="text-sm text-gray-600">Autres</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Les marqueurs avec opacité réduite indiquent des FOSA fermées
          </p>
        </div>
      </div>
    </div>
  )
}
