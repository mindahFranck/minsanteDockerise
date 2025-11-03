#!/bin/bash

# =============================================================================
# Script de Déploiement Manuel - Health Management System
# =============================================================================
# Ce script permet de déployer manuellement le backend et le frontend
# sur le serveur de production
#
# Usage:
#   ./scripts/deploy.sh [backend|frontend|all]
#
# Exemples:
#   ./scripts/deploy.sh backend    # Déploie uniquement le backend
#   ./scripts/deploy.sh frontend   # Déploie uniquement le frontend
#   ./scripts/deploy.sh all        # Déploie les deux (par défaut)
# =============================================================================

set -e  # Exit on error

# Configuration
SERVER_IP="78.142.242.49"
DOCKER_USERNAME="${DOCKER_USERNAME:-yourdockerhubusername}"
BACKEND_IMAGE="$DOCKER_USERNAME/health-management-backend"
FRONTEND_IMAGE="$DOCKER_USERNAME/health-management-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    print_success "Docker est installé"
}

# Build and push backend
deploy_backend() {
    print_info "Déploiement du backend..."

    # Build
    print_info "Build de l'image backend..."
    cd backend
    docker build -t $BACKEND_IMAGE:latest .
    cd ..

    # Push to Docker Hub
    print_info "Push vers Docker Hub..."
    docker push $BACKEND_IMAGE:latest

    print_success "Backend image pushed to Docker Hub"
}

# Build and push frontend
deploy_frontend() {
    print_info "Déploiement du frontend..."

    # Build
    print_info "Build de l'image frontend..."
    cd frontend
    docker build \
        --build-arg VITE_API_URL=https://api-dev-minsante.it-grafik.com/api/v1 \
        --build-arg VITE_APP_NAME="Health Management System" \
        --build-arg VITE_APP_VERSION=1.0.0 \
        -t $FRONTEND_IMAGE:latest .
    cd ..

    # Push to Docker Hub
    print_info "Push vers Docker Hub..."
    docker push $FRONTEND_IMAGE:latest

    print_success "Frontend image pushed to Docker Hub"
}

# Main deployment logic
main() {
    local component="${1:-all}"

    print_info "=== Health Management System - Déploiement ==="
    print_info "Composant: $component"
    print_info "Serveur: $SERVER_IP"
    echo ""

    # Check dependencies
    check_docker

    # Deploy based on argument
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
    print_success "=== Déploiement terminé ==="
    print_info "Les images sont disponibles sur Docker Hub"
    print_info "Connectez-vous au serveur pour les déployer:"
    echo ""
    echo "  ssh user@$SERVER_IP"
    echo "  docker pull $BACKEND_IMAGE:latest"
    echo "  docker pull $FRONTEND_IMAGE:latest"
    echo ""
    print_info "Ou utilisez GitHub Actions pour un déploiement automatique"
}

# Run main function
main "$@"
