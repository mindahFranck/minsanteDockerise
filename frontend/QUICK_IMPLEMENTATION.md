# Guide Rapide d'Implémentation - Permissions & Export

## Pour toutes les pages restantes, suivez ce template :

### Étape 1 : Ajouter les imports (en haut du fichier)

```typescript
import ExportButtons from "../components/ExportButtons"
import { usePermissions } from "../hooks/usePermissions"
import { exportXXXToPDF, exportXXXToExcel } from "../utils/pageExports"
```

### Étape 2 : Ajouter le hook dans le composant (après `export default`)

```typescript
export default function XXXPage() {
  const permissions = usePermissions()
  // ... reste du code
```

### Étape 3 : Ajouter les fonctions d'export (avant le `return`)

```typescript
const handleExportPDF = () => exportXXXToPDF(filteredData)
const handleExportExcel = () => exportXXXToExcel(filteredData)
```

### Étape 4 : Remplacer le bouton "Ajouter"

**AVANT :**
```typescript
<h1>...</h1>
<button onClick={...}>
  <Plus />
  Ajouter
</button>
```

**APRÈS :**
```typescript
<h1>...</h1>
<div className="flex gap-3">
  <ExportButtons
    onExportPDF={handleExportPDF}
    onExportExcel={handleExportExcel}
    disabled={filteredData.length === 0}
  />
  {permissions.canCreate && permissions.canManageXXX && (
    <button onClick={...}>
      <Plus />
      Ajouter
    </button>
  )}
</div>
```

### Étape 5 : Modifier le DataTable

**AVANT :**
```typescript
<DataTable
  data={data}
  columns={columns}
  onEdit={handleEdit}
  onDelete={handleDelete}
  ...
/>
```

**APRÈS :**
```typescript
<DataTable
  data={data}
  columns={columns}
  onEdit={permissions.canEdit && permissions.canManageXXX ? handleEdit : undefined}
  onDelete={permissions.canDelete && permissions.canManageXXX ? handleDelete : undefined}
  ...
/>
```

## Correspondance des Permissions par Page

| Page | Permission à utiliser |
|------|----------------------|
| RegionsPage | `canView` (lecture seule pour tous) |
| DepartementsPage | `canView` (lecture seule pour tous) |
| ArrondissementsPage | `canView` (lecture seule pour tous) |
| DistrictsPage | `canView` (lecture seule pour tous) |
| AiresantesPage | `canView` (lecture seule pour tous) |
| ServicesPage | `canView` (lecture seule pour tous) |
| CategoriesPage | `canView` (lecture seule pour tous) |
| EquipebiosPage | `canManageEquipments` |
| MaterielroulantsPage | `canManageEquipments` |
| DegradationsPage | `canManageDegradations` |
| ParametresPage | `canManageSettings` |
| ImportExcelPage | `canImportData` |

## Fonctions d'export disponibles (déjà créées)

- ✅ `exportRegionsToPDF` / `exportRegionsToExcel`
- ✅ `exportDepartementsToPDF` / `exportDepartementsToExcel`
- ✅ `exportArrondissementsToPDF` / `exportArrondissementsToExcel`
- ✅ `exportMaterielroulantsToPDF` / `exportMaterielroulantsToExcel`
- ✅ `exportDegradationsToPDF` / `exportDegradationsToExcel`
- ✅ `exportPersonnelsToPDF` / `exportPersonnelsToExcel`
- ✅ `exportEquipementsToPDF` / `exportEquipementsToExcel`
- ✅ `exportBatimentsToPDF` / `exportBatimentsToExcel`

Pour les pages sans fonction prédéfinie, utiliser `exportGenericToPDF` et `exportGenericToExcel`.

## Pages déjà complétées ✅

1. ✅ FosasPage
2. ✅ UsersPage
3. ✅ BatimentsPage
4. ✅ EquipementsPage
5. ✅ PersonnelsPage

## Pages à compléter ⏳

6. ⏳ RegionsPage
7. ⏳ DepartementsPage
8. ⏳ ArrondissementsPage
9. ⏳ DistrictsPage
10. ⏳ AiresantesPage
11. ⏳ ServicesPage
12. ⏳ EquipebiosPage
13. ⏳ MaterielroulantsPage
14. ⏳ CategoriesPage
15. ⏳ DegradationsPage
16. ⏳ ParametresPage
17. ⏳ ImportExcelPage
