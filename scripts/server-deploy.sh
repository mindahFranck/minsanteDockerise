#!/bin/bash

# =============================================================================
# Script de Déploiement sur Serveur - Health Management System
# =============================================================================
# Ce script doit être exécuté DIRECTEMENT sur le serveur de production
# Il arrête les anciens conteneurs et démarre les nouveaux
#
# Usage (sur le serveur):
#   ./server-deploy.sh [backend|frontend|all]
# =============================================================================

set -e

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-yourdockerhubusername}"
BACKEND_IMAGE="$DOCKER_USERNAME/health-management-backend:latest"
FRONTEND_IMAGE="$DOCKER_USERNAME/health-management-frontend:latest"

# Database configuration
DB_HOST="mysql_db"
DB_NAME="mydatabase"
DB_USER="myuser"
DB_PASSWORD="mypassword"

# JWT Secret (IMPORTANT: Changez cette valeur en production)
JWT_SECRET="${JWT_SECRET:-change-this-secret-in-production}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Deploy backend
deploy_backend() {
    print_info "Déploiement du backend..."

    # Create directories
    print_info "Création des répertoires..."
    mkdir -p /var/health-backend/uploads
    mkdir -p /var/health-backend/logs

    # Create network if doesn't exist
    docker network create proxy-tier 2>/dev/null || true

    # Pull latest image
    print_info "Pull de la dernière image..."
    docker pull $BACKEND_IMAGE

    # Stop and remove old container
    print_info "Arrêt de l'ancien conteneur..."
    docker stop health-backend 2>/dev/null || true
    docker rm health-backend 2>/dev/null || true

    # Run new container
    print_info "Démarrage du nouveau conteneur..."
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
      -e DB_HOST=$DB_HOST \
      -e DB_PORT=3306 \
      -e DB_NAME=$DB_NAME \
      -e DB_USER=$DB_USER \
      -e DB_PASSWORD=$DB_PASSWORD \
      -e JWT_SECRET="$JWT_SECRET" \
      -e JWT_EXPIRES_IN=7d \
      -e CORS_ORIGIN="https://minsante.it-grafik.com,https://api-dev-minsante.it-grafik.com" \
      -e LOG_LEVEL=info \
      -e RATE_LIMIT_WINDOW_MS=900000 \
      -e RATE_LIMIT_MAX_REQUESTS=100 \
      -v /var/health-backend/uploads:/app/uploads \
      -v /var/health-backend/logs:/app/logs \
      $BACKEND_IMAGE

    # Wait and check
    print_info "Attente du démarrage..."
    sleep 10

    if docker ps | grep -q health-backend; then
        print_success "Backend déployé avec succès"
        print_info "Logs récents:"
        docker logs --tail=20 health-backend
    else
        print_error "Le backend n'a pas démarré correctement"
        docker logs health-backend
        exit 1
    fi
}

# Deploy frontend
deploy_frontend() {
    print_info "Déploiement du frontend..."

    # Create network if doesn't exist
    docker network create proxy-tier 2>/dev/null || true

    # Pull latest image
    print_info "Pull de la dernière image..."
    docker pull $FRONTEND_IMAGE

    # Stop and remove old container
    print_info "Arrêt de l'ancien conteneur..."
    docker stop health-frontend 2>/dev/null || true
    docker rm health-frontend 2>/dev/null || true

    # Run new container
    print_info "Démarrage du nouveau conteneur..."
    docker run -d \
      --name health-frontend \
      --restart unless-stopped \
      --network proxy-tier \
      -e VIRTUAL_HOST=minsante.it-grafik.com \
      -e VIRTUAL_PORT=80 \
      -e LETSENCRYPT_HOST=minsante.it-grafik.com \
      -e LETSENCRYPT_EMAIL=mindahnkemeni@gmail.com \
      $FRONTEND_IMAGE

    # Wait and check
    print_info "Attente du démarrage..."
    sleep 5

    if docker ps | grep -q health-frontend; then
        print_success "Frontend déployé avec succès"
        print_info "Logs récents:"
        docker logs --tail=10 health-frontend
    else
        print_error "Le frontend n'a pas démarré correctement"
        docker logs health-frontend
        exit 1
    fi
}

# Cleanup old images
cleanup() {
    print_info "Nettoyage des anciennes images..."
    docker image prune -af --filter "until=48h" || true
    print_success "Nettoyage terminé"
}

# Main
main() {
    local component="${1:-all}"

    print_info "=== Déploiement sur Serveur ==="
    print_info "Composant: $component"
    echo ""

    case "$component" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            echo ""
            deploy_frontend
            ;;
        *)
            print_error "Composant invalide: $component"
            print_info "Usage: $0 [backend|frontend|all]"
            exit 1
            ;;
    esac

    echo ""
    cleanup

    echo ""
    print_success "=== Déploiement terminé ==="
    echo ""
    print_info "URLs:"
    echo "  Frontend: https://minsante.it-grafik.com"
    echo "  Backend:  https://api-dev-minsante.it-grafik.com"
    echo "  API Docs: https://api-dev-minsante.it-grafik.com/api-docs"
}

main "$@"
