#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "❌ Usage: ./rollback.sh <tag_or_commit>"
  echo ""
  echo "Exemples:"
  echo "  ./rollback.sh v2.0-20250101_120000"
  echo "  ./rollback.sh abc1234"
  echo ""
  echo "Pour voir les tags disponibles:"
  echo "  git tag -l"
  exit 1
fi

VERSION=$1

echo "⏪ Rollback vers $VERSION..."

# 1. Vérifier que la version existe
if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "❌ Erreur: La version '$VERSION' n'existe pas"
  echo ""
  echo "Tags disponibles:"
  git tag -l | tail -10
  exit 1
fi

# 2. Arrêter les services
echo "⏸️  Arrêt des services..."
pm2 stop all 2>/dev/null || echo "⚠️  PM2 non accessible"

# 3. Restaurer le code
echo "📦 Restauration du code..."
git checkout $VERSION

# 4. Restaurer la base de données (optionnel - commenté par défaut)
# echo "🔄 Restauration de la base de données..."
# echo "⚠️  Décommentez cette section dans rollback.sh si nécessaire"
# psql -U postgres conta_db < backups/backup_YYYYMMDD_HHMMSS.sql

# 5. Rebuild
echo "🏗️  Rebuild des dépendances..."
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..

# 6. Vider le cache Redis
echo "🗑️  Nettoyage du cache Redis..."
redis-cli FLUSHDB 2>/dev/null || echo "⚠️  Redis non accessible"

# 7. Redémarrer
echo "▶️  Redémarrage des services..."
if [ -f "ecosystem.config.js" ]; then
  pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
else
  pm2 restart all 2>/dev/null || echo "⚠️  Redémarrage PM2 échoué"
fi

echo ""
echo "✅ Rollback terminé vers $VERSION"
echo ""
echo "💡 Pour revenir à la dernière version:"
echo "   git checkout main"
echo "   ./deploy.sh"

