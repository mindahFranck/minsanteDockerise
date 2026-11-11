"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { equipementService } from "../services/equipementService"
import type { Equipement } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import { useFosaServices, useServicesForFosa } from "../hooks/useFosaServices"
import SearchableSelect from "../components/SearchableSelect"
import Select from "../components/Select"
import { exportEquipementsToPDF, exportEquipementsToExcel } from "../utils/pageExports"
import { PageHeader, FilterBar, SearchInput, Badge, toast } from "../components/ui"
import { CATEGORIES_FOSA, devinerCategorie, loadCategorieItems, type CatalogueItem } from "../data/catalogue"

/** Valeurs par défaut du formulaire équipement (avec champs recommandation). */
const EMPTY_FORM = {
  nom: "",
  type: "",
  dateAcquisition: "",
  fosaId: 0,
  serviceId: 0,
  categorieFosa: "",
  marque: "",
  modele: "",
  numeroSerie: "",
  anneeFabrication: "" as number | "",
  sourceAcquisition: "",
  etat: "",
  contratMaintenance: false,
  typeMaintenance: "",
  dateDerniereMaintenance: "",
  dateProchaineMaintenance: "",
  dureeGarantie: "",
  dateFinGarantie: "",
}
type FormState = typeof EMPTY_FORM

/** Intertitre de section dans le formulaire. */
function FormSection({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="kicker">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

/** Squelette du tableau pendant le chargement. */
function TableSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-11 bg-table-head" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-gray-100 px-4 py-3.5">
          <div className="h-3 w-1/6 rounded bg-gray-200" />
          <div className="h-3 w-1/4 rounded bg-gray-100" />
          <div className="h-3 w-1/5 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export default function EquipementsPage() {
  const permissions = usePermissions()

  const { fosas, services: formServices, loadServicesForFosa } = useFosaServices()

  const [equipements, setEquipements] = useState<Equipement[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipement | null>(null)
  const [search, setSearch] = useState("")
  const [filterFosaId, setFilterFosaId] = useState<number | null>(null)
  const [filterServiceId, setFilterServiceId] = useState<number | null>(null)
  const { services: filterServices, loadServicesForFosa: loadFilterServices } = useServicesForFosa()
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    equipement: Equipement | null
  }>({ isOpen: false, equipement: null })

  const [formData, setFormData] = useState<FormState>({ ...EMPTY_FORM })
  // Sélection dans la liste standard (comme pour les équipements biomédicaux)
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([])
  const [selectedCatIdx, setSelectedCatIdx] = useState<number | null>(null)
  const [selectedSpecs, setSelectedSpecs] = useState<string>("")
  const [fromCatalogue, setFromCatalogue] = useState<boolean>(false)

  useEffect(() => {
    loadData()
  }, [page, search, filterFosaId, filterServiceId])

  // Déduit la catégorie du catalogue depuis la FOSA choisie (si non définie)
  useEffect(() => {
    if (!formData.fosaId) return
    const f = fosas.find((x) => x.id === formData.fosaId)
    const cat = devinerCategorie((f as any)?.catRec ?? (f as any)?.type)
    if (cat && !formData.categorieFosa) setFormData((prev) => ({ ...prev, categorieFosa: cat }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fosaId, fosas])

  // Charge la liste standard de la catégorie choisie (avec spécifications)
  useEffect(() => {
    let annule = false
    if (!formData.categorieFosa) {
      setCatalogueItems([])
      return
    }
    loadCategorieItems(formData.categorieFosa, "autre")
      .then((items) => { if (!annule) setCatalogueItems(items) })
      .catch(() => setCatalogueItems([]))
    return () => { annule = true }
  }, [formData.categorieFosa])

  // Recharge les services quand la FOSA du formulaire change
  useEffect(() => {
    loadServicesForFosa(formData.fosaId)
  }, [formData.fosaId, loadServicesForFosa])

  // Recharge les services du filtre quand la FOSA du filtre change
  useEffect(() => {
    loadFilterServices(filterFosaId)
  }, [filterFosaId, loadFilterServices])

  const loadData = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10, search }
      if (filterFosaId) params.fosaId = filterFosaId
      if (filterServiceId) params.serviceId = filterServiceId
      const equipResponse = await equipementService.getAll(params)
      setEquipements(equipResponse.data)
      setPagination(equipResponse.pagination)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fosaId) {
      toast.warning("Veuillez d'abord sélectionner une FOSA.")
      return
    }
    if (!formData.serviceId) {
      toast.warning("Veuillez sélectionner un service.")
      return
    }
    setSubmitting(true)
    try {
      const payload: any = { ...formData }
      payload.anneeFabrication = formData.anneeFabrication === "" ? null : Number(formData.anneeFabrication)
      for (const k of [
        "type", "dateAcquisition", "marque", "modele", "numeroSerie", "sourceAcquisition", "etat",
        "typeMaintenance", "dateDerniereMaintenance", "dateProchaineMaintenance", "dureeGarantie", "dateFinGarantie",
      ]) {
        if (payload[k] === "") payload[k] = null
      }
      if (editingItem) {
        await equipementService.update(editingItem.id, payload)
      } else {
        await equipementService.create(payload)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ ...EMPTY_FORM })
      setSelectedCatIdx(null); setSelectedSpecs(""); setFromCatalogue(false)
      loadData()
    } catch (error: any) {
      console.error("Error saving:", error)
      // Le message d'erreur est affiché par l'intercepteur de l'API (toast).
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Equipement) => {
    setEditingItem(item)
    // Édition : saisie libre (pas de verrou catalogue)
    setSelectedCatIdx(null); setSelectedSpecs(""); setFromCatalogue(false)
    const svc = (item as any).service
    setFormData({
      nom: item.nom || "",
      type: item.type || "",
      dateAcquisition: item.dateAcquisition?.split("T")[0] || "",
      fosaId: svc?.fosaId ?? svc?.fosa_id ?? 0,
      serviceId: item.serviceId,
      categorieFosa: "",
      marque: item.marque || "",
      modele: item.modele || "",
      numeroSerie: item.numeroSerie || "",
      anneeFabrication: item.anneeFabrication ?? "",
      sourceAcquisition: item.sourceAcquisition || "",
      etat: item.etat || "",
      contratMaintenance: !!item.contratMaintenance,
      typeMaintenance: item.typeMaintenance || "",
      dateDerniereMaintenance: item.dateDerniereMaintenance?.split("T")[0] || "",
      dateProchaineMaintenance: item.dateProchaineMaintenance?.split("T")[0] || "",
      dureeGarantie: item.dureeGarantie || "",
      dateFinGarantie: item.dateFinGarantie?.split("T")[0] || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (item: Equipement) => {
    setConfirmDialog({ isOpen: true, equipement: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.equipement) return

    setSubmitting(true)
    try {
      await equipementService.delete(confirmDialog.equipement.id)
      setConfirmDialog({ isOpen: false, equipement: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom" },
    { key: "type", label: "Type" },
    { key: "marque", label: "Marque", render: (e: Equipement) => e.marque || "—" },
    {
      key: "etat",
      label: "État",
      render: (e: Equipement) => (e.etat ? <Badge variant={e.etat === "Bon" ? "success" : e.etat === "Mauvais" ? "danger" : "warning"} withDot>{e.etat}</Badge> : "—"),
    },
    { key: "sourceAcquisition", label: "Source", render: (e: Equipement) => e.sourceAcquisition || "—" },
    {
      key: "dateAcquisition",
      label: "Acquisition",
      render: (e: Equipement) => (e.dateAcquisition ? new Date(e.dateAcquisition).toLocaleDateString("fr-FR") : "—"),
    },
    { key: "service", label: "Service", render: (e: Equipement) => e.service?.nom || "-" },
  ]

  // Fonctions d'export
  const handleExportPDF = () => {
    exportEquipementsToPDF(equipements)
  }

  const handleExportExcel = () => {
    exportEquipementsToExcel(equipements)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Équipements"
        title="Équipements"
        description="Équipements non biomédicaux rattachés aux services des formations sanitaires."
        actions={
          permissions.canCreate && permissions.canManageEquipments ? (
            <button
              onClick={() => {
                setEditingItem(null)
                setFormData({ ...EMPTY_FORM })
                setSelectedCatIdx(null); setSelectedSpecs(""); setFromCatalogue(false)
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

      <FilterBar
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={equipements.length === 0}
          />
        }
      >
        <SearchInput value={search} onChange={setSearch} className="w-full sm:w-72" />
        <div className="w-full sm:w-56">
          <SearchableSelect
            options={fosas.map((f) => ({ id: f.id, label: f.nom }))}
            value={filterFosaId}
            onChange={(v) => {
              setFilterFosaId(v ? Number(v) : null)
              setFilterServiceId(null)
            }}
            placeholder="Toutes les FOSA"
          />
        </div>
        <div className="w-full sm:w-56">
          <SearchableSelect
            options={filterServices.map((s) => ({ id: s.id, label: s.nom }))}
            value={filterServiceId}
            onChange={(v) => setFilterServiceId(v ? Number(v) : null)}
            placeholder={filterFosaId ? "Tous les services" : "Choisir une FOSA d'abord"}
            disabled={!filterFosaId}
          />
        </div>
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={equipements}
          columns={columns}
          onEdit={permissions.canEdit && permissions.canManageEquipments ? handleEdit : undefined}
          onDelete={permissions.canDelete && permissions.canManageEquipments ? handleDelete : undefined}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="large" title={editingItem ? "Modifier l'équipement" : "Ajouter un équipement"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Sélection dans la liste standard (catégorie + équipement), en premier */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <p className="kicker mb-2">Sélection dans la liste standard</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Catégorie de FOSA</label>
                <Select
                  value={formData.categorieFosa}
                  onChange={(v) => {
                    setSelectedCatIdx(null); setSelectedSpecs(""); setFromCatalogue(false)
                    setFormData({ ...formData, categorieFosa: v })
                  }}
                  placeholder="— Choisir une catégorie —"
                  options={CATEGORIES_FOSA.map((c) => ({ value: c.code, label: c.label }))}
                />
              </div>
              <div>
                <label className="label">Équipement standard</label>
                <SearchableSelect
                  options={catalogueItems.map((it, i) => ({ id: i, label: `${it.designation} (${it.service})` }))}
                  value={selectedCatIdx}
                  onChange={(v) => {
                    if (v == null) { setSelectedCatIdx(null); setSelectedSpecs(""); setFromCatalogue(false); return }
                    const it = catalogueItems[Number(v)]
                    if (it) {
                      setSelectedCatIdx(Number(v))
                      setSelectedSpecs(it.specifications || "")
                      setFromCatalogue(true)
                      setFormData((prev) => ({ ...prev, nom: it.designation, type: it.service || "" }))
                    }
                  }}
                  placeholder={
                    formData.categorieFosa
                      ? catalogueItems.length ? "Rechercher dans la liste standard…" : "Chargement…"
                      : "Choisir une catégorie d'abord"
                  }
                  disabled={!formData.categorieFosa || !catalogueItems.length}
                />
              </div>
            </div>
            {selectedSpecs ? (
              <div className="mt-3 rounded-lg border border-brand-100 bg-white/70 p-2.5">
                <p className="kicker">Spécifications techniques</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-600">{selectedSpecs}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Choisir un équipement remplit le nom et le type (verrouillés). Sinon, saisissez manuellement ci-dessous.
              </p>
            )}
          </div>

          {/* 2. Identification (verrouillée si issue de la liste standard) */}
          <FormSection title="Identification" />
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Nom</label>
              {fromCatalogue && (
                <button
                  type="button"
                  onClick={() => { setFromCatalogue(false); setSelectedCatIdx(null); setSelectedSpecs("") }}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Saisir manuellement
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="input disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
              disabled={fromCatalogue}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="input disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                disabled={fromCatalogue}
              />
            </div>
            <div>
              <label className="label">Date d'acquisition</label>
              <input
                type="date"
                value={formData.dateAcquisition}
                onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>
          <FormSection title="Rattachement" hint="FOSA propriétaire et service d'affectation." />
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">FOSA *</label>
            <SearchableSelect
              options={fosas.map((f) => ({ id: f.id, label: f.nom }))}
              value={formData.fosaId || null}
              onChange={(v) => setFormData({ ...formData, fosaId: v ? Number(v) : 0, serviceId: 0 })}
              placeholder="Rechercher et sélectionner une FOSA"
              required
            />
          </div>
          <div>
            <label className="label">Service *</label>
            <SearchableSelect
              options={formServices.map((s) => ({ id: s.id, label: s.nom }))}
              value={formData.serviceId || null}
              onChange={(v) => setFormData({ ...formData, serviceId: v ? Number(v) : 0 })}
              placeholder={
                formData.fosaId
                  ? formServices.length
                    ? "Sélectionner un service"
                    : "Aucun service pour cette FOSA"
                  : "Choisissez d'abord une FOSA"
              }
              disabled={!formData.fosaId}
              required
            />
          </div>
          </div>

          <FormSection title="Caractéristiques & acquisition" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Marque</label>
              <input type="text" value={formData.marque} onChange={(e) => setFormData({ ...formData, marque: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Modèle</label>
              <input type="text" value={formData.modele} onChange={(e) => setFormData({ ...formData, modele: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">N° de série</label>
              <input type="text" value={formData.numeroSerie} onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Année de fabrication</label>
              <input
                type="number" min="1900" max="2100"
                value={formData.anneeFabrication}
                onChange={(e) => setFormData({ ...formData, anneeFabrication: e.target.value === "" ? "" : Number(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Source d'acquisition</label>
              <Select
                value={formData.sourceAcquisition}
                onChange={(v) => setFormData({ ...formData, sourceAcquisition: v })}
                placeholder="—"
                options={[
                  { value: "BIP", label: "BIP" },
                  { value: "PTF", label: "PTF" },
                  { value: "DON", label: "DON" },
                  { value: "ACHAT", label: "ACHAT" },
                ]}
              />
            </div>
            <div>
              <label className="label">État</label>
              <Select
                value={formData.etat}
                onChange={(v) => setFormData({ ...formData, etat: v })}
                placeholder="—"
                options={[
                  { value: "Bon", label: "Bon" },
                  { value: "Moyen", label: "Moyen" },
                  { value: "Mauvais", label: "Mauvais" },
                  { value: "Hors service", label: "Hors service" },
                ]}
              />
            </div>
          </div>

          <FormSection title="Maintenance & garantie" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 pt-6">
              <input
                id="eqContratMaintenance" type="checkbox"
                checked={formData.contratMaintenance}
                onChange={(e) => setFormData({ ...formData, contratMaintenance: e.target.checked })}
                className="size-4 rounded border-gray-300"
              />
              <label htmlFor="eqContratMaintenance" className="text-sm text-gray-700">Sous contrat de maintenance</label>
            </div>
            <div>
              <label className="label">Type de maintenance</label>
              <Select
                value={formData.typeMaintenance}
                onChange={(v) => setFormData({ ...formData, typeMaintenance: v })}
                placeholder="—"
                options={[
                  { value: "Préventive", label: "Préventive" },
                  { value: "Curative", label: "Curative" },
                ]}
              />
            </div>
            <div>
              <label className="label">Durée de garantie</label>
              <input type="text" value={formData.dureeGarantie} onChange={(e) => setFormData({ ...formData, dureeGarantie: e.target.value })} className="input" placeholder="Ex: 24 mois" />
            </div>
            <div>
              <label className="label">Dernière maintenance</label>
              <input type="date" value={formData.dateDerniereMaintenance} onChange={(e) => setFormData({ ...formData, dateDerniereMaintenance: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Prochaine maintenance</label>
              <input type="date" value={formData.dateProchaineMaintenance} onChange={(e) => setFormData({ ...formData, dateProchaineMaintenance: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Fin de garantie</label>
              <input type="date" value={formData.dateFinGarantie} onChange={(e) => setFormData({ ...formData, dateFinGarantie: e.target.value })} className="input" />
            </div>
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
        onClose={() => setConfirmDialog({ isOpen: false, equipement: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'équipement "${confirmDialog.equipement?.type}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
