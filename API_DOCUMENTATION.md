# Documentation API - Health Management System

## 📖 Vue d'ensemble

L'API Health Management System est une API RESTful construite avec Express.js et TypeScript qui fournit des endpoints pour gérer les infrastructures de santé du Cameroun.

**Base URL Production** : `https://api-dev-minsante.it-grafik.com/api/v1`
**Documentation Interactive** : `https://api-dev-minsante.it-grafik.com/api-docs`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│              (React Frontend / Mobile App)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/REST
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                  (Nginx Reverse Proxy)                       │
│                     + Let's Encrypt                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Middleware Layer                          │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────┐   │
│  │  CORS    │  Helmet  │   Rate   │   Auth   │ Logger  │   │
│  │          │ Security │ Limiting │   JWT    │ Winston │   │
│  └──────────┴──────────┴──────────┴──────────┴─────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                          │
│   ┌──────────────────────────────────────────────────┐      │
│   │  Request Validation (express-validator)         │      │
│   │  Error Handling                                  │      │
│   │  Response Formatting                             │      │
│   └──────────────────────────────────────────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│   ┌──────────────────────────────────────────────────┐      │
│   │  Business Logic                                  │      │
│   │  Data Processing                                 │      │
│   │  External API Calls                              │      │
│   └──────────────────────────────────────────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Repository/Model Layer                       │
│   ┌──────────────────────────────────────────────────┐      │
│   │  Sequelize ORM                                   │      │
│   │  Database Queries                                │      │
│   │  Data Validation                                 │      │
│   └──────────────────────────────────────────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│                      MySQL 8.0                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentification

### JWT (JSON Web Tokens)

L'API utilise JWT pour l'authentification. Les tokens doivent être inclus dans le header `Authorization`.

#### Obtenir un Token

**Endpoint** : `POST /api/v1/auth/login`

**Request Body** :
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response** :
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nom": "Doe",
      "prenom": "John",
      "role": "admin"
    }
  }
}
```

#### Utiliser le Token

Incluez le token dans vos requêtes :

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://api-dev-minsante.it-grafik.com/api/v1/fosa
```

### Rafraîchir le Token

**Endpoint** : `POST /api/v1/auth/refresh`

**Request Body** :
```json
{
  "refreshToken": "your-refresh-token"
}
```

## 📚 Endpoints Principaux

### 1. Authentication (`/api/v1/auth`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| POST | `/auth/register` | Inscription (admin uniquement) | ✓ |
| POST | `/auth/login` | Connexion | ✗ |
| POST | `/auth/logout` | Déconnexion | ✓ |
| POST | `/auth/refresh` | Rafraîchir le token | ✗ |
| GET | `/auth/me` | Profil utilisateur | ✓ |

### 2. Structures Géographiques

#### Régions (`/api/v1/regions`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/regions` | Liste toutes les régions | ✗ |
| GET | `/regions/:id` | Détails d'une région | ✗ |
| POST | `/regions` | Créer une région | ✓ |
| PUT | `/regions/:id` | Modifier une région | ✓ |
| DELETE | `/regions/:id` | Supprimer une région | ✓ |

**Exemple Response** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nom": "Adamaoua",
      "code": "AD",
      "chef_lieu": "Ngaoundéré"
    }
  ]
}
```

#### Départements (`/api/v1/departements`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/departements` | Liste tous les départements | ✗ |
| GET | `/departements/:id` | Détails d'un département | ✗ |
| GET | `/departements/region/:regionId` | Départements par région | ✗ |
| POST | `/departements` | Créer un département | ✓ |

#### Districts (`/api/v1/districts`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/districts` | Liste tous les districts | ✗ |
| GET | `/districts/:id` | Détails d'un district | ✗ |
| GET | `/districts/departement/:deptId` | Districts par département | ✗ |

#### Aires de Santé (`/api/v1/airesante`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/airesante` | Liste toutes les aires de santé | ✗ |
| GET | `/airesante/:id` | Détails d'une aire de santé | ✗ |
| GET | `/airesante/district/:districtId` | Aires par district | ✗ |

### 3. FOSA - Formations Sanitaires (`/api/v1/fosa`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/fosa` | Liste toutes les FOSA | ✗ |
| GET | `/fosa/:id` | Détails d'une FOSA | ✗ |
| POST | `/fosa` | Créer une FOSA | ✓ |
| PUT | `/fosa/:id` | Modifier une FOSA | ✓ |
| DELETE | `/fosa/:id` | Supprimer une FOSA | ✓ |
| GET | `/fosa/region/:regionId` | FOSA par région | ✗ |
| GET | `/fosa/category/:categoryId` | FOSA par catégorie | ✗ |

**Exemple Create Request** :
```json
{
  "nom": "Hôpital Central de Yaoundé",
  "code": "HCY001",
  "categorieId": 1,
  "airesanteId": 10,
  "adresse": "Avenue Kennedy",
  "telephone": "+237 222 234 567",
  "email": "contact@hcy.cm",
  "latitude": 3.8667,
  "longitude": 11.5167,
  "capacite_lits": 500,
  "statut": "Fonctionnel"
}
```

**Query Parameters** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (défaut: 10)
- `search` : Recherche par nom
- `region` : Filtrer par région
- `category` : Filtrer par catégorie
- `status` : Filtrer par statut

### 4. Équipements (`/api/v1/equipements`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/equipements` | Liste tous les équipements | ✓ |
| GET | `/equipements/:id` | Détails d'un équipement | ✓ |
| POST | `/equipements` | Ajouter un équipement | ✓ |
| PUT | `/equipements/:id` | Modifier un équipement | ✓ |
| DELETE | `/equipements/:id` | Supprimer un équipement | ✓ |
| GET | `/equipements/fosa/:fosaId` | Équipements par FOSA | ✓ |

**Exemple Request** :
```json
{
  "nom": "Scanner IRM Siemens",
  "code": "EQP-IRM-001",
  "fosaId": 1,
  "categorieId": 2,
  "etat": "Bon",
  "date_acquisition": "2023-01-15",
  "valeur_acquisition": 150000000,
  "fournisseur": "Siemens Healthcare"
}
```

### 5. Personnel (`/api/v1/personnel`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/personnel` | Liste tout le personnel | ✓ |
| GET | `/personnel/:id` | Détails d'un personnel | ✓ |
| POST | `/personnel` | Ajouter du personnel | ✓ |
| PUT | `/personnel/:id` | Modifier un personnel | ✓ |
| DELETE | `/personnel/:id` | Supprimer un personnel | ✓ |
| GET | `/personnel/fosa/:fosaId` | Personnel par FOSA | ✓ |

### 6. Statistiques (`/api/v1/statistics`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/statistics/overview` | Vue d'ensemble globale | ✓ |
| GET | `/statistics/by-region` | Statistiques par région | ✓ |
| GET | `/statistics/by-category` | Stats par catégorie | ✓ |
| GET | `/statistics/equipment-status` | État des équipements | ✓ |
| GET | `/statistics/personnel-distribution` | Distribution du personnel | ✓ |

**Exemple Response (Overview)** :
```json
{
  "success": true,
  "data": {
    "totalFosa": 3245,
    "totalPersonnel": 45678,
    "totalEquipements": 12345,
    "totalRegions": 10,
    "fosaByCategory": [
      {
        "categorie": "Hôpital Central",
        "count": 12
      }
    ],
    "fosaByRegion": [
      {
        "region": "Centre",
        "count": 456
      }
    ]
  }
}
```

### 7. Utilisateurs (`/api/v1/users`)

| Méthode | Endpoint | Description | Auth Required | Permission |
|---------|----------|-------------|---------------|------------|
| GET | `/users` | Liste des utilisateurs | ✓ | admin |
| GET | `/users/:id` | Détails utilisateur | ✓ | admin |
| POST | `/users` | Créer un utilisateur | ✓ | admin |
| PUT | `/users/:id` | Modifier utilisateur | ✓ | admin |
| DELETE | `/users/:id` | Supprimer utilisateur | ✓ | admin |

### 8. Audit Logs (`/api/v1/audit`)

| Méthode | Endpoint | Description | Auth Required | Permission |
|---------|----------|-------------|---------------|------------|
| GET | `/audit` | Liste des logs d'audit | ✓ | admin |
| GET | `/audit/:id` | Détails d'un log | ✓ | admin |
| GET | `/audit/user/:userId` | Logs par utilisateur | ✓ | admin |

### 9. Health Check (`/api/v1/health`)

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/health` | État de santé de l'API | ✗ |

**Response** :
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T12:00:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected"
}
```

## 📝 Format de Réponse Standard

### Succès

```json
{
  "success": true,
  "data": { /* vos données */ },
  "message": "Opération réussie" // optionnel
}
```

### Succès avec Pagination

```json
{
  "success": true,
  "data": [ /* vos données */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Erreur

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ressource non trouvée",
    "details": {} // optionnel
  }
}
```

## ⚠️ Codes d'Erreur HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Non authentifié |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Conflit (ex: doublon) |
| 422 | Unprocessable Entity | Validation échouée |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Server Error | Erreur serveur |

## 🔒 Rôles et Permissions

### Rôles Disponibles

1. **admin** : Accès complet au système
2. **manager** : Gestion des FOSA et équipements
3. **user** : Lecture seule
4. **operator** : Opérations courantes

### Matrice de Permissions

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| FOSA | admin, manager | all | admin, manager | admin |
| Équipements | admin, manager, operator | admin, manager | admin, manager | admin |
| Personnel | admin, manager | admin, manager | admin, manager | admin |
| Utilisateurs | admin | admin | admin | admin |
| Statistiques | - | admin, manager | - | - |

## 🚦 Rate Limiting

Pour protéger l'API contre les abus :

- **Limite** : 100 requêtes par 15 minutes par IP
- **Header de réponse** : `X-RateLimit-Remaining`

Si la limite est dépassée, vous recevrez :
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later"
  }
}
```

## 📊 Exemples d'Utilisation

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api-dev-minsante.it-grafik.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.data.token);
  return response.data;
};

// Get FOSA
const getFosa = async (page = 1, limit = 10) => {
  const response = await api.get('/fosa', { params: { page, limit } });
  return response.data;
};

// Create FOSA
const createFosa = async (data: any) => {
  const response = await api.post('/fosa', data);
  return response.data;
};
```

### Python (Requests)

```python
import requests

BASE_URL = "https://api-dev-minsante.it-grafik.com/api/v1"

class HealthAPI:
    def __init__(self):
        self.session = requests.Session()
        self.token = None

    def login(self, email, password):
        response = self.session.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )
        data = response.json()
        self.token = data['data']['token']
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}'
        })
        return data

    def get_fosa(self, page=1, limit=10):
        response = self.session.get(
            f"{BASE_URL}/fosa",
            params={"page": page, "limit": limit}
        )
        return response.json()

# Usage
api = HealthAPI()
api.login("user@example.com", "password")
fosa_list = api.get_fosa()
```

### cURL

```bash
# Login
TOKEN=$(curl -s -X POST https://api-dev-minsante.it-grafik.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.token')

# Get FOSA
curl -H "Authorization: Bearer $TOKEN" \
  "https://api-dev-minsante.it-grafik.com/api/v1/fosa?page=1&limit=10"

# Create FOSA
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Hôpital Test","code":"HT001","categorieId":1}' \
  https://api-dev-minsante.it-grafik.com/api/v1/fosa
```

## 🐛 Debugging

### Activer les Logs Détaillés

Les logs sont disponibles dans le conteneur :

```bash
# Logs applicatifs
docker exec health-backend tail -f /app/logs/combined.log

# Logs d'erreurs
docker exec health-backend tail -f /app/logs/error.log
```

### Headers de Debug

En développement, vous pouvez activer les headers de debug :

```bash
curl -v https://api-dev-minsante.it-grafik.com/api/v1/health
```

Headers utiles :
- `X-Request-Id` : ID unique de la requête
- `X-Response-Time` : Temps de réponse en ms

## 📱 Versioning

L'API utilise le versioning dans l'URL :
- **Version actuelle** : `v1`
- **Base URL** : `/api/v1`

Les anciennes versions restent disponibles pendant au moins 6 mois après le lancement d'une nouvelle version.

## 🔄 Changelog API

### v1.0.0 (2025-01-03)
- Version initiale de l'API
- Endpoints pour FOSA, équipements, personnel
- Authentification JWT
- System RBAC
- Documentation Swagger

## 📞 Support

- **Documentation Interactive** : https://api-dev-minsante.it-grafik.com/api-docs
- **Email** : mindahnkemeni@gmail.com
- **GitHub Issues** : https://github.com/yourusername/API-HEALTH/issues

---

**Dernière mise à jour** : 2025-01-03
**Version API** : 1.0.0
