"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2, Plus, Stethoscope } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { equipebioService } from "../services/equipebioService"
import type { Equipebio } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import { useFosaServices, useServicesForFosa } from "../hooks/useFosaServices"
import SearchableSelect from "../components/SearchableSelect"
import { exportGenericToPDF, exportGenericToExcel } from "../utils/exportUtils"
import { PageHeader, StatCard, FilterBar, SearchInput, Badge, formatNumber, toast } from "../components/ui"
import type { BadgeVariant } from "../components/ui"
import { CATEGORIES_FOSA, devinerCategorie, loadCatalogue, type CatalogueItem } from "../data/catalogue"

/** Valeurs par défaut des nouveaux champs d'un équipement biomédical. */
const EMPTY_FORM = {
  nom: "",
  fosaId: 0,
  serviceId: 0,
  type: "",
  quantite: 1,
  etat: "Bon",
  dateAcquisition: new Date().toISOString().split("T")[0],
  categorieFosa: "",
  marque: "",
  modele: "",
  numeroSerie: "",
  anneeFabrication: "" as number | "",
  sourceAcquisition: "",
  contratMaintenance: false,
  typeMaintenance: "",
  dateDerniereMaintenance: "",
  dateProchaineMaintenance: "",
  dureeGarantie: "",
  dateFinGarantie: "",
}
type FormState = typeof EMPTY_FORM

/** Couleur du badge selon l'état de l'équipement. */
function etatVariant(etat?: string): BadgeVariant {
  switch (etat) {
    case "Bon":
      return "success"
    case "Moyen":
      return "warning"
    case "Mauvais":
    case "Hors service":
      return "danger"
    default:
      return "neutral"
  }
}

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

/** FOSA propriétaire de l'équipement (equipebio -> service -> fosa), « — » si inconnue. */
function fosaName(e: Equipebio): string {
  return e.fosaNom ?? e.fosa?.nom ?? (e.service as any)?.fosa?.nom ?? "—"
}

export default function EquipebiosPage() {
  const permissions = usePermissions()

  const [equipebios, setEquipebios] = useState<Equipebio[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEquipebio, setEditingEquipebio] = useState<Equipebio | null>(null)
  const [search, setSearch] = useState("")
  const [filterFosaId, setFilterFosaId] = useState<number | null>(null)
  const [filterServiceId, setFilterServiceId] = useState<number | null>(null)
  const [filterEtat, setFilterEtat] = useState<string>("")
  // Services de la FOSA sélectionnée dans le filtre (cascade)
  const { services: filterServices, loadServicesForFosa: loadFilterServices } = useServicesForFosa()
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number; totalQuantite?: number }>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    equipebio: Equipebio | null
  }>({ isOpen: false, equipebio: null })

  // Cascade FOSA -> Services pour le formulaire
  const { fosas, services: formServices, loadServicesForFosa } = useFosaServices()

  const [formData, setFormData] = useState<FormState>({ ...EMPTY_FORM })

  // Liste standard d'équipements de la catégorie FOSA choisie (chargée à la demande)
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([])

  useEffect(() => {
    loadEquipebios()
  }, [page, search, filterFosaId, filterServiceId, filterEtat])

  // Recharge les services quand la FOSA du formulaire change
  useEffect(() => {
    loadServicesForFosa(formData.fosaId)
  }, [formData.fosaId, loadServicesForFosa])

  // Recharge les services du filtre quand la FOSA du filtre change
  useEffect(() => {
    loadFilterServices(filterFosaId)
  }, [filterFosaId, loadFilterServices])

  // Déduit la catégorie du catalogue depuis la FOSA choisie (si non définie)
  useEffect(() => {
    if (!formData.fosaId) return
    const f = fosas.find((x) => x.id === formData.fosaId)
    const cat = devinerCategorie((f as any)?.catRec ?? (f as any)?.type)
    if (cat && !formData.categorieFosa) {
      setFormData((prev) => ({ ...prev, categorieFosa: cat }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fosaId, fosas])

  // Charge la liste standard de la catégorie choisie
  useEffect(() => {
    let annule = false
    if (!formData.categorieFosa) {
      setCatalogueItems([])
      return
    }
    loadCatalogue()
      .then((cat) => {
        if (!annule) setCatalogueItems(cat[formData.categorieFosa]?.equipements ?? [])
      })
      .catch(() => setCatalogueItems([]))
    return () => {
      annule = true
    }
  }, [formData.categorieFosa])

  const loadEquipebios = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterFosaId) params.fosaId = filterFosaId
      if (filterServiceId) params.serviceId = filterServiceId
      if (filterEtat) params.etat = filterEtat

      const response = await equipebioService.getAll(params)
      setEquipebios(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading equipebios:", error)
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
      // Nettoyage : les chaînes vides deviennent null, l'année un entier ou null.
      const payload: any = { ...formData }
      payload.anneeFabrication = formData.anneeFabrication === "" ? null : Number(formData.anneeFabrication)
      for (const k of [
        "type", "categorieFosa", "marque", "modele", "numeroSerie", "sourceAcquisition",
        "typeMaintenance", "dateDerniereMaintenance", "dateProchaineMaintenance",
        "dureeGarantie", "dateFinGarantie",
      ]) {
        if (payload[k] === "") payload[k] = null
      }
      if (editingEquipebio) {
        await equipebioService.update(editingEquipebio.id, payload)
      } else {
        await equipebioService.create(payload)
      }
      setIsModalOpen(false)
      setEditingEquipebio(null)
      resetForm()
      loadEquipebios()
    } catch (error: any) {
      console.error("Error saving equipebio:", error)
      // Le message d'erreur est affiché par l'intercepteur de l'API (toast).
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, dateAcquisition: new Date().toISOString().split("T")[0] })
  }

  const handleEdit = (equipebio: Equipebio) => {
    setEditingEquipebio(equipebio)
    const svc = (equipebio as any).service
    const fosaId = svc?.fosaId ?? svc?.fosa_id ?? 0
    setFormData({
      nom: equipebio.nom || "",
      fosaId,
      serviceId: equipebio.serviceId,
      type: equipebio.type || "",
      quantite: equipebio.quantite || 1,
      etat: equipebio.etat || "Bon",
      dateAcquisition: equipebio.dateAcquisition?.split("T")[0] || new Date().toISOString().split("T")[0],
      categorieFosa: equipebio.categorieFosa || "",
      marque: equipebio.marque || "",
      modele: equipebio.modele || "",
      numeroSerie: equipebio.numeroSerie || "",
      anneeFabrication: equipebio.anneeFabrication ?? "",
      sourceAcquisition: equipebio.sourceAcquisition || "",
      contratMaintenance: !!equipebio.contratMaintenance,
      typeMaintenance: equipebio.typeMaintenance || "",
      dateDerniereMaintenance: equipebio.dateDerniereMaintenance?.split("T")[0] || "",
      dateProchaineMaintenance: equipebio.dateProchaineMaintenance?.split("T")[0] || "",
      dureeGarantie: equipebio.dureeGarantie || "",
      dateFinGarantie: equipebio.dateFinGarantie?.split("T")[0] || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (equipebio: Equipebio) => {
    setConfirmDialog({ isOpen: true, equipebio })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.equipebio) return

    setSubmitting(true)
    try {
      await equipebioService.delete(confirmDialog.equipebio.id)
      setConfirmDialog({ isOpen: false, equipebio: null })
      loadEquipebios()
    } catch (error) {
      console.error("Error deleting equipebio:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nom", label: "Nom", render: (e: Equipebio) => <span className="font-medium text-gray-900">{e.nom || "-"}</span> },
    { key: "fosaNom", label: "FOSA", render: (e: Equipebio) => fosaName(e) },
    { key: "type", label: "Type" },
    { key: "service", label: "Service", render: (e: Equipebio) => e.service?.nom || "N/A" },
    { key: "quantite", label: "Quantité", render: (e: Equipebio) => <span className="tabular-nums">{e.quantite ?? "-"}</span> },
    {
      key: "etat",
      label: "État",
      render: (e: Equipebio) => (
        <Badge variant={etatVariant(e.etat)} withDot>
          {e.etat || "Non renseigné"}
        </Badge>
      )
    },
  ]


  // Lignes exportées : les colonnes calculées (FOSA, service) sont aplaties.
  const exportRows = () =>
    equipebios.map((e) => ({ ...e, fosaName: fosaName(e), serviceName: e.service?.nom || "—" }))

  const handleExportPDF = () => {
    exportGenericToPDF(
      exportRows(),
      [
        { header: 'ID', dataKey: 'id' },
        { header: 'Nom', dataKey: 'nom' },
        { header: 'FOSA', dataKey: 'fosaName' },
        { header: 'Type', dataKey: 'type' },
        { header: 'État', dataKey: 'etat' },
        { header: 'Service', dataKey: 'serviceName' },
      ],
      'Liste des Équipements Biomédicaux',
      `equipements_bio_${new Date().toISOString().split('T')[0]}`
    )
  }

  const handleExportExcel = () => {
    exportGenericToExcel(
      exportRows(),
      [
        { header: 'ID', key: 'id' },
        { header: 'Nom', key: 'nom' },
        { header: 'FOSA', key: 'fosaName' },
        { header: 'Type', key: 'type' },
        { header: 'État', key: 'etat' },
        { header: 'Service', key: 'serviceName' },
        { header: 'Date Acquisition', key: 'dateAcquisition' },
      ],
      `equipements_bio_${new Date().toISOString().split('T')[0]}`,
      'Équipements Bio'
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Équipements"
        title="Équipements biomédicaux"
        description="Parc biomédical des services : type, quantité et état de fonctionnement."
        actions={
          permissions.canCreate && permissions.canManageEquipments ? (
            <button
              onClick={() => {
                setEditingEquipebio(null)
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={formatNumber(pagination.totalQuantite ?? pagination.total)}
          hint={`équipements selon les filtres · ${formatNumber(pagination.total)} ligne(s)`}
          tone="brand"
          icon={<Stethoscope />}
        />
      </div>

      <FilterBar
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={equipebios.length === 0}
          />
        }
      >
        <SearchInput value={search} onChange={setSearch} className="w-full sm:w-64" />
        <div className="w-full sm:w-52">
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
        <div className="w-full sm:w-52">
          <SearchableSelect
            options={filterServices.map((s) => ({ id: s.id, label: s.nom }))}
            value={filterServiceId}
            onChange={(v) => setFilterServiceId(v ? Number(v) : null)}
            placeholder={filterFosaId ? "Tous les services" : "Choisir une FOSA d'abord"}
            disabled={!filterFosaId}
          />
        </div>
        <select
          value={filterEtat}
          onChange={(e) => setFilterEtat(e.target.value)}
          className="input w-auto"
        >
          <option value="">Tous les états</option>
          <option value="Bon">Bon</option>
          <option value="Moyen">Moyen</option>
          <option value="Mauvais">Mauvais</option>
          <option value="Hors service">Hors service</option>
        </select>
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={equipebios}
          columns={columns}
          onEdit={permissions.canEdit && permissions.canManageEquipments ? handleEdit : undefined}
          onDelete={permissions.canDelete && permissions.canManageEquipments ? handleDelete : undefined}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="large" title={editingEquipebio ? "Modifier l'équipement biomédical" : "Ajouter un équipement biomédical"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
                placeholder="Ex: Scanner, IRM, Échographe..."
              />
            </div>
          </div>

          {/* Choix dans la liste standard d'équipements par catégorie de FOSA */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Catégorie de FOSA</label>
                <select
                  value={formData.categorieFosa}
                  onChange={(e) => setFormData({ ...formData, categorieFosa: e.target.value })}
                  className="input"
                >
                  <option value="">— Choisir une catégorie —</option>
                  {CATEGORIES_FOSA.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Équipement standard</label>
                <SearchableSelect
                  options={catalogueItems.map((it, i) => ({
                    id: i,
                    label: it.code ? `${it.designation} (${it.service})` : `${it.designation} (${it.service})`,
                  }))}
                  value={null}
                  onChange={(v) => {
                    const it = v != null ? catalogueItems[Number(v)] : undefined
                    if (it) setFormData((prev) => ({ ...prev, nom: it.designation, type: prev.type || it.service }))
                  }}
                  placeholder={
                    formData.categorieFosa
                      ? catalogueItems.length
                        ? "Rechercher dans la liste standard…"
                        : "Chargement…"
                      : "Choisir une catégorie d'abord"
                  }
                  disabled={!formData.categorieFosa || !catalogueItems.length}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Choisir un équipement pré-remplit le nom (liste standard MINSANTÉ). Il reste modifiable.
            </p>
          </div>

          <FormSection title="Rattachement" hint="FOSA propriétaire et service d'affectation." />
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">FOSA *</label>
            <SearchableSelect
              options={fosas.map((f) => ({ id: f.id, label: f.nom }))}
              value={formData.fosaId || null}
              onChange={(v) =>
                setFormData({ ...formData, fosaId: v ? Number(v) : 0, serviceId: 0 })
              }
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

          <FormSection title="État & acquisition" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Quantité</label>
              <input
                type="number"
                min="1"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="label">État</label>
              <select
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                className="input"
              >
                <option value="Bon">Bon</option>
                <option value="Moyen">Moyen</option>
                <option value="Mauvais">Mauvais</option>
                <option value="Hors service">Hors service</option>
              </select>
            </div>

            <div>
              <label className="label">Date d'acquisition</label>
              <input
                type="date"
                value={formData.dateAcquisition}
                onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <FormSection title="Caractéristiques" />
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
              <select value={formData.sourceAcquisition} onChange={(e) => setFormData({ ...formData, sourceAcquisition: e.target.value })} className="input">
                <option value="">—</option>
                <option value="BIP">BIP</option>
                <option value="PTF">PTF</option>
                <option value="DON">DON</option>
                <option value="ACHAT">ACHAT</option>
              </select>
            </div>
          </div>

          <FormSection title="Maintenance & garantie" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 pt-6">
              <input
                id="contratMaintenance" type="checkbox"
                checked={formData.contratMaintenance}
                onChange={(e) => setFormData({ ...formData, contratMaintenance: e.target.checked })}
                className="size-4 rounded border-gray-300"
              />
              <label htmlFor="contratMaintenance" className="text-sm text-gray-700">Sous contrat de maintenance</label>
            </div>
            <div>
              <label className="label">Type de maintenance</label>
              <select value={formData.typeMaintenance} onChange={(e) => setFormData({ ...formData, typeMaintenance: e.target.value })} className="input">
                <option value="">—</option>
                <option value="Préventive">Préventive</option>
                <option value="Curative">Curative</option>
              </select>
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
                editingEquipebio ? "Modifier" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, equipebio: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'équipement biomédical "${confirmDialog.equipebio?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
