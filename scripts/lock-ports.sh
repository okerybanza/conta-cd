#!/bin/bash
# Script pour verrouiller les ports d'un projet
# Usage: ./scripts/lock-ports.sh [project-name]

set -e

PROJECT_NAME=${1:-"conta"}
PROJECT_DIR="/home/kazurih/${PROJECT_NAME}.kazurihost.com"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Erreur: Le projet ${PROJECT_NAME} n'existe pas dans ${PROJECT_DIR}"
    exit 1
fi

echo "🔒 Verrouillage des ports pour le projet: ${PROJECT_NAME}"
echo ""

# Lire la configuration des ports depuis PORTS_CONFIG.md ou utiliser les valeurs par défaut
if [ "$PROJECT_NAME" = "conta" ]; then
    FRONTEND_PORT=3000
    BACKEND_PORT=3002
    PM2_BACKEND_NAME="conta-backend"
elif [ "$PROJECT_NAME" = "pipobot" ]; then
    FRONTEND_PORT=3001  # Différent de conta pour éviter conflit
    BACKEND_PORT=8182
    PM2_BACKEND_NAME="pipobot-backend"
else
    echo "⚠️  Projet non reconnu, utilisation des ports par défaut"
    FRONTEND_PORT=3000
    BACKEND_PORT=3001
    PM2_BACKEND_NAME="${PROJECT_NAME}-backend"
fi

echo "📋 Ports configurés:"
echo "   - Frontend: ${FRONTEND_PORT}"
echo "   - Backend: ${BACKEND_PORT}"
echo ""

# 1. Vérifier et configurer le backend
if [ -f "${PROJECT_DIR}/backend/.env" ]; then
    echo "🔧 Configuration du backend..."
    
    # Vérifier si PORT est déjà défini
    if grep -q "^PORT=" "${PROJECT_DIR}/backend/.env"; then
        # Remplacer la valeur existante
        sed -i "s/^PORT=.*/PORT=${BACKEND_PORT}/" "${PROJECT_DIR}/backend/.env"
        echo "   ✅ PORT=${BACKEND_PORT} mis à jour dans backend/.env"
    else
        # Ajouter PORT s'il n'existe pas
        echo "PORT=${BACKEND_PORT}" >> "${PROJECT_DIR}/backend/.env"
        echo "   ✅ PORT=${BACKEND_PORT} ajouté dans backend/.env"
    fi
else
    echo "   ⚠️  Fichier backend/.env non trouvé"
fi

# 2. Vérifier et configurer le frontend (vite.config.ts)
if [ -f "${PROJECT_DIR}/frontend/vite.config.ts" ]; then
    echo "🔧 Configuration du frontend..."
    
    # Vérifier si le port est déjà défini
    if grep -q "port:" "${PROJECT_DIR}/frontend/vite.config.ts"; then
        # Remplacer la valeur existante
        sed -i "s/port: [0-9]*/port: ${FRONTEND_PORT}/" "${PROJECT_DIR}/frontend/vite.config.ts"
        echo "   ✅ port: ${FRONTEND_PORT} mis à jour dans frontend/vite.config.ts"
    else
        echo "   ⚠️  Port non trouvé dans vite.config.ts, ajout manuel nécessaire"
    fi
else
    echo "   ⚠️  Fichier frontend/vite.config.ts non trouvé"
fi

# 3. Vérifier la configuration Nginx
echo "🔧 Vérification de la configuration Nginx..."
NGINX_CONF="/etc/nginx/conf.d/vhosts/${PROJECT_NAME}.kazurihost.com.conf"
if [ -f "$NGINX_CONF" ]; then
    # Vérifier que les ports dans Nginx correspondent
    if grep -q "proxy_pass.*:${BACKEND_PORT}" "$NGINX_CONF"; then
        echo "   ✅ Configuration Nginx correcte pour le backend (port ${BACKEND_PORT})"
    else
        echo "   ⚠️  Vérifiez que Nginx pointe vers le port ${BACKEND_PORT}"
    fi
else
    echo "   ⚠️  Configuration Nginx non trouvée: ${NGINX_CONF}"
fi

# 4. Vérifier PM2
echo "🔧 Vérification PM2..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "${PM2_BACKEND_NAME}"; then
        echo "   ✅ Processus PM2 '${PM2_BACKEND_NAME}' trouvé"
        echo "   💡 Pour redémarrer avec les nouveaux ports: pm2 restart ${PM2_BACKEND_NAME}"
    else
        echo "   ⚠️  Processus PM2 '${PM2_BACKEND_NAME}' non trouvé"
    fi
else
    echo "   ⚠️  PM2 non installé"
fi

echo ""
echo "✅ Verrouillage des ports terminé!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Redémarrer le backend: cd ${PROJECT_DIR}/backend && pm2 restart ${PM2_BACKEND_NAME}"
echo "   2. Redémarrer le frontend si nécessaire"
echo "   3. Vérifier les ports: ./scripts/check-ports.sh"
echo ""

