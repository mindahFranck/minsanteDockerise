#!/bin/bash

##############################################################################
# Script de Déploiement Production
# Health Management System - minsante.it-grafik.com
#
# Usage:
#   chmod +x deploy-prod.sh
#   ./deploy-prod.sh [deploy|rollback|status|logs|backup]
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

# Variables
PROJECT_NAME="health-management"
DEPLOY_DIR="$HOME/api-health-deploy"
COMPOSE_FILE="docker-compose.prod.yml"
DOMAIN="minsante.it-grafik.com"
BACKUP_DIR="/var/backups/$PROJECT_NAME"

# Charger les variables d'environnement
if [ -f "$DEPLOY_DIR/.env" ]; then
    export $(grep -v '^#' $DEPLOY_DIR/.env | xargs)
fi

# Vérifications initiales
check_requirements() {
    print_header "Vérification des prérequis"
    
    check_command() {
        if command -v $1 &> /dev/null; then
            print_success "$1 est installé"
            return 0
        else
            print_error "$1 n'est pas installé"
            return 1
        fi
    }

    check_command "docker" || exit 1
    check_command "docker-compose" || exit 1
    
    if ! docker info &> /dev/null; then
        print_error "Docker n'est pas démarré"
        exit 1
    fi
    
    if ! docker network ls | grep -q nginx-proxy; then
        print_warning "Création du réseau nginx-proxy..."
        docker network create nginx-proxy || {
            print_error "Impossible de créer le réseau nginx-proxy"
            exit 1
        }
    fi
    
    print_success "Tous les prérequis sont satisfaits"
}

# Sauvegarde de la base de données
backup_database() {
    print_info "Sauvegarde de la base de données..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
    
    mkdir -p $BACKUP_DIR
    
    if docker ps | grep -q health-management-mysql-prod; then
        if docker exec health-management-mysql-prod mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_FILE 2>/dev/null; then
            print_success "Sauvegarde créée: $BACKUP_FILE"
            # Garder seulement les 5 dernières sauvegardes
            ls -t $BACKUP_DIR/backup_*.sql 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
        else
            print_warning "Sauvegarde MySQL échouée (peut être la première installation)"
        fi
    else
        print_info "Aucune base de données existante à sauvegarder"
    fi
}

# Vérification de santé
health_check() {
    print_info "Vérification de la santé des services..."
    
    # Vérifier les conteneurs
    if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        print_error "Certains conteneurs ne sont pas démarrés"
        docker-compose -f $COMPOSE_FILE ps
        exit 1
    fi
    
    # Vérifier le backend
    if curl -f -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        print_success "Backend est en bonne santé"
    else
        print_warning "Backend ne répond pas encore, nouvelle tentative..."
        sleep 10
        if curl -f -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
            print_success "Backend est en bonne santé"
        else
            print_error "Backend ne répond pas"
            docker-compose -f $COMPOSE_FILE logs backend
            exit 1
        fi
    fi
    
    # Vérifier MySQL
    if docker exec health-management-mysql-prod mysql -u root -p$DB_PASSWORD -e "SELECT 1;" > /dev/null 2>&1; then
        print_success "MySQL est en bonne santé"
    else
        print_error "MySQL ne répond pas"
        exit 1
    fi
    
    # Vérifier Redis
    if docker exec health-management-redis-prod redis-cli ping | grep -q "PONG"; then
        print_success "Redis est en bonne santé"
    else
        print_error "Redis ne répond pas"
        exit 1
    fi
}

# Déploiement
deploy() {
    print_header "DÉPLOIEMENT PRODUCTION - $DOMAIN"
    
    cd $DEPLOY_DIR
    check_requirements
    backup_database
    
    print_info "Arrêt des anciens conteneurs..."
    docker-compose -f $COMPOSE_FILE down --remove-orphans || true
    
    print_info "Nettoyage des images Docker..."
    docker image prune -af --filter "until=24h"
    
    print_info "Téléchargement des dernières images..."
    docker-compose -f $COMPOSE_FILE pull
    
    print_info "Démarrage des services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    print_info "Attente du démarrage des services (40 secondes)..."
    sleep 40
    
    health_check
    
    print_info "Exécution des migrations..."
    docker exec health-management-backend-prod npm run db:migrate 2>/dev/null || print_warning "Migrations échouées ou déjà à jour"
    
    print_success "Déploiement terminé avec succès!"
    show_status
    show_urls
}

# Rollback
rollback() {
    print_header "ROLLBACK - $DOMAIN"
    
    cd $DEPLOY_DIR
    
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        print_error "Aucune sauvegarde trouvée"
        exit 1
    fi
    
    print_info "Dernière sauvegarde: $LATEST_BACKUP"
    
    print_warning "Êtes-vous sûr de vouloir restaurer cette sauvegarde? (y/n)"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Rollback annulé"
        exit 0
    fi
    
    print_info "Arrêt de l'application..."
    docker-compose -f $COMPOSE_FILE down
    
    print_info "Restauration de la base de données..."
    docker-compose -f $COMPOSE_FILE up -d mysql
    sleep 20
    
    docker exec -i health-management-mysql-prod mysql -u root -p$DB_PASSWORD $DB_NAME < $LATEST_BACKUP || {
        print_error "Échec de la restauration"
        exit 1
    }
    
    print_info "Redémarrage de l'application..."
    docker-compose -f $COMPOSE_FILE up -d
    
    sleep 30
    health_check
    
    print_success "Rollback terminé avec succès!"
    show_status
}

# Statut
show_status() {
    print_header "STATUT DES SERVICES"
    
    cd $DEPLOY_DIR
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    print_info "Utilisation des ressources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -n 6
}

# URLs
show_urls() {
    print_header "URLS D'ACCÈS"
    
    echo -e "${GREEN}Application Frontend:${NC}    https://$DOMAIN"
    echo -e "${GREEN}API Backend:${NC}             https://$DOMAIN/api/v1"
    echo -e "${GREEN}Adminer (DB):${NC}            https://admin.$DOMAIN"
    echo -e "${GREEN}Health Check:${NC}            https://$DOMAIN/api/v1/health"
    echo ""
    echo -e "${YELLOW}Commandes utiles:${NC}"
    echo "  Logs:              docker-compose logs -f"
    echo "  Shell Backend:     docker exec -it health-management-backend-prod sh"
    echo "  Shell MySQL:       docker exec -it health-management-mysql-prod mysql -u root -p"
    echo "  Shell Redis:       docker exec -it health-management-redis-prod redis-cli"
}

# Logs
show_logs() {
    print_header "LOGS DES SERVICES"
    
    cd $DEPLOY_DIR
    SERVICE=${1:-}
    
    if [ -n "$SERVICE" ]; then
        print_info "Logs du service: $SERVICE"
        docker-compose -f $COMPOSE_FILE logs -f --tail=50 $SERVICE
    else
        docker-compose -f $COMPOSE_FILE logs --tail=50
    fi
}

# Aide
show_help() {
    print_header "SCRIPT DE DÉPLOIEMENT PRODUCTION"
    
    echo "Usage: $0 [COMMANDE]"
    echo ""
    echo "Commandes:"
    echo "  deploy     - Déployer l'application"
    echo "  rollback   - Restaurer la version précédente"
    echo "  status     - Statut des services"
    echo "  logs       - Logs des services"
    echo "  backup     - Sauvegarder la base de données"
    echo "  help       - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 deploy"
    echo "  $0 logs backend"
    echo "  $0 status"
}

# Main
case "${1:-}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    backup)
        backup_database
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac