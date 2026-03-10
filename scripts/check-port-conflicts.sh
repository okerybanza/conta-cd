#!/bin/bash
# Script pour vérifier les conflits de ports selon PORTS_ALLOCATION.md
# Usage: ./scripts/check-port-conflicts.sh

PROJECT_DIR="/home/conta/conta.cd"

echo "🔍 Vérification des Conflits de Ports - Conta.cd"
echo "================================================="
echo ""

# Ports selon PORTS_ALLOCATION.md avec processus attendus
declare -A PORTS=(
    ["3000"]="Frontend (Vite)|vite|node"
    ["3001"]="Backend API|node|conta-backend"
    ["5432"]="PostgreSQL|postgres"
    ["6379"]="Redis|redis-server"
)

CONFLICTS=0
MULTIPLE_USERS=0

for port in "${!PORTS[@]}"; do
    IFS='|' read -r service expected_processes <<< "${PORTS[$port]}"
    
    # Compter les PIDs uniques utilisant ce port
    port_users=$(ss -tlnp | grep ":${port} " | awk '{print $6}' | cut -d, -f2 | cut -d= -f2 | sort -u | wc -l)
    
    if [ "$port_users" -eq 0 ]; then
        echo "✅ Port ${port} (${service}) est disponible"
    elif [ "$port_users" -eq 1 ]; then
        pid=$(ss -tlnp | grep ":${port} " | awk '{print $6}' | cut -d, -f2 | cut -d= -f2 | head -n 1)
        process=$(ps -p "$pid" -o comm= 2>/dev/null || echo "inconnu")
        cmdline=$(ps -p "$pid" -o cmd= 2>/dev/null | cut -c1-60 || echo "")
        
        # Vérifier si le processus est attendu
        is_expected=false
        for expected in $(echo "$expected_processes" | tr ',' ' '); do
            # Vérifier dans le nom du processus OU dans la commande complète
            if echo "$process" | grep -qi "$expected" || echo "$cmdline" | grep -qi "$expected"; then
                is_expected=true
                break
            fi
        done
        
        # Cas spécial: node avec vite dans la commande = OK pour port 3000
        if [ "$port" = "3000" ] && echo "$cmdline" | grep -qi "vite"; then
            is_expected=true
        fi
        
        # Cas spécial: node avec dist/server.js = OK pour port 3001
        if [ "$port" = "3001" ] && echo "$cmdline" | grep -qi "dist/server.js"; then
            is_expected=true
        fi
        
        if [ "$is_expected" = true ]; then
            echo "✅ Port ${port} (${service}) utilisé par ${process} (PID ${pid}) - OK"
        else
            echo "⚠️  Port ${port} (${service}) utilisé par ${process} (PID ${pid}) - Processus inattendu"
            echo "   Commande: ${cmdline}..."
            CONFLICTS=$((CONFLICTS + 1))
        fi
    else
        echo "❌ Port ${port} (${service}) utilisé par ${port_users} processus - CONFLIT!"
        ss -tlnp | grep ":${port} " | while read line; do
            pid=$(echo "$line" | awk '{print $6}' | cut -d, -f2 | cut -d= -f2)
            process=$(ps -p "$pid" -o comm= 2>/dev/null || echo "inconnu")
            echo "   - PID ${pid}: ${process}"
        done
        MULTIPLE_USERS=$((MULTIPLE_USERS + 1))
        CONFLICTS=$((CONFLICTS + 1))
    fi
done

echo ""
if [ $CONFLICTS -eq 0 ]; then
    echo "✅ Aucun conflit détecté - Tous les ports sont correctement utilisés"
    exit 0
else
    if [ $MULTIPLE_USERS -gt 0 ]; then
        echo "❌ ${MULTIPLE_USERS} port(s) avec plusieurs utilisateurs détecté(s)"
    fi
    echo "⚠️  ${CONFLICTS} problème(s) détecté(s)"
    echo ""
    echo "💡 Pour résoudre:"
    echo "   1. Vérifier les processus: ps aux | grep <PID>"
    echo "   2. Arrêter les processus inattendus: kill <PID>"
    echo "   3. Relancer: pm2 restart conta-backend"
    echo "   4. Vérifier: ./scripts/fix-ports.sh"
    exit 1
fi
