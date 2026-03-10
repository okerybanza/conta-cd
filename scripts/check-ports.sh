#!/bin/bash
# Script de vérification des ports par projet
# Usage: ./scripts/check-ports.sh

echo "🔍 Vérification des ports par projet..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour vérifier un port
check_port() {
    local port=$1
    local service=$2
    local project=$3
    
    if netstat -tlnp 2>/dev/null | grep -q ":${port}"; then
        local process=$(netstat -tlnp 2>/dev/null | grep ":${port}" | awk '{print $7}' | head -1)
        echo -e "${GREEN}✅${NC} ${project} - ${service} (Port ${port}) : ${process}"
        return 0
    else
        echo -e "${RED}❌${NC} ${project} - ${service} (Port ${port}) : NON DÉMARRÉ"
        return 1
    fi
}

# Fonction pour vérifier un port avec PM2
check_port_pm2() {
    local port=$1
    local service=$2
    local project=$3
    local pm2_name=$4
    
    if pm2 list | grep -q "${pm2_name}"; then
        local status=$(pm2 list | grep "${pm2_name}" | awk '{print $10}')
        if [ "$status" = "online" ]; then
            if netstat -tlnp 2>/dev/null | grep -q ":${port}"; then
                echo -e "${GREEN}✅${NC} ${project} - ${service} (Port ${port}, PM2: ${pm2_name}) : ONLINE"
                return 0
            else
                echo -e "${YELLOW}⚠️${NC} ${project} - ${service} (Port ${port}, PM2: ${pm2_name}) : PM2 ONLINE mais port non accessible"
                return 1
            fi
        else
            echo -e "${RED}❌${NC} ${project} - ${service} (Port ${port}, PM2: ${pm2_name}) : PM2 ${status}"
            return 1
        fi
    else
        echo -e "${RED}❌${NC} ${project} - ${service} (Port ${port}, PM2: ${pm2_name}) : PM2 NON TROUVÉ"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PROJET: CONTA (conta.cd)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_port_pm2 3002 "Backend API" "CONTA" "conta-backend"
check_port 3000 "Frontend (Vite)" "CONTA"
check_port 5432 "PostgreSQL" "CONTA (partagé)"
check_port 6379 "Redis" "CONTA (optionnel)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PROJET: PIPOBOT (pipobot.kazurihost.com)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_port 8182 "Backend API" "PIPOBOT"
check_port 2095 "Webmail" "PIPOBOT (partagé)"
check_port 2083 "cPanel" "PIPOBOT (partagé)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 SERVICES PARTAGÉS (Nginx)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_port 80 "HTTP" "Nginx (partagé)"
check_port 443 "HTTPS" "Nginx (partagé)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  CONFLITS POTENTIELS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier les conflits de port 3000
port3000_count=$(netstat -tlnp 2>/dev/null | grep ":3000" | wc -l)
if [ "$port3000_count" -gt 1 ]; then
    echo -e "${YELLOW}⚠️  Port 3000 utilisé par plusieurs processus :${NC}"
    netstat -tlnp 2>/dev/null | grep ":3000" | awk '{print "   - " $7}'
fi

# Vérifier les conflits de port 3002
port3002_count=$(netstat -tlnp 2>/dev/null | grep ":3002" | wc -l)
if [ "$port3002_count" -gt 1 ]; then
    echo -e "${YELLOW}⚠️  Port 3002 utilisé par plusieurs processus :${NC}"
    netstat -tlnp 2>/dev/null | grep ":3002" | awk '{print "   - " $7}'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 RÉSUMÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pour plus d'informations, consultez: PORTS_CONFIG.md"
echo ""

