"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Plus, ListChecks } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import Select from "../components/Select"
import { equipementStandardService, type EquipementStandard } from "../services/equipementStandardService"
import { usePermissions } from "../hooks/usePermissions"
import { CATEGORIES_FOSA } from "../data/catalogue"
import { PageHeader, StatCard, FilterBar, SearchInput, Badge, formatNumber, toast } from "../components/ui"

const PER_PAGE = 12

const EMPTY_FORM = {
  categorieFosa: "CSI",
  famille: "bio",
  service: "",
  code: "",
  designation: "",
  specifications: "",
  quantiteStandard: "",
  prixUnitaire: "",
}
type FormState = typeof EMPTY_FORM

export default function EquipementsStandardPage() {
  const permissions = usePermissions()

  const [items, setItems] = useState<EquipementStandard[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<EquipementStandard | null>(null)

  // Filtres
  const [filterCategorie, setFilterCategorie] = useState("CSI")
  const [filterFamille, setFilterFamille] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [formData, setFormData] = useState<FormState>({ ...EMPTY_FORM })
  const [confirm, setConfirm] = useState<{ isOpen: boolean; item: EquipementStandard | null }>({ isOpen: false, item: null })

  const load = async () => {
    try {
      setLoading(true)
      const params: any = { categorie: filterCategorie }
      if (filterFamille) params.famille = filterFamille
      const res = await equipementStandardService.list(params)
      setItems(res.data ?? [])
      setPage(1)
    } catch (e) {
      console.error("load equipements-standard", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategorie, filterFamille])

  // Recherche + pagination côté client sur la catégorie chargée
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return items
    return items.filter(
      (i) =>
        i.designation?.toLowerCase().includes(s) ||
        i.service?.toLowerCase().includes(s) ||
        i.code?.toLowerCase().includes(s),
    )
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const resetForm = () => setFormData({ ...EMPTY_FORM, categorieFosa: filterCategorie })

  const openNew = () => {
    setEditing(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openEdit = (it: EquipementStandard) => {
    setEditing(it)
    setFormData({
      categorieFosa: it.categorieFosa || "CSI",
      famille: it.famille || "bio",
      service: it.service || "",
      code: it.code || "",
      designation: it.designation || "",
      specifications: it.specifications || "",
      quantiteStandard: it.quantiteStandard || "",
      prixUnitaire: it.prixUnitaire || "",
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.designation.trim()) {
      toast.warning("La désignation est obligatoire.")
      return
    }
    setSubmitting(true)
    try {
      const payload: any = { ...formData }
      for (const k of ["service", "code", "specifications", "quantiteStandard", "prixUnitaire"]) {
        if (payload[k] === "") payload[k] = null
      }
      if (editing) {
        await equipementStandardService.update(editing.id, payload)
        toast.success("Équipement standard mis à jour.")
      } else {
        await equipementStandardService.create(payload)
        toast.success("Équipement standard créé.")
      }
      setIsModalOpen(false)
      setEditing(null)
      resetForm()
      load()
    } catch (err) {
      console.error("save equipement-standard", err)
      // message affiché par l'intercepteur API
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!confirm.item) return
    setSubmitting(true)
    try {
      await equipementStandardService.remove(confirm.item.id)
      setConfirm({ isOpen: false, item: null })
      load()
    } catch (e) {
      console.error("delete equipement-standard", e)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "code", label: "Code", render: (i: EquipementStandard) => <span className="font-mono text-xs">{i.code || "—"}</span> },
    { key: "designation", label: "Désignation", render: (i: EquipementStandard) => <span className="font-medium text-gray-900">{i.designation}</span> },
    { key: "service", label: "Service", render: (i: EquipementStandard) => i.service || "—" },
    {
      key: "famille",
      label: "Famille",
      render: (i: EquipementStandard) => (
        <Badge variant={i.famille === "bio" ? "info" : "neutral"} withDot>
          {i.famille === "bio" ? "Biomédical" : "Non biomédical"}
        </Badge>
      ),
    },
    { key: "quantiteStandard", label: "Qté", render: (i: EquipementStandard) => <span className="tabular-nums">{i.quantiteStandard || "—"}</span> },
    { key: "prixUnitaire", label: "P.U (FCFA)", render: (i: EquipementStandard) => <span className="tabular-nums">{i.prixUnitaire || "—"}</span> },
  ]

  const canManage = permissions.canManageEquipments

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Équipements"
        title="Catalogue standard"
        description="Liste standard d'équipements par catégorie de FOSA (MINSANTÉ). Gérez le référentiel utilisé par les listes déroulantes des formulaires."
        actions={
          permissions.canCreate && canManage ? (
            <button onClick={openNew} className="btn btn-primary">
              <Plus className="size-4" />
              Ajouter
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Catégorie ${filterCategorie}`}
          value={formatNumber(filtered.length)}
          hint={`${CATEGORIES_FOSA.find((c) => c.code === filterCategorie)?.label ?? ""}`}
          tone="brand"
          icon={<ListChecks />}
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} className="w-full sm:w-64" />
        <div className="w-full sm:w-56">
          <Select
            value={filterCategorie}
            onChange={setFilterCategorie}
            options={CATEGORIES_FOSA.map((c) => ({ value: c.code, label: c.label }))}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            value={filterFamille}
            onChange={setFilterFamille}
            placeholder="Toutes les familles"
            options={[
              { value: "bio", label: "Biomédical" },
              { value: "autre", label: "Non biomédical" },
            ]}
          />
        </div>
      </FilterBar>

      {loading ? (
        <div className="card flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="mr-2 size-5 animate-spin" /> Chargement…
        </div>
      ) : (
        <DataTable
          data={pageItems}
          columns={columns}
          onEdit={permissions.canEdit && canManage ? openEdit : undefined}
          onDelete={permissions.canDelete && canManage ? (it) => setConfirm({ isOpen: true, item: it }) : undefined}
          pagination={{ page, limit: PER_PAGE, total: filtered.length, totalPages }}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="large" title={editing ? "Modifier l'équipement standard" : "Ajouter un équipement standard"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Catégorie de FOSA *</label>
              <Select
                value={formData.categorieFosa}
                onChange={(v) => setFormData({ ...formData, categorieFosa: v })}
                options={CATEGORIES_FOSA.map((c) => ({ value: c.code, label: c.label }))}
              />
            </div>
            <div>
              <label className="label">Famille *</label>
              <Select
                value={formData.famille}
                onChange={(v) => setFormData({ ...formData, famille: v })}
                options={[
                  { value: "bio", label: "Biomédical" },
                  { value: "autre", label: "Non biomédical" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="label">Désignation *</label>
            <input
              type="text"
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Service / Section</label>
              <input type="text" value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} className="input" placeholder="Ex: Équipements médicaux" />
            </div>
            <div>
              <label className="label">Code</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Quantité standard</label>
              <input type="text" value={formData.quantiteStandard} onChange={(e) => setFormData({ ...formData, quantiteStandard: e.target.value })} className="input" placeholder="Ex: 1" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Prix unitaire (FCFA)</label>
              <input type="text" value={formData.prixUnitaire} onChange={(e) => setFormData({ ...formData, prixUnitaire: e.target.value })} className="input" placeholder="Ex: 55 000" />
            </div>
          </div>

          <div>
            <label className="label">Spécifications techniques</label>
            <textarea
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              rows={4}
              className="input"
              placeholder="Caractéristiques techniques de l'équipement…"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                editing ? "Modifier" : "Ajouter"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={() => setConfirm({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Supprimer « ${confirm.item?.designation} » du catalogue standard ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
