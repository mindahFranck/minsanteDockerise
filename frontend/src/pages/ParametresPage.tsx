"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AlertTriangle, Settings, Loader2, Plus } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import ConfirmDialog from "../components/ConfirmDialog"
import { PageHeader, StatCard, FilterBar, SearchInput, EmptyState, Badge, formatNumber } from "../components/ui"
import { parametreService } from "../services/parametreService"
import type { Parametre } from "../types"

/* --- Briques locales de présentation ---------------------------------------- */

/** Squelette du tableau pendant le chargement. */
function TableSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden" aria-busy="true">
      <div className="h-11 bg-table-head" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-t border-gray-100 px-4 py-4">
          <div className="h-3 w-10 rounded bg-gray-200" />
          <div className="h-3 flex-1 rounded bg-gray-200" />
          <div className="h-3 w-28 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

/** Libellé du bouton d'enregistrement, avec indicateur pendant l'envoi. */
function SubmitLabel({ submitting, label }: { submitting: boolean; label: string }) {
  return submitting ? (
    <>
      <Loader2 className="size-4 animate-spin" />
      <span>Enregistrement...</span>
    </>
  ) : (
    <>{label}</>
  )
}

export default function ParametresPage() {
  const [parametres, setParametres] = useState<Parametre[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParametre, setEditingParametre] = useState<Parametre | null>(null)
  const [search, setSearch] = useState("")
  const [filterCategorie, setFilterCategorie] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    parametre: Parametre | null
  }>({ isOpen: false, parametre: null })

  const [formData, setFormData] = useState({
    cle: "",
    valeur: "",
    categorie: "",
    description: "",
  })

  const categories = ["Système", "Sécurité", "Email", "API", "Interface", "Autre"]

  useEffect(() => {
    loadParametres()
  }, [page, search, filterCategorie])

  const loadParametres = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (filterCategorie) params.categorie = filterCategorie

      const response = await parametreService.getAll(params)
      setParametres(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading parametres:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingParametre) {
        await parametreService.update(editingParametre.id, formData)
      } else {
        await parametreService.create(formData)
      }
      setIsModalOpen(false)
      setEditingParametre(null)
      resetForm()
      loadParametres()
    } catch (error) {
      console.error("Error saving parametre:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      cle: "",
      valeur: "",
      categorie: "",
      description: "",
    })
  }

  const handleEdit = (parametre: Parametre) => {
    setEditingParametre(parametre)
    setFormData({
      cle: parametre.cle,
      valeur: parametre.valeur,
      categorie: parametre.categorie || "",
      description: parametre.description || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = (parametre: Parametre) => {
    setConfirmDialog({ isOpen: true, parametre })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.parametre) return

    setSubmitting(true)
    try {
      await parametreService.delete(confirmDialog.parametre.id)
      setConfirmDialog({ isOpen: false, parametre: null })
      loadParametres()
    } catch (error) {
      console.error("Error deleting parametre:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "cle", label: "Clé" },
    { key: "valeur", label: "Valeur", render: (p: Parametre) => (
      <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">{p.valeur}</span>
    )},
    {
      key: "categorie",
      label: "Catégorie",
      render: (p: Parametre) => (
        <Badge variant={p.categorie ? "info" : "neutral"}>
          {p.categorie || "N/A"}
        </Badge>
      )
    },
    { key: "description", label: "Description", render: (p: Parametre) => p.description || "N/A" },
  ]

  const openCreate = () => {
    setEditingParametre(null)
    resetForm()
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Paramètres Système"
        description="Clés de configuration de l'application, classées par catégorie."
        actions={
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="size-4" />
            Ajouter
          </button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-sm text-gray-700">
          Attention : La modification des paramètres système peut affecter le fonctionnement de l'application. Effectuez les changements avec précaution.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Paramètres"
          value={loading && (pagination?.total ?? 0) === 0 ? "…" : formatNumber((pagination?.total ?? 0))}
          hint={filterCategorie ? `Catégorie ${filterCategorie}` : "Toutes catégories"}
          icon={<Settings />}
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par clé..." className="w-full sm:w-72" />
        <select
          value={filterCategorie}
          onChange={(e) => setFilterCategorie(e.target.value)}
          className="input w-auto"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </FilterBar>

      {loading ? (
        <TableSkeleton />
      ) : parametres.length === 0 && (pagination?.total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Settings />}
            title={filterCategorie ? "Aucun paramètre dans cette catégorie" : "Aucun paramètre enregistré"}
            description={filterCategorie ? "Choisissez une autre catégorie ou affichez-les toutes." : "Ajoutez un premier paramètre pour commencer."}
            action={
              filterCategorie ? (
                <button onClick={() => setFilterCategorie("")} className="btn btn-outline">Toutes les catégories</button>
              ) : (
                <button onClick={openCreate} className="btn btn-primary"><Plus className="size-4" />Ajouter</button>
              )
            }
          />
        </div>
      ) : (
        <DataTable
          data={parametres}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingParametre ? "Modifier le paramètre" : "Ajouter un paramètre"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Clé *</label>
              <input
                type="text"
                required
                value={formData.cle}
                onChange={(e) => setFormData({ ...formData, cle: e.target.value })}
                className="input font-mono"
                placeholder="Ex: app.name, max.file.size..."
                disabled={!!editingParametre}
              />
              {editingParametre && (
                <p className="mt-1 text-xs text-gray-500">La clé ne peut pas être modifiée</p>
              )}
            </div>

            <div>
              <label className="label">Valeur *</label>
              <input
                type="text"
                required
                value={formData.valeur}
                onChange={(e) => setFormData({ ...formData, valeur: e.target.value })}
                className="input font-mono"
                placeholder="Valeur du paramètre"
              />
            </div>
          </div>

          <div>
            <label className="label">Catégorie</label>
            <select
              value={formData.categorie}
              onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              className="input"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Description du paramètre et son utilité..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="btn btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <SubmitLabel submitting={submitting} label={editingParametre ? "Modifier" : "Ajouter"} />
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, parametre: null })}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le paramètre "${confirmDialog.parametre?.cle}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={submitting}
        variant="danger"
      />
    </div>
  )
}
