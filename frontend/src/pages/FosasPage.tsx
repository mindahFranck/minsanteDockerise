"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { Plus, ImageIcon, SlidersHorizontal, Loader2, Check, X as XIcon } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { fosaService, type Fosa as FosaServiceType } from "../services/fosaService"
import { arrondissementService } from "../services/arrondissementService"
import { airesanteService } from "../services/airesanteService"
import { regionService } from "../services/regionService"
import { departementService } from "../services/departementService"
import type { Arrondissement, Airesante, Region, Departement } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import { exportFosasToPDF, exportFosasToExcel } from "../utils/exportUtils"
import {
  PageHeader, StatCard, Badge, SearchInput, FilterBar,
  cn, formatNumber, formatPercent, percent,
} from "../components/ui"

// Interface FOSA étendue
interface Fosa extends FosaServiceType {
  statutRec: string
  catRec?: string
  categorieRec?: string
  fonction?: boolean
  nomDirect?: string
  orgUnit?: string
  // Champs de maintenance
  lastInspection?: string
  nextInspection?: string
  maintenancePriority?: 'low' | 'medium' | 'high' | 'urgent'
  maintenanceIssues?: string
  // Champs de contacts
  telephone?: string
  email?: string
  responsableNom?: string
  responsableTelephone?: string
}

// Fonction utilitaire pour normaliser les données FOSA
const normalizeFosaData = (fosaData: any): Fosa => {
  return {
    id: fosaData.id,
    nom: fosaData.nom || '',
    type: fosaData.type, // Fusionner type et statutRec
    capaciteLits: fosaData.capaciteLits || 0,
    estFerme: Boolean(fosaData.estFerme),
    situation: fosaData.situation || '',
    image: fosaData.image || null,
    airesanteId: fosaData.airesanteId || 0,
    arrondissementId: fosaData.arrondissementId || 0,

    // Normaliser les champs pour le filtrage
    statutRec: fosaData.statutRec,
    catRec: fosaData.catRec || fosaData.categorieRec || '',
    categorieRec: fosaData.categorieRec || fosaData.catRec || '',
    fonction: Boolean(fosaData.fonction !== undefined ? fosaData.fonction : true),
    nomDirect: fosaData.nomDirect || '',
    orgUnit: fosaData.orgUnit || '',

    // Coordonnées
    longitude: fosaData.longitude || 0,
    latitude: fosaData.latitude || 0,

    // Sécurité
    aCloture: Boolean(fosaData.aCloture),
    aTitreFoncier: Boolean(fosaData.aTitreFoncier),
    connecteeElectricite: Boolean(fosaData.connecteeElectricite),
    typeCourant: fosaData.typeCourant || '',

    // Relations
    arrondissement: fosaData.arrondissement || null,
    airesante: fosaData.airesante || null,

    createdAt: fosaData.createdAt,
    updatedAt: fosaData.updatedAt,
  }
}

/* --- Briques locales de présentation ---------------------------------------- */

/** Section de formulaire : titre en capitales, description, grille 2 colonnes. */
function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4">
        <h3 className="kicker !text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

/** Case à cocher présentée en tuile (questions OUI/NON). */
function CheckField({
  id,
  checked,
  onChange,
  label,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 transition-colors",
        checked ? "border-brand-200 bg-brand-50/60" : "border-gray-200 bg-white",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="relative inline-flex size-4 shrink-0">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer size-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-brand-500 checked:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          />
          <Check className="pointer-events-none absolute inset-0 hidden size-4 p-0.5 text-white peer-checked:block" strokeWidth={3} />
        </span>
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-gray-700">
          {label}
        </label>
      </div>
      {children}
    </div>
  )
}

export default function FosasPage() {
  // Permissions
  const permissions = usePermissions()

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
  const [filterStatutJuridique, setFilterStatutJuridique] = useState("") // Privé laïc, Public, etc.
  const [filterCategorie, setFilterCategorie] = useState("") // HD, CSI, CMA, Centre de santé, etc.
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
    // Champs de maintenance
    lastInspection: "",
    nextInspection: "",
    maintenancePriority: "low" as "low" | "medium" | "high" | "urgent",
    maintenanceIssues: "",
    // Champs de contacts
    telephone: "",
    email: "",
    responsableNom: "",
    responsableTelephone: "",
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Charger les données de référence
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

      // Charger les FOSA avec filtrage backend si filtres géographiques actifs
      let fosasData: any[] = []
      if (filterArrondissement) {
        const arrondissement = arrResponse.data.find((a: Arrondissement) => a.nom === filterArrondissement)
        if (arrondissement) {
          const raw = await fosaService.getByArrondissementSpatial(arrondissement.id)
          fosasData = raw.map(normalizeFosaData)
        }
      } else if (filterDepartement) {
        const departement = deptResponse.data.find((d: Departement) => d.departement === filterDepartement)
        if (departement) {
          const raw = await fosaService.getByDepartementSpatial(departement.id)
          fosasData = raw.map(normalizeFosaData)
        }
      } else if (filterRegion) {
        const region = regionResponse.data.find((r: Region) => r.nom === filterRegion)
        if (region) {
          const raw = await fosaService.getByRegionSpatial(region.id)
          fosasData = raw.map(normalizeFosaData)
        }
      } else {
        // Pas de filtre géo : charger toutes les FOSA
        const fosaResponse = await fosaService.getAll({ limit: 10000 })
        fosasData = fosaResponse.data.map(normalizeFosaData)
      }

      setFosas(fosasData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [filterRegion, filterDepartement, filterArrondissement])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Appliquer tous les filtres côté frontend (les filtres géo sont déjà appliqués par le backend)
  const allFilteredFosas = fosas.filter((fosa) => {
    // Recherche textuelle
    if (search) {
      const q = search.toLowerCase().trim()
      const nom = (fosa.nom || '').toLowerCase()
      const type = (fosa.type || '').toLowerCase()
      const catRec = (fosa.catRec || '').toLowerCase()
      if (!nom.includes(q) && !type.includes(q) && !catRec.includes(q)) return false
    }

    // Filtre Statut Juridique
    if (filterStatutJuridique) {
      const fosaStatut = fosa.statutRec?.toLowerCase().trim() || ''
      const selectedStatut = filterStatutJuridique.toLowerCase().trim()
      if (fosaStatut !== selectedStatut) return false
    }

    // Filtre Catégorie (matching sur catRec OU type)
    if (filterCategorie) {
      const target = filterCategorie.toLowerCase().trim()
      const fosaCategorie = (fosa.catRec || '').toLowerCase().trim()
      const fosaType = (fosa.type || '').toLowerCase().trim()
      if (fosaCategorie !== target && fosaType !== target &&
          !fosaCategorie.includes(target) && !fosaType.includes(target)) return false
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

  // Pagination frontend
  const PER_PAGE = 15
  const totalFiltered = allFilteredFosas.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const filteredFosas = allFilteredFosas.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  // Mettre à jour l'objet pagination pour le composant DataTable
  useEffect(() => {
    setPagination({
      page: currentPage,
      limit: PER_PAGE,
      total: totalFiltered,
      totalPages,
    })
  }, [totalFiltered, currentPage, totalPages])

  // Fonction pour réinitialiser tous les filtres
  const clearFilters = () => {
    setFilterRegion("")
    setFilterDepartement("")
    setFilterArrondissement("")
    setFilterStatutJuridique("")
    setFilterCategorie("")
    setFilterStatut("all")
    setFilterFonctionnel("all")
    setFilterSecurite("all")
  }

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filterRegion || filterDepartement || filterArrondissement || filterStatutJuridique || filterCategorie || filterStatut !== "all" || filterFonctionnel !== "all" || filterSecurite !== "all"

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
      // Champs de maintenance
      lastInspection: "",
      nextInspection: "",
      maintenancePriority: "low" as "low" | "medium" | "high" | "urgent",
      maintenanceIssues: "",
      // Champs de contacts
      telephone: "",
      email: "",
      responsableNom: "",
      responsableTelephone: "",
    })
    setImageFile(null)
    setImagePreview("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Nettoyer le payload : ne pas envoyer 'type' (utilisé uniquement en lecture, représente cat_rec)
      // Le backend gère : catRec -> cat_rec, statutRec -> statut_rec
      const { type, ...cleanData } = formData as any
      const payload = cleanData

      if (editingItem) {
        await fosaService.update(editingItem.id, payload, imageFile || undefined)
      } else {
        await fosaService.create(payload, imageFile || undefined)
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
      orgUnit: item.orgUnit || "",
      fonction: item.fonction !== undefined ? item.fonction : true,
      statutRec: item.statutRec || "",
      catRec: item.catRec || "",
      nomDirect: item.nomDirect || "",
      // Champs de maintenance
      lastInspection: item.lastInspection || "",
      nextInspection: item.nextInspection || "",
      maintenancePriority: (item.maintenancePriority || "low") as "low" | "medium" | "high" | "urgent",
      maintenanceIssues: item.maintenanceIssues || "",
      // Champs de contacts
      telephone: item.telephone || "",
      email: item.email || "",
      responsableNom: item.responsableNom || "",
      responsableTelephone: item.responsableTelephone || "",
    })
    if (item.image) {
      setImagePreview(fosaService.getImageUrl(item.image))
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
    {
      key: "id",
      label: "ID",
      render: (f: Fosa) => <span className="font-mono text-xs text-gray-500">{f.id}</span>,
    },
    {
      key: "image",
      label: "Image",
      render: (f: Fosa) =>
        f.image ? (
          <img
            src={fosaService.getImageUrl(f.image)}
            alt={f.nom}
            className="size-10 rounded-lg border border-gray-200 object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
            <ImageIcon className="size-4 text-gray-400" />
          </div>
        ),
    },
    {
      key: "nom",
      label: "Nom",
      render: (f: Fosa) => <span className="font-semibold text-gray-900">{f.nom || "-"}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (f: Fosa) => <span className="text-gray-700">{f.type || "-"}</span>,
    },
    {
      key: "capaciteLits",
      label: "Capacité Lits",
      render: (f: Fosa) => <span className="tabular-nums">{f.capaciteLits || "-"}</span>,
    },
    {
      key: "estFerme",
      label: "Statut",
      render: (f: Fosa) => (
        <Badge variant={f.estFerme ? "danger" : "success"} withDot>
          {f.estFerme ? "Fermé" : "Ouvert"}
        </Badge>
      ),
    },
    {
      key: "situation",
      label: "Situation",
      render: (f: Fosa) => (
        <span className="block max-w-[16rem] truncate text-gray-700" title={f.situation || undefined}>
          {f.situation || "-"}
        </span>
      ),
    },
    {
      key: "catRec",
      label: "Catégorie",
      render: (f: Fosa) =>
        f.catRec ? (
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-600">
            {f.catRec}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "statutRec",
      label: "Statut juridique",
      render: (f: Fosa) => <span className="text-gray-700">{f.statutRec || "-"}</span>,
    },
    {
      key: "nomDirect",
      label: "Directeur",
      render: (f: Fosa) => <span className="text-gray-700">{f.nomDirect || "-"}</span>,
    },
    {
      key: "fonction",
      label: "Fonctionnel",
      render: (f: Fosa) => (
        <Badge variant={f.fonction ? "success" : "neutral"}>{f.fonction ? "Oui" : "Non"}</Badge>
      ),
    },
    {
      key: "securite",
      label: "Sécurité",
      render: (f: Fosa) => (
        <div className="flex gap-1">
          {f.aTitreFoncier && <Badge variant="info">TF</Badge>}
          {f.aCloture && <Badge variant="info">Clôture</Badge>}
          {!f.aTitreFoncier && !f.aCloture && <span className="text-xs text-gray-400">-</span>}
        </div>
      ),
    },
    {
      key: "arrondissement",
      label: "Arrondissement",
      render: (f: Fosa) => <span className="text-gray-700">{f.arrondissement?.nom || "-"}</span>,
    },
    {
      key: "airesante",
      label: "Aire de Santé",
      render: (f: Fosa) => <span className="text-gray-700">{f.airesante?.nom_as || "-"}</span>,
    },
  ]

  // Fonctions d'export
  const handleExportPDF = () => {
    exportFosasToPDF(filteredFosas)
  }

  const handleExportExcel = () => {
    exportFosasToExcel(filteredFosas)
  }

  // Indicateurs calculés sur la liste filtrée déjà chargée
  const kpiOuvertes = allFilteredFosas.filter((f) => !f.estFerme).length
  const kpiFermees = totalFiltered - kpiOuvertes
  const kpiElectrifiees = allFilteredFosas.filter((f) => f.connecteeElectricite).length

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Formations sanitaires"
        title="Formations Sanitaires (FOSA)"
        description="Répertoire des formations sanitaires : identification, localisation, infrastructures et contacts."
        actions={
          permissions.canCreate && permissions.canManageFosas ? (
            <button
              onClick={() => {
                setEditingItem(null)
                resetForm()
                setIsModalOpen(true)
              }}
              className="btn btn-primary"
            >
              <Plus className="size-4" />
              Ajouter
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid animate-pulse grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-[118px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="FOSA affichées"
            value={formatNumber(totalFiltered)}
            hint={`sur ${formatNumber(fosas.length)} chargées`}
          />
          <StatCard
            label="Ouvertes"
            value={formatNumber(kpiOuvertes)}
            tone="success"
            hint={`${formatPercent(percent(kpiOuvertes, totalFiltered))} des FOSA affichées`}
          />
          <StatCard
            label="Fermées"
            value={formatNumber(kpiFermees)}
            tone={kpiFermees > 0 ? "danger" : "default"}
            hint={`${formatPercent(percent(kpiFermees, totalFiltered))} des FOSA affichées`}
          />
          <StatCard
            label="Électrifiées"
            value={formatNumber(kpiElectrifiees)}
            tone="brand"
            hint={`${formatPercent(percent(kpiElectrifiees, totalFiltered))} raccordées au réseau`}
          />
        </div>
      )}

      <div className="space-y-3">
        <FilterBar
          actions={
            <ExportButtons
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              disabled={filteredFosas.length === 0}
            />
          }
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher..."
            className="w-full sm:w-80"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("chip", (showFilters || hasActiveFilters) && "chip-active")}
          >
            <SlidersHorizontal className="size-4" />
            Filtres
            {hasActiveFilters && (
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                Actifs
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm">
              <XIcon className="size-4" />
              Réinitialiser
            </button>
          )}
        </FilterBar>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="card-title">Filtres avancés</h3>
                <p className="card-subtitle mt-0.5">Les filtres géographiques sont appliqués côté serveur.</p>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                  <XIcon className="size-4" />
                  Réinitialiser
                </button>
              )}
            </div>

            <p className="kicker mb-2">Localisation</p>
            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Filtre Région */}
              <div>
                <label className="label">Région</label>
                <select
                  value={filterRegion}
                  onChange={(e) => {
                    setFilterRegion(e.target.value)
                    setFilterDepartement("")
                    setFilterArrondissement("")
                  }}
                  className="input"
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
                <label className="label">Département</label>
                <select
                  value={filterDepartement}
                  onChange={(e) => {
                    setFilterDepartement(e.target.value)
                    setFilterArrondissement("")
                  }}
                  className="input"
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
                <label className="label">Arrondissement</label>
                <select
                  value={filterArrondissement}
                  onChange={(e) => setFilterArrondissement(e.target.value)}
                  className="input"
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

              {/* Filtre Catégorie (HD, CSI, CMA, etc.) */}
              <div>
                <label className="label">Catégorie</label>
                <select
                  value={filterCategorie}
                  onChange={(e) => setFilterCategorie(e.target.value)}
                  className="input"
                >
                  <option value="">Toutes les catégories</option>
                  <option value="CHU">CHU</option>
                  <option value="CHR">CHR</option>
                  <option value="CHD">CHD</option>
                  <option value="HG">HG</option>
                  <option value="HC">HC</option>
                  <option value="HR">HR</option>
                  <option value="HD">HD</option>
                  <option value="CMA">CMA</option>
                  <option value="CSI">CSI</option>
                  <option value="SSD">SSD</option>
                  <option value="EF">EF</option>
                  <option value="DRS">DRS</option>
                  <option value="PRG">PRG</option>
                  <option value="Centre de santé">Centre de santé</option>
                </select>
              </div>
            </div>

            <p className="kicker mb-2">Statut et sécurité</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Filtre Statut Juridique (Public, Privé laïc, etc.) */}
              <div>
                <label className="label">Statut juridique</label>
                <select
                  value={filterStatutJuridique}
                  onChange={(e) => setFilterStatutJuridique(e.target.value)}
                  className="input"
                >
                  <option value="">Tous les statuts</option>
                  <option value="Public">Public</option>
                  <option value="Parapublic">Parapublic</option>
                  <option value="Privé laïc">Privé laïc</option>
                  <option value="Privé confessionnel">Privé confessionnel</option>
                </select>
              </div>

              {/* Filtre Statut */}
              <div>
                <label className="label">Statut</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="input"
                >
                  <option value="all">Tous</option>
                  <option value="ouvert">Ouvert</option>
                  <option value="fermé">Fermé</option>
                </select>
              </div>

              {/* Filtre Fonctionnel */}
              <div>
                <label className="label">Fonctionnel</label>
                <select
                  value={filterFonctionnel}
                  onChange={(e) => setFilterFonctionnel(e.target.value)}
                  className="input"
                >
                  <option value="all">Tous</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </div>

              {/* Filtre Sécurité */}
              <div>
                <label className="label">Sécurité</label>
                <select
                  value={filterSecurite}
                  onChange={(e) => setFilterSecurite(e.target.value)}
                  className="input"
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
        <div className="card animate-pulse overflow-hidden">
          <div className="h-11 bg-table-head" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-4 py-3">
              <div className="size-10 rounded-lg bg-gray-100" />
              <div className="h-3 w-48 rounded bg-gray-100" />
              <div className="h-3 w-24 rounded bg-gray-100" />
              <div className="ml-auto h-5 w-16 rounded-full bg-gray-100" />
            </div>
          ))}
          <span className="sr-only">Chargement...</span>
        </div>
      ) : (
        <DataTable
          data={filteredFosas}
          columns={columns}
          onEdit={permissions.canEdit && permissions.canManageFosas ? handleEdit : undefined}
          onDelete={permissions.canDelete && permissions.canManageFosas ? handleDelete : undefined}
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
          <div className="-mx-6 max-h-[65vh] space-y-6 overflow-y-auto px-6">
            <FormSection title="Identification" description="Nom, image, statut et catégorie de la formation sanitaire.">
              <div className="sm:col-span-2">
                <label className="label">Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="size-20 shrink-0 rounded-xl border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
                      <ImageIcon className="size-5 text-gray-400" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:h-10 file:cursor-pointer file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Statut juridique *</label>
                <select
                  value={formData.statutRec}
                  onChange={(e) => setFormData({ ...formData, statutRec: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Public">Public</option>
                  <option value="Parapublic">Parapublic</option>
                  <option value="Privé laïc">Privé laïc</option>
                  <option value="Privé confessionnel">Privé confessionnel</option>
                </select>
              </div>
              <div>
                <label className="label">Capacité Lits</label>
                <input
                  type="number"
                  value={formData.capaciteLits}
                  onChange={(e) => setFormData({ ...formData, capaciteLits: Number(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Org Unit (Nom officiel)</label>
                <input
                  type="text"
                  value={formData.orgUnit}
                  onChange={(e) => setFormData({ ...formData, orgUnit: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Statut</label>
                <select
                  value={formData.statutRec}
                  onChange={(e) => setFormData({ ...formData, statutRec: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Formation Sanitaire">Formation Sanitaire</option>
                  <option value="Centre de Formation">Centre de Formation</option>
                </select>
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select
                  value={formData.catRec}
                  onChange={(e) => setFormData({ ...formData, catRec: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner une catégorie...</option>
                  <option value="CHU">CHU - Centre Hospitalier Universitaire</option>
                  <option value="CHR">CHR - Centre Hospitalier Régional</option>
                  <option value="CHD">CHD - Centre Hospitalier Départemental</option>
                  <option value="HG">HG - Hôpital Général</option>
                  <option value="HC">HC - Hôpital Central</option>
                  <option value="HR">HR - Hôpital Régional</option>
                  <option value="HD">HD - Hôpital de District</option>
                  <option value="CMA">CMA - Centre Médical d'Arrondissement</option>
                  <option value="CSI">CSI - Centre de Santé Intégré</option>
                  <option value="SSD">SSD - Service de Santé du District</option>
                  <option value="EF">EF - Établissement de Formation</option>
                  <option value="DRS">DRS - Délégation Régionale de la Santé Publique</option>
                  <option value="PRG">PRG - Programme de Santé</option>
                </select>
              </div>
              <div>
                <label className="label">Nom du Directeur</label>
                <input
                  type="text"
                  value={formData.nomDirect}
                  onChange={(e) => setFormData({ ...formData, nomDirect: e.target.value })}
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <CheckField
                  id="fonction"
                  checked={formData.fonction}
                  onChange={(checked) => setFormData({ ...formData, fonction: checked })}
                  label="Fonctionnel"
                />
              </div>
            </FormSection>

            <FormSection title="Localisation" description="Coordonnées GPS, rattachement administratif et situation.">
              {!editingItem && (
                <>
                  <div>
                    <label className="label">Longitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) || 0 })}
                      className="input"
                      placeholder="Ex: 11.5021"
                    />
                  </div>
                  <div>
                    <label className="label">Latitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) || 0 })}
                      className="input"
                      placeholder="Ex: 3.8480"
                    />
                  </div>
                  <div>
                    <label className="label">Arrondissement</label>
                    <select
                      value={formData.arrondissementId}
                      onChange={(e) => setFormData({ ...formData, arrondissementId: Number(e.target.value) })}
                      className="input"
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
                    <label className="label">Aire de Santé</label>
                    <select
                      value={formData.airesanteId}
                      onChange={(e) => setFormData({ ...formData, airesanteId: Number(e.target.value) })}
                      className="input"
                    >
                      <option value="">Sélectionner...</option>
                      {airesantes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nom_as}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <label className="label">Situation</label>
                <textarea
                  value={formData.situation}
                  onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                  rows={3}
                  className="input"
                />
              </div>
            </FormSection>

            {/* Questions OUI/NON */}
            <FormSection title="Questions sur les infrastructures" description="Clôture, titre foncier et raccordement électrique.">
              <CheckField
                id="aCloture"
                checked={formData.aCloture}
                onChange={(checked) => setFormData({ ...formData, aCloture: checked })}
                label="La FOSA a-t-elle une clôture ?"
              />
              <CheckField
                id="aTitreFoncier"
                checked={formData.aTitreFoncier}
                onChange={(checked) => setFormData({ ...formData, aTitreFoncier: checked })}
                label="La FOSA a-t-elle un titre foncier ?"
              />
              <div className="sm:col-span-2">
                <CheckField
                  id="connecteeElectricite"
                  checked={formData.connecteeElectricite}
                  onChange={(checked) => setFormData({ ...formData, connecteeElectricite: checked })}
                  label="La FOSA est-elle connectée au réseau national d'électricité ?"
                >
                  {/* Type de courant - affiché seulement si connectée */}
                  {formData.connecteeElectricite && (
                    <div className="mt-3 sm:max-w-xs">
                      <label className="label">Type de courant *</label>
                      <select
                        value={formData.typeCourant}
                        onChange={(e) => setFormData({ ...formData, typeCourant: e.target.value })}
                        required={formData.connecteeElectricite}
                        className="input"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="monophase">Monophasé</option>
                        <option value="triphase">Triphasé</option>
                      </select>
                    </div>
                  )}
                </CheckField>
              </div>
            </FormSection>

            {/* Champs de contacts */}
            <FormSection title="Informations de contact">
              <div>
                <label className="label">Téléphone principal</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="input"
                  placeholder="Ex: +237 6XX XXX XXX"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="Ex: fosa@example.com"
                />
              </div>
              <div>
                <label className="label">Nom du responsable</label>
                <input
                  type="text"
                  value={formData.responsableNom}
                  onChange={(e) => setFormData({ ...formData, responsableNom: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Téléphone du responsable</label>
                <input
                  type="tel"
                  value={formData.responsableTelephone}
                  onChange={(e) => setFormData({ ...formData, responsableTelephone: e.target.value })}
                  className="input"
                />
              </div>
            </FormSection>

            {/* Champs de maintenance */}
            <FormSection title="Maintenance et inspection">
              <div>
                <label className="label">Dernière inspection</label>
                <input
                  type="date"
                  value={formData.lastInspection}
                  onChange={(e) => setFormData({ ...formData, lastInspection: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Prochaine inspection</label>
                <input
                  type="date"
                  value={formData.nextInspection}
                  onChange={(e) => setFormData({ ...formData, nextInspection: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Priorité de maintenance</label>
                <select
                  value={formData.maintenancePriority}
                  onChange={(e) => setFormData({ ...formData, maintenancePriority: e.target.value as "low" | "medium" | "high" | "urgent" })}
                  className="input"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Problèmes identifiés</label>
                <textarea
                  value={formData.maintenanceIssues}
                  onChange={(e) => setFormData({ ...formData, maintenanceIssues: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="Décrivez les problèmes de maintenance identifiés..."
                />
              </div>
            </FormSection>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="btn btn-outline"
            >
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
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
