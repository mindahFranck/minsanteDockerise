# Système de Permissions Basé sur les Rôles (RBAC)

## Vue d'ensemble

Ce projet implémente un système de contrôle d'accès basé sur les rôles (Role-Based Access Control - RBAC) qui masque automatiquement les fonctionnalités auxquelles un utilisateur n'a pas accès selon son rôle.

## Rôles Disponibles

| Rôle | Description | Niveau d'accès |
|------|-------------|----------------|
| **super_admin** | Super administrateur | Accès complet à toutes les fonctionnalités |
| **admin** | Administrateur | Accès étendu, gestion des données mais pas des utilisateurs |
| **manager** | Gestionnaire | Création et modification, pas de suppression |
| **user** | Utilisateur standard | Lecture seule |

## Permissions par Rôle

### Super Admin (super_admin)
- ✅ Toutes les permissions
- ✅ Gestion des utilisateurs
- ✅ Gestion des paramètres système
- ✅ Import de données
- ✅ Création, modification, suppression de toutes les données
- ✅ Accès national (toutes les régions)

### Admin (admin)
- ✅ Gestion des données (FOSA, personnel, équipements, etc.)
- ✅ Gestion des paramètres
- ✅ Import de données
- ✅ Création, modification, suppression
- ❌ Gestion des utilisateurs (réservé au super_admin)
- ⚠️ Accès géographique selon le scope (national/régional/etc.)

### Manager (manager)
- ✅ Consultation de toutes les données
- ✅ Création de nouvelles entrées
- ✅ Modification des données existantes
- ❌ Suppression de données
- ❌ Gestion des utilisateurs
- ❌ Import de données
- ❌ Gestion des dégradations
- ⚠️ Accès géographique selon le scope

### User (user/viewer)
- ✅ Consultation des données uniquement
- ❌ Toute modification ou création
- ❌ Toute fonctionnalité administrative
- ⚠️ Accès géographique selon le scope

## Utilisation du Hook `usePermissions`

### Import
```typescript
import { usePermissions } from '../hooks/usePermissions'
```

### Dans un composant
```typescript
export default function MyPage() {
  const permissions = usePermissions()

  return (
    <div>
      {/* Bouton visible uniquement si l'utilisateur peut créer */}
      {permissions.canCreate && permissions.canManageFosas && (
        <button onClick={handleCreate}>
          Ajouter une FOSA
        </button>
      )}

      {/* Table avec actions conditionnelles */}
      <DataTable
        data={data}
        columns={columns}
        onEdit={permissions.canEdit ? handleEdit : undefined}
        onDelete={permissions.canDelete ? handleDelete : undefined}
      />
    </div>
  )
}
```

## Permissions Disponibles

```typescript
interface Permissions {
  // Permissions de base
  canView: boolean              // Lecture des données
  canCreate: boolean            // Création de nouvelles entrées
  canEdit: boolean              // Modification des données
  canDelete: boolean            // Suppression de données

  // Permissions administratives
  canManageUsers: boolean       // Gestion des utilisateurs
  canManageSettings: boolean    // Gestion des paramètres
  canImportData: boolean        // Import de données Excel

  // Permissions géographiques
  canViewAllRegions: boolean    // Vue sur toutes les régions
  canEditAllRegions: boolean    // Édition sur toutes les régions

  // Permissions par module
  canManagePersonnel: boolean
  canManageEquipments: boolean
  canManageFosas: boolean
  canManageBuildings: boolean
  canManageDegradations: boolean
}
```

## Hooks Utilitaires

### useHasPermission
Vérifie une seule permission :
```typescript
import { useHasPermission } from '../hooks/usePermissions'

const canManageUsers = useHasPermission('canManageUsers')

if (canManageUsers) {
  // Afficher le bouton d'ajout d'utilisateur
}
```

### useHasAllPermissions
Vérifie plusieurs permissions (AND logique) :
```typescript
import { useHasAllPermissions } from '../hooks/usePermissions'

const canFullyManageFosas = useHasAllPermissions([
  'canCreate',
  'canEdit',
  'canDelete',
  'canManageFosas'
])
```

### useHasAnyPermission
Vérifie au moins une permission (OR logique) :
```typescript
import { useHasAnyPermission } from '../hooks/usePermissions'

const canDoSomething = useHasAnyPermission([
  'canManageFosas',
  'canManageBuildings'
])
```

## Masquage de la Navigation

Le système masque automatiquement les éléments de navigation selon les permissions dans `Layout.tsx`.

### Ajouter une nouvelle page avec permissions
```typescript
// Dans Layout.tsx
const navigationSections: NavSection[] = [
  {
    title: "Mon Module",
    collapsible: true,
    items: [
      {
        name: "Ma Page",
        href: "/dashboard/mapage",
        icon: MonIcon,
        requiresPermission: "canManageFosas" // Permission requise
      }
    ]
  }
]
```

## Exemples d'Implémentation

### 1. Page avec bouton d'ajout conditionnel
```typescript
export default function FosasPage() {
  const permissions = usePermissions()

  return (
    <div>
      <div className="flex justify-between">
        <h1>FOSA</h1>
        {permissions.canCreate && permissions.canManageFosas && (
          <button onClick={handleAdd}>Ajouter</button>
        )}
      </div>
    </div>
  )
}
```

### 2. Table avec actions conditionnelles
```typescript
<DataTable
  data={fosas}
  columns={columns}
  onEdit={permissions.canEdit && permissions.canManageFosas ? handleEdit : undefined}
  onDelete={permissions.canDelete && permissions.canManageFosas ? handleDelete : undefined}
/>
```

### 3. Section complète masquée
```typescript
{permissions.canManageUsers && (
  <section>
    <h2>Administration des Utilisateurs</h2>
    {/* Contenu réservé aux super_admin */}
  </section>
)}
```

## Scope Géographique

Les utilisateurs peuvent avoir un scope géographique limité :
- **national** : Accès à toutes les régions
- **regional** : Limité à une ou plusieurs régions
- **departemental** : Limité à un ou plusieurs départements
- **arrondissement** : Limité à un ou plusieurs arrondissements

```typescript
const { user } = useAuth()
const permissions = usePermissions()

// Vérifier le scope
if (permissions.canViewAllRegions) {
  // Afficher toutes les régions
} else {
  // Filtrer selon user.regionIds, user.departementIds, etc.
}
```

## Bonnes Pratiques

### ✅ À FAIRE
- Toujours vérifier les permissions avant d'afficher une action
- Combiner plusieurs permissions si nécessaire (`canCreate && canManageFosas`)
- Masquer complètement les éléments non autorisés (pas seulement les désactiver)
- Utiliser le hook `usePermissions` au début du composant

### ❌ À ÉVITER
- Afficher des boutons désactivés pour des actions non autorisées
- Dupliquer la logique de permissions dans plusieurs composants
- Modifier directement le hook `usePermissions` pour un cas particulier
- Oublier d'ajouter des vérifications backend (la sécurité frontend n'est pas suffisante)

## Sécurité

⚠️ **IMPORTANT** : Les permissions frontend sont pour l'UX uniquement. Toutes les opérations doivent AUSSI être validées côté backend.

Le système frontend :
- Améliore l'expérience utilisateur en masquant les actions non autorisées
- Évite les erreurs 403 Forbidden
- Rend l'interface plus claire et intuitive

Le système backend doit :
- Valider TOUTES les requêtes selon le rôle de l'utilisateur
- Retourner 403 Forbidden pour les actions non autorisées
- Filtrer les données selon le scope géographique de l'utilisateur

## Débogage

Pour vérifier les permissions d'un utilisateur :
```typescript
const permissions = usePermissions()
console.log('Permissions:', permissions)
```

Pour voir l'utilisateur connecté :
```typescript
const { user } = useAuth()
console.log('User:', user)
console.log('Role:', user?.role)
console.log('Scope:', user?.scopeType)
```

## Migration des Pages Existantes

Pour ajouter le système de permissions à une page existante :

1. Importer le hook :
```typescript
import { usePermissions } from '../hooks/usePermissions'
```

2. L'utiliser dans le composant :
```typescript
const permissions = usePermissions()
```

3. Entourer le bouton d'ajout :
```typescript
{permissions.canCreate && permissions.canManageXXX && (
  <button>Ajouter</button>
)}
```

4. Modifier le DataTable :
```typescript
<DataTable
  onEdit={permissions.canEdit && permissions.canManageXXX ? handleEdit : undefined}
  onDelete={permissions.canDelete && permissions.canManageXXX ? handleDelete : undefined}
/>
```

## Support

Pour toute question sur le système de permissions, consultez :
- Le fichier source : `frontend/src/hooks/usePermissions.ts`
- Le composant Layout : `frontend/src/components/Layout.tsx`
- Les exemples : `frontend/src/pages/FosasPage.tsx` et `frontend/src/pages/UsersPage.tsx`
