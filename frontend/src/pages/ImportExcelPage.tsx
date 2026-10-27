"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Upload, Download, Table2, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Info, Check } from "lucide-react"
import { PageHeader, SectionCard, StatCard } from "../components/ui"
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
      // Normaliser pour éviter tout crash si le backend omet un champ
      const safeStructure: TableStructure = {
        table: structure?.table ?? selectedTable,
        columns: structure?.columns ?? [],
        foreignKeys: structure?.foreignKeys ?? {},
        requiredColumns: structure?.requiredColumns ?? [],
      }
      setTableStructure(safeStructure)

      // Initialiser les mappages de clés étrangères avec la première option
      const mappings: { [key: string]: number } = {}
      Object.keys(safeStructure.foreignKeys).forEach((fkColumn) => {
        const fk = safeStructure.foreignKeys[fkColumn]
        if (fk?.options?.length > 0) {
          mappings[fkColumn] = fk.options[0].id
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
      tmpfosa: 'Formations sanitaires (FOSA)',
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

  const steps = ["Choisir la table", "Configurer", "Télécharger modèle", "Importer"]

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <PageHeader
        kicker="Outils"
        title="Import Excel - Import en Masse"
        description="Importez des données en masse depuis des fichiers Excel. Suivez les étapes ci-dessous."
      />

      {/* Indicateur de progression */}
      <div className="card p-6">
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((labelText, idx) => {
            const step = idx + 1
            const reached = currentStep >= step
            return (
              <li key={step} className="min-w-0">
                <div className="flex items-center">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                      reached ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                  {step < 4 && (
                    <span className={`mx-2 h-1 flex-1 rounded-full ${currentStep > step ? "bg-brand-500" : "bg-track"}`} />
                  )}
                </div>
                <p className={`mt-2 truncate text-sm ${reached ? "font-semibold text-brand-600" : "text-gray-500"}`}>
                  {labelText}
                </p>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Étape 1: Sélection de la table */}
      <SectionCard
        title={<StepTitle icon={<Table2 />} step={1} text="Sélectionnez la table à importer" />}
        actions={
          selectedTable ? (
            <button onClick={resetImport} className="btn btn-ghost btn-sm text-brand-500">
              Changer de table
            </button>
          ) : undefined
        }
      >
        {!selectedTable ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-50"
              >
                <div className="text-sm font-semibold text-gray-900">{getTableDisplayName(table)}</div>
                <div className="mt-1 font-mono text-xs text-gray-500">{table}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <CheckCircle className="size-5 shrink-0 text-brand-500" />
            <div>
              <div className="font-semibold text-gray-900">{getTableDisplayName(selectedTable)}</div>
              <div className="text-sm text-gray-500">
                Table: <span className="font-mono">{selectedTable}</span>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Étape 2: Configuration des clés étrangères */}
      {tableStructure && (
        <SectionCard title={<StepTitle icon={<Info />} step={2} text="Configurez les relations (Clés Étrangères)" />}>
          {Object.keys(tableStructure.foreignKeys).length === 0 ? (
            <Notice tone="success" icon={<CheckCircle />}>
              Cette table n'a pas de clés étrangères. Vous pouvez passer à l'étape suivante.
            </Notice>
          ) : (
            <div className="space-y-5">
              <Notice tone="warning" icon={<AlertTriangle />}>
                <strong>Important:</strong> Sélectionnez les valeurs pour les relations. Ces valeurs seront utilisées
                pour tous les enregistrements du fichier Excel qui n'ont pas de valeur spécifiée pour ces colonnes.
              </Notice>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(tableStructure.foreignKeys).map(([fkColumn, fkInfo]) => (
                  <div key={fkColumn} className="rounded-xl border border-gray-200 bg-surface p-4">
                    <label className="label">
                      {getForeignKeyDisplayName(fkColumn)}
                      <span className="ml-2 font-mono text-xs font-normal text-gray-500">
                        ({fkColumn} → {fkInfo.referenced_table})
                      </span>
                    </label>

                    {fkInfo.options.length === 0 ? (
                      <Notice tone="danger" icon={<AlertTriangle />}>
                        Aucune donnée disponible dans la table {fkInfo.referenced_table}.
                        Veuillez d'abord ajouter des enregistrements.
                      </Notice>
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
                        className="input"
                      >
                        {fkInfo.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.nom || option.id} (ID: {option.id})
                          </option>
                        ))}
                      </select>
                    )}

                    <p className="mt-2 text-xs text-gray-500">
                      Total: {fkInfo.options.length} option(s) disponible(s)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Étape 3: Téléchargement du modèle */}
      {selectedTable && (
        <SectionCard title={<StepTitle icon={<Download />} step={3} text="Téléchargez le fichier modèle Excel" />}>
          <div className="mb-4 rounded-xl border border-gray-200 bg-surface p-4">
            <p className="mb-2 text-sm font-medium text-gray-900">Le fichier modèle contient:</p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Check className="size-4 text-success" />Les en-têtes de colonnes avec les types de données</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-success" />Les annotations pour les clés étrangères</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-success" />Une ligne d'exemple (à supprimer avant l'import)</li>
            </ul>
          </div>

          <button
            onClick={() => {
              handleDownloadTemplate()
              setCurrentStep(4)
            }}
            disabled={loading}
            className="btn btn-outline"
          >
            <FileSpreadsheet className="size-4 text-success" />
            {loading ? 'Téléchargement...' : 'Télécharger le Modèle Excel'}
          </button>
        </SectionCard>
      )}

      {/* Étape 4: Upload et import */}
      {selectedTable && (
        <SectionCard title={<StepTitle icon={<Upload />} step={4} text="Importez vos données" />}>
          <div className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="label">
                Sélectionnez votre fichier Excel rempli
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 bg-surface p-2 text-sm text-gray-500
                  file:mr-4 file:h-9 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4
                  file:text-sm file:font-semibold file:text-brand-500 hover:file:bg-brand-100"
              />
              {selectedFile && (
                <div className="mt-3">
                  <Notice tone="success" icon={<CheckCircle />}>
                    <span className="font-semibold">Fichier sélectionné:</span> {selectedFile.name}{" "}
                    <span className="text-gray-500">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  </Notice>
                </div>
              )}
            </div>

            <button onClick={handleImport} disabled={!selectedFile || loading} className="btn btn-primary">
              <Upload className="size-4" />
              {loading ? 'Import en cours...' : 'Lancer l\'Import en Masse'}
            </button>
          </div>
        </SectionCard>
      )}

      {/* Résultat de l'import */}
      {importResult && (
        <SectionCard title="Résultat de l'Import">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total de lignes" value={importResult.total} />
            <StatCard label="Importées avec succès" value={importResult.success} tone="success" icon={<CheckCircle />} />
            <StatCard label="Erreurs" value={importResult.errors} tone={importResult.errors > 0 ? "danger" : "default"} icon={<XCircle />} />
          </div>

          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <AlertTriangle className="size-4 text-warning" />
                Détails des erreurs ({importResult.errorDetails.length} premières)
              </h3>
              <div className="max-h-96 overflow-y-auto rounded-xl border border-danger/20 bg-danger-soft/50 p-4">
                {importResult.errorDetails.map((error, index) => (
                  <div key={index} className="mb-3 border-b border-danger/15 pb-3 text-sm last:mb-0 last:border-0 last:pb-0">
                    <span className="font-semibold text-danger">Ligne {error.row}:</span>{' '}
                    <span className="text-gray-700">{error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4">
            <button onClick={resetImport} className="btn btn-outline">
              Nouvel Import
            </button>
            <button onClick={() => setImportResult(null)} className="btn btn-primary">
              Fermer
            </button>
          </div>
        </SectionCard>
      )}

      {/* Erreurs */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft p-4">
          <XCircle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div className="flex-1">
            <h3 className="font-semibold text-danger">Erreur</h3>
            <p className="mt-1 text-sm text-gray-700">{error}</p>
            <button onClick={() => setError(null)} className="btn btn-ghost btn-sm mt-2 -ml-3 text-danger">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepTitle({ icon, step, text }: { icon: React.ReactNode; step: number; text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500 [&_svg]:size-4">{icon}</span>
      <span>
        <span className="text-gray-500">Étape {step} :</span> {text}
      </span>
    </span>
  )
}

const noticeTones = {
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
} as const

function Notice({ tone, icon, children }: { tone: keyof typeof noticeTones; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${noticeTones[tone]}`}>
      <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span>
      <p className="text-gray-700">{children}</p>
    </div>
  )
}
