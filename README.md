# Health Management System - Système de Gestion de la Santé

[![Deploy to Production](https://github.com/yourusername/API-HEALTH/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/yourusername/API-HEALTH/actions/workflows/deploy-production.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Système complet de gestion des infrastructures de santé du Cameroun avec interface web moderne et API REST robuste.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Déploiement](#déploiement)
- [Documentation API](#documentation-api)
- [Structure du Projet](#structure-du-projet)
- [Contribution](#contribution)

## 🌟 Vue d'ensemble

Le **Health Management System** est une plateforme complète développée pour gérer les infrastructures sanitaires du Cameroun. Le système permet de :

- Gérer les structures de santé (FOSA) à travers les régions
- Suivre les équipements médicaux et leur état
- Gérer le personnel de santé
- Visualiser les données géographiques sur une carte interactive
- Générer des statistiques et rapports détaillés
- Gérer les utilisateurs et permissions avec système RBAC

### 🔗 Liens Importants

- **Frontend (Production)** : [https://minsante.it-grafik.com](https://minsante.it-grafik.com)
- **Backend API (Production)** : [https://api-dev-minsante.it-grafik.com](https://api-dev-minsante.it-grafik.com)
- **Documentation API** : [https://api-dev-minsante.it-grafik.com/api-docs](https://api-dev-minsante.it-grafik.com/api-docs)
- **PHPMyAdmin** : [https://phpmyadmin.it-grafik.com](https://phpmyadmin.it-grafik.com)

## 🏗️ Architecture

Le système est composé de deux applications principales :

```
┌─────────────────────────────────────────────────────────────┐
│                      Utilisateurs                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│   Frontend     │   │   Backend API   │
│   React +      │◄──┤   Express +     │
│   Vite         │   │   TypeScript    │
│   (Nginx)      │   │   Sequelize     │
└────────────────┘   └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  MySQL 8.0      │
                     │  Database       │
                     └─────────────────┘
```

### Technologies Stack

#### Backend
- **Runtime** : Node.js 20 LTS
- **Framework** : Express.js
- **Language** : TypeScript
- **ORM** : Sequelize
- **Base de données** : MySQL 8.0
- **Authentication** : JWT (JSON Web Tokens)
- **Validation** : Express-validator
- **Documentation** : Swagger/OpenAPI
- **Logging** : Winston
- **Security** : Helmet, CORS, Rate limiting

#### Frontend
- **Framework** : React 18
- **Build Tool** : Vite
- **Routing** : React Router v7
- **Styling** : Tailwind CSS
- **Maps** : Leaflet + React-Leaflet
- **Charts** : Recharts
- **HTTP Client** : Axios
- **Icons** : Lucide React

#### DevOps
- **Containerization** : Docker
- **CI/CD** : GitHub Actions
- **Web Server** : Nginx (reverse proxy + static files)
- **SSL/TLS** : Let's Encrypt
- **Monitoring** : Docker logs

## ✨ Fonctionnalités

### Gestion des Structures de Santé
- ✅ CRUD complet pour les FOSA (Formations Sanitaires)
- ✅ Hiérarchie géographique : Régions > Départements > Arrondissements > Districts > Aires de santé
- ✅ Catégorisation des structures (Hôpitaux, Centres de Santé, etc.)
- ✅ Géolocalisation sur carte interactive

### Gestion des Équipements
- ✅ Inventaire des équipements médicaux
- ✅ Suivi de l'état et dégradations
- ✅ Équipements biomédicaux
- ✅ Matériel roulant (ambulances, véhicules)

### Gestion du Personnel
- ✅ Répertoire du personnel de santé
- ✅ Affectations par structure
- ✅ Catégories professionnelles

### Administration
- ✅ Système d'authentification sécurisé
- ✅ Gestion des rôles et permissions (RBAC)
- ✅ Audit logs des actions importantes
- ✅ Gestion multi-utilisateurs

### Statistiques et Rapports
- ✅ Tableaux de bord interactifs
- ✅ Graphiques et visualisations
- ✅ Exports de données
- ✅ Rapports personnalisables

## 📦 Prérequis

### Pour le Développement Local
- Node.js 20.x ou supérieur
- MySQL 8.0
- npm ou yarn
- Git

### Pour le Déploiement
- Serveur Linux (Ubuntu 20.04+ recommandé)
- Docker et Docker Compose
- Nginx (si non utilisé dans Docker)
- Nom de domaine avec certificat SSL

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/yourusername/API-HEALTH.git
cd API-HEALTH
```

### 2. Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Modifier le fichier .env avec vos configurations
nano .env

# Compiler TypeScript
npm run build

# Initialiser la base de données (roles, permissions, users par défaut)
npm run db:init

# OU charger toutes les données de test (complète)
npm run db:seed
```

**Note importante** : Au premier démarrage, l'application initialise automatiquement :
- ✅ Les rôles (Super Admin, Admin, Manager, User)
- ✅ Les permissions (60+ permissions RBAC)
- ✅ Les utilisateurs par défaut
- ✅ Les associations rôles-permissions

Les **comptes par défaut** créés :
| Email | Mot de passe | Rôle |
|-------|--------------|------|
| superadmin@minsante.cm | Admin@2024 | Super Administrateur |
| admin@minsante.cm | Admin@2024 | Administrateur |
| manager@minsante.cm | Admin@2024 | Gestionnaire |
| user@minsante.cm | Admin@2024 | Utilisateur |

⚠️ **IMPORTANT** : Changez ces mots de passe immédiatement en production !

### 3. Configuration Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Modifier le fichier .env
nano .env

# Build pour production
npm run build
```

### 4. Démarrage en Mode Développement

**Backend :**
```bash
cd backend
npm run dev
# API disponible sur http://localhost:3000
```

**Frontend :**
```bash
cd frontend
npm run dev
# Application disponible sur http://localhost:5173
```

## ⚙️ Configuration

### Variables d'Environnement Backend

Voir [backend/.env.example](backend/.env.example) pour la liste complète.

**Principales variables :**

```env
# Database
DB_HOST=mysql_db
DB_PORT=3306
DB_NAME=mydatabase
DB_USER=myuser
DB_PASSWORD=mypassword

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://minsante.it-grafik.com
```

### Variables d'Environnement Frontend

Voir [frontend/.env.example](frontend/.env.example) pour la liste complète.

**Principales variables :**

```env
VITE_API_URL=https://api-dev-minsante.it-grafik.com/api/v1
VITE_APP_NAME=Health Management System
```

## 🐳 Déploiement avec Docker

### Backend

```bash
cd backend

# Build de l'image
docker build -t health-backend:latest .

# Lancer le conteneur
docker run -d \
  --name health-backend \
  --network proxy-tier \
  -e VIRTUAL_HOST=api-dev-minsante.it-grafik.com \
  -e LETSENCRYPT_HOST=api-dev-minsante.it-grafik.com \
  -e DB_HOST=mysql_db \
  -e DB_NAME=mydatabase \
  -e DB_USER=myuser \
  -e DB_PASSWORD=mypassword \
  -e JWT_SECRET=your-secret \
  -v /var/health-backend/uploads:/app/uploads \
  -v /var/health-backend/logs:/app/logs \
  health-backend:latest
```

### Frontend

```bash
cd frontend

# Build de l'image avec variables d'environnement
docker build \
  --build-arg VITE_API_URL=https://api-dev-minsante.it-grafik.com/api/v1 \
  -t health-frontend:latest .

# Lancer le conteneur
docker run -d \
  --name health-frontend \
  --network proxy-tier \
  -e VIRTUAL_HOST=minsante.it-grafik.com \
  -e LETSENCRYPT_HOST=minsante.it-grafik.com \
  health-frontend:latest
```

### Configuration MySQL Existante

Le système utilise une base de données MySQL déjà configurée :

```bash
# Base de données existante
docker run -d \
  --name mysql_db \
  --network proxy-tier \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=mydatabase \
  -e MYSQL_USER=myuser \
  -e MYSQL_PASSWORD=mypassword \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0
```

## 🔄 CI/CD avec GitHub Actions

Le projet utilise GitHub Actions pour le déploiement automatique en production.

### Configuration des Secrets

Dans les paramètres GitHub de votre repository (`Settings > Secrets and variables > Actions`), ajoutez les secrets suivants :

```
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password
SERVER_USER=your-server-ssh-user
SSH_PRIVATE_KEY=your-ssh-private-key
SSH_PORT=22 (optionnel, défaut: 22)
JWT_SECRET=your-jwt-secret
```

### Workflow de Déploiement

**Fichier** : [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml)

**Déclenchement automatique :**
- ✅ Push sur la branche `main`
- ✅ Déclenchement manuel via GitHub UI

**Étapes du déploiement :**
1. **Build Backend** : Construction de l'image Docker backend
2. **Build Frontend** : Construction de l'image Docker frontend avec variables d'environnement
3. **Push to Docker Hub** : Upload des images vers Docker Hub
4. **Deploy Backend** : Déploiement via SSH sur le serveur (78.142.242.49)
5. **Deploy Frontend** : Déploiement via SSH sur le serveur
6. **Health Checks** : Vérification automatique de la santé des services
7. **Verification** : Tests de bout en bout

### Déploiement Manuel

Vous pouvez aussi déclencher le déploiement manuellement :

1. Allez sur GitHub > Actions
2. Sélectionnez "Deploy to Production"
3. Cliquez sur "Run workflow"
4. Choisissez la branche `main`
5. Cliquez sur "Run workflow"

## 📚 Documentation API

La documentation complète de l'API est disponible via Swagger UI :

**URL** : [https://api-dev-minsante.it-grafik.com/api-docs](https://api-dev-minsante.it-grafik.com/api-docs)

### Endpoints Principaux

#### Authentication
- `POST /api/v1/auth/login` - Connexion utilisateur
- `POST /api/v1/auth/register` - Inscription (admin uniquement)
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `POST /api/v1/auth/logout` - Déconnexion

#### Structures Géographiques
- `GET /api/v1/regions` - Liste des régions
- `GET /api/v1/departements` - Liste des départements
- `GET /api/v1/districts` - Liste des districts
- `GET /api/v1/airesante` - Liste des aires de santé

#### FOSA (Structures de Santé)
- `GET /api/v1/fosa` - Liste des FOSA
- `POST /api/v1/fosa` - Créer une FOSA
- `GET /api/v1/fosa/:id` - Détails d'une FOSA
- `PUT /api/v1/fosa/:id` - Modifier une FOSA
- `DELETE /api/v1/fosa/:id` - Supprimer une FOSA

#### Équipements
- `GET /api/v1/equipements` - Liste des équipements
- `POST /api/v1/equipements` - Ajouter un équipement
- `GET /api/v1/equipebio` - Équipements biomédicaux
- `GET /api/v1/materielroulant` - Matériel roulant

#### Personnel
- `GET /api/v1/personnel` - Liste du personnel
- `POST /api/v1/personnel` - Ajouter du personnel

#### Statistiques
- `GET /api/v1/statistics/overview` - Vue d'ensemble
- `GET /api/v1/statistics/by-region` - Stats par région
- `GET /api/v1/statistics/by-category` - Stats par catégorie

### Authentification

L'API utilise JWT Bearer tokens :

```bash
# Exemple de requête authentifiée
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-dev-minsante.it-grafik.com/api/v1/fosa
```

## 📁 Structure du Projet

```
API-HEALTH/
├── backend/                    # Application backend
│   ├── src/
│   │   ├── config/            # Configuration (DB, Redis, Logger, Swagger)
│   │   ├── controllers/       # Contrôleurs Express
│   │   ├── middleware/        # Middlewares (auth, error handling)
│   │   ├── models/            # Modèles Sequelize
│   │   ├── routes/            # Définitions des routes
│   │   ├── services/          # Logique métier
│   │   ├── utils/             # Utilitaires
│   │   ├── validation/        # Schémas de validation
│   │   └── server.ts          # Point d'entrée
│   ├── database/              # Migrations et seeders
│   ├── Dockerfile             # Dockerfile backend
│   ├── package.json
│   └── .env.example
│
├── frontend/                  # Application frontend
│   ├── src/
│   │   ├── components/        # Composants React réutilisables
│   │   ├── pages/             # Pages de l'application
│   │   ├── services/          # Services API
│   │   ├── contexts/          # Contextes React
│   │   ├── types/             # Types TypeScript
│   │   └── main.tsx           # Point d'entrée
│   ├── public/                # Fichiers statiques
│   ├── Dockerfile             # Dockerfile frontend
│   ├── nginx.conf             # Configuration Nginx
│   ├── package.json
│   └── .env.example
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Tests et validation
│       └── deploy-production.yml    # Déploiement production
│
├── README.md                  # Ce fichier
└── DEPLOYMENT.md             # Guide de déploiement détaillé
```

## 🔒 Sécurité

### Mesures Implémentées

- ✅ Authentication JWT avec expiration
- ✅ Hashage des mots de passe avec bcrypt
- ✅ Protection CORS configurée
- ✅ Helmet.js pour headers de sécurité
- ✅ Rate limiting sur les API
- ✅ Validation des entrées utilisateur
- ✅ Logs d'audit des actions sensibles
- ✅ HTTPS avec Let's Encrypt
- ✅ Principe du moindre privilège (RBAC)

### Bonnes Pratiques

- Ne jamais commiter les fichiers `.env`
- Changer les secrets par défaut en production
- Mettre à jour régulièrement les dépendances
- Surveiller les logs pour détecter les anomalies
- Effectuer des sauvegardes régulières de la base de données

## 🧪 Tests

```bash
# Backend
cd backend
npm test
npm run test:watch
npm run test:coverage

# Frontend
cd frontend
npm test
```

## 🔐 Initialisation et Sécurité

### Initialisation Automatique

L'application initialise automatiquement la base de données au premier démarrage :

**Ce qui est créé automatiquement :**
1. **Permissions (60+)** : Système RBAC complet
2. **Rôles (4)** : Super Admin, Admin, Manager, User
3. **Associations** : Permissions assignées aux rôles
4. **Utilisateurs par défaut** : Comptes admin pour démarrer

**Comptes créés automatiquement :**
```
superadmin@minsante.cm  (Super Administrateur) - Accès total
admin@minsante.cm       (Administrateur)       - Gestion administrative
manager@minsante.cm     (Gestionnaire)         - Gestion FOSA/équipements
user@minsante.cm        (Utilisateur)          - Lecture seule

Mot de passe par défaut : Admin@2024
```

### Initialisation Manuelle

```bash
# Initialiser (idempotent - safe)
npm run db:init

# Réinitialiser complètement (DANGER - efface tout!)
npm run db:init:force

# Avec confirmation
FORCE_CONFIRM=YES npm run db:init:force
```

### Configuration du Mot de Passe Admin

Changez le mot de passe par défaut via la variable d'environnement :

```env
# Dans .env
DEFAULT_ADMIN_PASSWORD=VotreMotDePasseSecurise2024!
```

### Matrice des Permissions par Rôle

| Ressource | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| Utilisateurs | ✅ CRUD + Manage | ❌ | ❌ | ❌ |
| Régions/Départements | ✅ | ✅ | 📖 Read | 📖 Read |
| FOSA | ✅ | ✅ | ✅ | 📖 Read |
| Équipements | ✅ | ✅ | ✅ | 📖 Read |
| Personnel | ✅ | ✅ | ✅ | 📖 Read |
| Audit Logs | ✅ | 📖 Read | ❌ | ❌ |
| Statistiques | ✅ | ✅ | ✅ | 📖 Read |

## 📊 Monitoring et Logs

### Logs Backend

Les logs sont stockés dans `/app/logs` avec rotation quotidienne :

```bash
# Voir les logs du conteneur
docker logs -f health-backend

# Voir les logs applicatifs
docker exec health-backend tail -f /app/logs/combined.log
docker exec health-backend tail -f /app/logs/error.log
```

### Logs Frontend

```bash
# Voir les logs Nginx
docker logs -f health-frontend
```

### Health Checks

- Backend : `https://api-dev-minsante.it-grafik.com/api/v1/health`
- Frontend : `https://minsante.it-grafik.com`

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Guidelines

- Suivre les conventions de code existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation si nécessaire
- Respecter le style de commit conventionnel

## 📝 Changelog

### Version 1.0.0 (2025-01-03)

- 🎉 Version initiale
- ✅ Gestion complète des FOSA
- ✅ Système d'authentification et RBAC
- ✅ Interface cartographique
- ✅ Gestion des équipements et personnel
- ✅ Statistiques et rapports
- ✅ Déploiement CI/CD automatisé

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

- **Équipe de Développement** - IT-Grafik
- **Contact** : mindahnkemeni@gmail.com

## 🙏 Remerciements

- Ministère de la Santé du Cameroun
- Toutes les équipes qui ont contribué au projet

---

**Développé avec ❤️ pour la santé au Cameroun**
