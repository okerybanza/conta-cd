#!/bin/bash
# Script de démarrage sécurisé du backend en développement
# Vérifie le port avant de démarrer PM2

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CHECK_PORT_SCRIPT="$SCRIPT_DIR/check-port.sh"

echo "🚀 Démarrage du backend DÉVELOPPEMENT..."
echo "📁 Répertoire: $PROJECT_DIR"

# Vérifier le port
if ! "$CHECK_PORT_SCRIPT" 3002; then
    echo "❌ Le port 3002 n'est pas disponible. Arrêtez le processus qui l'utilise."
    exit 1
fi

# Aller dans le répertoire du projet
cd "$PROJECT_DIR"

# Démarrer PM2
echo "▶️  Démarrage PM2..."
pm2 start ecosystem.config.js

# Attendre un peu
sleep 2

# Vérifier le statut
pm2 status

echo "✅ Backend démarré avec succès !"
echo "📊 Voir les logs: pm2 logs conta-backend-dev"
