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

| Secret | Description | Exemple |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Nom d'utilisateur Docker Hub | `nkemeni` |
| `DOCKER_PASSWORD` | Mot de passe ou token Docker Hub | `dckr_pat_xxxxx` |

**Comment obtenir un token Docker Hub:**
1. Connectez-vous à [Docker Hub](https://hub.docker.com)
2. Allez dans Account Settings → Security
3. Cliquez sur "New Access Token"
4. Donnez-lui un nom et créez-le
5. Copiez le token généré

#### Serveur SSH

| Secret | Description | Exemple |
|--------|-------------|---------|
| `SERVER_HOST` | IP ou hostname du serveur | `123.45.67.89` ou `server.example.com` |
| `SERVER_USER` | Utilisateur SSH | `ubuntu` ou `root` |
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

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VIRTUAL_HOST` | Nom de domaine de l'application | `api.yourdomain.com` |
| `LETSENCRYPT_EMAIL` | Email pour Let's Encrypt | `admin@yourdomain.com` |

#### Base de données

| Secret | Description | Exemple |
|--------|-------------|---------|
| `DB_HOST` | Hôte de la base de données | `mysql.example.com` ou `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_NAME` | Nom de la base de données | `api_health` |
| `DB_USER` | Utilisateur MySQL | `api_health_user` |
| `DB_PASSWORD` | Mot de passe MySQL | `SuperSecurePassword123!` |

#### Sécurité

| Secret | Description | Exemple |
|--------|-------------|---------|
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
