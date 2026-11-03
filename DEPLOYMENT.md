# Guide de Déploiement - Health Management System

Ce guide détaille les étapes complètes pour déployer le système Health Management sur un serveur de production.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Configuration du Serveur](#configuration-du-serveur)
- [Configuration de la Base de Données](#configuration-de-la-base-de-données)
- [Déploiement du Backend](#déploiement-du-backend)
- [Déploiement du Frontend](#déploiement-du-frontend)
- [Configuration Nginx Reverse Proxy](#configuration-nginx-reverse-proxy)
- [Configuration SSL/TLS](#configuration-ssltls)
- [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
- [Maintenance](#maintenance)
- [Dépannage](#dépannage)

## 🎯 Prérequis

### Serveur
- **OS** : Ubuntu 20.04 LTS ou supérieur
- **RAM** : Minimum 2 GB (4 GB recommandé)
- **CPU** : 2 cores minimum
- **Stockage** : 20 GB minimum
- **IP Publique** : 78.142.242.49

### Domaines Configurés
- Frontend : `minsante.it-grafik.com`
- Backend API : `api-dev-minsante.it-grafik.com`
- PHPMyAdmin : `phpmyadmin.it-grafik.com`

### Logiciels Requis
- Docker (version 20.10+)
- Docker Compose (optionnel)
- Git
- OpenSSH Server

## 🖥️ Configuration du Serveur

### 1. Connexion au Serveur

```bash
ssh root@78.142.242.49
# ou avec votre utilisateur
ssh yourusername@78.142.242.49
```

### 2. Mise à Jour du Système

```bash
# Mettre à jour les packages
sudo apt update && sudo apt upgrade -y

# Installer les dépendances de base
sudo apt install -y curl git wget vim
```

### 3. Installation de Docker

```bash
# Désinstaller les anciennes versions
sudo apt remove docker docker-engine docker.io containerd runc

# Installer les dépendances
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Ajouter la clé GPG officielle de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajouter le repository Docker
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Vérifier l'installation
docker --version

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Démarrer Docker au boot
sudo systemctl enable docker
sudo systemctl start docker
```

### 4. Configuration du Réseau Docker

```bash
# Créer le réseau proxy-tier pour la communication inter-conteneurs
docker network create proxy-tier

# Vérifier la création
docker network ls | grep proxy-tier
```

## 🗄️ Configuration de la Base de Données

### Base de Données MySQL Existante

Votre base de données MySQL est déjà configurée et fonctionnelle :

```bash
# Vérifier que MySQL est en cours d'exécution
docker ps | grep mysql_db

# Si la base de données n'est pas en cours d'exécution, la démarrer :
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

### Configuration PHPMyAdmin (Déjà Configuré)

```bash
# PHPMyAdmin est accessible sur https://phpmyadmin.it-grafik.com
docker ps | grep phpmyadmin

# Si non démarré :
docker run -d \
  --name phpmyadmin \
  --network proxy-tier \
  -e PMA_HOST=mysql_db \
  -e PMA_USER=myuser \
  -e PMA_PASSWORD=mypassword \
  -e VIRTUAL_HOST=phpmyadmin.it-grafik.com \
  -e LETSENCRYPT_HOST=phpmyadmin.it-grafik.com \
  -e LETSENCRYPT_EMAIL=mindahnkemeni@gmail.com \
  phpmyadmin/phpmyadmin
```

### Sauvegarde de la Base de Données

```bash
# Créer un répertoire pour les sauvegardes
mkdir -p /var/backups/mysql

# Script de sauvegarde
cat > /usr/local/bin/backup-mysql.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

docker exec mysql_db mysqldump -uroot -prootpassword mydatabase > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Garder seulement les 7 derniers jours
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

# Rendre le script exécutable
chmod +x /usr/local/bin/backup-mysql.sh

# Planifier la sauvegarde quotidienne à 2h du matin
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mysql.sh") | crontab -
```

## 🚀 Déploiement du Backend

### 1. Préparer l'Environnement

```bash
# Créer les répertoires nécessaires
mkdir -p /var/health-backend/uploads
mkdir -p /var/health-backend/logs

# Définir les permissions
chmod 755 /var/health-backend/uploads
chmod 755 /var/health-backend/logs
```

### 2. Build de l'Image Docker Backend

#### Option A : Build Local

```bash
# Cloner le repository (si ce n'est pas déjà fait)
git clone https://github.com/yourusername/API-HEALTH.git
cd API-HEALTH/backend

# Build de l'image
docker build -t health-backend:latest .
```

#### Option B : Pull depuis Docker Hub (Recommandé)

```bash
# Si vous utilisez CI/CD, l'image sera disponible sur Docker Hub
docker pull yourdockerhubusername/health-management-backend:latest
docker tag yourdockerhubusername/health-management-backend:latest health-backend:latest
```

### 3. Lancer le Conteneur Backend

```bash
# Arrêter et supprimer le conteneur existant (si présent)
docker stop health-backend 2>/dev/null || true
docker rm health-backend 2>/dev/null || true

# Lancer le nouveau conteneur
docker run -d \
  --name health-backend \
  --restart unless-stopped \
  --network proxy-tier \
  -e VIRTUAL_HOST=api-dev-minsante.it-grafik.com \
  -e VIRTUAL_PORT=3000 \
  -e LETSENCRYPT_HOST=api-dev-minsante.it-grafik.com \
  -e LETSENCRYPT_EMAIL=mindahnkemeni@gmail.com \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e API_VERSION=v1 \
  -e DB_HOST=mysql_db \
  -e DB_PORT=3306 \
  -e DB_NAME=mydatabase \
  -e DB_USER=myuser \
  -e DB_PASSWORD=mypassword \
  -e JWT_SECRET="VOTRE_SECRET_JWT_ICI_CHANGEZ_MOI" \
  -e JWT_EXPIRES_IN=7d \
  -e CORS_ORIGIN="https://minsante.it-grafik.com,https://api-dev-minsante.it-grafik.com" \
  -e LOG_LEVEL=info \
  -e RATE_LIMIT_WINDOW_MS=900000 \
  -e RATE_LIMIT_MAX_REQUESTS=100 \
  -v /var/health-backend/uploads:/app/uploads \
  -v /var/health-backend/logs:/app/logs \
  health-backend:latest

# Vérifier que le conteneur est démarré
docker ps | grep health-backend

# Voir les logs
docker logs -f health-backend
```

### 4. Vérifier le Backend

```bash
# Attendre quelques secondes puis tester
sleep 10

# Test de santé (via le réseau Docker)
docker exec health-backend curl -f http://localhost:3000/api/v1/health

# Test depuis l'extérieur (après configuration Nginx)
curl https://api-dev-minsante.it-grafik.com/api/v1/health
```

## 🎨 Déploiement du Frontend

### 1. Build de l'Image Docker Frontend

```bash
cd /path/to/API-HEALTH/frontend

# Build avec les variables d'environnement
docker build \
  --build-arg VITE_API_URL=https://api-dev-minsante.it-grafik.com/api/v1 \
  --build-arg VITE_APP_NAME="Health Management System" \
  --build-arg VITE_APP_VERSION=1.0.0 \
  -t health-frontend:latest .
```

### 2. Lancer le Conteneur Frontend

```bash
# Arrêter et supprimer le conteneur existant
docker stop health-frontend 2>/dev/null || true
docker rm health-frontend 2>/dev/null || true

# Lancer le nouveau conteneur
docker run -d \
  --name health-frontend \
  --restart unless-stopped \
  --network proxy-tier \
  -e VIRTUAL_HOST=minsante.it-grafik.com \
  -e VIRTUAL_PORT=80 \
  -e LETSENCRYPT_HOST=minsante.it-grafik.com \
  -e LETSENCRYPT_EMAIL=mindahnkemeni@gmail.com \
  health-frontend:latest

# Vérifier
docker ps | grep health-frontend
docker logs health-frontend
```

## 🔐 Configuration Nginx Reverse Proxy

> **Upload d'images** : nginx-proxy limite par défaut le corps des requêtes à 1 Mo (erreur 413, « Fichier trop volumineux »).
> L'API accepte jusqu'à 5 Mo par image ; autorisez-les côté proxy :
>
> ```bash
> echo "client_max_body_size 10m;" > proxy.conf
> docker cp proxy.conf nginx-proxy:/etc/nginx/conf.d/proxy.conf && docker exec nginx-proxy nginx -s reload
> ```
>
> (ou montez ce fichier dans `/etc/nginx/conf.d/` au `docker run` ci-dessous).

### Nginx-Proxy avec Let's Encrypt

Si vous n'avez pas déjà configuré nginx-proxy avec Let's Encrypt :

```bash
# Créer un réseau pour le proxy
docker network create proxy-tier 2>/dev/null || true

# Lancer nginx-proxy
docker run -d \
  --name nginx-proxy \
  --restart unless-stopped \
  --network proxy-tier \
  -p 80:80 \
  -p 443:443 \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  -v nginx-certs:/etc/nginx/certs \
  -v nginx-vhost:/etc/nginx/vhost.d \
  -v nginx-html:/usr/share/nginx/html \
  -e DEFAULT_HOST=minsante.it-grafik.com \
  jwilder/nginx-proxy

# Lancer le companion Let's Encrypt
docker run -d \
  --name nginx-proxy-letsencrypt \
  --restart unless-stopped \
  --network proxy-tier \
  --volumes-from nginx-proxy \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e DEFAULT_EMAIL=mindahnkemeni@gmail.com \
  jrcs/letsencrypt-nginx-proxy-companion
```

### Vérification des Certificats SSL

```bash
# Vérifier les certificats générés
docker exec nginx-proxy ls -la /etc/nginx/certs/

# Tester SSL
curl -I https://minsante.it-grafik.com
curl -I https://api-dev-minsante.it-grafik.com
```

## 🤖 CI/CD avec GitHub Actions

### 1. Configuration des Secrets GitHub

Dans les paramètres de votre repository GitHub (`Settings > Secrets and variables > Actions`), ajoutez :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Nom d'utilisateur Docker Hub | `yourusername` |
| `DOCKER_PASSWORD` | Token d'accès Docker Hub | `dckr_pat_xxx...` |
| `SERVER_USER` | Utilisateur SSH du serveur | `root` ou `ubuntu` |
| `SSH_PRIVATE_KEY` | Clé privée SSH | Contenu de `~/.ssh/id_rsa` |
| `SSH_PORT` | Port SSH (optionnel) | `22` |
| `JWT_SECRET` | Secret JWT pour production | Chaîne aléatoire sécurisée |

### 2. Générer une Clé SSH pour GitHub Actions

Sur votre serveur :

```bash
# Générer une nouvelle paire de clés
ssh-keygen -t rsa -b 4096 -C "github-actions@yourproject" -f ~/.ssh/github-actions

# Ajouter la clé publique aux clés autorisées
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Afficher la clé privée (à copier dans GitHub Secrets)
cat ~/.ssh/github-actions
```

### 3. Tester le Déploiement CI/CD

```bash
# Faire un commit et push sur la branche main
git add .
git commit -m "test: trigger deployment"
git push origin main

# Surveiller l'exécution dans GitHub Actions
# https://github.com/yourusername/API-HEALTH/actions
```

## 🔧 Maintenance

### Mise à Jour des Applications

#### Via CI/CD (Recommandé)

```bash
# 1. Faire vos modifications
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. Le déploiement se fait automatiquement via GitHub Actions
```

#### Manuelle

```bash
# Backend
docker pull yourdockerhubusername/health-management-backend:latest
docker stop health-backend
docker rm health-backend
# Relancer avec la commande docker run (voir section déploiement)

# Frontend
docker pull yourdockerhubusername/health-management-frontend:latest
docker stop health-frontend
docker rm health-frontend
# Relancer avec la commande docker run
```

### Nettoyage Docker

```bash
# Supprimer les images inutilisées
docker image prune -af --filter "until=48h"

# Supprimer les conteneurs arrêtés
docker container prune -f

# Supprimer les volumes non utilisés (ATTENTION aux données)
docker volume prune -f

# Voir l'utilisation disque
docker system df
```

### Surveillance des Logs

```bash
# Logs en temps réel
docker logs -f health-backend
docker logs -f health-frontend

# Logs des 100 dernières lignes
docker logs --tail 100 health-backend

# Logs avec horodatage
docker logs -t health-backend

# Logs applicatifs du backend (dans le conteneur)
docker exec health-backend tail -f /app/logs/combined.log
docker exec health-backend tail -f /app/logs/error.log
```

### Monitoring des Ressources

```bash
# Statistiques en temps réel
docker stats

# Utilisation mémoire/CPU pour un conteneur spécifique
docker stats health-backend health-frontend

# Inspecter un conteneur
docker inspect health-backend
```

## 🔍 Dépannage

### Le Backend ne Démarre Pas

```bash
# Vérifier les logs
docker logs health-backend

# Vérifier la connexion à la base de données
docker exec health-backend ping -c 3 mysql_db

# Vérifier les variables d'environnement
docker exec health-backend env | grep DB_

# Entrer dans le conteneur
docker exec -it health-backend sh
```

### Erreur de Connexion à la Base de Données

```bash
# Vérifier que MySQL est accessible
docker exec mysql_db mysql -umyuser -pmypassword -e "SHOW DATABASES;"

# Vérifier le réseau
docker network inspect proxy-tier

# Recréer la connexion réseau
docker network disconnect proxy-tier health-backend
docker network connect proxy-tier health-backend
docker restart health-backend
```

### Problème de SSL/TLS

```bash
# Vérifier les certificats
docker exec nginx-proxy ls -la /etc/nginx/certs/

# Forcer le renouvellement
docker exec nginx-proxy-letsencrypt /app/force_renew

# Redémarrer nginx-proxy
docker restart nginx-proxy
docker restart nginx-proxy-letsencrypt
```

### Le Frontend ne se Charge Pas

```bash
# Vérifier les logs Nginx
docker logs health-frontend

# Vérifier que les fichiers sont bien copiés
docker exec health-frontend ls -la /usr/share/nginx/html/

# Tester la configuration Nginx
docker exec health-frontend nginx -t

# Redémarrer Nginx
docker exec health-frontend nginx -s reload
```

### Problème de CORS

```bash
# Vérifier la configuration CORS du backend
docker exec health-backend env | grep CORS_ORIGIN

# Mettre à jour et redémarrer
docker stop health-backend
# Relancer avec la bonne variable CORS_ORIGIN
```

### Manque d'Espace Disque

```bash
# Vérifier l'espace
df -h

# Nettoyer Docker
docker system prune -a --volumes -f

# Nettoyer les logs système
sudo journalctl --vacuum-time=3d

# Nettoyer les anciennes sauvegardes
find /var/backups/mysql -name "backup_*.sql.gz" -mtime +30 -delete
```

## 📊 Commandes Utiles

### Gestion des Conteneurs

```bash
# Lister tous les conteneurs
docker ps -a

# Démarrer/Arrêter/Redémarrer
docker start health-backend
docker stop health-backend
docker restart health-backend

# Supprimer un conteneur
docker rm -f health-backend

# Logs
docker logs -f health-backend

# Exécuter une commande
docker exec health-backend ls -la
docker exec -it health-backend sh
```

### Gestion de la Base de Données

```bash
# Entrer dans MySQL
docker exec -it mysql_db mysql -uroot -prootpassword

# Backup manuel
docker exec mysql_db mysqldump -uroot -prootpassword mydatabase > backup.sql

# Restaurer un backup
docker exec -i mysql_db mysql -uroot -prootpassword mydatabase < backup.sql

# Voir les tables
docker exec mysql_db mysql -umyuser -pmypassword -e "USE mydatabase; SHOW TABLES;"
```

### Tests de Connectivité

```bash
# Tester l'API
curl https://api-dev-minsante.it-grafik.com/api/v1/health

# Tester avec authentification
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" \
  https://api-dev-minsante.it-grafik.com/api/v1/fosa

# Tester le frontend
curl -I https://minsante.it-grafik.com
```

## 🎯 Checklist de Déploiement

Avant de mettre en production, vérifiez :

- [ ] Base de données MySQL configurée et accessible
- [ ] Tous les secrets changés (JWT_SECRET, DB_PASSWORD, etc.)
- [ ] Variables d'environnement correctement définies
- [ ] Certificats SSL actifs et valides
- [ ] Sauvegardes automatiques configurées
- [ ] Logs rotatifs en place
- [ ] Firewall configuré (ports 80, 443, 22)
- [ ] CI/CD testé et fonctionnel
- [ ] Documentation à jour
- [ ] Tests de charge effectués
- [ ] Plan de rollback préparé
- [ ] Monitoring en place

## 📞 Support

En cas de problème :

1. Consultez les logs : `docker logs health-backend`
2. Vérifiez la documentation API : https://api-dev-minsante.it-grafik.com/api-docs
3. Contactez l'équipe : mindahnkemeni@gmail.com

---

**Dernière mise à jour** : 2025-01-03
**Version** : 1.0.0
