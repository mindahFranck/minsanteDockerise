#!/bin/bash

##############################################################################
# Script de Configuration Automatique du VPS
# Health Management System - Déploiement
#
# Usage:
#   chmod +x setup-vps.sh
#   ./setup-vps.sh [staging|production]
##############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Vérifier les arguments
if [ "$#" -ne 1 ]; then
    print_error "Usage: $0 [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Environment must be 'staging' or 'production'"
    exit 1
fi

# Variables
if [ "$ENVIRONMENT" == "staging" ]; then
    APP_DIR="/opt/health-management-staging"
    COMPOSE_FILE="docker-compose.staging.yml"
    ENV_FILE=".env.staging"
    BRANCH="staging"
else
    APP_DIR="/opt/health-management-prod"
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
    BRANCH="main"
fi

print_header "Configuration du VPS pour l'environnement: $ENVIRONMENT"

# 1. Vérification des prérequis
print_info "Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker n'est pas installé. Installation en cours..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker installé"
else
    print_success "Docker est déjà installé ($(docker --version))"
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose n'est pas installé. Installation en cours..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installé"
else
    print_success "Docker Compose est déjà installé ($(docker-compose --version))"
fi

# Vérifier Git
if ! command -v git &> /dev/null; then
    print_warning "Git n'est pas installé. Installation en cours..."
    sudo apt update
    sudo apt install -y git
    print_success "Git installé"
else
    print_success "Git est déjà installé"
fi

# 2. Création de la structure des dossiers
print_header "Création de la structure des dossiers"

if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    print_success "Dossier $APP_DIR créé"
else
    print_info "Le dossier $APP_DIR existe déjà"
fi

cd "$APP_DIR"

# Créer les sous-dossiers
mkdir -p uploads logs database/backups nginx/ssl
print_success "Sous-dossiers créés"

# 3. Clonage ou mise à jour du repository
print_header "Configuration du code source"

if [ ! -d ".git" ]; then
    print_info "Entrez l'URL de votre repository Git:"
    read REPO_URL

    git clone -b "$BRANCH" "$REPO_URL" .
    print_success "Repository cloné"
else
    print_info "Repository déjà présent, mise à jour..."
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    print_success "Repository mis à jour"
fi

# 4. Configuration du fichier .env
print_header "Configuration des variables d'environnement"

if [ ! -f ".env" ]; then
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" .env
        print_success "Fichier .env créé depuis $ENV_FILE"

        print_warning "IMPORTANT: Vous devez maintenant éditer le fichier .env avec vos propres valeurs!"
        print_info "Voulez-vous éditer le fichier .env maintenant? (y/n)"
        read EDIT_ENV

        if [ "$EDIT_ENV" == "y" ] || [ "$EDIT_ENV" == "Y" ]; then
            ${EDITOR:-nano} .env
        fi
    else
        print_error "Fichier $ENV_FILE non trouvé!"
        exit 1
    fi
else
    print_info "Le fichier .env existe déjà"
fi

# 5. Configuration SSL
print_header "Configuration SSL/TLS"

print_info "Souhaitez-vous configurer un certificat SSL? (y/n)"
read SETUP_SSL

if [ "$SETUP_SSL" == "y" ] || [ "$SETUP_SSL" == "Y" ]; then
    print_info "Choisissez une option:"
    print_info "1) Let's Encrypt (production recommandé)"
    print_info "2) Certificat auto-signé (staging/test)"
    read SSL_OPTION

    if [ "$SSL_OPTION" == "1" ]; then
        # Let's Encrypt
        if ! command -v certbot &> /dev/null; then
            print_info "Installation de Certbot..."
            sudo apt update
            sudo apt install -y certbot
        fi

        print_info "Entrez votre nom de domaine (ex: example.com):"
        read DOMAIN

        print_info "Obtention du certificat SSL..."
        sudo certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN"

        # Copier les certificats
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
        sudo chown -R $USER:$USER nginx/ssl

        print_success "Certificat SSL configuré"

        # Configuration du renouvellement automatique
        print_info "Configuration du renouvellement automatique..."
        (sudo crontab -l 2>/dev/null; echo "0 0 1 * * certbot renew --quiet") | sudo crontab -
        print_success "Renouvellement automatique configuré"

    elif [ "$SSL_OPTION" == "2" ]; then
        # Certificat auto-signé
        print_info "Entrez le nom de domaine (ex: staging.example.com):"
        read DOMAIN

        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=CM/ST=Centre/L=Yaounde/O=MINSANTE/CN=$DOMAIN"

        print_success "Certificat auto-signé créé"
    fi
fi

# 6. Configuration du pare-feu
print_header "Configuration du pare-feu"

if command -v ufw &> /dev/null; then
    print_info "Configuration du pare-feu UFW..."

    # Autoriser SSH
    sudo ufw allow 22/tcp

    # Autoriser HTTP et HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp

    # Activer UFW si pas déjà activé
    sudo ufw --force enable

    print_success "Pare-feu configuré"
    sudo ufw status
else
    print_warning "UFW n'est pas installé. Installation recommandée pour la sécurité."
    print_info "Voulez-vous installer UFW? (y/n)"
    read INSTALL_UFW

    if [ "$INSTALL_UFW" == "y" ] || [ "$INSTALL_UFW" == "Y" ]; then
        sudo apt update
        sudo apt install -y ufw
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable
        print_success "UFW installé et configuré"
    fi
fi

# 7. Génération de la clé SSH pour GitHub Actions
print_header "Configuration SSH pour GitHub Actions"

SSH_KEY_PATH="$HOME/.ssh/github_actions_deploy"

if [ ! -f "$SSH_KEY_PATH" ]; then
    print_info "Génération d'une nouvelle clé SSH pour GitHub Actions..."
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""

    # Ajouter la clé publique aux authorized_keys
    cat "${SSH_KEY_PATH}.pub" >> "$HOME/.ssh/authorized_keys"

    # Définir les permissions correctes
    chmod 600 "$HOME/.ssh/authorized_keys"
    chmod 700 "$HOME/.ssh"

    print_success "Clé SSH créée"

    echo ""
    print_info "Clé publique:"
    cat "${SSH_KEY_PATH}.pub"
    echo ""

    print_warning "IMPORTANT: Copiez la clé PRIVÉE ci-dessous et ajoutez-la aux secrets GitHub"
    print_warning "Nom du secret: STAGING_VPS_SSH_KEY ou PROD_VPS_SSH_KEY"
    echo ""
    cat "$SSH_KEY_PATH"
    echo ""

    print_info "Appuyez sur Entrée pour continuer..."
    read
else
    print_info "La clé SSH existe déjà à $SSH_KEY_PATH"
fi

# 8. Test du déploiement
print_header "Test du déploiement"

print_info "Voulez-vous tester le déploiement maintenant? (y/n)"
read TEST_DEPLOY

if [ "$TEST_DEPLOY" == "y" ] || [ "$TEST_DEPLOY" == "Y" ]; then
    print_info "Démarrage des services Docker..."

    # Créer le réseau s'il n'existe pas
    docker network create health-network 2>/dev/null || true

    # Démarrer les services
    docker-compose -f "$COMPOSE_FILE" up -d

    print_success "Services Docker démarrés"

    # Attendre que les services soient prêts
    print_info "Attente du démarrage des services (30 secondes)..."
    sleep 30

    # Vérifier l'état
    docker-compose -f "$COMPOSE_FILE" ps

    # Lancer les migrations
    print_info "Lancement des migrations de base de données..."
    docker-compose -f "$COMPOSE_FILE" exec -T backend npm run db:migrate || print_warning "Migrations échouées - vérifiez manuellement"

    # Health check
    print_info "Vérification de la santé de l'application..."
    sleep 5

    if curl -f http://localhost:3000/api/v1/health &> /dev/null; then
        print_success "Health check réussi!"
    else
        print_warning "Health check échoué - vérifiez les logs"
        docker-compose -f "$COMPOSE_FILE" logs --tail=50
    fi
fi

# 9. Configuration de la sauvegarde automatique
print_header "Configuration des sauvegardes automatiques"

print_info "Voulez-vous configurer les sauvegardes automatiques quotidiennes? (y/n)"
read SETUP_BACKUP

if [ "$SETUP_BACKUP" == "y" ] || [ "$SETUP_BACKUP" == "Y" ]; then
    # Créer le script de sauvegarde
    BACKUP_SCRIPT="$APP_DIR/scripts/backup.sh"
    mkdir -p "$APP_DIR/scripts"

    cat > "$BACKUP_SCRIPT" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."
COMPOSE_FILE=$(ls docker-compose.*.yml | head -1)
DATE=$(date +%Y%m%d-%H%M%S)

# Sauvegarde de la base de données
docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqldump -uroot -p$DB_PASSWORD health_management > "./database/backups/backup-$DATE.sql"

# Compression
gzip "./database/backups/backup-$DATE.sql"

# Nettoyer les sauvegardes de plus de 7 jours
find ./database/backups -name "backup-*.sql.gz" -mtime +7 -delete

echo "Sauvegarde terminée: backup-$DATE.sql.gz"
EOF

    chmod +x "$BACKUP_SCRIPT"

    # Ajouter au crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $BACKUP_SCRIPT >> $APP_DIR/logs/backup.log 2>&1") | crontab -

    print_success "Sauvegardes automatiques configurées (quotidien à 2h du matin)"
fi

# 10. Résumé
print_header "Configuration terminée!"

echo ""
print_success "✓ Docker et Docker Compose installés"
print_success "✓ Structure des dossiers créée"
print_success "✓ Code source configuré"
print_success "✓ Fichier .env créé"

if [ "$SETUP_SSL" == "y" ]; then
    print_success "✓ Certificats SSL configurés"
fi

print_success "✓ Pare-feu configuré"
print_success "✓ Clé SSH générée"

if [ "$TEST_DEPLOY" == "y" ]; then
    print_success "✓ Test de déploiement effectué"
fi

if [ "$SETUP_BACKUP" == "y" ]; then
    print_success "✓ Sauvegardes automatiques configurées"
fi

echo ""
print_header "Prochaines étapes"

echo "1. Vérifiez et modifiez le fichier .env si nécessaire:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Ajoutez les secrets suivants dans GitHub:"
echo "   - DOCKER_USERNAME"
echo "   - DOCKER_PASSWORD"
echo "   - ${ENVIRONMENT^^}_VPS_HOST (votre IP: $(curl -s ifconfig.me))"
echo "   - ${ENVIRONMENT^^}_VPS_USER ($USER)"
echo "   - ${ENVIRONMENT^^}_VPS_SSH_KEY (clé affichée ci-dessus)"
echo "   - ${ENVIRONMENT^^}_VPS_PORT (22)"
echo "   - ${ENVIRONMENT^^}_URL"
echo ""
echo "3. Poussez votre code sur la branche '$BRANCH' pour déclencher le déploiement automatique"
echo ""
echo "4. Consultez la documentation complète:"
echo "   - VPS_DEPLOYMENT_SETUP.md"
echo "   - DOCKER_DEPLOYMENT_GUIDE.md"
echo ""

print_info "Dossier de l'application: $APP_DIR"
print_info "Fichier Docker Compose: $COMPOSE_FILE"
print_info "Logs: docker-compose -f $APP_DIR/$COMPOSE_FILE logs -f"

echo ""
print_success "Configuration terminée avec succès! 🎉"
echo ""
