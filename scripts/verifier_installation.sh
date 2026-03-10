#!/bin/bash
# Script de vérification de l'installation

echo "🔍 Vérification de l'installation conta.cd"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Vérifier les outils installés
echo "📦 Vérification des outils..."
command -v node >/dev/null && check "Node.js installé ($(node --version))" || warn "Node.js non installé"
command -v npm >/dev/null && check "npm installé ($(npm --version))" || warn "npm non installé"
command -v pm2 >/dev/null && check "PM2 installé ($(pm2 --version | head -1))" || warn "PM2 non installé"
command -v psql >/dev/null && check "PostgreSQL client installé" || warn "PostgreSQL client non installé"
command -v nginx >/dev/null && check "Nginx installé ($(nginx -v 2>&1 | cut -d/ -f2))" || warn "Nginx non installé"
command -v certbot >/dev/null && check "Certbot installé" || warn "Certbot non installé"

# 2. Vérifier les services
echo ""
echo "🔧 Vérification des services..."
systemctl is-active --quiet postgresql && check "PostgreSQL actif" || warn "PostgreSQL inactif"
systemctl is-active --quiet nginx && check "Nginx actif" || warn "Nginx inactif"

# 3. Vérifier la base de données
echo ""
echo "💾 Vérification de la base de données..."
sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw conta_db && check "Base de données conta_db existe" || warn "Base de données conta_db n'existe pas"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='conta_user'" | grep -q 1 && check "Utilisateur conta_user existe" || warn "Utilisateur conta_user n'existe pas"

# 4. Vérifier la structure des dossiers
echo ""
echo "📁 Vérification de la structure..."
[ -d "/home/conta/conta.cd" ] && check "Répertoire principal existe" || warn "Répertoire principal manquant"
[ -d "/home/conta/conta.cd/backend" ] && check "Répertoire backend existe" || warn "Répertoire backend manquant"
[ -d "/home/conta/conta.cd/frontend" ] && check "Répertoire frontend existe" || warn "Répertoire frontend manquant"
[ -d "/home/conta/conta.cd/database" ] && check "Répertoire database existe" || warn "Répertoire database manquant"
[ -d "/home/conta/conta.cd/logs" ] && check "Répertoire logs existe" || warn "Répertoire logs manquant"
[ -d "/home/conta/conta.cd/backups" ] && check "Répertoire backups existe" || warn "Répertoire backups manquant"

# 5. Vérifier les fichiers de configuration
echo ""
echo "⚙️  Vérification des fichiers de configuration..."
[ -f "/home/conta/conta.cd/backend/.env" ] && check "backend/.env existe" || warn "backend/.env manquant"
[ -f "/home/conta/conta.cd/frontend/.env" ] && check "frontend/.env existe" || warn "frontend/.env manquant"
[ -f "/home/conta/conta.cd/ecosystem.config.js" ] && check "ecosystem.config.js existe" || warn "ecosystem.config.js manquant"
[ -f "/etc/nginx/sites-available/conta.cd" ] && check "Configuration Nginx existe" || warn "Configuration Nginx manquante"

# 6. Vérifier Nginx
echo ""
echo "🌐 Vérification de Nginx..."
nginx -t >/dev/null 2>&1 && check "Configuration Nginx valide" || warn "Erreur dans la configuration Nginx"

# 7. Vérifier les ports
echo ""
echo "🔌 Vérification des ports..."
netstat -tlnp 2>/dev/null | grep -q ":80 " && check "Port 80 ouvert" || warn "Port 80 non ouvert"
netstat -tlnp 2>/dev/null | grep -q ":443 " && warn "Port 443 ouvert (SSL pas encore configuré)" || check "Port 443 fermé (normal avant SSL)"
netstat -tlnp 2>/dev/null | grep -q ":5432 " && check "Port 5432 (PostgreSQL) ouvert" || warn "Port 5432 non ouvert"

# 8. Vérifier le code source
echo ""
echo "📝 Vérification du code source..."
if [ -f "/home/conta/conta.cd/backend/package.json" ]; then
    check "Code backend présent"
else
    warn "Code backend manquant (à récupérer depuis ancien serveur)"
fi

if [ -f "/home/conta/conta.cd/frontend/package.json" ]; then
    check "Code frontend présent"
else
    warn "Code frontend manquant (à récupérer depuis ancien serveur)"
fi

if [ -f "/home/conta/conta.cd/database/prisma/schema.prisma" ]; then
    check "Schéma Prisma présent"
else
    warn "Schéma Prisma manquant (à récupérer depuis ancien serveur)"
fi

# 9. Vérifier les permissions
echo ""
echo "🔐 Vérification des permissions..."
[ -O "/home/conta/conta.cd" ] && check "Permissions correctes sur /home/conta/conta.cd" || warn "Problème de permissions"

# Résumé
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Toutes les vérifications sont passées!${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) - Vérifiez les points ci-dessus${NC}"
else
    echo -e "${RED}❌ $ERRORS erreur(s) et $WARNINGS avertissement(s)${NC}"
fi
echo ""

