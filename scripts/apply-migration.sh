#!/bin/bash

# Script pour appliquer la migration Prisma
# Usage: ./scripts/apply-migration.sh

set -e

echo "🔄 Application de la migration Prisma..."

cd "$(dirname "$0")/.."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "database/prisma/schema.prisma" ]; then
    echo "❌ Erreur: schema.prisma non trouvé"
    exit 1
fi

# Aller dans le répertoire prisma
cd database/prisma

# Générer le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate

# Appliquer la migration manuellement si nécessaire
if [ -f "migrations/20250102000000_add_missing_invoice_and_expense_fields/migration.sql" ]; then
    echo "📝 Migration trouvée, application..."
    
    # Vérifier si la migration a déjà été appliquée
    if command -v psql &> /dev/null; then
        echo "⚠️  Pour appliquer la migration, exécutez:"
        echo "   psql -d conta_db -f migrations/20250102000000_add_missing_invoice_and_expense_fields/migration.sql"
        echo ""
        echo "   Ou utilisez Prisma Studio pour vérifier les tables:"
        echo "   npx prisma studio"
    else
        echo "⚠️  psql non trouvé. Appliquez manuellement la migration SQL:"
        echo "   migrations/20250102000000_add_missing_invoice_and_expense_fields/migration.sql"
    fi
else
    echo "❌ Migration non trouvée"
    exit 1
fi

echo "✅ Migration préparée"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Appliquez la migration SQL sur votre base de données"
echo "   2. Vérifiez avec: npx prisma studio"
echo "   3. Testez l'application"

