#!/bin/bash
# Script de déploiement complet pour conta.cd

set -e  # Arrêter en cas d'erreur

PROJECT_DIR="/home/conta/conta.cd"
cd "$PROJECT_DIR"

echo "🚀 Déploiement de Conta sur conta.cd"
echo "======================================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# 1. Backup de la base de données
echo "📦 1. Sauvegarde de la base de données..."
mkdir -p "$PROJECT_DIR/backups"
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw conta_db; then
    sudo -u postgres pg_dump conta_db > "$PROJECT_DIR/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    info "Backup créé"
else
    warn "Base de données non trouvée, pas de backup"
fi

# 2. Arrêter les services PM2
echo ""
echo "🛑 2. Arrêt des services PM2..."
pm2 stop all 2>/dev/null || warn "Aucun processus PM2 en cours"
pm2 delete all 2>/dev/null || warn "Aucun processus PM2 à supprimer"

# 3. Installation des dépendances backend
echo ""
echo "📦 3. Installation des dépendances backend..."
if [ -d "$PROJECT_DIR/backend" ]; then
    cd "$PROJECT_DIR/backend"
    npm install --production
    info "Dépendances backend installées"
else
    error "Répertoire backend non trouvé"
fi

# 4. Installation des dépendances frontend
echo ""
echo "📦 4. Installation des dépendances frontend..."
if [ -d "$PROJECT_DIR/frontend" ]; then
    cd "$PROJECT_DIR/frontend"
    npm install
    info "Dépendances frontend installées"
else
    error "Répertoire frontend non trouvé"
fi

# 5. Migrations Prisma
echo ""
echo "🔄 5. Application des migrations Prisma..."
if [ -d "$PROJECT_DIR/database/prisma" ]; then
    cd "$PROJECT_DIR/database/prisma"
    npx prisma generate
    npx prisma migrate deploy
    info "Migrations appliquées"
else
    warn "Répertoire Prisma non trouvé, migrations ignorées"
fi

# 6. Build backend
echo ""
echo "🔨 6. Build du backend..."
cd "$PROJECT_DIR/backend"
npm run build
info "Backend compilé"

# 7. Build frontend
echo ""
echo "🔨 7. Build du frontend..."
cd "$PROJECT_DIR/frontend"
npm run build
info "Frontend compilé"

# 8. Nettoyage (optionnel)
echo ""
echo "🧹 8. Nettoyage..."
# Nettoyer les anciens logs si nécessaire
find "$PROJECT_DIR/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
info "Nettoyage terminé"

# 9. Démarrage avec PM2
echo ""
echo "🚀 9. Démarrage des services avec PM2..."
cd "$PROJECT_DIR"
pm2 start ecosystem.config.js
pm2 save
info "Services démarrés"

# 10. Vérification
echo ""
echo "🔍 10. Vérification du statut..."
sleep 2
pm2 list
pm2 logs --lines 10

echo ""
echo "======================================"
info "Déploiement terminé avec succès!"
echo ""
echo "📊 Statut des services:"
pm2 status
echo ""
echo "🌐 URLs:"
echo "   - Frontend: https://conta.cd"
echo "   - API: https://conta.cd/api/v1"
echo ""
echo "📝 Logs:"
echo "   - PM2: pm2 logs"
echo "   - Backend: $PROJECT_DIR/logs/backend-*.log"
echo "   - Frontend: $PROJECT_DIR/logs/frontend-*.log"
echo "   - Nginx: /var/log/nginx/conta.cd-*.log"

