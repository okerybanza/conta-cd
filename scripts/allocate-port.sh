#!/bin/bash
# Script pour allouer des ports à une application
# Usage: ./scripts/allocate-port.sh [app-name] [frontend-port] [backend-port]

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Usage: $0 [app-name] [frontend-port] [backend-port]"
    echo ""
    echo "Exemples:"
    echo "  $0 conta 3000 3002"
    echo "  $0 pipobot 3001 8182"
    echo "  $0 nouvelle-app 3003 3004"
    exit 1
fi

APP_NAME=$1
FRONTEND_PORT=$2
BACKEND_PORT=${3:-""}

echo "🔢 Allocation de ports pour: $APP_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier le port frontend
echo "🔍 Vérification du port frontend: $FRONTEND_PORT"
if ./scripts/check-port.sh $FRONTEND_PORT 2>&1 | grep -q "DÉJÀ UTILISÉ"; then
    echo "❌ Le port $FRONTEND_PORT est déjà utilisé !"
    echo ""
    echo "Processus utilisant ce port:"
    ./scripts/check-port.sh $FRONTEND_PORT 2>&1 | grep -A 5 "Processus"
    exit 1
fi
echo "✅ Port frontend $FRONTEND_PORT disponible"
echo ""

# Vérifier le port backend si fourni
if [ ! -z "$BACKEND_PORT" ]; then
    echo "🔍 Vérification du port backend: $BACKEND_PORT"
    if ./scripts/check-port.sh $BACKEND_PORT 2>&1 | grep -q "DÉJÀ UTILISÉ"; then
        echo "❌ Le port $BACKEND_PORT est déjà utilisé !"
        echo ""
        echo "Processus utilisant ce port:"
        ./scripts/check-port.sh $BACKEND_PORT 2>&1 | grep -A 5 "Processus"
        exit 1
    fi
    echo "✅ Port backend $BACKEND_PORT disponible"
    echo ""
fi

# Afficher l'allocation
echo "📋 Allocation proposée:"
echo "   Application: $APP_NAME"
echo "   Frontend: Port $FRONTEND_PORT"
if [ ! -z "$BACKEND_PORT" ]; then
    echo "   Backend: Port $BACKEND_PORT"
fi
echo ""

# Demander confirmation
read -p "Confirmer cette allocation? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Allocation annulée"
    exit 1
fi

# Allouer les ports selon le type d'application
APP_DIR="/home/kazurih/${APP_NAME}.kazurihost.com"

if [ -d "$APP_DIR" ]; then
    echo ""
    echo "🔧 Configuration de l'application..."
    
    # Backend
    if [ -f "${APP_DIR}/backend/.env" ] && [ ! -z "$BACKEND_PORT" ]; then
        if grep -q "^PORT=" "${APP_DIR}/backend/.env"; then
            sed -i "s/^PORT=.*/PORT=${BACKEND_PORT}/" "${APP_DIR}/backend/.env"
            echo "   ✅ Backend PORT=${BACKEND_PORT} configuré dans .env"
        else
            echo "PORT=${BACKEND_PORT}" >> "${APP_DIR}/backend/.env"
            echo "   ✅ Backend PORT=${BACKEND_PORT} ajouté dans .env"
        fi
    fi
    
    # Frontend
    if [ -f "${APP_DIR}/frontend/vite.config.ts" ]; then
        if grep -q "port:" "${APP_DIR}/frontend/vite.config.ts"; then
            sed -i "s/port: [0-9]*/port: ${FRONTEND_PORT}/" "${APP_DIR}/frontend/vite.config.ts"
            echo "   ✅ Frontend port: ${FRONTEND_PORT} configuré dans vite.config.ts"
        else
            echo "   ⚠️  Port non trouvé dans vite.config.ts, ajout manuel nécessaire"
        fi
    fi
    
    # Docker Compose
    if [ -f "${APP_DIR}/docker-compose.yml" ]; then
        echo "   ⚠️  Fichier docker-compose.yml trouvé, vérification manuelle nécessaire"
        echo "      Modifier les ports dans docker-compose.yml :"
        echo "      ports:"
        echo "        - \"${FRONTEND_PORT}:3000\"  # Frontend"
        if [ ! -z "$BACKEND_PORT" ]; then
            echo "        - \"${BACKEND_PORT}:8000\"  # Backend"
        fi
    fi
else
    echo ""
    echo "⚠️  Dossier de l'application non trouvé: $APP_DIR"
    echo "   Les ports sont alloués mais non configurés automatiquement"
fi

# Mettre à jour la documentation
echo ""
echo "📝 Mise à jour de la documentation..."
echo ""
echo "✅ Allocation terminée !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifier la configuration dans les fichiers de l'application"
echo "   2. Redémarrer les services si nécessaire"
echo "   3. Mettre à jour ALLOCATION_PORTS_COMPLETE.md avec cette allocation"
echo ""
echo "💡 Pour vérifier: ./scripts/check-port.sh $FRONTEND_PORT"

