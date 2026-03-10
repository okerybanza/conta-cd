#!/bin/bash
set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de Conta V2..."

# 1. Sauvegarder la base de données
echo "📦 Sauvegarde de la base de données..."
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
pg_dump -U postgres conta_db > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo "⚠️  Impossible de sauvegarder la DB (vérifier les credentials)"

# 2. Créer un tag de version
VERSION=$(date +%Y%m%d_%H%M%S)
git tag -a "v2.0-$VERSION" -m "Deployment $VERSION" 2>/dev/null || echo "⚠️  Tag non créé (déjà existe ou pas de repo Git)"

# 3. Arrêter les services
echo "⏸️  Arrêt des services..."
pm2 stop all 2>/dev/null || echo "⚠️  PM2 non accessible ou pas de services en cours"

# 4. Installer les dépendances
echo "📦 Installation des dépendances..."
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 5. Migrations de base de données
echo "🔄 Migrations de base de données..."
cd database/prisma
npx prisma migrate deploy 2>/dev/null || echo "⚠️  Pas de migrations à déployer"
npx prisma generate
cd ../..

# 6. Build backend (si nécessaire)
echo "🏗️  Build du backend..."
cd backend
if [ -f "tsconfig.json" ]; then
  npm run build 2>/dev/null || echo "⚠️  Pas de script build ou erreur"
fi
cd ..

# 7. Build frontend
echo "🏗️  Build du frontend..."
cd frontend
npm run build
cd ..

# 8. Vider le cache Redis (optionnel)
echo "🗑️  Nettoyage du cache Redis..."
redis-cli FLUSHDB 2>/dev/null || echo "⚠️  Redis non accessible ou pas configuré"

# 9. Redémarrer les services
echo "▶️  Redémarrage des services..."
if [ -f "ecosystem.config.js" ]; then
  pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
else
  echo "⚠️  ecosystem.config.js non trouvé, redémarrage manuel nécessaire"
  pm2 restart all 2>/dev/null || echo "⚠️  Redémarrage PM2 échoué"
fi

# 10. Vérifier le statut
echo "📊 Statut des services..."
pm2 status

echo ""
echo "✅ Déploiement terminé !"
echo "📝 Version: v2.0-$VERSION"
echo ""
echo "💡 Commandes utiles:"
echo "   - Voir les logs: pm2 logs"
echo "   - Monitoring: pm2 monit"
echo "   - Rollback: ./rollback.sh v2.0-YYYYMMDD_HHMMSS"

