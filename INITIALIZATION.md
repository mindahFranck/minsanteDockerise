# Guide d'Initialisation - Health Management System

Ce guide explique en détail le système d'initialisation automatique de la base de données.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Initialisation Automatique](#initialisation-automatique)
- [Initialisation Manuelle](#initialisation-manuelle)
- [Permissions Créées](#permissions-créées)
- [Rôles et Accès](#rôles-et-accès)
- [Utilisateurs Par Défaut](#utilisateurs-par-défaut)
- [Personnalisation](#personnalisation)
- [Dépannage](#dépannage)

## 🌟 Vue d'ensemble

Le système d'initialisation crée automatiquement :

1. **60+ Permissions** - Système RBAC complet
2. **4 Rôles** - Super Admin, Admin, Manager, User
3. **Associations Rôles-Permissions** - Matrice d'accès configurée
4. **Utilisateurs par défaut** - Comptes admin pour démarrer

**Caractéristiques importantes :**
- ✅ **Idempotent** : Safe de le lancer plusieurs fois
- ✅ **Automatique** : S'exécute au premier démarrage
- ✅ **Configurable** : Via variables d'environnement
- ✅ **Skip intelligent** : Ne recrée pas si déjà initialisé

## 🚀 Initialisation Automatique

### Au Premier Démarrage

Quand vous démarrez l'application pour la première fois :

```bash
npm run dev
# ou
npm start
```

Le système vérifie automatiquement si la base de données est initialisée. Si ce n'est pas le cas, il :

1. Crée toutes les permissions
2. Crée les rôles
3. Assigne les permissions aux rôles
4. Crée les utilisateurs par défaut

**Logs typiques au premier démarrage :**

```
╔═══════════════════════════════════════════════════════════╗
║   Database Initialization - First Run Setup              ║
╚═══════════════════════════════════════════════════════════╝

🚀 Starting first-time database initialization...

🔐 Initializing permissions...
✅ Initialized 64 permissions

👥 Initializing roles...
✅ Initialized 4 roles

🔗 Assigning permissions to roles...
  ✓ Super Admin: 64 permissions
  ✓ Admin: 60 permissions
  ✓ Manager: 42 permissions
  ✓ User: 18 permissions
✅ Role-Permission associations created

👤 Initializing default users...
  ✓ Created user: superadmin@minsante.cm (role: super_admin)
  ✓ Created user: admin@minsante.cm (role: admin)
  ✓ Created user: manager@minsante.cm (role: manager)
  ✓ Created user: user@minsante.cm (role: user)
✅ Default users initialized

📧 Default Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Super Admin: superadmin@minsante.cm
  Admin:       admin@minsante.cm
  Manager:     manager@minsante.cm
  User:        user@minsante.cm
  Password:    Admin@2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Changez ces mots de passe en production!

╔═══════════════════════════════════════════════════════════╗
║   ✅ Database Initialization Complete!                    ║
╚═══════════════════════════════════════════════════════════╝
```

### Démarrages Suivants

Au deuxième démarrage et suivants :

```
╔═══════════════════════════════════════════════════════════╗
║   Database Initialization - First Run Setup              ║
╚═══════════════════════════════════════════════════════════╝

✅ Database already initialized. Skipping setup.
```

Le système détecte que les données existent et ne les recrée pas.

## 🛠️ Initialisation Manuelle

### Commande Standard (Idempotent)

```bash
cd backend
npm run db:init
```

Cette commande :
- Vérifie si déjà initialisé
- Ne crée que ce qui manque
- Safe de lancer plusieurs fois

**Cas d'usage :**
- Après avoir supprimé accidentellement des rôles/permissions
- Pour ajouter de nouvelles permissions après une mise à jour
- Vérification de l'intégrité

### Force Re-initialisation (DANGER)

```bash
# Avec confirmation interactive
npm run db:init:force

# Avec confirmation automatique
FORCE_CONFIRM=YES npm run db:init:force
```

⚠️ **ATTENTION** : Cette commande :
- **SUPPRIME TOUTES LES DONNÉES** existantes
- Recrée les tables depuis zéro
- Perte de toutes les données utilisateurs

**Cas d'usage :**
- Reset complet en développement
- Migration majeure de schéma
- Environnement de test

### Via le Code

```typescript
import { initializeDatabase, reinitializeDatabase } from "./database/initializer"

// Initialisation normale (idempotent)
await initializeDatabase()

// Force re-initialisation (DANGER!)
await reinitializeDatabase()
```

## 🔐 Permissions Créées

### Structure des Permissions

Chaque permission suit le format : `resource.action`

**Exemples :**
- `users.create` - Créer des utilisateurs
- `fosas.read` - Lire les FOSA
- `equipements.update` - Modifier les équipements
- `audit.manage` - Gérer les logs d'audit

### Liste Complète (64 permissions)

#### Gestion des Utilisateurs (5)
```
users.create      - Créer des utilisateurs
users.read        - Consulter les utilisateurs
users.update      - Modifier les utilisateurs
users.delete      - Supprimer les utilisateurs
users.manage      - Gestion complète des utilisateurs
```

#### Structures Géographiques (16)
```
regions.create / .read / .update / .delete
departements.create / .read / .update / .delete
arrondissements.create / .read / .update / .delete
districts.create / .read / .update / .delete
```

#### Aires de Santé (4)
```
airesante.create / .read / .update / .delete
```

#### FOSA (4)
```
fosas.create / .read / .update / .delete
```

#### Infrastructure (12)
```
batiments.create / .read / .update / .delete
services.create / .read / .update / .delete
personnels.create / .read / .update / .delete
```

#### Équipements (12)
```
equipements.create / .read / .update / .delete
equipebio.create / .read / .update / .delete
materielroulant.create / .read / .update / .delete
```

#### Audit & Statistiques (4)
```
audit.read        - Consulter les logs d'audit
audit.manage      - Gérer les logs d'audit
statistics.read   - Consulter les statistiques
statistics.export - Exporter les statistiques
```

## 👥 Rôles et Accès

### Super Administrateur (`super_admin`)

**Niveau** : 4 (le plus élevé)

**Permissions** : TOUTES (64/64)

**Cas d'usage :**
- Administration système complète
- Gestion des utilisateurs et rôles
- Accès à toutes les fonctionnalités
- Gestion des logs d'audit

**Portée** : Nationale (accès à toutes les régions)

### Administrateur (`admin`)

**Niveau** : 3

**Permissions** : 60/64 (tout sauf gestion utilisateurs)

**Exclusions :**
- ❌ `users.create`
- ❌ `users.delete`
- ❌ `users.manage`

**Cas d'usage :**
- Gestion opérationnelle du système
- CRUD sur toutes les ressources (sauf users)
- Consultation des logs d'audit
- Génération de statistiques

**Portée** : Nationale ou régionale

### Gestionnaire (`manager`)

**Niveau** : 2

**Permissions** : 42/64

**Inclus :**
- ✅ Lecture de toutes les structures géographiques
- ✅ CRUD complet sur FOSA, bâtiments, services
- ✅ CRUD complet sur personnel et équipements
- ✅ Lecture des statistiques

**Exclusions :**
- ❌ Gestion des utilisateurs
- ❌ Modification des structures géographiques
- ❌ Logs d'audit

**Cas d'usage :**
- Gestion d'une région ou d'un département
- Gestion des FOSA dans sa zone
- Gestion du personnel et équipements
- Suivi opérationnel

**Portée** : Régionale, départementale ou arrondissement

### Utilisateur (`user`)

**Niveau** : 1 (le plus bas)

**Permissions** : 18/64 (lecture seule)

**Inclus :**
- ✅ Lecture des structures géographiques
- ✅ Lecture des FOSA
- ✅ Lecture des équipements et personnel
- ✅ Consultation des statistiques

**Exclusions :**
- ❌ Toute modification (create, update, delete)
- ❌ Gestion des utilisateurs
- ❌ Logs d'audit

**Cas d'usage :**
- Consultation des données
- Visualisation sur la carte
- Génération de rapports
- Utilisateurs en lecture seule

**Portée** : Variable selon affectation

### Matrice Détaillée

| Resource | Super Admin | Admin | Manager | User |
|----------|-------------|-------|---------|------|
| **Utilisateurs** |
| - Create | ✅ | ❌ | ❌ | ❌ |
| - Read | ✅ | ✅ | ❌ | ❌ |
| - Update | ✅ | ❌ | ❌ | ❌ |
| - Delete | ✅ | ❌ | ❌ | ❌ |
| - Manage | ✅ | ❌ | ❌ | ❌ |
| **Structures Géo** |
| - Create | ✅ | ✅ | ❌ | ❌ |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Update | ✅ | ✅ | ❌ | ❌ |
| - Delete | ✅ | ✅ | ❌ | ❌ |
| **FOSA** |
| - Create | ✅ | ✅ | ✅ | ❌ |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Update | ✅ | ✅ | ✅ | ❌ |
| - Delete | ✅ | ✅ | ❌ | ❌ |
| **Équipements** |
| - Create | ✅ | ✅ | ✅ | ❌ |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Update | ✅ | ✅ | ✅ | ❌ |
| - Delete | ✅ | ✅ | ✅ | ❌ |
| **Personnel** |
| - Create | ✅ | ✅ | ✅ | ❌ |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Update | ✅ | ✅ | ✅ | ❌ |
| - Delete | ✅ | ✅ | ✅ | ❌ |
| **Audit** |
| - Read | ✅ | ✅ | ❌ | ❌ |
| - Manage | ✅ | ❌ | ❌ | ❌ |
| **Statistiques** |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Export | ✅ | ✅ | ❌ | ❌ |

## 👤 Utilisateurs Par Défaut

### Super Administrateur
```
Email    : superadmin@minsante.cm
Password : Admin@2024
Rôle     : Super Administrateur
Portée   : Nationale
Statut   : Actif
```

**Accès :**
- Gestion complète du système
- Création/modification d'utilisateurs
- Accès à tous les logs d'audit
- Configuration système

### Administrateur
```
Email    : admin@minsante.cm
Password : Admin@2024
Rôle     : Administrateur
Portée   : Nationale
Statut   : Actif
```

**Accès :**
- Gestion des FOSA et ressources
- Consultation des logs
- Pas de gestion des utilisateurs

### Gestionnaire
```
Email    : manager@minsante.cm
Password : Admin@2024
Rôle     : Gestionnaire
Portée   : Régionale
Statut   : Actif
```

**Accès :**
- Gestion FOSA de sa région
- Gestion personnel/équipements
- Statistiques de sa zone

### Utilisateur
```
Email    : user@minsante.cm
Password : Admin@2024
Rôle     : Utilisateur
Portée   : Nationale
Statut   : Actif
```

**Accès :**
- Lecture seule
- Consultation des données
- Visualisation carte

## ⚙️ Personnalisation

### Changer le Mot de Passe Par Défaut

Dans votre fichier `.env` :

```env
# Mot de passe pour tous les comptes par défaut
DEFAULT_ADMIN_PASSWORD=VotreMotDePasseSecurise2024!
```

**Recommandations :**
- Minimum 12 caractères
- Majuscules + minuscules + chiffres + symboles
- Différent du mot de passe par défaut
- Unique pour la production

### Ajouter des Permissions Personnalisées

Modifiez `backend/src/database/initializer.ts` :

```typescript
const permissionsData = [
  // ... permissions existantes ...

  // Vos permissions personnalisées
  {
    name: "reports.create",
    resource: "reports",
    action: "create",
    description: "Créer des rapports personnalisés"
  },
  {
    name: "reports.read",
    resource: "reports",
    action: "read",
    description: "Consulter les rapports"
  },
]
```

Puis relancez :
```bash
npm run db:init
```

### Modifier les Permissions d'un Rôle

Dans `initializer.ts`, fonction `assignRolePermissions` :

```typescript
// Exemple : Donner plus de permissions au Manager
const managerPerms = permissions
  .filter(
    (p) =>
      p.action === "read" ||
      p.resource === "fosas" ||
      p.resource === "batiments" ||
      // Ajoutez vos conditions ici
      p.resource === "audit" && p.action === "read"
  )
  .map((p) => ({
    roleId: manager.id,
    permissionId: p.id,
  }))
```

## 🔍 Dépannage

### L'initialisation ne se lance pas

**Problème** : Le serveur démarre mais n'initialise pas.

**Solutions** :
```bash
# 1. Vérifier les logs
tail -f backend/logs/combined.log

# 2. Lancer manuellement
npm run db:init

# 3. Vérifier la connexion DB
# Dans .env, vérifier DB_HOST, DB_USER, DB_PASSWORD
```

### Erreur "Permission already exists"

**Problème** : Erreur lors de la création des permissions.

**Solution** : Normal en mode idempotent. Si vraiment problématique :
```bash
# Force reset (ATTENTION : perte de données)
FORCE_CONFIRM=YES npm run db:init:force
```

### Les utilisateurs ne peuvent pas se connecter

**Problème** : Login échoue avec les identifiants par défaut.

**Vérifications** :
```bash
# 1. Vérifier que les users existent
# Connectez-vous à MySQL
docker exec -it mysql_db mysql -uroot -prootpassword

USE mydatabase;
SELECT email, role, isActive FROM Users;

# 2. Si pas d'utilisateurs, réinitialiser
npm run db:init
```

### Permissions manquantes après mise à jour

**Problème** : Après une mise à jour de code, certaines permissions n'existent pas.

**Solution** :
```bash
# L'initialisation est idempotente - elle ajoute ce qui manque
npm run db:init
```

### Reset complet pour tests

**Besoin** : Repartir de zéro en développement.

**Solution** :
```bash
# ATTENTION : Efface tout !
FORCE_CONFIRM=YES npm run db:init:force

# Puis recharger les données de test
npm run db:seed
```

## 📝 Checklist de Production

Avant de déployer en production :

- [ ] Changer `DEFAULT_ADMIN_PASSWORD` dans `.env`
- [ ] Vérifier que `NODE_ENV=production`
- [ ] Désactiver les comptes de test non utilisés
- [ ] Documenter les comptes admin créés
- [ ] Configurer des alertes sur les logs d'audit
- [ ] Planifier une rotation des mots de passe
- [ ] Tester le système de permissions
- [ ] Sauvegarder la base après initialisation

## 🔗 Ressources

- [README principal](./README.md)
- [Guide de déploiement](./DEPLOYMENT.md)
- [Documentation API](./API_DOCUMENTATION.md)
- [Guide de contribution](./CONTRIBUTING.md)

---

**Dernière mise à jour** : 2025-01-03
**Version** : 1.0.0
