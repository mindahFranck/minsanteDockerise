# 🐛 Guide de Debug des Permissions

## Problème Signalé
L'utilisateur avec le rôle `user` voit toujours tous les boutons d'action (Ajouter, Modifier, Supprimer).

## Étapes de Diagnostic

### 1. Vérifier la Console du Navigateur

Ouvrez la console (F12) et rechargez la page. Vous devriez voir:

```
🔐 usePermissions - User: {...}
🔐 usePermissions - Role: "user"
🔐 usePermissions - ScopeType: "national"
📋 Layout - Permissions: {...}
```

### 2. Vérifier le LocalStorage

Dans la console, tapez:
```javascript
JSON.parse(localStorage.getItem('user'))
```

Vous devriez voir:
```json
{
  "id": 4,
  "email": "user@minsante.cm",
  "role": "user",
  "firstName": "Utilisateur",
  "lastName": "Test"
}
```

### 3. Permissions Attendues pour Chaque Rôle

#### En tant que **user** (rôle le plus restrictif):
```javascript
{
  canView: true,          // ✅ Peut voir
  canCreate: false,       // ❌ Ne peut PAS créer
  canEdit: false,         // ❌ Ne peut PAS modifier
  canDelete: false,       // ❌ Ne peut PAS supprimer
  canManageUsers: false,
  canManageSettings: false,
  canImportData: false,
  canViewAllRegions: false,  // ❌ Pas d'accès Géographie
  canEditAllRegions: false,
  canManagePersonnel: false,
  canManageEquipments: false,
  canManageFosas: false,
  canManageBuildings: false,
  canManageDegradations: false
}
```

**Résultat attendu dans l'interface:**
- ❌ Onglet "Géographie" MASQUÉ
- ❌ Onglet "Administration" MASQUÉ
- ✅ Peut voir: Principal, Infrastructures, Personnel, Équipements
- ❌ Bouton "Ajouter" MASQUÉ
- ❌ Bouton "Modifier" MASQUÉ (colonne actions dans tableau)
- ❌ Bouton "Supprimer" MASQUÉ (colonne actions dans tableau)
- ✅ Boutons Export PDF/Excel VISIBLES

#### En tant que **manager**:
Même résultat que **user** (lecture seule).

#### En tant que **admin**:
```javascript
{
  canView: true,
  canCreate: true,        // ✅ Peut créer
  canEdit: true,          // ✅ Peut modifier
  canDelete: false,       // ❌ Ne peut PAS supprimer
  canManageUsers: true,
  canManageSettings: true,
  canImportData: true,
  canViewAllRegions: true,  // ✅ Accès Géographie
  canEditAllRegions: true,
  canManagePersonnel: true,
  canManageEquipments: true,
  canManageFosas: true,
  canManageBuildings: true,
  canManageDegradations: true
}
```

**Résultat attendu dans l'interface:**
- ✅ Tous les onglets VISIBLES
- ✅ Bouton "Ajouter" VISIBLE
- ✅ Bouton "Modifier" VISIBLE
- ❌ Bouton "Supprimer" MASQUÉ
- ✅ Boutons Export PDF/Excel VISIBLES

#### En tant que **super_admin**:
Tout à `true` - Accès complet.

### 4. Causes Possibles du Problème

#### A. Le rôle n'est pas correctement stocké
**Symptôme**: Dans la console, `Role: undefined` ou `Role: null`

**Solution**: Vérifier que le backend retourne bien le champ `role` lors du login.

Dans la console:
```javascript
// Vérifier les données stockées
const user = JSON.parse(localStorage.getItem('user'))
console.log('Role stocké:', user.role)
```

#### B. Le hook usePermissions ne détecte pas le rôle
**Symptôme**: Dans la console, `Role: "user"` mais `canCreate: true`

**Cause**: Le switch/if dans usePermissions.ts ne capture pas correctement le rôle.

**Solution**: Vérifier les logs de debug dans `usePermissions.ts`.

#### C. Les boutons ne sont pas conditionnés
**Symptôme**: Dans la console, `canCreate: false` mais le bouton est visible

**Cause**: Le code JSX n'utilise pas les permissions correctement.

**Vérification**: Chercher dans le code de la page:
```typescript
{permissions.canCreate && permissions.canManageXXX && (
  <button>Ajouter</button>
)}
```

Si cette condition n'existe pas, le bouton sera toujours visible.

#### D. Cache du navigateur
**Symptôme**: Les changements de code ne sont pas pris en compte

**Solution**:
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Faire un hard refresh (Ctrl+F5)
3. Se déconnecter puis se reconnecter
4. Vider le localStorage:
```javascript
localStorage.clear()
```

### 5. Tests à Effectuer

#### Test 1: Vérifier le Rôle dans la Console
```javascript
// Dans la console du navigateur
const user = JSON.parse(localStorage.getItem('user'))
console.log('User:', user)
console.log('Role:', user?.role)
```

**Résultat attendu**: `"user"`

#### Test 2: Forcer les Permissions Manuellement
Ouvrir `usePermissions.ts` et ajouter un return forcé:

```typescript
export const usePermissions = (): Permissions => {
  // DÉBUT DEBUG - FORCER PERMISSIONS USER
  return {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canImportData: false,
    canViewAllRegions: false,
    canEditAllRegions: false,
    canManagePersonnel: false,
    canManageEquipments: false,
    canManageFosas: false,
    canManageBuildings: false,
    canManageDegradations: false,
  }
  // FIN DEBUG

  const { user } = useAuth();
  // ... reste du code
}
```

Rechargez la page. Si les boutons disparaissent, cela signifie que:
- ✅ Le code de condition fonctionne
- ❌ Le problème vient de la détection du rôle

#### Test 3: Vérifier le DataTable
Sur une page (ex: FosasPage), ouvrir les DevTools et inspecter le tableau.

**Si vous voyez des colonnes "Actions" avec Modifier/Supprimer**, vérifier dans le code:
```typescript
<DataTable
  onEdit={permissions.canEdit && permissions.canManageXXX ? handleEdit : undefined}
  onDelete={permissions.canDelete && permissions.canManageXXX ? handleDelete : undefined}
/>
```

Si `onEdit` ou `onDelete` sont `undefined`, la colonne Actions ne devrait pas apparaître.

### 6. Checklist de Vérification

- [ ] Console: Le rôle affiché est bien `"user"`
- [ ] Console: `canCreate`, `canEdit`, `canDelete` sont à `false`
- [ ] Console: `canViewAllRegions` est à `false`
- [ ] Interface: L'onglet "Géographie" est masqué dans la navigation
- [ ] Interface: L'onglet "Administration" est masqué dans la navigation
- [ ] Interface: Le bouton "Ajouter" n'apparaît pas sur les pages
- [ ] Interface: Les boutons Modifier/Supprimer n'apparaissent pas dans les tableaux
- [ ] Interface: Les boutons Export PDF/Excel sont visibles

### 7. Solutions Rapides

#### Solution 1: Vider le Cache et Se Reconnecter
```javascript
// Dans la console
localStorage.clear()
// Puis se reconnecter
```

#### Solution 2: Vérifier que AuthProvider est Bien Configuré
Dans `App.tsx`, vérifier que:
```typescript
<AuthProvider>
  <BrowserRouter>
    {/* routes */}
  </BrowserRouter>
</AuthProvider>
```

#### Solution 3: Vérifier le Type du Rôle
Le problème peut venir d'un espace ou d'une casse incorrecte.

Dans la console:
```javascript
const user = JSON.parse(localStorage.getItem('user'))
console.log('Role exact:', JSON.stringify(user.role))
console.log('Est "user"?:', user.role === 'user')
```

Si `false`, il y a un espace ou une différence de casse.

### 8. Code de Debug Temporaire

Ajouter ceci dans `FosasPage.tsx` (ou n'importe quelle page):

```typescript
// Juste après const permissions = usePermissions()
console.log('🚀 DEBUG FosasPage:')
console.log('  - permissions.canCreate:', permissions.canCreate)
console.log('  - permissions.canEdit:', permissions.canEdit)
console.log('  - permissions.canDelete:', permissions.canDelete)
console.log('  - permissions.canManageFosas:', permissions.canManageFosas)

const shouldShowAddButton = permissions.canCreate && permissions.canManageFosas
console.log('  - Bouton Ajouter visible?:', shouldShowAddButton)
```

### 9. Informations à Fournir pour le Debug

Si le problème persiste, copier-coller les informations suivantes:

```javascript
// Dans la console du navigateur
console.log('=== DEBUG PERMISSIONS ===')
console.log('1. User:', JSON.parse(localStorage.getItem('user')))
console.log('2. Token exists:', !!localStorage.getItem('token'))

// Dans usePermissions, le log devrait afficher:
// 🔐 usePermissions - User: {...}
// 🔐 usePermissions - Role: "..."
// 🔐 usePermissions - ScopeType: "..."

// Dans Layout, le log devrait afficher:
// 📋 Layout - Permissions: {...}
```

---

## Résumé

**Comportement attendu pour un utilisateur avec rôle "user":**
- ✅ Peut VOIR les pages: Principal, Infrastructures, Personnel, Équipements
- ❌ Ne peut PAS voir: Géographie, Administration
- ✅ Peut exporter en PDF/Excel
- ❌ Ne peut PAS créer, modifier, supprimer

**Si ce n'est pas le cas:**
1. Vérifier la console pour les logs de debug
2. Vérifier le localStorage
3. Vider le cache et se reconnecter
4. Fournir les logs de debug
