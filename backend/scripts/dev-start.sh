#!/bin/bash

##############################################################################
# Script de Démarrage Rapide pour le Développement Local
# Health Management System
#
# Usage:
#   chmod +x dev-start.sh
#   ./dev-start.sh [docker|native]
##############################################################################

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Fonction de vérification des prérequis
check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 est installé"
        return 0
    else
        print_error "$1 n'est pas installé"
        return 1
    fi
}

# Bannière
clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Health Management System - Développement Local          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Déterminer le mode
MODE=${1:-docker}

if [ "$MODE" != "docker" ] && [ "$MODE" != "native" ]; then
    print_error "Mode invalide. Utilisez 'docker' ou 'native'"
    echo "Usage: $0 [docker|native]"
    exit 1
fi

print_header "Mode sélectionné: $MODE"

# Vérification des prérequis communs
print_header "Vérification des prérequis"

check_command "node" || { print_error "Node.js est requis. Installez-le depuis https://nodejs.org"; exit 1; }
check_command "npm" || { print_error "npm est requis"; exit 1; }
check_command "git" || print_warning "git n'est pas installé (recommandé)"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_warning "Node.js version $NODE_VERSION détectée. Version 20+ recommandée."
fi

# Vérifications spécifiques au mode
if [ "$MODE" == "docker" ]; then
    check_command "docker" || { print_error "Docker est requis. Installez-le depuis https://www.docker.com"; exit 1; }
    check_command "docker-compose" || { print_error "Docker Compose est requis"; exit 1; }

    # Vérifier que Docker est démarré
    if ! docker info &> /dev/null; then
        print_error "Docker n'est pas démarré. Démarrez Docker Desktop."
        exit 1
    fi
    print_success "Docker est démarré"
else
    print_info "Vérification de MySQL..."
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL n'est pas installé"
        print_info "Installez MySQL depuis https://dev.mysql.com/downloads/mysql/"
        exit 1
    fi

    print_info "Vérification de Redis..."
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis n'est pas installé"
        print_info "Installez Redis:"
        print_info "  Mac: brew install redis"
        print_info "  Linux: sudo apt install redis-server"
        print_info "  Windows: Utilisez WSL2"
        exit 1
    fi

    # Vérifier que MySQL est démarré
    if ! pgrep -x mysqld &> /dev/null; then
        print_warning "MySQL ne semble pas démarré"
        print_info "Démarrez MySQL avec:"
        print_info "  Mac: brew services start mysql@8.0"
        print_info "  Linux: sudo systemctl start mysql"
    else
        print_success "MySQL est démarré"
    fi

    # Vérifier que Redis est démarré
    if ! redis-cli ping &> /dev/null; then
        print_warning "Redis ne semble pas démarré"
        print_info "Démarrez Redis avec:"
        print_info "  Mac: brew services start redis"
        print_info "  Linux: sudo systemctl start redis-server"
    else
        print_success "Redis est démarré"
    fi
fi

# Configuration de l'environnement
print_header "Configuration de l'environnement"

if [ ! -f ".env" ]; then
    print_info "Création du fichier .env..."
    if [ -f ".env.development" ]; then
        cp .env.development .env
        print_success "Fichier .env créé depuis .env.development"
    else
        print_error ".env.development n'existe pas"
        exit 1
    fi
else
    print_info "Le fichier .env existe déjà"
fi

# Installation des dépendances
print_header "Installation des dépendances"

if [ ! -d "node_modules" ]; then
    print_info "Installation des dépendances backend..."
    npm install
    print_success "Dépendances backend installées"
else
    print_info "Dépendances backend déjà installées"
fi

if [ ! -d "frontend/node_modules" ]; then
    print_info "Installation des dépendances frontend..."
    cd frontend
    npm install
    cd ..
    print_success "Dépendances frontend installées"
else
    print_info "Dépendances frontend déjà installées"
fi

# Mode Docker
if [ "$MODE" == "docker" ]; then
    print_header "Démarrage avec Docker"

    print_info "Arrêt des conteneurs existants..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

    print_info "Démarrage des services Docker..."
    docker-compose -f docker-compose.dev.yml up -d --build

    print_info "Attente du démarrage des services (30 secondes)..."
    sleep 30

    # Vérifier l'état des services
    print_info "Vérification de l'état des services..."
    docker-compose -f docker-compose.dev.yml ps

    # Migrations
    print_info "Exécution des migrations..."
    docker-compose -f docker-compose.dev.yml exec -T backend npm run db:migrate || print_warning "Migrations échouées - vérifiez manuellement"

    # Seeders
    print_info "Voulez-vous peupler la base de données avec des données de test? (y/n)"
    read -t 10 RUN_SEED || RUN_SEED="n"

    if [ "$RUN_SEED" == "y" ] || [ "$RUN_SEED" == "Y" ]; then
        print_info "Exécution des seeders..."
        docker-compose -f docker-compose.dev.yml exec -T backend npm run db:seed || print_warning "Seeders échoués"
    fi

    print_success "Services Docker démarrés!"

    print_header "URLs d'accès"
    echo -e "${GREEN}Frontend:${NC}    http://localhost:5173"
    echo -e "${GREEN}Backend API:${NC} http://localhost:3000/api/v1"
    echo -e "${GREEN}API Docs:${NC}    http://localhost:3000/api-docs"
    echo -e "${GREEN}Adminer:${NC}     http://localhost:8080"
    echo ""
    echo -e "${YELLOW}Compte par défaut:${NC}"
    echo -e "  Email:    admin@example.com"
    echo -e "  Password: admin123"
    echo ""

    print_info "Pour voir les logs:"
    echo "  docker-compose -f docker-compose.dev.yml logs -f"
    echo ""

    print_info "Pour arrêter:"
    echo "  docker-compose -f docker-compose.dev.yml down"
    echo ""

    print_info "Appuyez sur Entrée pour voir les logs (Ctrl+C pour quitter)..."
    read
    docker-compose -f docker-compose.dev.yml logs -f

# Mode Native
else
    print_header "Démarrage en mode natif"

    # Vérifier/créer la base de données
    print_info "Vérification de la base de données..."

    DB_EXISTS=$(mysql -u root -ppassword -e "SHOW DATABASES LIKE 'health_management_dev';" 2>/dev/null | grep -c "health_management_dev" || echo "0")

    if [ "$DB_EXISTS" == "0" ]; then
        print_info "Création de la base de données..."
        mysql -u root -ppassword -e "CREATE DATABASE health_management_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
            print_error "Impossible de créer la base de données"
            print_info "Créez-la manuellement avec:"
            echo "  mysql -u root -p"
            echo "  CREATE DATABASE health_management_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            exit 1
        }
        print_success "Base de données créée"
    else
        print_success "Base de données existe déjà"
    fi

    # Migrations
    print_info "Exécution des migrations..."
    npm run db:migrate || print_warning "Migrations échouées"

    # Seeders
    print_info "Voulez-vous peupler la base de données? (y/n)"
    read -t 10 RUN_SEED || RUN_SEED="n"

    if [ "$RUN_SEED" == "y" ] || [ "$RUN_SEED" == "Y" ]; then
        npm run db:seed || print_warning "Seeders échoués"
    fi

    # Build TypeScript
    print_info "Build du backend..."
    npm run build

    print_success "Configuration terminée!"

    print_header "Démarrage des services"
    print_warning "Vous devez démarrer 2 terminaux:"
    echo ""
    echo -e "${BLUE}Terminal 1 - Backend:${NC}"
    echo "  npm run dev"
    echo ""
    echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
    echo "  cd frontend"
    echo "  npm run dev"
    echo ""

    print_info "Voulez-vous démarrer le backend maintenant? (y/n)"
    read START_BACKEND

    if [ "$START_BACKEND" == "y" ] || [ "$START_BACKEND" == "Y" ]; then
        print_header "Démarrage du backend"
        print_info "Pour démarrer le frontend, ouvrez un nouveau terminal et exécutez:"
        echo "  cd frontend && npm run dev"
        echo ""
        print_success "Backend en cours de démarrage..."
        npm run dev
    else
        print_info "Pour démarrer manuellement:"
        echo "  Terminal 1: npm run dev"
        echo "  Terminal 2: cd frontend && npm run dev"
    fi
fi

print_header "Démarrage terminé!"
print_success "L'application est prête pour le développement! 🎉"
