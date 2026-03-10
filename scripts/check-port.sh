#!/bin/bash
# Script de vérification du port avant démarrage PM2 (DEV)
# Usage: ./check-port.sh [PORT]

PORT=${1:-3002}
PROCESS_NAME="conta-backend-dev"

echo "🔍 Vérification du port $PORT (DEV)..."

# Vérifier si le port est utilisé
PID=$(lsof -ti :$PORT 2>/dev/null)

if [ -n "$PID" ]; then
    echo "⚠️  ATTENTION: Le port $PORT est déjà utilisé par le processus PID: $PID"
    
    # Afficher les détails du processus
    echo "📋 Détails du processus:"
    ps -p $PID -o pid,user,cmd --no-headers
    
    # Vérifier si c'est notre processus PM2
    PM2_PID=$(pm2 pid $PROCESS_NAME 2>/dev/null)
    
    if [ "$PID" = "$PM2_PID" ]; then
        echo "✅ C'est notre processus PM2, c'est normal."
        exit 0
    else
        echo "❌ Ce n'est PAS notre processus PM2 !"
        echo "💡 Action recommandée: Arrêter ce processus avec: kill $PID"
        exit 1
    fi
else
    echo "✅ Le port $PORT est libre."
    exit 0
fi
