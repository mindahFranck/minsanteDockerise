"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Upload, Download, Table2, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import importService, { type TableStructure, type ImportResult } from "../services/importService"

export default function ImportExcelPage() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [tableStructure, setTableStructure] = useState<TableStructure | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [foreignKeyMappings, setForeignKeyMappings] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(1)

  useEffect(() => {
    loadTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      loadTableStructure()
      setCurrentStep(2)
    } else {
      setTableStructure(null)
      setCurrentStep(1)
    }
  }, [selectedTable])

  const loadTables = async () => {
    try {
      setLoading(true)
      const data = await importService.getImportableTables()
      setTables(data)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des tables")
    } finally {
      setLoading(false)
    }
  }

  const loadTableStructure = async () => {
    try {
      setLoading(true)
      const structure = await importService.getTableStructure(selectedTable)
      setTableStructure(structure)

      // Initialiser les mappages de clés étrangères avec la première option
      const mappings: { [key: string]: number } = {}
      Object.keys(structure.foreignKeys).forEach((fkColumn) => {
        if (structure.foreignKeys[fkColumn].options.length > 0) {
          mappings[fkColumn] = structure.foreignKeys[fkColumn].options[0].id
        }
      })
      setForeignKeyMappings(mappings)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de la structure de la table")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    if (!selectedTable) return

    try {
      setLoading(true)
      const blob = await importService.downloadTemplate(selectedTable)
      importService.downloadFile(blob, `${selectedTable}_template.xlsx`)
    } catch (err: any) {
      setError(err.message || "Erreur lors du téléchargement du modèle")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier que c'est un fichier Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]
      if (!validTypes.includes(file.type)) {
        setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)')
        return
      }
      setSelectedFile(file)
      setError(null)
      setCurrentStep(4)
    }
  }

  const handleImport = async () => {
    if (!selectedTable || !selectedFile) return

    try {
      setLoading(true)
      setError(null)
      setImportResult(null)

      const result = await importService.importData(
        selectedTable,
        selectedFile,
        Object.keys(foreignKeyMappings).length > 0 ? foreignKeyMappings : undefined
      )

      setImportResult(result)
      setSelectedFile(null)

      // Réinitialiser l'input file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'import")
    } finally {
      setLoading(false)
    }
  }

  const getTableDisplayName = (table: string): string => {
    const names: { [key: string]: string } = {
      batiments: 'Bâtiments',
      categories: 'Catégories',
      degradations: 'Dégradations',
      equipebios: 'Équipements biomédicaux',
      equipements: 'Équipements',
      fosas: 'Formations sanitaires (FOSA)',
      materielroulants: 'Matériel roulant',
      parametres: 'Paramètres',
      personnels: 'Personnel',
      services: 'Services',
      users: 'Utilisateurs',
      audit_logs: 'Journaux d\'audit',
      cameroun: 'Données Cameroun',
      communes: 'Communes',
      district: 'Districts',
      permissions: 'Permissions',
      role_permissions: 'Rôles-Permissions',
      roles: 'Rôles'
    }
    return names[table] || table
  }

  const getForeignKeyDisplayName = (fkColumn: string): string => {
    const names: { [key: string]: string } = {
      fosa_id: 'Formation Sanitaire (FOSA)',
      airesante_id: 'Aire de Santé',
      arrondissement_id: 'Arrondissement',
      departement_id: 'Département',
      region_id: 'Région',
      district_id: 'District',
      batiment_id: 'Bâtiment',
      service_id: 'Service',
      categorie_id: 'Catégorie',
      degradation_id: 'Dégradation',
      user_id: 'Utilisateur',
      role_id: 'Rôle',
      permission_id: 'Permission'
    }
    return names[fkColumn] || fkColumn
  }

  const resetImport = () => {
    setSelectedTable("")
    setTableStructure(null)
    setSelectedFile(null)
    setForeignKeyMappings({})
    setImportResult(null)
    setError(null)
    setCurrentStep(1)
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          Import Excel - Import en Masse
        </h1>
        <p className="text-gray-600 mt-2">
          Importez des données en masse depuis des fichiers Excel. Suivez les étapes ci-dessous.
        </p>
      </div>

      {/* Indicateur de progression */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className={`text-sm ${currentStep >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            Choisir la table
          </span>
          <span className={`text-sm ${currentStep >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            Configurer
          </span>
          <span className={`text-sm ${currentStep >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            Télécharger modèle
          </span>
          <span className={`text-sm ${currentStep >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            Importer
          </span>
        </div>
      </div>

      {/* Étape 1: Sélection de la table */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Table2 className="w-5 h-5 text-blue-600" />
            Étape 1: Sélectionnez la table à importer
          </h2>
          {selectedTable && (
            <button
              onClick={resetImport}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Changer de table
            </button>
          )}
        </div>

        {!selectedTable ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="font-medium text-sm">{getTableDisplayName(table)}</div>
                <div className="text-xs text-gray-500 mt-1">{table}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">{getTableDisplayName(selectedTable)}</div>
                <div className="text-sm text-blue-700">Table: {selectedTable}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Étape 2: Configuration des clés étrangères */}
      {tableStructure && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Étape 2: Configurez les relations (Clés Étrangères)
          </h2>

          {Object.keys(tableStructure.foreignKeys).length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Cette table n'a pas de clés étrangères. Vous pouvez passer à l'étape suivante.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Sélectionnez les valeurs pour les relations. Ces valeurs seront utilisées
                  pour tous les enregistrements du fichier Excel qui n'ont pas de valeur spécifiée pour ces colonnes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(tableStructure.foreignKeys).map(([fkColumn, fkInfo]) => (
                  <div key={fkColumn} className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      {getForeignKeyDisplayName(fkColumn)}
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        ({fkColumn} → {fkInfo.referenced_table})
                      </span>
                    </label>

                    {fkInfo.options.length === 0 ? (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                        ⚠️ Aucune donnée disponible dans la table {fkInfo.referenced_table}.
                        Veuillez d'abord ajouter des enregistrements.
                      </div>
                    ) : (
                      <select
                        value={foreignKeyMappings[fkColumn] || ''}
                        onChange={(e) => {
                          setForeignKeyMappings({
                            ...foreignKeyMappings,
                            [fkColumn]: Number.parseInt(e.target.value),
                          })
                          setCurrentStep(3)
                        }}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {fkInfo.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.nom || option.id} (ID: {option.id})
                          </option>
                        ))}
                      </select>
                    )}

                    <p className="text-xs text-gray-600 mt-2">
                      Total: {fkInfo.options.length} option(s) disponible(s)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Étape 3: Téléchargement du modèle */}
      {selectedTable && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Étape 3: Téléchargez le fichier modèle Excel
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 mb-2">
              Le fichier modèle contient:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>✓ Les en-têtes de colonnes avec les types de données</li>
              <li>✓ Les annotations pour les clés étrangères</li>
              <li>✓ Une ligne d'exemple (à supprimer avant l'import)</li>
            </ul>
          </div>

          <button
            onClick={() => {
              handleDownloadTemplate()
              setCurrentStep(4)
            }}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            {loading ? 'Téléchargement...' : 'Télécharger le Modèle Excel'}
          </button>
        </div>
      )}

      {/* Étape 4: Upload et import */}
      {selectedTable && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Étape 4: Importez vos données
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez votre fichier Excel rempli
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              {selectedFile && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Fichier sélectionné:</span> {selectedFile.name}
                    <span className="text-gray-600">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={!selectedFile || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              <Upload className="w-6 h-6" />
              {loading ? 'Import en cours...' : 'Lancer l\'Import en Masse'}
            </button>
          </div>
        </div>
      )}

      {/* Résultat de l'import */}
      {importResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Résultat de l'Import</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total de lignes</div>
              <div className="text-3xl font-bold text-gray-900">{importResult.total}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <div className="text-sm text-green-600 flex items-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4" />
                Importées avec succès
              </div>
              <div className="text-3xl font-bold text-green-700">{importResult.success}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <div className="text-sm text-red-600 flex items-center gap-1 mb-1">
                <XCircle className="w-4 h-4" />
                Erreurs
              </div>
              <div className="text-3xl font-bold text-red-700">{importResult.errors}</div>
            </div>
          </div>

          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Détails des erreurs ({importResult.errorDetails.length} premières)
              </h3>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {importResult.errorDetails.map((error, index) => (
                  <div key={index} className="text-sm mb-3 pb-3 border-b border-red-200 last:border-0 last:pb-0 last:mb-0">
                    <span className="font-semibold text-red-900">Ligne {error.row}:</span>{' '}
                    <span className="text-red-700">{error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={resetImport}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Nouvel Import
            </button>
            <button
              onClick={() => setImportResult(null)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Erreurs */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
