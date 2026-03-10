#!/bin/bash
# Script pour créer les fichiers .env à partir des templates

PROJECT_DIR="/home/conta/conta.cd"

echo "📝 Création des fichiers .env..."

# Backend .env
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    cat > "$PROJECT_DIR/backend/.env" << 'EOF'
# ============================================
# CONFIGURATION BACKEND - CONTA.CD
# ============================================

# Environnement
NODE_ENV=production
PORT=3001

# Base de données PostgreSQL
DATABASE_URL=postgresql://conta_user:aOpLcu14TmmBfxmkxF1n@localhost:5432/conta_db

# JWT Secrets (NOUVEAUX - générés pour conta.cd)
JWT_SECRET=7c9428951b4267a158d5cc9e68d425b0c189451292f04257a9d0115cd689e5b8
JWT_REFRESH_SECRET=5KaxJTc0JvRMZZk95F69Iex6foGMmulfTNObzplvf6k=
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# URLs
FRONTEND_URL=https://conta.cd
API_URL=https://conta.cd/api/v1

# Email SMTP (temporaire - mail.kazurihost.com)
SMTP_HOST=mail.kazurihost.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@conta.cd
SMTP_PASS=CHANGER_MOT_DE_PASSE
SMTP_FROM=noreply@conta.cd
SMTP_INVOICE_FROM=facture@conta.cd
SMTP_NOTIF_FROM=notifications@conta.cd

# Redis (optionnel - désactivé par défaut)
# REDIS_URL=redis://localhost:6379

# Uploads
UPLOAD_DIR=/home/conta/conta.cd/uploads
INVOICE_DIR=/home/conta/conta.cd/invoices

# Logs
LOG_DIR=/home/conta/conta.cd/logs
LOG_LEVEL=info

# Sécurité
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Puppeteer (PDF generation)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Autres
TIMEZONE=Africa/Kinshasa
LOCALE=fr_FR
EOF
    echo "✅ Fichier backend/.env créé"
else
    echo "⚠️  backend/.env existe déjà, ignoré"
fi

# Frontend .env
if [ ! -f "$PROJECT_DIR/frontend/.env" ]; then
    cat > "$PROJECT_DIR/frontend/.env" << 'EOF'
# ============================================
# CONFIGURATION FRONTEND - CONTA.CD
# ============================================

# API URL
VITE_API_URL=https://conta.cd/api/v1

# Environnement
VITE_NODE_ENV=production
EOF
    echo "✅ Fichier frontend/.env créé"
else
    echo "⚠️  frontend/.env existe déjà, ignoré"
fi

echo ""
echo "✅ Fichiers .env créés"
echo "⚠️  IMPORTANT: Vérifiez et modifiez les valeurs selon vos besoins"
echo "   - SMTP_PASS dans backend/.env"
echo "   - Autres credentials si nécessaire"

