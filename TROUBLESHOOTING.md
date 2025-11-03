# Guide de Dépannage - Health Management System

## Frontend Vide / Page Blanche

### Symptômes
- Le frontend se charge mais affiche une page blanche
- Pas d'erreurs visibles dans les logs Docker

### Diagnostic

1. **Vérifier les logs du navigateur**
   - Ouvrir la console développeur (F12)
   - Chercher des erreurs JavaScript
   - Vérifier les logs de configuration (doit afficher l'URL de l'API)

2. **Vérifier les variables d'environnement du build**
   ```bash
   # Lors du build Docker, vous devriez voir:
   docker build --build-arg VITE_API_URL=https://apiminsante.it-grafik.com/api/v1 \
                --build-arg VITE_APP_NAME="Health Management System" \
                --build-arg VITE_APP_VERSION="1.0.0" \
                -t frontend .
   ```

3. **Vérifier que nginx-proxy détecte le container**
   ```bash
   # Sur le serveur
   docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep minsante
   ```

4. **Vérifier les certificats SSL**
   ```bash
   docker exec nginx-proxy ls -la /etc/nginx/certs/ | grep minsante
   ```

### Solutions

#### Solution 1: Reconstruire avec les bonnes variables
```bash
# Dans GitHub Actions, vérifier que build-args sont bien passés
build-args: |
  VITE_API_URL=https://apiminsante.it-grafik.com/api/v1
  VITE_APP_NAME=Health Management System
  VITE_APP_VERSION=1.0.0
```

#### Solution 2: Vérifier la connexion au backend
```bash
# Tester depuis le container frontend
docker exec health-frontend wget -O- https://apiminsante.it-grafik.com/api/v1/health
```

#### Solution 3: Vérifier les assets
```bash
# Vérifier que les fichiers sont présents
docker exec health-frontend ls -la /usr/share/nginx/html/assets/
```

## Backend Non Accessible

### Diagnostic
```bash
# Vérifier que le container tourne
docker ps | grep health-backend

# Vérifier les logs
docker logs health-backend --tail=50

# Vérifier la connexion à la base de données
docker logs health-backend | grep "Database"

# Tester l'endpoint health
curl http://localhost:3000/api/v1/health  # Depuis le serveur
```

### Solutions

#### Problème de connexion MySQL
```bash
# Vérifier que mysql_db est sur le même réseau
docker network inspect proxy-tier | grep mysql_db
docker network inspect proxy-tier | grep health-backend

# Tester la connexion
docker exec health-backend ping -c 3 mysql_db
```

#### Problème de certificat SSL
```bash
# Forcer le renouvellement
docker restart nginx-proxy-acme
sleep 30
docker logs nginx-proxy-acme --tail=50
```

## Erreurs Courantes

### 1. "can't connect without a private SSH key or password"
**Cause**: Secret SSH_PASSWORD non configuré
**Solution**: Ajouter le secret dans GitHub Actions Settings

### 2. "curl: (35) OpenSSL error"
**Cause**: Certificat SSL non encore généré
**Solution**: Attendre quelques minutes pour que Let's Encrypt génère le certificat

### 3. "nginx: host not found in upstream"
**Cause**: Container backend pas sur le réseau proxy-tier
**Solution**: 
```bash
docker network connect proxy-tier health-backend
docker restart nginx-proxy
```

### 4. Page blanche avec "Failed to fetch"
**Cause**: Frontend ne peut pas joindre le backend
**Solutions**:
- Vérifier CORS dans le backend
- Vérifier que VITE_API_URL est correct
- Vérifier les certificats SSL

## Commandes Utiles

```bash
# Redémarrer tous les services
docker restart health-backend health-frontend nginx-proxy nginx-proxy-acme

# Voir tous les containers sur proxy-tier
docker network inspect proxy-tier

# Nettoyer et redéployer
docker stop health-backend health-frontend
docker rm health-backend health-frontend
# Puis relancer le déploiement GitHub Actions

# Vérifier la configuration nginx-proxy
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf

# Tester les endpoints
curl -I https://minsante.it-grafik.com
curl -I https://apiminsante.it-grafik.com/api/v1/health
```

## Logs de Diagnostic

```bash
# Backend
docker logs health-backend --follow

# Frontend  
docker logs health-frontend --follow

# Nginx Proxy
docker logs nginx-proxy --follow

# SSL/Acme
docker logs nginx-proxy-acme --follow
```

## Vérifications Post-Déploiement

1. ✅ Containers en cours d'exécution
2. ✅ Réseau proxy-tier configuré
3. ✅ Certificats SSL générés
4. ✅ Backend accessible via HTTPS
5. ✅ Frontend accessible via HTTPS
6. ✅ API répond correctement
7. ✅ Console navigateur sans erreurs

## Support

Pour plus d'aide, vérifier:
- Logs GitHub Actions: https://github.com/[USER]/[REPO]/actions
- Documentation: ./README.md
- Configuration: ./DEPLOYMENT.md
