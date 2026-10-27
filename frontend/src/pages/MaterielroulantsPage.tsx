"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Loader2, Plus, Truck } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import ExportButtons from "../components/ExportButtons"
import { materielroulantService } from "../services/materielroulantService"
import { fosaService } from "../services/fosaService"
import type { Materielroulant, Fosa } from "../types"
import { usePermissions } from "../hooks/usePermissions"
import SearchableSelect from "../components/SearchableSelect"
import { useServicesForFosa } from "../hooks/useFosaServices"
import { exportMaterielroulantsToPDF, exportMaterielroulantsToExcel } from "../utils/pageExports"
import { PageHeader, StatCard, FilterBar, SearchInput, Badge, formatNumber } from "../components/ui"
import type { BadgeVariant } from "../components/ui"

/** Couleur du badge selon l'état du véhicule. */
function etatVariant(etat?: string): BadgeVariant {
  switch (etat) {
    case "Neuf":
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
function FormSection({ title }: { title: string }) {
  return <p className="kicker border-t border-gray-100 pt-4">{title}</p>
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

export default function MaterielroulantsPage() {
  const permissions = usePermissions()

  const [materielroulants, setMaterielroulants] = useState<Materielroulant[]>([])
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Materielroulant | null>(null)
  const [search, setSearch] = useState("")
  const [filterFosaId, setFilterFosaId] = useState<number | null>(null)
  const [filterServiceId, setFilterServiceId] = useState<number | null>(null)
  const { services: filterServices, loadServicesForFosa: loadFilterServices } = useServicesForFosa()
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    materielroulant: Materielroulant | null
  }>({ isOpen: false, materielroulant: null })

  const [formData, setFormData] = useState({
    numeroChassis: "",
    annee: new Date().getFullYear(),
    marque: "",
    modele: "",
    type: "",
    dateMiseEnCirculation: "",
    etat: "",
    quantite: 1,
    fosaId: 0,
    // Nouveaux champs (Page 4 du document)
    dateMiseService: "",
    acteAffectation: "",
    typeVehicule: "",
    immatriculation: "",
    usage: "",
    code: "",
    structure: "",
    serviceId: 0,
    nomUtilisateur: "",
    fonctionUtilisateur: "",
    energie: "",
    financement: "",
  })

  useEffect(() => {
    loadData()
  }, [page, search, filterFosaId, filterServiceId])

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
      const [matResponse, fosaResponse] = await Promise.all([
        materielroulantService.getAll(params),
        fosaService.getAll({ limit: 100 }),
      ])
      setMaterielroulants(matResponse.data)
      setPagination(matResponse.pagination)
      setFosas(fosaResponse.data)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingItem) {
        await materielroulantService.update(editingItem.id, formData)
      } else {
        await materielroulantService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({
        numeroChassis: "",
        annee: new Date().getFullYear(),
        marque: "",
        modele: "",
        type: "",
        dateMiseEnCirculation: "",
        etat: "",
        quantite: 1,
        fosaId: 0,
        dateMiseService: "",
        acteAffectation: "",
        typeVehicule: "",
        immatriculation: "",
        usage: "",
        code: "",
        structure: "",
        serviceId: 0,
        nomUtilisateur: "",
        fonctionUtilisateur: "",
        energie: "",
        financement: "",
      })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: Materielroulant) => {
    setEditingItem(item)
    const itemAny = item as any
    setFormData({
      numeroChassis: item.numeroChassis || "",
      annee: item.annee || new Date().getFullYear(),
      marque: item.marque || "",
      modele: item.modele || "",
      type: item.type || "",
      dateMiseEnCirculation: item.dateMiseEnCirculation?.split('T')[0] || "",
      etat: item.etat || "",
      quantite: item.quantite || 1,
      fosaId: item.fosaId,
      dateMiseService: itemAny.dateMiseService?.split('T')[0] || "",
      acteAffectation: itemAny.acteAffectation || "",
      typeVehicule: itemAny.typeVehicule || "",
      immatriculation: itemAny.immatriculation || "",
      usage: itemAny.usage || "",
      code: itemAny.code || "",
      structure: itemAny.structure || "",
      serviceId: itemAny.serviceId || 0,
      nomUtilisateur: itemAny.nomUtilisateur || "",
      fonctionUtilisateur: itemAny.fonctionUtilisateur || "",
      energie: itemAny.energie || "",
      financement: itemAny.financement || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (item: Materielroulant) => {
    setConfirmDialog({ isOpen: true, materielroulant: item })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.materielroulant) return

    setSubmitting(true)
    try {
      await materielroulantService.delete(confirmDialog.materielroulant.id)
      setConfirmDialog({ isOpen: false, materielroulant: null })
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "numeroChassis", label: "N° Chassis", render: (m: Materielroulant) => <span className="font-mono text-xs">{m.numeroChassis || "-"}</span> },
    { key: "marque", label: "Marque", render: (m: Materielroulant) => <span className="font-medium text-gray-900">{m.marque || "-"}</span> },
    { key: "modele", label: "Modèle" },
    { key: "type", label: "Type" },
    { key: "annee", label: "Année", render: (m: Materielroulant) => <span className="tabular-nums">{m.annee || "-"}</span> },
    { key: "quantite", label: "Quantité", render: (m: Materielroulant) => <span className="tabular-nums">{m.quantite || "-"}</span> },
    {
      key: "etat",
      label: "État",
      render: (m: Materielroulant) => (m.etat ? <Badge variant={etatVariant(m.etat)} withDot>{m.etat}</Badge> : "-"),
    },
    { key: "fosa", label: "FOSA", render: (m: Materielroulant) => m.fosa?.nom || "-" },
  ]


  const handleExportPDF = () => exportMaterielroulantsToPDF(materielroulants)
  const handleExportExcel = () => exportMaterielroulantsToExcel(materielroulants)

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Équipements"
        title="Matériel roulant"
        description="Ambulances, véhicules de service, motos et camions affectés aux formations sanitaires."
        actions={
          permissions.canCreate && permissions.canManageEquipments ? (
            <button
              onClick={() => {
                setEditingItem(null)
                setFormData({
                  numeroChassis: "",
                  annee: new Date().getFullYear(),
                  marque: "",
                  modele: "",
                  type: "",
                  dateMiseEnCirculation: "",
                  etat: "",
                  quantite: 1,
                  fosaId: 0,
                })
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
          value={formatNumber(pagination.total)}
          hint="véhicules selon les filtres"
          tone="brand"
          icon={<Truck />}
        />
      </div>

      <FilterBar
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={materielroulants.length === 0}
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
          data={materielroulants}
          columns={columns}
          onEdit={permissions.canEdit && permissions.canManageEquipments ? handleEdit : undefined}
          onDelete={permissions.canDelete && permissions.canManageEquipments ? handleDelete : undefined}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Modifier" : "Ajouter"} size="large">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="kicker">Identification</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Numéro de Chassis</label>
              <input
                type="text"
                value={formData.numeroChassis}
                onChange={(e) => setFormData({ ...formData, numeroChassis: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Marque</label>
              <input
                type="text"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Modèle</label>
              <input
                type="text"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="input"
              >
                <option value="">Sélectionner...</option>
                <option value="Ambulance">Ambulance</option>
                <option value="Véhicule de service">Véhicule de service</option>
                <option value="Moto">Moto</option>
                <option value="Camion">Camion</option>
              </select>
            </div>
            <div>
              <label className="label">Année</label>
              <input
                type="number"
                value={formData.annee}
                onChange={(e) => setFormData({ ...formData, annee: Number.parseInt(e.target.value) })}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                className="input"
              />
            </div>
            <div>
              <label className="label">Quantité</label>
              <input
                type="number"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: Number.parseInt(e.target.value) || 1 })}
                min="1"
                className="input"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Date de mise en circulation</label>
              <input
                type="date"
                value={formData.dateMiseEnCirculation}
                onChange={(e) => setFormData({ ...formData, dateMiseEnCirculation: e.target.value })}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">État</label>
              <select
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                className="input"
              >
                <option value="">Sélectionner...</option>
                <option value="Neuf">Neuf</option>
                <option value="Bon">Bon</option>
                <option value="Moyen">Moyen</option>
                <option value="Mauvais">Mauvais</option>
                <option value="Hors service">Hors service</option>
              </select>
            </div>
          </div>

          {/* Nouveaux champs (Page 4) */}
          <FormSection title="Affectation et usage" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Date Mise en Service</label>
              <input
                type="date"
                value={formData.dateMiseService}
                onChange={(e) => setFormData({ ...formData, dateMiseService: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Type Véhicule</label>
              <input
                type="text"
                value={formData.typeVehicule}
                onChange={(e) => setFormData({ ...formData, typeVehicule: e.target.value })}
                className="input"
                placeholder="Ex: PICK UP, SUV, Ambulance"
              />
            </div>
            <div>
              <label className="label">Immatriculation</label>
              <input
                type="text"
                value={formData.immatriculation}
                onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                className="input"
                placeholder="Ex: CA 6161 D"
              />
            </div>
            <div>
              <label className="label">Usage</label>
              <input
                type="text"
                value={formData.usage}
                onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                className="input"
                placeholder="Ex: Fonction"
              />
            </div>
            <div>
              <label className="label">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Structure</label>
              <input
                type="text"
                value={formData.structure}
                onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                className="input"
                placeholder="Ex: Cabinet du Ministre"
              />
            </div>
            <div>
              <label className="label">Nom Utilisateur</label>
              <input
                type="text"
                value={formData.nomUtilisateur}
                onChange={(e) => setFormData({ ...formData, nomUtilisateur: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Fonction Utilisateur</label>
              <input
                type="text"
                value={formData.fonctionUtilisateur}
                onChange={(e) => setFormData({ ...formData, fonctionUtilisateur: e.target.value })}
                className="input"
                placeholder="Ex: Ministre de la santé"
              />
            </div>
            <div>
              <label className="label">Énergie</label>
              <select
                value={formData.energie}
                onChange={(e) => setFormData({ ...formData, energie: e.target.value })}
                className="input"
              >
                <option value="">Sélectionner...</option>
                <option value="Gasoil">Gasoil</option>
                <option value="Essence">Essence</option>
                <option value="Électrique">Électrique</option>
                <option value="Hybride">Hybride</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Financement</label>
              <input
                type="text"
                value={formData.financement}
                onChange={(e) => setFormData({ ...formData, financement: e.target.value })}
                className="input"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="label">Acte d'Affectation</label>
              <textarea
                value={formData.acteAffectation}
                onChange={(e) => setFormData({ ...formData, acteAffectation: e.target.value })}
                className="input"
                rows={3}
                placeholder="Ex: Décision n°1320/D/MINSANTE/CAB du 03/07/2020"
              />
            </div>
          </div>

          <div>
            <label className="label">FOSA</label>
            <SearchableSelect
              options={fosas.map((f) => ({ id: f.id, label: f.nom }))}
              value={formData.fosaId || null}
              onChange={(v) => setFormData({ ...formData, fosaId: v ? Number(v) : 0 })}
              placeholder="Rechercher et sélectionner une FOSA"
              required
            />
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
        onClose={() => setConfirmDialog({ isOpen: false, materielroulant: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le véhicule "${confirmDialog.materielroulant?.marque} ${confirmDialog.materielroulant?.modele}" (${confirmDialog.materielroulant?.numeroChassis}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
