# DOCUMENTATION TECHNIQUE
## Plateforme de Gestion des Infrastructures Sanitaires du Cameroun

---

**Version :** 1.0.0
**Date :** 6 Décembre 2025
**Développeurs :**
- Mindah Nkemeni Franck Julius
- Serge Mezui

---

## TABLE DES MATIÈRES

1. [Vue d'Ensemble du Projet](#1-vue-densemble-du-projet)
2. [Architecture Globale](#2-architecture-globale)
3. [Architecture Frontend](#3-architecture-frontend)
4. [Architecture Backend](#4-architecture-backend)
5. [Base de Données](#5-base-de-données)
6. [Outils et Technologies](#6-outils-et-technologies)
7. [Sécurité et Authentification](#7-sécurité-et-authentification)
8. [Déploiement et Infrastructure](#8-déploiement-et-infrastructure)
9. [Guides de Développement](#9-guides-de-développement)
10. [Annexes](#10-annexes)

---

## 1. VUE D'ENSEMBLE DU PROJET

### 1.1 Objectif du Projet

La **Plateforme de Gestion des Infrastructures Sanitaires du Cameroun** est un système web complet développé pour le Ministère de la Santé Publique du Cameroun. Cette plateforme permet de :

- **Centraliser** les données de toutes les formations sanitaires (FOSA) du pays
- **Géolocaliser** et visualiser les infrastructures de santé sur une carte interactive
- **Suivre** l'état des équipements médicaux et biomédicaux
- **Gérer** le personnel de santé à travers les différentes structures
- **Analyser** les données avec des statistiques et rapports détaillés
- **Contrôler** l'accès avec un système de permissions et rôles avancé

### 1.2 Contexte et Enjeux

Le système de santé camerounais comprend :
- **10 régions** administratives
- **58 départements**
- Des centaines d'arrondissements
- Plus de **180 districts de santé**
- Plus de **400 aires de santé**
- Des milliers de **formations sanitaires (FOSA)**

La plateforme permet une gestion centralisée et efficace de cet écosystème complexe.

### 1.3 Fonctionnalités Principales

#### Gestion des Structures de Santé (FOSA)
- CRUD complet (Create, Read, Update, Delete)
- Catégorisation : Hôpitaux, Centres de Santé Intégrés (CSI), Centres Médicaux d'Arrondissement (CMA), etc.
- Types : Public, Parapublic, Privé laïc, Privé confessionnel
- Géolocalisation GPS précise
- Informations détaillées : titre foncier, clôture, bâtiments, services disponibles

#### Cartographie Interactive
- Visualisation géographique avec Leaflet
- Filtres par région, département, arrondissement, district, aire de santé
- Filtres par type de structure et catégorie
- Filtres avancés : titre foncier, clôture, fonctionnalité
- Analyse thématique avec statistiques en temps réel
- Clustering intelligent pour grandes quantités de marqueurs

#### Gestion des Équipements
- **Équipements médicaux** : lits, tables d'opération, etc.
- **Équipements biomédicaux** : échographes, radiographs, scanners, IRM, etc.
- **Matériel roulant** : ambulances, véhicules de service
- Suivi de l'état et des dégradations
- Historique de maintenance

#### Gestion du Personnel
- Répertoire du personnel de santé
- Catégories professionnelles : médecins, infirmiers, techniciens, etc.
- Affectations par structure
- Suivi des effectifs par FOSA

#### Statistiques et Analyses
- Tableaux de bord dynamiques
- Graphiques interactifs (Recharts)
- Statistiques par région, département, catégorie
- Rapports exportables
- Analyse thématique géospatiale

#### Administration et Sécurité
- Système d'authentification JWT
- Gestion des utilisateurs
- Rôles et permissions (RBAC - Role-Based Access Control)
- Audit logs des actions sensibles
- Contrôle d'accès granulaire

---

## 2. ARCHITECTURE GLOBALE

### 2.1 Schéma d'Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UTILISATEURS FINAUX                          │
│          (Administrateurs, Gestionnaires, Personnel Santé)          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NGINX REVERSE PROXY                         │
│                    (SSL/TLS - Let's Encrypt)                        │
│                                                                     │
│  ┌─────────────────────────────┬──────────────────────────────┐   │
│  │  minsante.it-grafik.com     │  api-dev-minsante...        │   │
│  │  (Frontend)                 │  (Backend API)              │   │
│  └─────────────┬───────────────┴────────────┬─────────────────┘   │
└────────────────┼──────────────────────────────┼─────────────────────┘
                 │                              │
                 ▼                              ▼
┌────────────────────────────┐  ┌──────────────────────────────────┐
│    FRONTEND CONTAINER      │  │     BACKEND CONTAINER            │
│    (Docker - Nginx)        │  │     (Docker - Node.js)           │
│                            │  │                                  │
│  ┌──────────────────────┐  │  │  ┌────────────────────────────┐ │
│  │   React 18           │  │  │  │   Express.js              │ │
│  │   + TypeScript       │  │  │  │   + TypeScript            │ │
│  │   + Vite             │  │  │  │   + Sequelize ORM         │ │
│  │   + Tailwind CSS     │  │  │  │   + JWT Auth              │ │
│  │   + Leaflet Maps     │  │  │  │   + Swagger Docs          │ │
│  │   + Recharts         │  │  │  │   + Winston Logger        │ │
│  │   + React Router v7  │  │  │  │   + PostGIS (spatial)     │ │
│  └──────────────────────┘  │  │  └────────────┬───────────────┘ │
│                            │  │               │                  │
│  Static Files (SPA)        │  │               │                  │
│  Port: 80 (internal)       │  │               │ Port: 3000       │
└────────────────────────────┘  └───────────────┼──────────────────┘
                                                 │
                                                 │ MySQL Protocol
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │      MySQL 8.0 DATABASE              │
                              │      (Docker Container)              │
                              │                                      │
                              │  ┌────────────────────────────────┐  │
                              │  │  Tables Principales:           │  │
                              │  │  - Region (10)                 │  │
                              │  │  - Departement (58)            │  │
                              │  │  - Arrondissement              │  │
                              │  │  - District (180+)             │  │
                              │  │  - Airesante (400+)            │  │
                              │  │  - Fosa (milliers)             │  │
                              │  │  - User, Role, Permission      │  │
                              │  │  - Equipement, Personnel       │  │
                              │  │  - Batiment, Service           │  │
                              │  │  - AuditLog                    │  │
                              │  └────────────────────────────────┘  │
                              │                                      │
                              │  Volume: /var/lib/mysql             │
                              │  Port: 3306                          │
                              └──────────────────────────────────────┘
```

### 2.2 Architecture en Couches

#### Couche Présentation (Frontend)
- **Responsabilité** : Interface utilisateur, visualisation des données, interactions
- **Technologies** : React, TypeScript, Tailwind CSS, Leaflet
- **Communication** : API REST via Axios

#### Couche Application (Backend API)
- **Responsabilité** : Logique métier, validation, authentification, autorisation
- **Technologies** : Express.js, TypeScript, Sequelize
- **Patterns** : MVC (Model-View-Controller), Repository Pattern, Service Layer

#### Couche Données (Database)
- **Responsabilité** : Persistance des données, requêtes SQL, intégrité référentielle
- **Technologies** : MySQL 8.0, PostGIS (extension spatiale)
- **Features** : Transactions ACID, indexes, contraintes de clés étrangères

### 2.3 Flux de Données

```
User Action → Frontend (React) → Axios HTTP Request → Backend API (Express)
                                                            ↓
                                                      Middleware Chain
                                                      (Auth, Validation)
                                                            ↓
                                                      Controller Layer
                                                            ↓
                                                      Service Layer
                                                      (Business Logic)
                                                            ↓
                                                      Repository/Model
                                                      (Sequelize ORM)
                                                            ↓
                                                      MySQL Database
                                                            ↓
                                                      Response JSON
                                                            ↓
                                                      Frontend Update
                                                      (State Management)
                                                            ↓
                                                      UI Re-render
```

---

## 3. ARCHITECTURE FRONTEND

### 3.1 Stack Technique Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **React** | 18.3.1 | Framework UI |
| **TypeScript** | 5.5.3 | Typage statique |
| **Vite** | 5.4.2 | Build tool & dev server |
| **React Router** | 7.6.3 | Routing SPA |
| **Tailwind CSS** | 3.4.1 | Framework CSS utility-first |
| **Leaflet** | 1.9.4 | Cartographie interactive |
| **React-Leaflet** | 4.2.1 | Bindings React pour Leaflet |
| **Recharts** | 3.1.0 | Graphiques et visualisations |
| **Axios** | 1.12.2 | Client HTTP |
| **Lucide React** | 0.344.0 | Icônes |
| **@turf/turf** | 7.2.0 | Calculs géospatiaux |

### 3.2 Structure du Projet Frontend

```
frontend/
├── src/
│   ├── components/              # Composants React
│   │   ├── analytics/           # Module d'analyse
│   │   │   └── AnalyticsModule.tsx
│   │   ├── auth/                # Authentification
│   │   │   └── LoginForm.tsx
│   │   ├── buildings/           # Gestion des bâtiments
│   │   │   └── BuildingsModule.tsx
│   │   ├── common/              # Composants réutilisables
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Loader.tsx
│   │   ├── dashboard/           # Tableau de bord
│   │   │   ├── Dashboard.tsx
│   │   │   └── StatCard.tsx
│   │   ├── data/                # Gestion des données
│   │   │   └── DataManagement.tsx
│   │   ├── hospitals/           # Module FOSA
│   │   │   └── HospitalsModule.tsx
│   │   ├── maintenance/         # Maintenance équipements
│   │   │   └── MaintenanceModule.tsx
│   │   ├── map/                 # Cartographie
│   │   │   ├── MapView.tsx       (2100+ lignes - composant principal)
│   │   │   ├── ThematicAnalysis.tsx (analyse thématique)
│   │   │   └── MapLegend.tsx
│   │   ├── planning/            # Planification
│   │   │   └── PlanningModule.tsx
│   │   ├── reports/             # Rapports
│   │   │   └── ReportsModule.tsx
│   │   ├── users/               # Gestion utilisateurs
│   │   │   └── UsersModule.tsx
│   │   ├── DataTable.tsx        # Table de données réutilisable
│   │   ├── Modal.tsx            # Modal générique
│   │   ├── ConfirmDialog.tsx    # Dialog de confirmation
│   │   └── Router.tsx           # Configuration du routeur
│   │
│   ├── services/                # Services API
│   │   └── apiService.ts        # Appels API centralisés
│   │
│   ├── contexts/                # Contextes React
│   │   └── AuthContext.tsx      # Contexte d'authentification
│   │
│   ├── types/                   # Définitions TypeScript
│   │   └── index.ts             # Types communs
│   │
│   ├── assets/                  # Ressources statiques
│   │   └── images/
│   │
│   ├── App.tsx                  # Composant racine
│   ├── main.tsx                 # Point d'entrée
│   └── index.css                # Styles globaux
│
├── public/                      # Fichiers statiques publics
│   └── favicon.ico
│
├── vite.config.ts               # Configuration Vite
├── tailwind.config.js           # Configuration Tailwind
├── tsconfig.json                # Configuration TypeScript
├── package.json                 # Dépendances npm
├── Dockerfile                   # Image Docker frontend
└── nginx.conf                   # Configuration Nginx
```

### 3.3 Architecture des Composants

#### 3.3.1 Composant MapView (Cartographie Principale)

**Fichier** : `src/components/map/MapView.tsx` (2100+ lignes)

**Responsabilités** :
- Affichage de la carte interactive avec Leaflet
- Gestion des filtres géographiques (région, département, arrondissement, district, aire de santé)
- Filtres typologiques (type de FOSA, catégorie, fonctionnalité)
- Filtres avancés (titre foncier, clôture)
- Chargement lazy des FOSA (optimisation performances)
- Clustering et tooltips personnalisés
- Intégration avec ThematicAnalysis

**Technologies clés** :
```typescript
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
```

**Features notables** :
- **Requêtes spatiales PostGIS** : utilise `ST_Within` pour filtrer géographiquement les FOSA
- **Optimisation chargement** : ne charge pas toutes les FOSA au démarrage, uniquement sur sélection de filtre
- **Icônes dynamiques** : couleurs et symboles selon le type de FOSA
- **Tooltips enrichis** : informations détaillées au survol

#### 3.3.2 Composant ThematicAnalysis

**Fichier** : `src/components/map/ThematicAnalysis.tsx`

**Responsabilités** :
- Affichage des statistiques de la zone sélectionnée
- Calcul des totaux et pourcentages
- Graphiques et visualisations
- Positionnement non-intrusif (n'obstrue pas le zoom)

#### 3.3.3 Service API

**Fichier** : `src/services/apiService.ts`

**Pattern** : Singleton avec méthodes statiques

**Exemples d'endpoints** :
```typescript
// Authentification
static async login(email: string, password: string)
static async logout()

// Données géographiques
static async getRegions()
static async getDepartements()
static async getArrondissements()
static async getDistricts()
static async getAiresante()

// FOSA avec filtres spatiaux
static async getFosasByRegion(regionId: string)
static async getFosasByDepartement(departementId: string)
static async getFosasByArrondissement(arrondissementId: string)

// CRUD FOSA
static async getFosas(params?)
static async getFosaById(id: number)
static async createFosa(data: any)
static async updateFosa(id: number, data: any)
static async deleteFosa(id: number)

// Équipements
static async getEquipements()
static async getEquipebio()
static async getMaterielroulant()

// Personnel
static async getPersonnel()

// Utilisateurs et rôles
static async getUsers()
static async getRoles()
static async getPermissions()
```

### 3.4 Gestion de l'État

#### 3.4.1 Contexte d'Authentification

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**Stockage** : localStorage pour persistance du token JWT

#### 3.4.2 State Management Local

Utilisation des hooks React :
- `useState` : état local des composants
- `useEffect` : effets de bord (chargement données)
- `useCallback` : mémorisation des fonctions
- `useMemo` : mémorisation des valeurs calculées

### 3.5 Routing

**Fichier** : `src/components/Router.tsx`

```typescript
// Routes principales
/                        → Dashboard
/login                   → LoginForm
/fosas                   → MapView (carte + filtres)
/hospitals               → HospitalsModule (liste FOSA)
/users                   → UsersModule (gestion utilisateurs)
/analytics               → AnalyticsModule (statistiques)
/reports                 → ReportsModule (rapports)
/buildings               → BuildingsModule (bâtiments)
/maintenance             → MaintenanceModule (équipements)
/planning                → PlanningModule
/data                    → DataManagement
```

**Protection des routes** :
- Routes publiques : `/login`
- Routes protégées : toutes les autres (vérification JWT)

### 3.6 Styling

#### Tailwind CSS Utility Classes

```css
/* Exemples d'usage */
.bg-blue-600 hover:bg-blue-700    /* Boutons */
.shadow-lg rounded-lg             /* Cartes */
.grid grid-cols-4 gap-4          /* Grilles */
.flex items-center justify-between /* Flexbox */
```

#### Responsive Design

```typescript
// Breakpoints Tailwind
sm: 640px    // Mobile
md: 768px    // Tablette
lg: 1024px   // Desktop
xl: 1280px   // Large desktop
```

### 3.7 Build et Déploiement Frontend

#### Configuration Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: { /* optimisations */ }
  },
  server: {
    host: true,
    port: 5173
  }
});
```

#### Dockerfile Frontend

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. ARCHITECTURE BACKEND

### 4.1 Stack Technique Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Node.js** | 20 LTS | Runtime JavaScript |
| **Express.js** | latest | Framework web |
| **TypeScript** | 5.x | Typage statique |
| **Sequelize** | latest | ORM (Object-Relational Mapping) |
| **MySQL2** | 3.6.5 | Driver MySQL |
| **JWT** | latest | JSON Web Tokens (auth) |
| **Bcryptjs** | latest | Hashage mots de passe |
| **Winston** | latest | Logging avancé |
| **Swagger** | latest | Documentation API |
| **Helmet** | latest | Sécurité headers HTTP |
| **CORS** | latest | Cross-Origin Resource Sharing |
| **Express Validator** | latest | Validation données |
| **Compression** | latest | Compression gzip |
| **Multer** | latest | Upload de fichiers |

### 4.2 Structure du Projet Backend

```
backend/
├── src/
│   ├── config/                  # Configuration
│   │   ├── database.ts          # Sequelize config
│   │   ├── logger.ts            # Winston logger
│   │   ├── redis.ts             # Redis config (cache)
│   │   └── swagger.ts           # Swagger/OpenAPI spec
│   │
│   ├── models/                  # Modèles Sequelize (ORM)
│   │   ├── index.ts             # Export & associations
│   │   ├── User.ts              # Utilisateurs
│   │   ├── Role.ts              # Rôles
│   │   ├── Permission.ts        # Permissions
│   │   ├── RolePermission.ts    # Association N-N
│   │   ├── AuditLog.ts          # Logs d'audit
│   │   ├── Region.ts            # Régions (10)
│   │   ├── Departement.ts       # Départements (58)
│   │   ├── Arrondissement.ts    # Arrondissements
│   │   ├── District.ts          # Districts sanitaires
│   │   ├── Airesante.ts         # Aires de santé
│   │   ├── Fosa.ts              # Formations sanitaires
│   │   ├── Categorie.ts         # Catégories FOSA
│   │   ├── Batiment.ts          # Bâtiments
│   │   ├── Service.ts           # Services médicaux
│   │   ├── Personnel.ts         # Personnel de santé
│   │   ├── Equipement.ts        # Équipements médicaux
│   │   ├── Equipebio.ts         # Équipements biomédicaux
│   │   ├── Materielroulant.ts   # Véhicules
│   │   ├── Degradation.ts       # Dégradations
│   │   └── Parametre.ts         # Paramètres système
│   │
│   ├── controllers/             # Contrôleurs (logique requête/réponse)
│   │   ├── BaseController.ts
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   ├── FosaController.ts
│   │   ├── RegionController.ts
│   │   ├── DepartementController.ts
│   │   ├── ArrondissementController.ts
│   │   ├── DistrictController.ts
│   │   ├── AiresanteController.ts
│   │   ├── CategorieController.ts
│   │   ├── EquipementController.ts
│   │   ├── PersonnelController.ts
│   │   ├── BatimentController.ts
│   │   ├── ServiceController.ts
│   │   ├── AuditController.ts
│   │   └── HealthController.ts
│   │
│   ├── services/                # Services (logique métier)
│   │   ├── BaseService.ts
│   │   ├── AuthService.ts
│   │   ├── UserService.ts
│   │   ├── FosaService.ts
│   │   ├── AuditService.ts
│   │   ├── RegionService.ts
│   │   ├── DepartementService.ts
│   │   ├── ArrondissementService.ts
│   │   ├── EquipementService.ts
│   │   └── PersonnelService.ts
│   │
│   ├── routes/                  # Définitions des routes
│   │   ├── index.ts             # Router principal
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── fosa.routes.ts
│   │   ├── region.routes.ts
│   │   ├── departement.routes.ts
│   │   ├── arrondissement.routes.ts
│   │   ├── district.routes.ts
│   │   ├── airesante.routes.ts
│   │   ├── categorie.routes.ts
│   │   ├── equipement.routes.ts
│   │   ├── personnel.routes.ts
│   │   ├── batiment.routes.ts
│   │   ├── service.routes.ts
│   │   ├── audit.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── middleware/              # Middlewares Express
│   │   ├── auth.ts              # Vérification JWT
│   │   ├── permission.ts        # Vérification permissions RBAC
│   │   ├── validate.ts          # Validation express-validator
│   │   ├── errorHandler.ts      # Gestion globale erreurs
│   │   ├── requestId.ts         # ID unique par requête
│   │   ├── requestLogger.ts     # Logging requêtes
│   │   └── upload.ts            # Upload fichiers (Multer)
│   │
│   ├── validation/              # Schémas de validation
│   │   └── schemas.ts
│   │
│   ├── utils/                   # Utilitaires
│   │   ├── ApiError.ts          # Classe erreur personnalisée
│   │   ├── response.ts          # Formateurs de réponse
│   │   └── asyncHandler.ts      # Wrapper async/await
│   │
│   ├── repositories/            # Pattern Repository (optionnel)
│   │   └── BaseRepository.ts
│   │
│   ├── database/                # Migrations et seeders
│   │   ├── initializer.ts       # Initialisation DB (roles, permissions, users)
│   │   ├── seed.ts
│   │   ├── migrate.ts
│   │   ├── seeders/
│   │   │   └── index.ts
│   │   └── importers/
│   │       └── importGeographicData.ts
│   │
│   ├── scripts/                 # Scripts d'administration
│   │   ├── init-db.ts           # Initialisation DB
│   │   ├── createUsers.ts
│   │   ├── createGeoData.ts
│   │   ├── importGeoData.ts
│   │   └── resetPasswords.ts
│   │
│   ├── types/                   # Types TypeScript
│   │   └── index.ts
│   │
│   └── server.ts                # Point d'entrée
│
├── uploads/                     # Fichiers uploadés
├── logs/                        # Logs Winston
│   ├── combined.log
│   ├── error.log
│   └── access.log
│
├── Dockerfile                   # Image Docker backend
├── .env.example                 # Variables d'environnement exemple
├── package.json                 # Dépendances npm
└── tsconfig.json                # Configuration TypeScript
```

### 4.3 Architecture en Couches (Layered Architecture)

```
┌─────────────────────────────────────────────────┐
│              HTTP REQUEST                       │
└───────────────────┬─────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         MIDDLEWARE LAYER                        │
│  • Request ID                                   │
│  • Request Logger                               │
│  • Authentication (JWT)                         │
│  • Authorization (Permissions)                  │
│  • Validation (express-validator)               │
└───────────────────┬─────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         CONTROLLER LAYER                        │
│  • Parse request                                │
│  • Call service                                 │
│  • Format response                              │
│  • Error handling                               │
└───────────────────┬─────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         SERVICE LAYER                           │
│  • Business logic                               │
│  • Validation métier                            │
│  • Orchestration                                │
│  • Transactions                                 │
└───────────────────┬─────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         MODEL/REPOSITORY LAYER                  │
│  • Sequelize models                             │
│  • Database queries                             │
│  • Relations & associations                     │
└───────────────────┬─────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         DATABASE (MySQL)                        │
└─────────────────────────────────────────────────┘
```

### 4.4 Modèle de Données (ORM Sequelize)

#### 4.4.1 Modèle User

```typescript
// src/models/User.ts
class User extends Model {
  declare id: number;
  declare email: string;
  declare password: string;
  declare firstName: string;
  declare lastName: string;
  declare roleId: number;
  declare isActive: boolean;
  declare lastLogin: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations
  declare role?: Role;
}

User.init({
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin: DataTypes.DATE
}, { sequelize, modelName: 'User', tableName: 'users' });
```

#### 4.4.2 Modèle FOSA (Formation Sanitaire)

```typescript
// src/models/Fosa.ts
class Fosa extends Model {
  declare id: number;
  declare nom: string;
  declare code: string;
  declare categorieId: number;
  declare type: 'Public' | 'Parapublic' | 'Privé laïc' | 'Privé confessionnel';
  declare airesanteId: number;
  declare regionId: number;
  declare departementId: number;
  declare latitude: number;
  declare longitude: number;
  declare fonctionnelle: boolean;
  declare aTitreFoncier: boolean;
  declare aCloture: boolean;
  declare adresse: string;
  declare telephone: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associations
  declare categorie?: Categorie;
  declare airesante?: Airesante;
  declare region?: Region;
  declare departement?: Departement;
  declare batiments?: Batiment[];
  declare services?: Service[];
  declare personnels?: Personnel[];
  declare equipements?: Equipement[];
}
```

#### 4.4.3 Hiérarchie Géographique

```typescript
Region (1) ──> (N) Departement
                      ↓ (1)
                      ↓
                   (N) Arrondissement
                      ↓ (1)
                      ↓
                   (N) District
                      ↓ (1)
                      ↓
                   (N) Airesante
                      ↓ (1)
                      ↓
                   (N) Fosa
```

### 4.5 Système RBAC (Role-Based Access Control)

#### 4.5.1 Structure des Permissions

```typescript
// Permission format: {resource}:{action}
// Exemples:
'fosa:create'
'fosa:read'
'fosa:update'
'fosa:delete'
'user:manage'
'audit:read'
```

#### 4.5.2 Rôles Prédéfinis

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | Accès total | Toutes les permissions (60+) |
| **Admin** | Administrateur | CRUD FOSA, équipements, personnel, lecture audit |
| **Manager** | Gestionnaire | CRUD FOSA, équipements, personnel (pas de gestion utilisateurs) |
| **User** | Utilisateur | Lecture seule sur toutes les ressources |

#### 4.5.3 Middleware d'Autorisation

```typescript
// src/middleware/permission.ts
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Injecté par middleware auth
    const hasPermission = await checkUserPermission(user.id, permission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Utilisation dans les routes
router.post('/fosa',
  authenticate,
  requirePermission('fosa:create'),
  FosaController.create
);
```

### 4.6 Authentification JWT

#### 4.6.1 Flux d'Authentification

```
1. User POST /api/v1/auth/login { email, password }
                    ↓
2. AuthService vérifie credentials
                    ↓
3. Génération JWT token (secret + expiration 7 jours)
                    ↓
4. Response { token, user }
                    ↓
5. Frontend stocke token dans localStorage
                    ↓
6. Requêtes suivantes : Header "Authorization: Bearer {token}"
                    ↓
7. Middleware auth.ts vérifie et décode token
                    ↓
8. Injecte user dans req.user
                    ↓
9. Controller accède à req.user
```

#### 4.6.2 Implémentation JWT

```typescript
// src/services/AuthService.ts
export class AuthService {
  static async login(email: string, password: string) {
    // 1. Trouver utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) throw new ApiError(401, 'Invalid credentials');

    // 2. Vérifier mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new ApiError(401, 'Invalid credentials');

    // 3. Générer JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // 4. Update last login
    await user.update({ lastLogin: new Date() });

    // 5. Return token + user
    return { token, user };
  }
}

// src/middleware/auth.ts
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new ApiError(401, 'No token provided');

    const token = authHeader.split(' ')[1]; // "Bearer {token}"
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    const user = await User.findByPk(decoded.id, { include: ['role'] });
    if (!user) throw new ApiError(401, 'Invalid token');

    req.user = user; // Inject user
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};
```

### 4.7 Gestion des Erreurs

#### 4.7.1 Classe ApiError Personnalisée

```typescript
// src/utils/ApiError.ts
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

#### 4.7.2 Error Handler Global

```typescript
// src/middleware/errorHandler.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Erreur inattendue
  logger.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

### 4.8 Logging avec Winston

```typescript
// src/config/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d'
    })
  ]
});
```

### 4.9 Documentation API (Swagger)

**URL** : `https://api-dev-minsante.it-grafik.com/api-docs`

```typescript
// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Health Management API',
      version: '1.0.0',
      description: 'API pour la gestion des infrastructures sanitaires du Cameroun'
    },
    servers: [
      { url: 'https://api-dev-minsante.it-grafik.com/api/v1' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
});
```

---

## 5. BASE DE DONNÉES

### 5.1 Système de Gestion de Base de Données

- **SGBD** : MySQL 8.0
- **Serveur** : srv915.hstgr.io:3306
- **Base de données** : health_management
- **Caractères** : utf8mb4 (support emoji et caractères spéciaux)
- **Collation** : utf8mb4_unicode_ci

### 5.2 Configuration Sequelize

```typescript
// backend/src/config/database.ts
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'srv915.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'health_management',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    connectTimeout: 60000 // 60 secondes
  },
  pool: {
    max: 10,      // Connexions max
    min: 0,       // Connexions min
    acquire: 60000,
    idle: 10000
  },
  define: {
    timestamps: true,        // createdAt, updatedAt automatiques
    underscored: true,       // snake_case pour colonnes
    freezeTableName: true    // Pas de pluralisation
  }
});
```

### 5.3 Schéma de Base de Données

#### 5.3.1 Tables Principales

```sql
-- AUTHENTIFICATION ET AUTORISATION
users                    -- Utilisateurs du système
roles                    -- Rôles (Super Admin, Admin, Manager, User)
permissions              -- Permissions granulaires
role_permissions         -- Association N-N roles <-> permissions
audit_logs               -- Logs d'audit des actions

-- HIÉRARCHIE GÉOGRAPHIQUE
regions                  -- 10 régions du Cameroun
departements             -- 58 départements
arrondissements          -- Arrondissements
districts                -- Districts sanitaires (180+)
airesantes               -- Aires de santé (400+)

-- STRUCTURES SANITAIRES
categories               -- Catégories de FOSA (Hôpital, CSI, CMA, etc.)
fosas                    -- Formations sanitaires (FOSA)
batiments                -- Bâtiments des FOSA
services                 -- Services médicaux disponibles

-- RESSOURCES HUMAINES
personnels               -- Personnel de santé

-- ÉQUIPEMENTS
equipements              -- Équipements médicaux généraux
equipebios               -- Équipements biomédicaux (scanners, IRM, etc.)
materielroulants         -- Véhicules et ambulances
degradations             -- Dégradations d'équipements

-- CONFIGURATION
parametres               -- Paramètres système
```

#### 5.3.2 Diagramme Entité-Relation (ERD)

```
┌─────────────┐
│   regions   │
│  (10 rows)  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│  departements   │
│   (58 rows)     │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼─────────────┐
│ arrondissements    │
└──────┬─────────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│   districts     │
│  (180+ rows)    │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│  airesantes     │
│  (400+ rows)    │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────────────────┐
│         fosas               │
│      (milliers)             │
│                             │
│  • nom                      │
│  • code                     │
│  • type (Public, Privé...)  │
│  • categorieId              │
│  • airesanteId              │
│  • latitude, longitude      │
│  • fonctionnelle            │
│  • aTitreFoncier            │
│  • aCloture                 │
└──┬──────┬──────┬────────┬───┘
   │      │      │        │
   │ 1    │ 1    │ 1      │ 1
   │      │      │        │
   │ N    │ N    │ N      │ N
   │      │      │        │
┌──▼───┐ ┌▼──────┐ ┌─────▼──┐ ┌──────▼─────┐
│bati- │ │servi- │ │person- │ │equipements │
│ments │ │ces    │ │nels    │ └────────────┘
└──────┘ └───────┘ └────────┘


┌─────────┐          ┌──────────────┐
│  users  │───N:1───▶│    roles     │
└────┬────┘          └──────┬───────┘
     │                      │
     │                      │ N:N
     │                      │
     ▼                      ▼
┌────────────┐       ┌─────────────────┐
│ audit_logs │       │  permissions    │
└────────────┘       └─────────────────┘
                             ▲
                             │ N:N
                             │
                     ┌───────┴──────────┐
                     │ role_permissions │
                     └──────────────────┘
```

#### 5.3.3 Table `fosas` (Détails)

```sql
CREATE TABLE fosas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  type ENUM('Public', 'Parapublic', 'Privé laïc', 'Privé confessionnel'),
  categorie_id INT,
  airesante_id INT,
  region_id INT,
  departement_id INT,
  arrondissement_id INT,
  district_id INT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  fonctionnelle BOOLEAN DEFAULT TRUE,
  a_titre_foncier BOOLEAN DEFAULT FALSE,
  a_cloture BOOLEAN DEFAULT FALSE,
  adresse TEXT,
  telephone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (categorie_id) REFERENCES categories(id),
  FOREIGN KEY (airesante_id) REFERENCES airesantes(id),
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (departement_id) REFERENCES departements(id),

  INDEX idx_airesante (airesante_id),
  INDEX idx_region (region_id),
  INDEX idx_departement (departement_id),
  INDEX idx_coordinates (latitude, longitude),
  INDEX idx_type (type),
  INDEX idx_fonctionnelle (fonctionnelle)
);
```

#### 5.3.4 Table `users`

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_email (email),
  INDEX idx_role (role_id)
);
```

#### 5.3.5 Système RBAC (Tables)

```sql
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_permission (resource, action)
);

CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
);
```

### 5.4 Requêtes Spatiales (PostGIS-like)

Bien que MySQL n'ait pas PostGIS natif, des fonctions spatiales sont utilisées :

```sql
-- Exemple : Trouver toutes les FOSA dans une région spécifique
SELECT f.*,
       a.nom as aire_sante_nom,
       d.nom_ds as district_nom,
       r.nom as region_nom
FROM fosas f
LEFT JOIN airesantes a ON f.airesante_id = a.id
LEFT JOIN districts d ON a.district_id = d.id
LEFT JOIN regions r ON f.region_id = r.id
WHERE f.region_id = :regionId;

-- Exemple : Filtrer FOSA dans un rayon géographique
SELECT *,
  (6371 * acos(
    cos(radians(:lat)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians(:lng)) +
    sin(radians(:lat)) * sin(radians(latitude))
  )) AS distance
FROM fosas
HAVING distance < :radiusKm
ORDER BY distance;
```

### 5.5 Initialisation et Seeders

#### 5.5.1 Script d'Initialisation

```typescript
// backend/src/database/initializer.ts
export async function initializeDatabase() {
  try {
    // 1. Créer les rôles
    await createRoles();

    // 2. Créer les permissions (60+)
    await createPermissions();

    // 3. Associer permissions aux rôles
    await associatePermissionsToRoles();

    // 4. Créer utilisateurs par défaut
    await createDefaultUsers();

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}
```

#### 5.5.2 Utilisateurs par Défaut

```typescript
const defaultUsers = [
  {
    email: 'superadmin@minsante.cm',
    password: 'Admin@2024', // Hashé avec bcrypt
    firstName: 'Super',
    lastName: 'Administrateur',
    roleName: 'Super Admin'
  },
  {
    email: 'admin@minsante.cm',
    password: 'Admin@2024',
    firstName: 'Admin',
    lastName: 'Principal',
    roleName: 'Admin'
  },
  {
    email: 'manager@minsante.cm',
    password: 'Admin@2024',
    firstName: 'Gestionnaire',
    lastName: 'FOSA',
    roleName: 'Manager'
  },
  {
    email: 'user@minsante.cm',
    password: 'Admin@2024',
    firstName: 'Utilisateur',
    lastName: 'Standard',
    roleName: 'User'
  }
];
```

### 5.6 Optimisations et Index

```sql
-- Index pour recherche rapide par nom
CREATE INDEX idx_fosa_nom ON fosas(nom);

-- Index composé pour filtres géographiques
CREATE INDEX idx_geographic ON fosas(region_id, departement_id, airesante_id);

-- Index pour coordonnées GPS
CREATE INDEX idx_coordinates ON fosas(latitude, longitude);

-- Index pour filtres booléens
CREATE INDEX idx_filters ON fosas(fonctionnelle, a_titre_foncier, a_cloture);

-- Index pour type et catégorie
CREATE INDEX idx_classification ON fosas(type, categorie_id);
```

### 5.7 Contraintes d'Intégrité

- **Clés primaires** : Auto-incrémentées sur toutes les tables
- **Clés étrangères** : Assure l'intégrité référentielle
- **Contraintes UNIQUE** : email (users), code (fosas)
- **Contraintes NOT NULL** : Champs obligatoires
- **Valeurs par défaut** : timestamps, booléens

---

## 6. OUTILS ET TECHNOLOGIES

### 6.1 Tableau Récapitulatif des Technologies

| Catégorie | Technologie | Version | Utilisation |
|-----------|-------------|---------|-------------|
| **Frontend** |
| Framework UI | React | 18.3.1 | Composants interactifs |
| Langage | TypeScript | 5.5.3 | Typage statique |
| Build Tool | Vite | 5.4.2 | Bundler rapide |
| Routing | React Router | 7.6.3 | Navigation SPA |
| Styling | Tailwind CSS | 3.4.1 | Utility-first CSS |
| Cartographie | Leaflet | 1.9.4 | Cartes interactives |
| Graphiques | Recharts | 3.1.0 | Visualisations |
| HTTP Client | Axios | 1.12.2 | Requêtes API |
| Géospatial | Turf.js | 7.2.0 | Calculs géographiques |
| **Backend** |
| Runtime | Node.js | 20 LTS | Serveur JavaScript |
| Framework | Express.js | latest | API REST |
| Langage | TypeScript | 5.x | Typage statique |
| ORM | Sequelize | latest | Base de données |
| Validation | Express Validator | latest | Validation données |
| Auth | JWT | latest | Authentification |
| Crypto | Bcryptjs | latest | Hashage passwords |
| Logging | Winston | latest | Logs structurés |
| Documentation | Swagger | latest | API docs |
| Sécurité | Helmet | latest | Headers HTTP |
| Upload | Multer | latest | Fichiers |
| **Base de Données** |
| SGBD | MySQL | 8.0 | Base relationnelle |
| Driver | MySQL2 | 3.6.5 | Connector Node.js |
| **DevOps** |
| Conteneurisation | Docker | latest | Containers |
| Orchestration | Docker Compose | latest | Multi-containers |
| Web Server | Nginx | alpine | Reverse proxy |
| CI/CD | GitHub Actions | - | Déploiement auto |
| SSL | Let's Encrypt | - | Certificats HTTPS |
| Registry | Docker Hub | - | Images Docker |

### 6.2 Outils de Développement

#### 6.2.1 Environnement de Développement

- **IDE recommandé** : Visual Studio Code
- **Extensions VSCode** :
  - ESLint
  - Prettier
  - TypeScript + JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Docker
  - GitLens

#### 6.2.2 Gestion de Version

- **Git** : Contrôle de version
- **GitHub** : Hébergement repository
- **Branches** :
  - `main` : Production
  - `develop` : Développement
  - `feature/*` : Nouvelles fonctionnalités
  - `fix/*` : Corrections de bugs

#### 6.2.3 Tests

- **Jest** : Framework de test backend
- **Supertest** : Tests API HTTP
- **Coverage** :
  ```bash
  npm run test:coverage
  ```

### 6.3 Configuration des Outils

#### 6.3.1 TypeScript Configuration

```json
// tsconfig.json (Backend & Frontend)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 6.3.2 ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
];
```

#### 6.3.3 Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      }
    }
  },
  plugins: []
};
```

### 6.4 Gestion des Packages

#### 6.4.1 Package Manager

- **npm** (Node Package Manager)
- Version lockfile : `package-lock.json`

#### 6.4.2 Scripts npm Principaux

**Frontend** :
```json
{
  "scripts": {
    "dev": "vite",                  // Dev server (port 5173)
    "build": "vite build",          // Build production
    "preview": "vite preview",      // Preview build
    "lint": "eslint ."              // Linting
  }
}
```

**Backend** :
```json
{
  "scripts": {
    "dev": "tsx src/server.ts",        // Dev avec hot reload
    "build": "tsc --build --force",    // Compilation TypeScript
    "start": "node dist/server.js",    // Production
    "db:init": "tsx src/scripts/init-db.ts",    // Init DB
    "db:seed": "tsx src/database/seeders/index.ts",  // Seed data
    "test": "jest --coverage",         // Tests
    "lint": "eslint src"               // Linting
  }
}
```

---

## 7. SÉCURITÉ ET AUTHENTIFICATION

### 7.1 Mesures de Sécurité Implémentées

#### 7.1.1 Authentification

- **JWT (JSON Web Tokens)** : Authentification stateless
- **Expiration** : 7 jours
- **Secret Key** : Stocké dans variable d'environnement
- **Refresh Tokens** : Non implémenté (peut être ajouté)

#### 7.1.2 Autorisation

- **RBAC** : Role-Based Access Control
- **Permissions granulaires** : 60+ permissions
- **Middleware de vérification** : Sur chaque route protégée

#### 7.1.3 Protection des Mots de Passe

```typescript
// Hashage avec bcrypt (10 rounds)
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Vérification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

#### 7.1.4 Sécurité des Headers HTTP (Helmet)

```typescript
app.use(helmet());

// Configure automatiquement :
// - Content-Security-Policy
// - X-DNS-Prefetch-Control
// - X-Frame-Options: DENY
// - X-Content-Type-Options: nosniff
// - X-XSS-Protection
```

#### 7.1.5 CORS (Cross-Origin Resource Sharing)

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Production: origin = ['https://minsante.it-grafik.com']
```

#### 7.1.6 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requêtes par IP
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

#### 7.1.7 Validation des Entrées

```typescript
import { body, validationResult } from 'express-validator';

// Exemple de validation
router.post('/fosa',
  [
    body('nom').trim().isLength({ min: 3 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 })
  ],
  validateMiddleware,
  FosaController.create
);
```

#### 7.1.8 Protection SQL Injection

- **ORM Sequelize** : Parameterized queries automatiques
- **Échappement** : Automatique via Sequelize

```typescript
// Safe - Sequelize parameterized query
const fosa = await Fosa.findOne({ where: { id: userId } });

// UNSAFE - Raw query sans Sequelize (NE PAS FAIRE)
const fosa = await sequelize.query(`SELECT * FROM fosas WHERE id = ${userId}`);
```

#### 7.1.9 Protection XSS

- **React** : Échappement automatique des variables
- **DOMPurify** : Peut être ajouté pour HTML brut
- **Content-Security-Policy** : Headers Helmet

#### 7.1.10 HTTPS/TLS

- **Let's Encrypt** : Certificats SSL gratuits
- **Auto-renewal** : Via nginx-proxy-companion
- **Force HTTPS** : Redirection automatique

### 7.2 Audit et Traçabilité

#### 7.2.1 Audit Logs

```typescript
// Table audit_logs
{
  id: number;
  userId: number;
  action: string;         // 'CREATE', 'UPDATE', 'DELETE'
  resource: string;       // 'FOSA', 'User', 'Equipement'
  resourceId: number;
  details: JSON;          // Données avant/après
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Middleware d'audit
export const auditLog = (action: string, resource: string) => {
  return async (req, res, next) => {
    await AuditLog.create({
      userId: req.user.id,
      action,
      resource,
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  };
};
```

### 7.3 Bonnes Pratiques de Sécurité

#### ✅ À FAIRE

1. Changer les mots de passe par défaut en production
2. Utiliser des secrets forts pour JWT_SECRET
3. Activer HTTPS en production
4. Limiter les tentatives de connexion
5. Valider toutes les entrées utilisateur
6. Logger les actions sensibles
7. Mettre à jour régulièrement les dépendances
8. Utiliser des variables d'environnement pour secrets
9. Implémenter 2FA (peut être ajouté)
10. Effectuer des audits de sécurité réguliers

#### ❌ À ÉVITER

1. Stocker des mots de passe en clair
2. Commiter des fichiers `.env`
3. Exposer des stack traces en production
4. Utiliser `SELECT *` sans nécessité
5. Désactiver CORS en production
6. Ignorer les mises à jour de sécurité
7. Utiliser des secrets faibles
8. Logger des informations sensibles

---

## 8. DÉPLOIEMENT ET INFRASTRUCTURE

### 8.1 Architecture de Déploiement

```
                      INTERNET
                         │
                         ▼
              ┌──────────────────────┐
              │   CLOUDFLARE DNS     │
              │  (optionnel)         │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  SERVEUR PRODUCTION  │
              │  78.142.242.49       │
              │  Ubuntu 20.04+       │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   NGINX PROXY        │
              │   (nginx-proxy)      │
              │   + Let's Encrypt    │
              └───┬──────────────┬───┘
                  │              │
         ┌────────┴───┐    ┌────┴──────────┐
         ▼            ▼    ▼               ▼
┌────────────┐ ┌─────────────┐ ┌───────────────┐
│  Frontend  │ │   Backend   │ │  PHPMyAdmin   │
│  Container │ │  Container  │ │   Container   │
│            │ │             │ │               │
│  Nginx     │ │  Node.js    │ │   Apache      │
│  Port 80   │ │  Port 3000  │ │   Port 80     │
└────────────┘ └──────┬──────┘ └───────┬───────┘
                      │                │
                      └────────┬───────┘
                               ▼
                      ┌─────────────────┐
                      │  MySQL 8.0      │
                      │  Container      │
                      │  Port 3306      │
                      └─────────────────┘
```

### 8.2 Configuration Docker

#### 8.2.1 Dockerfile Backend

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["node", "dist/server.js"]
```

#### 8.2.2 Dockerfile Frontend

```dockerfile
# frontend/Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 8.2.3 Configuration Nginx (Frontend)

```nginx
# frontend/nginx.conf
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
  gzip_min_length 1000;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
      add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
  }
}
```

### 8.3 CI/CD avec GitHub Actions

#### 8.3.1 Workflow de Déploiement

**Fichier** : `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-backend:
    name: Deploy Backend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/health-backend:latest ./backend

      - name: Login to Docker Hub
        run: echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin

      - name: Push to Docker Hub
        run: docker push ${{ secrets.DOCKER_USERNAME }}/health-backend:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: 78.142.242.49
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT || 22 }}
          script: |
            docker pull ${{ secrets.DOCKER_USERNAME }}/health-backend:latest
            docker stop health-backend || true
            docker rm health-backend || true
            docker run -d \
              --name health-backend \
              --network proxy-tier \
              -e VIRTUAL_HOST=api-dev-minsante.it-grafik.com \
              -e LETSENCRYPT_HOST=api-dev-minsante.it-grafik.com \
              -e DB_HOST=mysql_db \
              -e JWT_SECRET=${{ secrets.JWT_SECRET }} \
              -v /var/health-backend/uploads:/app/uploads \
              -v /var/health-backend/logs:/app/logs \
              ${{ secrets.DOCKER_USERNAME }}/health-backend:latest

  deploy-frontend:
    name: Deploy Frontend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build \
            --build-arg VITE_API_URL=https://api-dev-minsante.it-grafik.com/api/v1 \
            -t ${{ secrets.DOCKER_USERNAME }}/health-frontend:latest \
            ./frontend

      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push ${{ secrets.DOCKER_USERNAME }}/health-frontend:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: 78.142.242.49
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_USERNAME }}/health-frontend:latest
            docker stop health-frontend || true
            docker rm health-frontend || true
            docker run -d \
              --name health-frontend \
              --network proxy-tier \
              -e VIRTUAL_HOST=minsante.it-grafik.com \
              -e LETSENCRYPT_HOST=minsante.it-grafik.com \
              ${{ secrets.DOCKER_USERNAME }}/health-frontend:latest
```

### 8.4 Variables d'Environnement

#### 8.4.1 Backend (.env)

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=mysql_db
DB_PORT=3306
DB_NAME=health_management
DB_USER=healthuser
DB_PASSWORD=<strong_password>

# JWT
JWT_SECRET=<very_strong_secret_key>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://minsante.it-grafik.com

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads

# Nginx Proxy (Docker)
VIRTUAL_HOST=api-dev-minsante.it-grafik.com
LETSENCRYPT_HOST=api-dev-minsante.it-grafik.com
LETSENCRYPT_EMAIL=admin@minsante.cm
```

#### 8.4.2 Frontend (.env)

```env
VITE_API_URL=https://api-dev-minsante.it-grafik.com/api/v1
VITE_APP_NAME=Health Management System
```

### 8.5 Commandes de Déploiement

#### 8.5.1 Déploiement Manuel Backend

```bash
# 1. Build image
cd backend
docker build -t health-backend:latest .

# 2. Stop container existant
docker stop health-backend
docker rm health-backend

# 3. Run nouveau container
docker run -d \
  --name health-backend \
  --network proxy-tier \
  -e VIRTUAL_HOST=api-dev-minsante.it-grafik.com \
  -e LETSENCRYPT_HOST=api-dev-minsante.it-grafik.com \
  -e DB_HOST=mysql_db \
  -e DB_NAME=health_management \
  -e DB_USER=healthuser \
  -e DB_PASSWORD=<password> \
  -e JWT_SECRET=<secret> \
  -v /var/health-backend/uploads:/app/uploads \
  -v /var/health-backend/logs:/app/logs \
  health-backend:latest

# 4. Vérifier logs
docker logs -f health-backend
```

#### 8.5.2 Déploiement Manuel Frontend

```bash
# 1. Build image
cd frontend
docker build \
  --build-arg VITE_API_URL=https://api-dev-minsante.it-grafik.com/api/v1 \
  -t health-frontend:latest .

# 2. Stop container existant
docker stop health-frontend
docker rm health-frontend

# 3. Run nouveau container
docker run -d \
  --name health-frontend \
  --network proxy-tier \
  -e VIRTUAL_HOST=minsante.it-grafik.com \
  -e LETSENCRYPT_HOST=minsante.it-grafik.com \
  health-frontend:latest

# 4. Vérifier
docker logs -f health-frontend
```

### 8.6 Monitoring et Logs

#### 8.6.1 Consulter les Logs

```bash
# Backend logs
docker logs health-backend
docker logs -f health-backend  # Follow mode
docker exec health-backend tail -f /app/logs/combined.log

# Frontend logs (Nginx)
docker logs health-frontend
docker logs -f health-frontend

# MySQL logs
docker logs mysql_db
```

#### 8.6.2 Health Checks

```bash
# Backend health
curl https://api-dev-minsante.it-grafik.com/api/v1/health

# Frontend
curl https://minsante.it-grafik.com

# Database connection (depuis backend container)
docker exec health-backend node -e "require('./dist/config/database').default.authenticate().then(() => console.log('DB OK')).catch(console.error)"
```

### 8.7 Sauvegarde et Restauration

#### 8.7.1 Sauvegarde MySQL

```bash
# Dump complet
docker exec mysql_db mysqldump -u root -p<password> health_management > backup_$(date +%Y%m%d).sql

# Dump avec compression
docker exec mysql_db mysqldump -u root -p<password> health_management | gzip > backup_$(date +%Y%m%d).sql.gz

# Automatisation (cron)
0 2 * * * docker exec mysql_db mysqldump -u root -p<password> health_management | gzip > /backups/health_$(date +\%Y\%m\%d).sql.gz
```

#### 8.7.2 Restauration MySQL

```bash
# Restaurer depuis dump
docker exec -i mysql_db mysql -u root -p<password> health_management < backup_20250106.sql

# Restaurer depuis gzip
gunzip < backup_20250106.sql.gz | docker exec -i mysql_db mysql -u root -p<password> health_management
```

---

## 9. GUIDES DE DÉVELOPPEMENT

### 9.1 Installation de l'Environnement de Développement

#### 9.1.1 Prérequis

- Node.js 20+ : https://nodejs.org/
- MySQL 8.0+ : https://dev.mysql.com/downloads/
- Git : https://git-scm.com/
- VSCode (recommandé) : https://code.visualstudio.com/

#### 9.1.2 Cloner le Repository

```bash
git clone https://github.com/votre-organisation/API-HEALTH.git
cd API-HEALTH
```

#### 9.1.3 Configuration Backend

```bash
cd backend

# Installer dépendances
npm install

# Créer .env
cp .env.example .env

# Modifier .env avec vos paramètres
nano .env

# Compiler TypeScript
npm run build

# Initialiser base de données
npm run db:init

# Démarrer serveur dev
npm run dev
```

Backend accessible sur : http://localhost:3000
API Docs : http://localhost:3000/api-docs

#### 9.1.4 Configuration Frontend

```bash
cd frontend

# Installer dépendances
npm install

# Créer .env
cp .env.example .env

# Modifier .env
nano .env
# VITE_API_URL=http://localhost:3000/api/v1

# Démarrer serveur dev
npm run dev
```

Frontend accessible sur : http://localhost:5173

### 9.2 Workflow de Développement

#### 9.2.1 Créer une Nouvelle Feature

```bash
# 1. Créer branche
git checkout -b feature/nom-de-la-feature

# 2. Développer la feature
# ... modifications ...

# 3. Tester
npm run test

# 4. Linter
npm run lint

# 5. Commit
git add .
git commit -m "feat: description de la feature"

# 6. Push
git push origin feature/nom-de-la-feature

# 7. Créer Pull Request sur GitHub
```

#### 9.2.2 Conventions de Commit

```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: modification documentation
style: formatage code (pas de changement logique)
refactor: refactoring
test: ajout/modification tests
chore: tâches de maintenance
```

### 9.3 Ajouter une Nouvelle Entité (CRUD)

#### Exemple : Ajouter entité "Medicament"

**Étape 1 : Créer le modèle**

```typescript
// backend/src/models/Medicament.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Medicament extends Model {
  declare id: number;
  declare nom: string;
  declare code: string;
  declare fosaId: number;
  declare quantite: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Medicament.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, unique: true },
  fosaId: { type: DataTypes.INTEGER, allowNull: false },
  quantite: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { sequelize, modelName: 'Medicament', tableName: 'medicaments' });

export default Medicament;
```

**Étape 2 : Créer le service**

```typescript
// backend/src/services/MedicamentService.ts
import Medicament from '../models/Medicament';
import { ApiError } from '../utils/ApiError';

export class MedicamentService {
  async create(data: any) {
    return await Medicament.create(data);
  }

  async getAll(filters: any) {
    return await Medicament.findAll({ where: filters });
  }

  async getById(id: number) {
    const medicament = await Medicament.findByPk(id);
    if (!medicament) throw new ApiError(404, 'Medicament not found');
    return medicament;
  }

  async update(id: number, data: any) {
    const medicament = await this.getById(id);
    return await medicament.update(data);
  }

  async delete(id: number) {
    const medicament = await this.getById(id);
    await medicament.destroy();
  }
}
```

**Étape 3 : Créer le controller**

```typescript
// backend/src/controllers/MedicamentController.ts
import { Request, Response } from 'express';
import { MedicamentService } from '../services/MedicamentService';

const service = new MedicamentService();

export class MedicamentController {
  async create(req: Request, res: Response) {
    const medicament = await service.create(req.body);
    res.status(201).json({ success: true, data: medicament });
  }

  async getAll(req: Request, res: Response) {
    const medicaments = await service.getAll(req.query);
    res.json({ success: true, data: medicaments });
  }

  async getById(req: Request, res: Response) {
    const medicament = await service.getById(parseInt(req.params.id));
    res.json({ success: true, data: medicament });
  }

  async update(req: Request, res: Response) {
    const medicament = await service.update(parseInt(req.params.id), req.body);
    res.json({ success: true, data: medicament });
  }

  async delete(req: Request, res: Response) {
    await service.delete(parseInt(req.params.id));
    res.json({ success: true, message: 'Deleted successfully' });
  }
}
```

**Étape 4 : Créer les routes**

```typescript
// backend/src/routes/medicament.routes.ts
import { Router } from 'express';
import { MedicamentController } from '../controllers/MedicamentController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();
const controller = new MedicamentController();

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, requirePermission('medicament:create'), controller.create);
router.put('/:id', authenticate, requirePermission('medicament:update'), controller.update);
router.delete('/:id', authenticate, requirePermission('medicament:delete'), controller.delete);

export default router;
```

**Étape 5 : Ajouter au router principal**

```typescript
// backend/src/routes/index.ts
import medicamentRoutes from './medicament.routes';

// ... autres routes ...

router.use('/medicaments', medicamentRoutes);
```

### 9.4 Debugging

#### 9.4.1 Backend

```typescript
// Activer logs SQL
// backend/src/config/database.ts
const sequelize = new Sequelize({
  // ...
  logging: console.log  // Voir toutes les requêtes SQL
});

// Logs Winston
import { logger } from './config/logger';
logger.info('Mon message');
logger.error('Erreur:', error);
```

#### 9.4.2 Frontend

```typescript
// React DevTools (extension Chrome/Firefox)
// Console logs
console.log('State:', state);
console.table(data);

// Network tab (pour voir requêtes API)
```

---

## 10. ANNEXES

### 10.1 URLs Importantes

| Service | URL | Description |
|---------|-----|-------------|
| Frontend Production | https://minsante.it-grafik.com | Interface utilisateur |
| Backend API Production | https://api-dev-minsante.it-grafik.com | API REST |
| API Documentation | https://api-dev-minsante.it-grafik.com/api-docs | Swagger UI |
| PHPMyAdmin | https://phpmyadmin.it-grafik.com | Gestion base de données |

### 10.2 Comptes par Défaut

⚠️ **IMPORTANT : Changez ces mots de passe en production !**

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| superadmin@minsante.cm | Admin@2024 | Super Administrateur |
| admin@minsante.cm | Admin@2024 | Administrateur |
| manager@minsante.cm | Admin@2024 | Gestionnaire |
| user@minsante.cm | Admin@2024 | Utilisateur |

### 10.3 Ports Utilisés

| Service | Port | Description |
|---------|------|-------------|
| Backend | 3000 | API Express.js |
| Frontend Dev | 5173 | Vite dev server |
| MySQL | 3306 | Base de données |
| Nginx Proxy | 80, 443 | HTTP/HTTPS |

### 10.4 Ressources et Documentation

#### Documentation Officielle des Technologies

- **React** : https://react.dev/
- **TypeScript** : https://www.typescriptlang.org/
- **Express.js** : https://expressjs.com/
- **Sequelize** : https://sequelize.org/
- **Leaflet** : https://leafletjs.com/
- **Tailwind CSS** : https://tailwindcss.com/
- **Vite** : https://vitejs.dev/
- **Docker** : https://docs.docker.com/

#### Tutoriels Recommandés

- React + TypeScript : https://react-typescript-cheatsheet.netlify.app/
- Node.js Best Practices : https://github.com/goldbergyoni/nodebestpractices
- Sequelize Migrations : https://sequelize.org/docs/v6/other-topics/migrations/

### 10.5 Structure des Permissions

#### Liste Complète des Permissions (60+)

```typescript
// FOSA
'fosa:create', 'fosa:read', 'fosa:update', 'fosa:delete'

// Utilisateurs
'user:create', 'user:read', 'user:update', 'user:delete', 'user:manage'

// Régions
'region:create', 'region:read', 'region:update', 'region:delete'

// Départements
'departement:create', 'departement:read', 'departement:update', 'departement:delete'

// Arrondissements
'arrondissement:create', 'arrondissement:read', 'arrondissement:update', 'arrondissement:delete'

// Districts
'district:create', 'district:read', 'district:update', 'district:delete'

// Aires de santé
'airesante:create', 'airesante:read', 'airesante:update', 'airesante:delete'

// Catégories
'categorie:create', 'categorie:read', 'categorie:update', 'categorie:delete'

// Équipements
'equipement:create', 'equipement:read', 'equipement:update', 'equipement:delete'

// Personnel
'personnel:create', 'personnel:read', 'personnel:update', 'personnel:delete'

// Bâtiments
'batiment:create', 'batiment:read', 'batiment:update', 'batiment:delete'

// Services
'service:create', 'service:read', 'service:update', 'service:delete'

// Audit
'audit:read'

// Statistiques
'statistics:read'
```

### 10.6 Dépannage (Troubleshooting)

#### Problème : Backend ne démarre pas

```bash
# Vérifier logs
docker logs health-backend

# Vérifier connexion DB
docker exec health-backend node -e "require('./dist/config/database').default.authenticate().then(() => console.log('OK')).catch(console.error)"

# Vérifier variables d'environnement
docker exec health-backend env | grep DB_
```

#### Problème : Frontend affiche erreurs CORS

```bash
# Vérifier CORS_ORIGIN dans backend .env
CORS_ORIGIN=https://minsante.it-grafik.com

# Redémarrer backend
docker restart health-backend
```

#### Problème : Base de données vide

```bash
# Initialiser base de données
docker exec health-backend npm run db:init

# Ou avec seed complet
docker exec health-backend npm run db:seed
```

### 10.7 Contact et Support

**Développeurs** :
- **Mindah Nkemeni Franck Julius** - mindahnkemeni@gmail.com
- **Serge Mezui**

**Organisation** : IT-Grafik

**Repository GitHub** : (URL du repository)

**Ministère de la Santé Publique du Cameroun**

---

## GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **FOSA** | Formation Sanitaire (structure de santé) |
| **CSI** | Centre de Santé Intégré |
| **CMA** | Centre Médical d'Arrondissement |
| **RBAC** | Role-Based Access Control (contrôle d'accès basé sur les rôles) |
| **JWT** | JSON Web Token (token d'authentification) |
| **ORM** | Object-Relational Mapping (mapping objet-relationnel) |
| **API** | Application Programming Interface |
| **REST** | Representational State Transfer |
| **CRUD** | Create, Read, Update, Delete |
| **SPA** | Single Page Application |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **HTTPS** | HyperText Transfer Protocol Secure |
| **SSL/TLS** | Secure Sockets Layer / Transport Layer Security |
| **CORS** | Cross-Origin Resource Sharing |
| **XSS** | Cross-Site Scripting |
| **SQL Injection** | Attaque par injection SQL |

---

**FIN DE LA DOCUMENTATION TECHNIQUE**

---

*Document généré le 6 Décembre 2025*
*Version 1.0.0*
*Développé avec ❤️ pour la santé au Cameroun*
