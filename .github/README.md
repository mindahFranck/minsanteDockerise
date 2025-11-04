# GitHub Actions - Configuration du CI/CD

Ce répertoire contient les workflows GitHub Actions pour le déploiement automatique de l'application API HEALTH.

## Workflow de déploiement

Le fichier [`workflows/deploy.yml`](./workflows/deploy.yml) définit le pipeline CI/CD automatique.

### Déclencheurs

Le workflow se déclenche automatiquement lors de:

- Push vers la branche `main`
- Push vers la branche `master`
- Déclenchement manuel via l'interface GitHub (workflow_dispatch)

### Étapes du pipeline

1. **Checkout du code** - Récupère le code source
2. **Configuration Docker Buildx** - Prépare l'environnement de build multi-plateforme
3. **Connexion Docker Hub** - Authentification à Docker Hub
4. **Build et Push** - Compile l'image Docker et la publie sur Docker Hub
5. **Déploiement SSH** - Se connecte au serveur et déploie la nouvelle version

## Configuration des secrets

Avant d'utiliser le workflow, configurez les secrets suivants dans GitHub:

### 1. Accéder aux secrets GitHub

1. Allez dans votre repository GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans la sidebar gauche, cliquez sur **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**

### 2. Secrets à configurer

#### Docker Hub

| Secret            | Description                      | Exemple          |
| ----------------- | -------------------------------- | ---------------- |
| `DOCKER_USERNAME` | Nom d'utilisateur Docker Hub     | `nkemeni`        |
| `DOCKER_PASSWORD` | Mot de passe ou token Docker Hub | `dckr_pat_xxxxx` |

**Comment obtenir un token Docker Hub:**

1. Connectez-vous à [Docker Hub](https://hub.docker.com)
2. Allez dans Account Settings → Security
3. Cliquez sur "New Access Token"
4. Donnez-lui un nom et créez-le
5. Copiez le token généré

#### Serveur SSH

| Secret            | Description                 | Exemple                                  |
| ----------------- | --------------------------- | ---------------------------------------- |
| `SERVER_HOST`     | IP ou hostname du serveur   | `123.45.67.89` ou `server.example.com`   |
| `SERVER_USER`     | Utilisateur SSH             | `ubuntu` ou `root`                       |
| `SSH_PRIVATE_KEY` | Clé privée SSH (format PEM) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

**Comment obtenir la clé SSH:**

```bash
# Sur votre machine locale, générez une paire de clés si nécessaire
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Affichez la clé privée (à copier dans le secret)
cat ~/.ssh/github_deploy

# Copiez la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/github_deploy.pub user@your-server
```

#### Configuration nginx-proxy

| Secret              | Description                     | Exemple                |
| ------------------- | ------------------------------- | ---------------------- |
| `VIRTUAL_HOST`      | Nom de domaine de l'application | `api.yourdomain.com`   |
| `LETSENCRYPT_EMAIL` | Email pour Let's Encrypt        | `admin@yourdomain.com` |

#### Base de données

| Secret        | Description                | Exemple                            |
| ------------- | -------------------------- | ---------------------------------- |
| `DB_HOST`     | Hôte de la base de données | `mysql.example.com` ou `localhost` |
| `DB_PORT`     | Port MySQL                 | `3306`                             |
| `DB_NAME`     | Nom de la base de données  | `api_health`                       |
| `DB_USER`     | Utilisateur MySQL          | `api_health_user`                  |
| `DB_PASSWORD` | Mot de passe MySQL         | `SuperSecurePassword123!`          |

#### Sécurité

| Secret       | Description          | Exemple                                |
| ------------ | -------------------- | -------------------------------------- |
| `JWT_SECRET` | Clé secrète pour JWT | `very-long-random-string-min-32-chars` |

**Comment générer un JWT_SECRET sécurisé:**

```bash
# Méthode 1: Utiliser openssl
openssl rand -base64 32

# Méthode 2: Utiliser Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Vérifier que tout fonctionne

### 1. Vérifier les secrets

Assurez-vous que tous les secrets sont correctement configurés:

- Allez dans Settings → Secrets and variables → Actions
- Vérifiez que tous les secrets listés ci-dessus sont présents

### 2. Tester le workflow

1. Faites un commit et push sur la branche `main`:

   ```bash
   git add .
   git commit -m "Test deployment workflow"
   git push origin main
   ```

2. Allez dans l'onglet **Actions** de votre repository GitHub

3. Vous devriez voir le workflow "API HEALTH - Build and Deploy" en cours d'exécution

4. Cliquez dessus pour voir les détails et les logs

### 3. Vérifier le déploiement sur le serveur

Une fois le workflow terminé avec succès:

```bash
# Connectez-vous au serveur
ssh user@your-server

# Vérifiez que le container est en cours d'exécution
docker ps | grep api-health

# Consultez les logs
docker logs -f api-health

# Testez l'API
curl https://api.yourdomain.com/api/v1/health
```

## Déclenchement manuel

Vous pouvez aussi déclencher le workflow manuellement:

1. Allez dans l'onglet **Actions**
2. Sélectionnez le workflow "API HEALTH - Build and Deploy"
3. Cliquez sur **Run workflow**
4. Sélectionnez la branche
5. Cliquez sur **Run workflow**

## Dépannage

### Le workflow échoue lors du build Docker

**Erreur:** `failed to solve with frontend dockerfile.v0`

**Solution:** Vérifiez que le Dockerfile est à la racine du projet et est valide.

### Le workflow échoue lors du push vers Docker Hub

**Erreur:** `unauthorized: incorrect username or password`

**Solution:**

- Vérifiez que `DOCKER_USERNAME` et `DOCKER_PASSWORD` sont corrects
- Utilisez un token d'accès Docker Hub plutôt qu'un mot de passe

### Le workflow échoue lors de la connexion SSH

**Erreur:** `Permission denied (publickey)`

**Solution:**

- Vérifiez que `SSH_PRIVATE_KEY` contient la clé complète avec les headers
- Assurez-vous que la clé publique correspondante est dans `~/.ssh/authorized_keys` sur le serveur
- Vérifiez que le bon utilisateur est spécifié dans `SERVER_USER`

### Le container ne démarre pas sur le serveur

**Erreur:** `Error response from daemon: network nginx-proxy not found`

**Solution:**

```bash
# Sur le serveur, créez le réseau nginx-proxy
docker network create nginx-proxy
```

### L'application ne répond pas

**Solution:**

```bash
# Sur le serveur, vérifiez les logs
docker logs api-health

# Vérifiez que nginx-proxy fonctionne
docker ps | grep nginx-proxy

# Vérifiez que le domaine pointe vers le serveur
nslookup api.yourdomain.com
```

## Personnalisation

### Changer le nom de l'image Docker

Dans [`.github/workflows/deploy.yml`](./workflows/deploy.yml), modifiez:

```yaml
tags: |
  ${{ secrets.DOCKER_USERNAME }}/api-health:latest
  ${{ secrets.DOCKER_USERNAME }}/api-health:${{ github.sha }}
```

Par:

```yaml
tags: |
  ${{ secrets.DOCKER_USERNAME }}/votre-nom-image:latest
  ${{ secrets.DOCKER_USERNAME }}/votre-nom-image:${{ github.sha }}
```

### Ajouter des étapes de test

Ajoutez avant l'étape "Build and push":

```yaml
- name: Run tests
  run: |
    npm ci
    npm test
```

### Déployer sur plusieurs serveurs

Dupliquez l'étape "Deploy to server" et utilisez des secrets différents:

```yaml
- name: Deploy to production server 1
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST_1 }}
    username: ${{ secrets.SERVER_USER_1 }}
    key: ${{ secrets.SSH_PRIVATE_KEY_1 }}
    # ...

- name: Deploy to production server 2
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST_2 }}
    username: ${{ secrets.SERVER_USER_2 }}
    key: ${{ secrets.SSH_PRIVATE_KEY_2 }}
    # ...
```

## Sécurité

### Bonnes pratiques

1. ✅ **Ne jamais commiter de secrets** - Utilisez toujours GitHub Secrets
2. ✅ **Utiliser des tokens** - Préférez les tokens Docker Hub aux mots de passe
3. ✅ **Clés SSH dédiées** - Créez une clé SSH spécifique pour le déploiement
4. ✅ **Permissions minimales** - L'utilisateur SSH doit avoir le minimum de permissions nécessaires
5. ✅ **Rotation des secrets** - Changez régulièrement les secrets (JWT, mots de passe)

### Protection des branches

Pour plus de sécurité, protégez vos branches principales:

1. Allez dans Settings → Branches
2. Ajoutez une règle pour `main` et `master`
3. Activez:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Include administrators

## Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Documentation Docker](https://docs.docker.com/)
- [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy)
- [nginx-proxy-acme](https://github.com/nginx-proxy/acme-companion)
- [SSH Action](https://github.com/appleboy/ssh-action)

backup

# =============================================================================

# Production Deployment Pipeline for Health Management System

# =============================================================================

name: Deploy to Production

on:
push:
branches: - main
workflow_dispatch:

env:
DOCKER_REGISTRY: docker.io
BACKEND_IMAGE: ${{ secrets.DOCKER_USERNAME }}/health-management-backend
FRONTEND_IMAGE: ${{ secrets.DOCKER_USERNAME }}/health-management-frontend

jobs:
build-backend:
name: Build Backend Image
runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.BACKEND_IMAGE }}
          tags: |
            type=sha,prefix=,format=short
            type=raw,value=latest

      - name: Build and push Backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          platforms: linux/amd64

build-frontend:
name: Build Frontend Image
runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.FRONTEND_IMAGE }}
          tags: |
            type=sha,prefix=,format=short
            type=raw,value=latest

      - name: Build and push Frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          platforms: linux/amd64
          build-args: |
            VITE_API_URL=https://apiminsante.it-grafik.com/api/v1
            VITE_APP_NAME=Health Management System
            VITE_APP_VERSION=1.0.0

deploy-infrastructure:
name: Deploy Infrastructure
runs-on: ubuntu-latest
environment:
name: production

    steps:
      - name: Deploy Redis and Check Services
        uses: appleboy/ssh-action@master
        with:
          host: 78.142.242.49
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          port: ${{ secrets.SSH_PORT || 22 }}
          script: |
            echo "🚀 Setting up infrastructure..."

            # Vérifier et créer le réseau si nécessaire
            docker network create proxy-tier 2>/dev/null || echo "Network proxy-tier already exists"

            # Vérifier que nginx-proxy est running
            if ! docker ps | grep -q nginx-proxy; then
              echo "🔄 Starting nginx-proxy..."
              docker run -d \
                --name nginx-proxy \
                --network proxy-tier \
                -p 80:80 -p 443:443 \
                -v /var/run/docker.sock:/tmp/docker.sock:ro \
                -v /etc/nginx/certs:/etc/nginx/certs:ro \
                -v /etc/nginx/vhost.d \
                -v /usr/share/nginx/html \
                jwilder/nginx-proxy
            fi

            # Vérifier que nginx-proxy-acme est running
            if ! docker ps | grep -q nginx-proxy-acme; then
              echo "🔄 Starting nginx-proxy-acme..."
              docker run -d \
                --name nginx-proxy-acme \
                --network proxy-tier \
                --volumes-from nginx-proxy \
                -v /var/run/docker.sock:/var/run/docker.sock:ro \
                -v /etc/nginx/certs:/etc/nginx/certs \
                -v /etc/nginx/vhost.d \
                -v /usr/share/nginx/html \
                -e DEFAULT_EMAIL=mindahnkemeni@gmail.com \
                jrcs/letsencrypt-nginx-proxy-companion
            fi

            # Vérifier que MySQL est running
            if ! docker ps | grep -q mysql_db; then
              echo "🔄 Starting MySQL..."
              docker run -d \
                --name mysql_db \
                --network proxy-tier \
                -e MYSQL_ROOT_PASSWORD=rootpassword \
                -e MYSQL_DATABASE=mydatabase \
                -e MYSQL_USER=myuser \
                -e MYSQL_PASSWORD=mypassword \
                -v mysql_data:/var/lib/mysql \
                mysql:8.0
            fi

            # Déployer Redis
            echo "🔴 Deploying Redis..."
            docker stop health-redis 2>/dev/null || true
            docker rm health-redis 2>/dev/null || true

            docker run -d \
              --name health-redis \
              --network proxy-tier \
              --restart unless-stopped \
              -v redis_data:/data \
              redis:7-alpine redis-server --appendonly yes

            echo "⏳ Waiting for services to be ready..."
            sleep 15

            echo "✅ Infrastructure setup completed!"

deploy-backend:
name: Deploy Backend
runs-on: ubuntu-latest
needs: [build-backend, deploy-infrastructure]
environment:
name: production-backend
url: https://apiminsante.it-grafik.com

    steps:
      - name: Deploy Backend Application
        uses: appleboy/ssh-action@master
        with:
          host: 78.142.242.49
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          port: ${{ secrets.SSH_PORT || 22 }}
          script: |
            echo "🚀 Starting Backend deployment..."

            # Pull the latest backend image
            echo "📦 Pulling latest backend image..."
            docker pull ${{ env.BACKEND_IMAGE }}:latest

            # Stop and remove existing backend container
            echo "🛑 Stopping existing backend container..."
            docker stop health-backend 2>/dev/null || true
            docker rm health-backend 2>/dev/null || true

            # Créer et configurer les répertoires
            echo "📁 Setting up directories..."
            sudo mkdir -p /var/health-backend/uploads
            sudo mkdir -p /var/health-backend/logs
            sudo chown -R 1000:1000 /var/health-backend
            sudo chmod -R 755 /var/health-backend

            # Run new backend container
            echo "🎯 Starting new backend container..."
            docker run -d \
              --name health-backend \
              --restart unless-stopped \
              --network proxy-tier \
              --user 1000:1000 \
              -e VIRTUAL_HOST=apiminsante.it-grafik.com \
              -e VIRTUAL_PORT=3000 \
              -e LETSENCRYPT_HOST=apiminsante.it-grafik.com \
              -e LETSENCRYPT_EMAIL=mindahnkemeni@gmail.com \
              -e NODE_ENV=production \
              -e PORT=3000 \
              -e API_VERSION=v1 \
              -e DB_HOST=srv915.hstgr.io \
              -e DB_PORT=3306 \
              -e DB_NAME=u877916646_minstante \
              -e DB_USER=u877916646_minstante \
              -e DB_PASSWORD=itgrafik@Dev12 \
              -e REDIS_HOST=health-redis \
              -e REDIS_PORT=6379 \
              -e JWT_SECRET="${{ secrets.JWT_SECRET }}" \
              -e JWT_EXPIRES_IN=7d \
              -e CORS_ORIGIN="https://minsante.it-grafik.com,https://apiminsante.it-grafik.com,https://gov.it-grafik.com" \
              -e LOG_LEVEL=info \
              -e LOG_TO_FILE="false" \
              -e RATE_LIMIT_WINDOW_MS=900000 \
              -e RATE_LIMIT_MAX_REQUESTS=100 \
              -v /var/health-backend/uploads:/app/uploads \
              -v /var/health-backend/logs:/app/logs \
              ${{ env.BACKEND_IMAGE }}:latest

            echo "⏳ Waiting for backend to start..."
            sleep 20

            echo "✅ Backend deployment completed!"

      - name: Health Check Backend
        run: |
          echo "🏥 Performing backend health check..."
          max_attempts=15
          attempt=1

          while [ $attempt -le $max_attempts ]; do
            echo "Attempt $attempt/$max_attempts..."

            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://apiminsante.it-grafik.com/api/v1/health 2>/dev/null || echo "000")

            if [ "$HTTP_CODE" = "200" ]; then
              echo "✅ Backend health check passed! HTTP 200"
              exit 0
            fi

            echo "HTTP Code: $HTTP_CODE - Waiting 10 seconds..."
            sleep 10
            attempt=$((attempt + 1))
          done

          echo "❌ Backend health check failed after $max_attempts attempts"
          exit 1

deploy-frontend:
name: Deploy Frontend
runs-on: ubuntu-latest
needs: [build-frontend, deploy-backend]
environment:
name: production-frontend
url: https://minsante.it-grafik.com

    steps:
      - name: Deploy Frontend Application
        uses: appleboy/ssh-action@master
        with:
          host: 78.142.242.49
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          port: ${{ secrets.SSH_PORT || 22 }}
          script: |
            echo "🚀 Starting Frontend deployment..."

            # Pull the latest frontend image
            echo "📦 Pulling latest frontend image..."
            docker pull ${{ env.FRONTEND_IMAGE }}:latest

            # Stop and remove existing frontend container
            echo "🛑 Stopping existing frontend container..."
            docker stop health-frontend 2>/dev/null || true
            docker rm health-frontend 2>/dev/null || true

            # Run new frontend container
            echo "🎯 Starting new frontend container..."
            docker run -d \
              --name health-frontend \
              --restart unless-stopped \
              --network proxy-tier \
              -e VIRTUAL_HOST=minsante.it-grafik.com \
              -e VIRTUAL_PORT=80 \
              -e LETSENCRYPT_HOST=minsante.it-grafik.com \
              -e LETSENCRYPT_EMAIL=mindahnkemeni@gmail.com \
              ${{ env.FRONTEND_IMAGE }}:latest

            echo "⏳ Waiting for frontend to start..."
            sleep 15

            # Debug: Vérifier les fichiers dans le container
            echo "🔍 Checking frontend files..."
            docker exec health-frontend find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | head -10

            echo "✅ Frontend deployment completed!"

      - name: Health Check Frontend
        run: |
          echo "🏥 Performing frontend health check..."
          max_attempts=20
          attempt=1

          while [ $attempt -le $max_attempts ]; do
            echo "Attempt $attempt/$max_attempts..."

            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://minsante.it-grafik.com 2>/dev/null || echo "000")

            if [ "$HTTP_CODE" = "200" ]; then
              echo "✅ Frontend health check passed! HTTP 200"

              # Vérifier que le contenu n'est pas vide
              CONTENT=$(curl -s --max-time 10 https://minsante.it-grafik.com 2>/dev/null | head -c 200)
              if [[ "$CONTENT" == *"<!DOCTYPE html>"* ]] || [[ "$CONTENT" == *"<html"* ]]; then
                echo "✅ Frontend content is valid HTML"
                exit 0
              else
                echo "⚠️ Frontend returned 200 but content doesn't look like HTML"
                echo "First 200 chars: $CONTENT"
              fi
            fi

            echo "HTTP Code: $HTTP_CODE - Waiting 10 seconds..."
            sleep 10
            attempt=$((attempt + 1))
          done

          echo "❌ Frontend health check failed after $max_attempts attempts"

          # Debug supplémentaire
          echo "🔍 Additional debug info:"
          sshpass -p '${{ secrets.SSH_PASSWORD }}' ssh -o StrictHostKeyChecking=no ${{ secrets.SERVER_USER }}@78.142.242.49 "
            echo '=== Frontend logs ==='
            docker logs --tail=30 health-frontend 2>/dev/null || echo 'Cannot get frontend logs'
            echo '=== Nginx config ==='
            docker exec health-frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null || echo 'Cannot get nginx config'
            echo '=== Files in nginx html directory ==='
            docker exec health-frontend ls -la /usr/share/nginx/html/ 2>/dev/null || echo 'Cannot list files'
          "
          exit 1

verify-deployment:
name: Verify Full Deployment
runs-on: ubuntu-latest
needs: [deploy-backend, deploy-frontend]

    steps:
      - name: Final Verification
        run: |
          echo "🎉 Final deployment verification!"
          echo ""
          echo "🌐 Application URLs:"
          echo "  Frontend: https://minsante.it-grafik.com"
          echo "  Backend API: https://apiminsante.it-grafik.com/api/v1/health"
          echo "  PHPMyAdmin: https://phpmyadmin.it-grafik.com"
          echo ""
          echo "✅ Deployment completed successfully!"

backup

             -e API_VERSION=v1 \
              -e DB_HOST=mysql_db \
              -e DB_PORT=3306 \
              -e DB_NAME=mydatabase \
              -e DB_USER=myuser \
              -e DB_PASSWORD=mypassword \
              -e REDIS_HOST=health-redis \
