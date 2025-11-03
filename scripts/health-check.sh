#!/bin/bash

# =============================================================================
# Health Check Script - Health Management System
# =============================================================================
# Ce script vérifie l'état de santé de tous les composants du système
# =============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# URLs
FRONTEND_URL="https://minsante.it-grafik.com"
BACKEND_URL="https://api-dev-minsante.it-grafik.com"
HEALTH_ENDPOINT="${BACKEND_URL}/api/v1/health"
API_DOCS_URL="${BACKEND_URL}/api-docs"

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

print_check() {
    echo -n "$1 ... "
}

print_ok() {
    echo -e "${GREEN}✓ OK${NC}"
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "${RED}  Erreur: $1${NC}"
}

check_url() {
    local url=$1
    local name=$2

    print_check "$name"

    if curl -f -s -o /dev/null -w "%{http_code}" "$url" > /tmp/http_code 2>/dev/null; then
        local http_code=$(cat /tmp/http_code)
        if [ "$http_code" = "200" ]; then
            print_ok
            return 0
        else
            print_fail "HTTP $http_code"
            return 1
        fi
    else
        print_fail "Connexion impossible"
        return 1
    fi
}

check_docker_container() {
    local container=$1
    local name=$2

    print_check "$name"

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$container")
        if [ "$status" = "running" ]; then
            print_ok
            return 0
        else
            print_fail "Status: $status"
            return 1
        fi
    else
        print_fail "Conteneur non trouvé"
        return 1
    fi
}

check_ssl() {
    local url=$1
    local name=$2

    print_check "$name"

    local domain=$(echo "$url" | sed -e 's|^https://||' -e 's|/.*||')
    local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                   openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -n "$expiry" ]; then
        print_ok
        echo "    Expire le: $expiry"
        return 0
    else
        print_fail "Certificat non trouvé ou invalide"
        return 1
    fi
}

main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║   Health Management System - Health Check                ║"
    echo "╚═══════════════════════════════════════════════════════════╝"

    # Check Docker containers (if running on server)
    if command -v docker &> /dev/null; then
        print_header "Conteneurs Docker"
        check_docker_container "health-backend" "Backend Container"
        check_docker_container "health-frontend" "Frontend Container"
        check_docker_container "mysql_db" "MySQL Database"
        check_docker_container "nginx-proxy" "Nginx Proxy"
    fi

    # Check URLs
    print_header "Accessibilité Web"
    check_url "$FRONTEND_URL" "Frontend"
    check_url "$BACKEND_URL" "Backend"
    check_url "$HEALTH_ENDPOINT" "Health Endpoint"
    check_url "$API_DOCS_URL" "API Documentation"

    # Check SSL certificates
    print_header "Certificats SSL"
    check_ssl "$FRONTEND_URL" "Frontend SSL"
    check_ssl "$BACKEND_URL" "Backend SSL"

    # API Health details
    print_header "Détails API Health"
    if curl -f -s "$HEALTH_ENDPOINT" > /tmp/health.json 2>/dev/null; then
        echo -e "${GREEN}Réponse API:${NC}"
        cat /tmp/health.json | python3 -m json.tool 2>/dev/null || cat /tmp/health.json
        rm /tmp/health.json
    else
        echo -e "${RED}Impossible de récupérer les détails${NC}"
    fi

    # Docker stats (if on server)
    if command -v docker &> /dev/null && docker ps | grep -q health-backend; then
        print_header "Utilisation des Ressources"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
            health-backend health-frontend mysql_db 2>/dev/null || echo "Stats non disponibles"
    fi

    echo ""
    echo "=========================================="
    echo "Health check terminé"
    echo "=========================================="
    echo ""
}

main "$@"
