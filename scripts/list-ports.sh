#!/bin/bash
# Script pour lister tous les ports utilisés par application
# Usage: ./scripts/list-ports.sh

echo "🔍 Liste des ports utilisés par application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Applications Node.js/PM2${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list 2>/dev/null | tail -n +3 | while read line; do
    if [ ! -z "$line" ]; then
        name=$(echo "$line" | awk '{print $2}')
        status=$(echo "$line" | awk '{print $10}')
        if [ "$status" = "online" ]; then
            # Chercher le port utilisé
            pid=$(echo "$line" | awk '{print $6}')
            if [ ! -z "$pid" ] && [ "$pid" != "pid" ]; then
                ports=$(sudo lsof -Pan -p $pid -i 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | sort -n | uniq | tr '\n' ',' | sed 's/,$//')
                if [ ! -z "$ports" ]; then
                    echo -e "${GREEN}✅${NC} $name : Port(s) $ports"
                fi
            fi
        fi
    fi
done

echo ""
echo -e "${BLUE}🐳 Applications Docker${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo docker ps --format "{{.Names}}\t{{.Ports}}" 2>/dev/null | while read line; do
    if [ ! -z "$line" ]; then
        name=$(echo "$line" | awk '{print $1}')
        ports=$(echo "$line" | awk '{for(i=2;i<=NF;i++) printf "%s ", $i; print ""}' | grep -oP '\d+:\d+' | cut -d: -f1 | sort -n | uniq | tr '\n' ',' | sed 's/,$//')
        if [ ! -z "$ports" ]; then
            echo -e "${GREEN}✅${NC} $name (Docker) : Port(s) $ports"
        fi
    fi
done

echo ""
echo -e "${BLUE}🌐 Services Système${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}⚠️${NC}  Ports partagés (utilisés par plusieurs applications) :"
echo "   - 80, 443 : Nginx (tous les projets)"
echo "   - 5432 : PostgreSQL principal"
echo "   - 3306 : MySQL/MariaDB"
echo "   - 6379 : Redis principal"
echo "   - 2083, 2087 : cPanel"
echo "   - 2095, 2096 : Webmail"

echo ""
echo -e "${BLUE}📋 Tous les ports en écoute${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v ss &> /dev/null; then
    sudo ss -tlnp 2>/dev/null | grep LISTEN | awk '{print $4}' | cut -d: -f2 | sort -n | uniq | head -30
else
    sudo netstat -tlnp 2>/dev/null | grep LISTEN | awk '{print $4}' | cut -d: -f2 | sort -n | uniq | head -30
fi

echo ""
echo "💡 Pour vérifier un port spécifique : ./scripts/check-port.sh [port]"
echo "💡 Pour plus d'informations : ALLOCATION_PORTS_COMPLETE.md"

