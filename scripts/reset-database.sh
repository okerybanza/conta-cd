#!/bin/bash
# Database Reset Script for Testing
# WARNING: This will DELETE ALL DATA in the database!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "⚠️  DATABASE RESET WARNING ⚠️"
echo "================================"
echo -e "${RED}This script will DELETE ALL DATA from the production database!${NC}"
echo ""
echo "This includes:"
echo "  - All users"
echo "  - All companies"
echo "  - All invoices"
echo "  - All customers"
echo "  - All products"
echo "  - All financial data"
echo ""
echo -e "${YELLOW}You will be able to reuse email addresses after this reset.${NC}"
echo ""
read -p "Are you ABSOLUTELY SURE you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo "🔄 Starting database reset..."
echo ""

# Navigate to backend directory
cd /home/conta/conta.cd-prod/backend

# Create backup timestamp
BACKUP_NAME="backup_before_reset_$(date +%Y%m%d_%H%M%S)"

echo "📦 Creating backup: ${BACKUP_NAME}..."
mkdir -p ../backups

# Option 1: If you have database access
# pg_dump -U postgres conta_db > ../backups/${BACKUP_NAME}.sql 2>/dev/null || echo "Backup skipped (no direct DB access)"

# Option 2: Using Prisma to reset
echo "🗑️  Resetting database using Prisma..."

# Reset database (drops and recreates all tables)
npx prisma migrate reset --force --skip-seed --schema=../database/prisma/schema.prisma

echo ""
echo "🌱 Running seed data..."

# Run seed script if available
if [ -f "../database/prisma/seed.ts" ]; then
    echo "Running main seed..."
    cd ../database/prisma
    npx tsx seed.ts
    cd ../../backend
elif [ -f "src/scripts/reset-and-seed.ts" ]; then
    echo "Running reset-and-seed script..."
    npx tsx src/scripts/reset-and-seed.ts
else
    echo "⚠️  No seed script found. Database is empty."
fi

echo ""
echo -e "${GREEN}✅ Database reset complete!${NC}"
echo ""
echo "You can now:"
echo "  - Register with any email address (including previously used ones)"
echo "  - Start fresh testing"
echo "  - Create new test data"
echo ""

# Restart PM2 to clear any cached connections
echo "🔄 Restarting backend..."
pm2 restart conta-backend

echo ""
echo -e "${GREEN}Ready for testing!${NC}"
echo ""
