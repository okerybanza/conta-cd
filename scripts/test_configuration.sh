#!/bin/bash
# Script de test de la configuration avant déploiement

echo "🧪 Tests de configuration conta.cd"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

test_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

test_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# 1. Test connexion PostgreSQL
echo "1. Test connexion PostgreSQL..."
if sudo -u postgres psql -d conta_db -c "SELECT 1;" >/dev/null 2>&1 || sudo -u postgres psql -lqt | grep -q conta_db; then
    test_ok "Connexion PostgreSQL OK"
else
    test_warn "Test PostgreSQL nécessite sudo (base existe: $(sudo -u postgres psql -lqt | grep -c conta_db || echo '0'))"
fi

# 2. Test fichiers .env
echo ""
echo "2. Test fichiers .env..."
if [ -f "/home/conta/conta.cd/backend/.env" ]; then
    if grep -q "conta.cd" /home/conta/conta.cd/backend/.env; then
        test_ok "backend/.env existe et contient conta.cd"
    else
        test_warn "backend/.env existe mais ne contient pas conta.cd"
    fi
else
    test_error "backend/.env manquant"
fi

if [ -f "/home/conta/conta.cd/frontend/.env" ]; then
    if grep -q "conta.cd" /home/conta/conta.cd/frontend/.env; then
        test_ok "frontend/.env existe et contient conta.cd"
    else
        test_warn "frontend/.env existe mais ne contient pas conta.cd"
    fi
else
    test_error "frontend/.env manquant"
fi

# 3. Test Nginx
echo ""
echo "3. Test Nginx..."
if sudo nginx -t >/dev/null 2>&1 || nginx -t >/dev/null 2>&1; then
    test_ok "Configuration Nginx valide"
else
    test_warn "Test Nginx nécessite sudo (service actif: $(systemctl is-active nginx 2>/dev/null || echo 'inconnu'))"
fi

if systemctl is-active --quiet nginx; then
    test_ok "Nginx est actif"
else
    test_error "Nginx n'est pas actif"
fi

# 4. Test ports
echo ""
echo "4. Test ports..."
if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
    test_ok "Port 80 ouvert"
else
    test_warn "Port 80 non détecté (peut nécessiter sudo)"
fi

if netstat -tlnp 2>/dev/null | grep -q ":5432 "; then
    test_ok "Port 5432 (PostgreSQL) ouvert"
else
    test_warn "Port 5432 non détecté (peut nécessiter sudo)"
fi

# 5. Test DNS (si possible)
echo ""
echo "5. Test DNS..."
if command -v dig >/dev/null 2>&1; then
    DNS_IP=$(dig +short conta.cd @8.8.8.8 | tail -1)
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if [ "$DNS_IP" = "185.250.37.250" ] || [ "$DNS_IP" = "$SERVER_IP" ]; then
        test_ok "DNS conta.cd pointe vers le serveur ($DNS_IP)"
    else
        test_warn "DNS conta.cd pointe vers $DNS_IP (attendu: 185.250.37.250)"
    fi
else
    test_warn "dig non installé, test DNS ignoré"
fi

# 6. Test structure
echo ""
echo "6. Test structure des dossiers..."
REQUIRED_DIRS=("backend" "frontend" "database" "logs" "backups" "uploads" "invoices")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "/home/conta/conta.cd/$dir" ]; then
        test_ok "Répertoire $dir existe"
    else
        test_error "Répertoire $dir manquant"
    fi
done

# 7. Test code source (si présent)
echo ""
echo "7. Test code source..."
if [ -f "/home/conta/conta.cd/backend/package.json" ]; then
    test_ok "Code backend présent"
    if [ -d "/home/conta/conta.cd/backend/node_modules" ]; then
        test_ok "Dépendances backend installées"
    else
        test_warn "Dépendances backend non installées"
    fi
else
    test_warn "Code backend manquant (normal si pas encore récupéré)"
fi

if [ -f "/home/conta/conta.cd/frontend/package.json" ]; then
    test_ok "Code frontend présent"
    if [ -d "/home/conta/conta.cd/frontend/node_modules" ]; then
        test_ok "Dépendances frontend installées"
    else
        test_warn "Dépendances frontend non installées"
    fi
else
    test_warn "Code frontend manquant (normal si pas encore récupéré)"
fi

# 8. Test PM2
echo ""
echo "8. Test PM2..."
if command -v pm2 >/dev/null 2>&1; then
    test_ok "PM2 installé"
    PM2_PROCESSES=$(pm2 list 2>/dev/null | grep -c "conta-" || echo "0")
    if [ "$PM2_PROCESSES" -gt 0 ] 2>/dev/null; then
        test_ok "$PM2_PROCESSES processus PM2 actif(s)"
    else
        test_warn "Aucun processus PM2 actif (normal avant déploiement)"
    fi
else
    test_error "PM2 non installé"
fi

# 9. Test Chromium (pour Puppeteer)
echo ""
echo "9. Test Chromium..."
if command -v chromium-browser >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1; then
    test_ok "Chromium installé"
else
    test_warn "Chromium non trouvé (nécessaire pour Puppeteer)"
fi

# Résumé
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) - Configuration prête avec réserves${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) et $WARNINGS avertissement(s)${NC}"
    exit 1
fi

