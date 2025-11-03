# 🚀 Quick Start - Health Management System

Guide de démarrage rapide pour développeurs.

## ⚡ Installation Rapide (5 minutes)

### Prérequis
- Node.js 20+
- MySQL 8.0
- Docker (optionnel)

### 1. Clone et Installation

```bash
# Clone le repository
git clone https://github.com/yourusername/API-HEALTH.git
cd API-HEALTH

# Installation backend
cd backend
npm install
cp .env.example .env

# Installation frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Base de Données

**Option A : Avec Docker (Recommandé)**
```bash
docker run -d --name mysql_dev \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=health_management_dev \
  -e MYSQL_USER=devuser \
  -e MYSQL_PASSWORD=devpassword \
  -p 3306:3306 mysql:8.0
```

**Option B : MySQL Local**
```sql
CREATE DATABASE health_management_dev;
CREATE USER 'devuser'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON health_management_dev.* TO 'devuser'@'localhost';
```

### 3. Configuration Backend

Éditez `backend/.env` :
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=health_management_dev
DB_USER=devuser
DB_PASSWORD=devpassword
JWT_SECRET=dev-secret-change-in-production
```

### 4. Initialisation de la Base de Données

```bash
cd backend

# L'initialisation se fait automatiquement au premier démarrage !
# Mais vous pouvez aussi le faire manuellement :
npm run db:init

# Cela créera :
# - 60+ permissions
# - 4 rôles (Super Admin, Admin, Manager, User)
# - 4 utilisateurs par défaut
```

**OU** charger un jeu de données complet de test :
```bash
npm run db:seed  # Inclut données géographiques + FOSA de test
```

### 5. Démarrage

**Terminal 1 - Backend** :
```bash
cd backend
npm run dev
# API sur http://localhost:3000
```

**Terminal 2 - Frontend** :
```bash
cd frontend
npm run dev
# App sur http://localhost:5173
```

## 🎯 Accès Rapide

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **API Docs** : http://localhost:3000/api-docs
- **Health Check** : http://localhost:3000/api/v1/health

## 🔑 Comptes par Défaut

**Créés automatiquement au premier démarrage :**

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| superadmin@minsante.cm | Admin@2024 | Super Administrateur |
| admin@minsante.cm | Admin@2024 | Administrateur |
| manager@minsante.cm | Admin@2024 | Gestionnaire |
| user@minsante.cm | Admin@2024 | Utilisateur |

⚠️ **Changez ces mots de passe immédiatement après le premier login !**

## 📦 Commandes Utiles

### Backend
```bash
npm run dev          # Mode développement
npm run build        # Compiler TypeScript
npm start            # Production (après build)
npm test             # Tests
npm run lint         # Vérifier le code
npm run db:init      # Initialiser (roles, permissions, users)
npm run db:seed      # Charger données complètes de test
```

### Frontend
```bash
npm run dev          # Mode développement
npm run build        # Build production
npm run preview      # Prévisualiser build
npm test             # Tests
npm run lint         # Vérifier le code
```

## 🐳 Démarrage avec Docker

```bash
# Backend
cd backend
docker build -t health-backend .
docker run -p 3000:3000 --env-file .env health-backend

# Frontend
cd frontend
docker build -t health-frontend .
docker run -p 80:80 health-frontend
```

## 📡 Tester l'API

### Avec cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}'

# Get FOSA (avec token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/fosa
```

### Avec HTTPie

```bash
# Login
http POST localhost:3000/api/v1/auth/login \
  email=admin@test.com password=Admin123!

# Get FOSA
http GET localhost:3000/api/v1/fosa \
  Authorization:"Bearer YOUR_TOKEN"
```

## 🔧 Problèmes Courants

### Port déjà utilisé

```bash
# Backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### Erreur de connexion MySQL

```bash
# Vérifier que MySQL tourne
docker ps | grep mysql_dev

# Redémarrer MySQL
docker restart mysql_dev

# Vérifier les logs
docker logs mysql_dev
```

### Problème de dépendances

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Build échoue

```bash
# Backend
cd backend
npm run build
# Vérifier les erreurs TypeScript

# Frontend
cd frontend
npm run build
# Vérifier les erreurs de build Vite
```

## 📚 Documentation

- **README complet** : [README.md](./README.md)
- **Guide de déploiement** : [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Documentation API** : [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Guide de contribution** : [CONTRIBUTING.md](./CONTRIBUTING.md)

## 🧪 Tester une Fonctionnalité

### 1. Se Connecter et Obtenir un Token

```bash
# Login pour obtenir le token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@minsante.cm",
    "password": "Admin@2024"
  }'

# Copier le token de la réponse
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Créer une FOSA via API

```bash
curl -X POST http://localhost:3000/api/v1/fosa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Hôpital Test",
    "code": "HT001",
    "categorieId": 1,
    "airesanteId": 1,
    "latitude": 3.8667,
    "longitude": 11.5167
  }'
```

### 2. Voir sur la Carte

1. Ouvrez http://localhost:5173
2. Connectez-vous avec admin@test.com
3. Allez sur la page "Carte"
4. Votre nouvelle FOSA devrait apparaître

## 🎨 Structure de Base

```
API-HEALTH/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Logique des routes
│   │   ├── services/       # Logique métier
│   │   ├── models/         # Modèles Sequelize
│   │   ├── routes/         # Définition routes
│   │   └── server.ts       # Point d'entrée
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages
│   │   ├── services/       # API calls
│   │   └── main.tsx        # Point d'entrée
│   └── package.json
│
└── README.md
```

## 🚢 Déployer en Production

### Sur votre serveur

```bash
# 1. Sur votre machine locale
cd backend
docker build -t yourdockerusername/health-backend:latest .
docker push yourdockerusername/health-backend:latest

cd ../frontend
docker build --build-arg VITE_API_URL=https://your-api.com/api/v1 \
  -t yourdockerusername/health-frontend:latest .
docker push yourdockerusername/health-frontend:latest

# 2. Sur le serveur (SSH)
ssh user@your-server.com

# Backend
docker pull yourdockerusername/health-backend:latest
docker run -d --name health-backend \
  --network proxy-tier \
  -e VIRTUAL_HOST=api.your-domain.com \
  -e DB_HOST=mysql_db \
  -e DB_NAME=mydatabase \
  -e DB_USER=myuser \
  -e DB_PASSWORD=mypassword \
  -e JWT_SECRET=your-secret \
  yourdockerusername/health-backend:latest

# Frontend
docker pull yourdockerusername/health-frontend:latest
docker run -d --name health-frontend \
  --network proxy-tier \
  -e VIRTUAL_HOST=your-domain.com \
  yourdockerusername/health-frontend:latest
```

### Avec GitHub Actions (Automatique)

1. Configurez les secrets dans GitHub
2. Push sur la branche `main`
3. Le déploiement se fait automatiquement !

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les détails.

## 💡 Tips de Développement

### Hot Reload

Les deux serveurs (backend et frontend) ont le hot reload activé :
- Modifiez du code
- Sauvegardez
- Le serveur redémarre automatiquement

### VSCode

Extensions recommandées :
- ESLint
- Prettier
- TypeScript Vue Plugin
- Docker
- GitLens

### Debug Backend

```typescript
// Ajoutez des breakpoints dans VSCode
// Ou utilisez le logger
import { logger } from "./config/logger";

logger.debug("Variable value:", { myVar });
```

### Debug Frontend

```typescript
// React DevTools (extension Chrome/Firefox)
// Ou console.log en développement
if (import.meta.env.DEV) {
  console.log("Debug:", data);
}
```

## 🎓 Ressources d'Apprentissage

- **TypeScript** : https://www.typescriptlang.org/docs/
- **Express.js** : https://expressjs.com/
- **React** : https://react.dev/
- **Sequelize** : https://sequelize.org/
- **Tailwind CSS** : https://tailwindcss.com/

## 🆘 Besoin d'Aide ?

1. Consultez la [documentation complète](./README.md)
2. Vérifiez les [issues GitHub](https://github.com/yourusername/API-HEALTH/issues)
3. Créez une nouvelle issue
4. Contactez : mindahnkemeni@gmail.com

## ✅ Next Steps

Après l'installation :

1. ✅ Explorez l'API avec Swagger : http://localhost:3000/api-docs
2. ✅ Testez le frontend : http://localhost:5173
3. ✅ Lisez [CONTRIBUTING.md](./CONTRIBUTING.md) pour contribuer
4. ✅ Regardez [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour l'API
5. ✅ Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour déployer

---

**Temps estimé de setup** : 5-10 minutes
**Dernière mise à jour** : 2025-01-03
