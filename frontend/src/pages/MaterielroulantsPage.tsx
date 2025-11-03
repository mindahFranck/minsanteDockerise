"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import DataTable from "../components/DataTable"
import Modal from "../components/Modal"
import { materielroulantService } from "../services/materielroulantService"
import { fosaService } from "../services/fosaService"
import type { Materielroulant, Fosa } from "../types"

export default function MaterielroulantsPage() {
  const [materielroulants, setMaterielroulants] = useState<Materielroulant[]>([])
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Materielroulant | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({
    numeroChassis: "",
    annee: new Date().getFullYear(),
    marque: "",
    modele: "",
    type: "",
    fosaId: 0,
  })

  useEffect(() => {
    loadData()
  }, [page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [matResponse, fosaResponse] = await Promise.all([
        materielroulantService.getAll({ page, limit: 10, search }),
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
    try {
      if (editingItem) {
        await materielroulantService.update(editingItem.id, formData)
      } else {
        await materielroulantService.create(formData)
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ numeroChassis: "", annee: new Date().getFullYear(), marque: "", modele: "", type: "", fosaId: 0 })
      loadData()
    } catch (error) {
      console.error("Error saving:", error)
    }
  }

  const handleEdit = (item: Materielroulant) => {
    setEditingItem(item)
    setFormData({
      numeroChassis: item.numeroChassis,
      annee: item.annee,
      marque: item.marque,
      modele: item.modele,
      type: item.type,
      fosaId: item.fosaId,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (item: Materielroulant) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce véhicule?`)) {
      try {
        await materielroulantService.delete(item.id)
        loadData()
      } catch (error) {
        console.error("Error deleting:", error)
      }
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "numeroChassis", label: "N° Chassis" },
    { key: "marque", label: "Marque" },
    { key: "modele", label: "Modèle" },
    { key: "type", label: "Type" },
    { key: "annee", label: "Année" },
    { key: "fosa", label: "FOSA", render: (m: Materielroulant) => m.fosa?.nom || "-" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Matériel Roulant</h1>
        <button
          onClick={() => {
            setEditingItem(null)
            setFormData({
              numeroChassis: "",
              annee: new Date().getFullYear(),
              marque: "",
              modele: "",
              type: "",
              fosaId: 0,
            })
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
          data={materielroulants}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Modifier" : "Ajouter"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de Chassis</label>
            <input
              type="text"
              value={formData.numeroChassis}
              onChange={(e) => setFormData({ ...formData, numeroChassis: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
              <input
                type="text"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modèle</label>
              <input
                type="text"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                <option value="Ambulance">Ambulance</option>
                <option value="Véhicule de service">Véhicule de service</option>
                <option value="Moto">Moto</option>
                <option value="Camion">Camion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
              <input
                type="number"
                value={formData.annee}
                onChange={(e) => setFormData({ ...formData, annee: Number.parseInt(e.target.value) })}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">FOSA</label>
            <select
              value={formData.fosaId}
              onChange={(e) => setFormData({ ...formData, fosaId: Number.parseInt(e.target.value) })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {fosas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingItem ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
