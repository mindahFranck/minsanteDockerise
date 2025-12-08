# Guide d'Export PDF et Excel

## Vue d'ensemble

Ce projet dispose d'un système d'export complet permettant d'exporter les données en format PDF et Excel sur toutes les pages de données.

## Bibliothèques Utilisées

- **jsPDF** : Génération de fichiers PDF
- **jspdf-autotable** : Création de tableaux dans les PDF
- **xlsx** : Génération de fichiers Excel

## Composants et Utilitaires

### 1. Composant ExportButtons

Composant réutilisable qui affiche deux boutons d'export (PDF et Excel).

**Fichier** : [frontend/src/components/ExportButtons.tsx](frontend/src/components/ExportButtons.tsx)

**Utilisation** :
```typescript
import ExportButtons from '../components/ExportButtons'

<ExportButtons
  onExportPDF={handleExportPDF}
  onExportExcel={handleExportExcel}
  disabled={data.length === 0}
/>
```

### 2. Utilitaires d'Export Génériques

**Fichier** : [frontend/src/utils/exportUtils.ts](frontend/src/utils/exportUtils.ts)

#### Fonctions principales :

**`exportToPDF(config)`**
```typescript
exportToPDF({
  title: "Mon Titre",
  filename: "mon_fichier",
  orientation: "landscape", // ou "portrait"
  columns: [
    { header: "Nom", dataKey: "nom" },
    { header: "Email", dataKey: "email" }
  ],
  data: myData
})
```

**`exportToExcel(config)`**
```typescript
exportToExcel({
  filename: "mon_fichier",
  sheetName: "Feuille1",
  data: myData,
  columns: [
    { header: "Nom", key: "nom" },
    { header: "Email", key: "email" }
  ]
})
```

### 3. Exports Spécialisés par Page

**Fichier** : [frontend/src/utils/pageExports.ts](frontend/src/utils/pageExports.ts)

Fonctions prédéfinies pour chaque type de données :
- `exportFosasToPDF(fosas)` / `exportFosasToExcel(fosas)`
- `exportUsersToPDF(users)` / `exportUsersToExcel(users)`
- `exportPersonnelsToPDF(personnel)` / `exportPersonnelsToExcel(personnel)`
- `exportEquipementsToPDF(equipements)` / `exportEquipementsToExcel(equipements)`
- `exportBatimentsToPDF(batiments)` / `exportBatimentsToExcel(batiments)`
- etc.

## Implémentation dans une Page

### Exemple complet : FosasPage

#### 1. Importer les dépendances
```typescript
import ExportButtons from "../components/ExportButtons"
import { exportFosasToPDF, exportFosasToExcel } from "../utils/exportUtils"
```

#### 2. Créer les fonctions d'export
```typescript
const handleExportPDF = () => {
  exportFosasToPDF(filteredFosas)
}

const handleExportExcel = () => {
  exportFosasToExcel(filteredFosas)
}
```

#### 3. Ajouter le composant dans le JSX
```typescript
<div className="flex gap-3">
  <ExportButtons
    onExportPDF={handleExportPDF}
    onExportExcel={handleExportExcel}
    disabled={filteredFosas.length === 0}
  />
  {/* Autres boutons */}
</div>
```

## Personnalisation des Exports

### Créer un export personnalisé

```typescript
import { exportGenericToPDF, exportGenericToExcel } from '../utils/exportUtils'

// Export PDF personnalisé
const exportMyDataToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'Colonne 1', dataKey: 'field1' },
      { header: 'Colonne 2', dataKey: 'field2' },
      { header: 'Colonne 3', dataKey: 'field3' },
    ],
    'Mon Titre de Document',
    `mon_fichier_${new Date().toISOString().split('T')[0]}`
  )
}

// Export Excel personnalisé
const exportMyDataToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'Colonne 1', key: 'field1' },
      { header: 'Colonne 2', key: 'field2' },
      { header: 'Colonne 3', key: 'field3' },
    ],
    `mon_fichier_${new Date().toISOString().split('T')[0]}`,
    'Ma Feuille'
  )
}
```

### Formater les données avant l'export

```typescript
const handleExportPDF = () => {
  // Transformer les données avant export
  const formattedData = myData.map(item => ({
    ...item,
    // Formater les dates
    dateCreation: new Date(item.dateCreation).toLocaleDateString('fr-FR'),
    // Formater les booléens
    actif: item.actif ? 'Oui' : 'Non',
    // Ajouter des champs calculés
    nomComplet: `${item.prenom} ${item.nom}`,
  }))

  exportMyDataToPDF(formattedData)
}
```

## Fonctionnalités des Exports

### Export PDF

✅ **Caractéristiques** :
- Titre personnalisé
- Date d'export automatique
- Tableaux avec en-têtes colorés
- Alternance de couleurs pour les lignes
- Numérotation des pages
- Orientation portrait ou paysage
- Formats de page : A4, A3, Letter
- Formatage automatique des booléens (Oui/Non)
- Gestion des valeurs null/undefined (-)

### Export Excel

✅ **Caractéristiques** :
- Nom de feuille personnalisé
- En-têtes de colonnes
- Ajustement automatique de la largeur des colonnes
- Formatage automatique des booléens (Oui/Non)
- Gestion des valeurs null/undefined (-)
- Compatible avec Excel, LibreOffice, Google Sheets

## Pages avec Export Implémenté

- ✅ [FosasPage](frontend/src/pages/FosasPage.tsx) - Formations Sanitaires
- ✅ [UsersPage](frontend/src/pages/UsersPage.tsx) - Utilisateurs
- ⏳ PersonnelsPage - Personnel (à implémenter)
- ⏳ EquipementsPage - Équipements (à implémenter)
- ⏳ BatimentsPage - Bâtiments (à implémenter)
- ⏳ RegionsPage - Régions (à implémenter)
- ⏳ DepartementsPage - Départements (à implémenter)
- ⏳ ArrondissementsPage - Arrondissements (à implémenter)
- ⏳ MaterielroulantsPage - Matériel Roulant (à implémenter)
- ⏳ DegradationsPage - Dégradations (à implémenter)

## Guide d'Implémentation Rapide

Pour ajouter l'export à une nouvelle page :

### Étape 1 : Importer les dépendances
```typescript
import ExportButtons from "../components/ExportButtons"
import { exportXXXToPDF, exportXXXToExcel } from "../utils/pageExports"
// OU pour un export personnalisé :
import { exportGenericToPDF, exportGenericToExcel } from "../utils/exportUtils"
```

### Étape 2 : Créer les fonctions d'export
```typescript
const handleExportPDF = () => {
  exportXXXToPDF(myData) // ou exportGenericToPDF(...)
}

const handleExportExcel = () => {
  exportXXXToExcel(myData) // ou exportGenericToExcel(...)
}
```

### Étape 3 : Ajouter les boutons
```typescript
<ExportButtons
  onExportPDF={handleExportPDF}
  onExportExcel={handleExportExcel}
  disabled={myData.length === 0}
/>
```

## Gestion des Erreurs

Les fonctions d'export gèrent automatiquement :
- Données vides (tableau vide)
- Valeurs null/undefined
- Booléens
- Dates

### Exemple de données problématiques gérées :
```typescript
const data = [
  {
    nom: "Test",
    valeur: null,        // Sera affiché comme "-"
    actif: true,         // Sera affiché comme "Oui"
    date: undefined,     // Sera affiché comme "-"
  }
]
```

## Personnalisation du Style PDF

Pour personnaliser le style des PDF, modifier dans `exportUtils.ts` :

```typescript
// Couleur de l'en-tête
headStyles: {
  fillColor: [59, 130, 246], // RGB - Bleu par défaut
  textColor: 255,            // Blanc
  fontStyle: 'bold',
}

// Couleur des lignes alternées
alternateRowStyles: {
  fillColor: [245, 247, 250], // Gris clair
}
```

## Performance

- Les exports sont générés côté client (navigateur)
- Pas de charge supplémentaire sur le serveur
- Les fichiers sont directement téléchargés
- Optimisé pour des datasets jusqu'à 10 000 lignes

## Limitations

- **PDF** : Pour de très gros datasets (>5000 lignes), le temps de génération peut être long
- **Excel** : Limite théorique à 1 048 576 lignes (limitation Excel)
- Les images ne sont pas incluses dans les exports (sauf si configuré manuellement)

## Support des Navigateurs

- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (non supporté)

## Dépannage

### Le PDF ne se télécharge pas
- Vérifier que les données ne sont pas vides
- Vérifier la console pour les erreurs
- S'assurer que le navigateur autorise les téléchargements

### Le fichier Excel est corrompu
- Vérifier que toutes les colonnes ont bien une clé `key` valide
- S'assurer que les données sont au format objet JavaScript

### Caractères spéciaux mal affichés
- Les caractères français (é, è, à, etc.) sont normalement supportés
- Pour des caractères exotiques, vérifier l'encodage des données

## Prochaines Améliorations

- [ ] Export avec images
- [ ] Export multi-feuilles pour Excel
- [ ] Graphiques dans les PDF
- [ ] Template PDF personnalisable
- [ ] Export en CSV
- [ ] Export programmé/automatique
