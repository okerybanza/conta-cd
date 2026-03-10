#!/bin/bash
# Script pour fixer et vérifier les ports selon PORTS_ALLOCATION.md
# Usage: ./scripts/fix-ports.sh [--check-only]

set -e

PROJECT_DIR="/home/conta/conta.cd"
CHECK_ONLY=${1:-""}

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🔧 Fixation des Ports - Conta.cd"
echo "=================================="
echo ""

# Ports selon PORTS_ALLOCATION.md
FRONTEND_PORT=3000
BACKEND_PORT=3001

# 1. Vérifier la disponibilité des ports
echo "📋 1. Vérification de la disponibilité des ports..."

check_port() {
    local port=$1
    local service=$2
    if ss -tlnp | grep -q ":${port} "; then
        local pid=$(ss -tlnp | grep ":${port} " | awk '{print $6}' | cut -d, -f2 | cut -d= -f2)
        warn "Port ${port} (${service}) est utilisé par PID ${pid}"
        return 1
    else
        info "Port ${port} (${service}) est disponible"
        return 0
    fi
}

check_port $FRONTEND_PORT "Frontend"
check_port $BACKEND_PORT "Backend API"

echo ""

# 2. Fixer le port dans backend/.env
if [ "$CHECK_ONLY" != "--check-only" ]; then
    echo "🔧 2. Configuration du backend..."
    cd "$PROJECT_DIR/backend"
    
    if [ -f ".env" ]; then
        if grep -q "^PORT=" .env; then
            sed -i "s/^PORT=.*/PORT=${BACKEND_PORT}/" .env
            info "PORT=${BACKEND_PORT} mis à jour dans backend/.env"
        else
            echo "PORT=${BACKEND_PORT}" >> .env
            info "PORT=${BACKEND_PORT} ajouté dans backend/.env"
        fi
    else
        error "Fichier backend/.env non trouvé"
    fi
    
    echo ""
fi

# 3. Vérifier ecosystem.config.js
echo "🔧 3. Vérification de ecosystem.config.js..."
if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
    if grep -q "\"PORT\": ${BACKEND_PORT}" "$PROJECT_DIR/ecosystem.config.js"; then
        info "ecosystem.config.js contient PORT=${BACKEND_PORT}"
    else
        if [ "$CHECK_ONLY" != "--check-only" ]; then
            sed -i "s/\"PORT\": [0-9]*/\"PORT\": ${BACKEND_PORT}/" "$PROJECT_DIR/ecosystem.config.js"
            info "ecosystem.config.js mis à jour avec PORT=${BACKEND_PORT}"
        else
            warn "ecosystem.config.js ne contient pas PORT=${BACKEND_PORT}"
        fi
    fi
else
    warn "ecosystem.config.js non trouvé"
fi

echo ""

# 4. Vérifier vite.config.ts
echo "🔧 4. Vérification de vite.config.ts..."
if [ -f "$PROJECT_DIR/frontend/vite.config.ts" ]; then
    if grep -q "port: ${FRONTEND_PORT}" "$PROJECT_DIR/frontend/vite.config.ts"; then
        info "vite.config.ts contient port=${FRONTEND_PORT}"
    else
        warn "vite.config.ts ne contient pas port=${FRONTEND_PORT}"
    fi
else
    warn "vite.config.ts non trouvé"
fi

echo ""

# 5. Vérifier les processus PM2
echo "🔧 5. Vérification des processus PM2..."
if command -v pm2 &> /dev/null; then
    PM2_PROCESSES=$(pm2 list | grep -c "conta-backend" || echo "0")
    if [ "$PM2_PROCESSES" -gt 0 ]; then
        info "Processus PM2 'conta-backend' trouvé"
        pm2 list | grep conta-backend
    else
        warn "Aucun processus PM2 'conta-backend' trouvé"
    fi
else
    warn "PM2 n'est pas installé"
fi

echo ""
echo "=================================="
if [ "$CHECK_ONLY" == "--check-only" ]; then
    info "Vérification terminée (mode check-only)"
else
    info "Configuration des ports terminée"
    echo ""
    echo "📝 Ports configurés:"
    echo "   - Frontend: ${FRONTEND_PORT}"
    echo "   - Backend: ${BACKEND_PORT}"
    echo ""
    echo "💡 Pour appliquer les changements:"
    echo "   pm2 restart conta-backend"
fi
