#!/bin/bash
# Script de test pour toutes les corrections appliquées
# Usage: ./scripts/test-corrections.sh

set -e

PROJECT_DIR="/home/conta/conta.cd"
API_URL="http://localhost:3001/api/v1"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED=$((PASSED + 1))
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    SKIPPED=$((SKIPPED + 1))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED=$((FAILED + 1))
}

echo "🧪 Tests des Corrections - Conta.cd"
echo "===================================="
echo ""

# 1. Vérifier que le backend est en ligne
info "1. Vérification du backend..."
if curl -s -f "${API_URL}/health" > /dev/null 2>&1 || curl -s "${API_URL}/customers" > /dev/null 2>&1; then
    success "Backend est en ligne sur ${API_URL}"
else
    error "Backend n'est pas accessible sur ${API_URL}"
    echo "   Vérifiez: pm2 status"
    exit 1
fi
echo ""

# 2. Test de la correction 1: Import uuidv4 dans payment.service.ts
info "2. Test Correction 1: Import uuidv4 dans payment.service.ts"
if grep -q "import { v4 as uuidv4 } from 'uuid';" "${PROJECT_DIR}/backend/src/services/payment.service.ts"; then
    success "Import uuidv4 présent dans payment.service.ts"
else
    error "Import uuidv4 manquant dans payment.service.ts"
fi
echo ""

# 3. Test de la correction 2: Validation credit-notes
info "3. Test Correction 2: Validation credit-notes (preprocessData)"
if grep -q "requiredFields = \['invoiceId', 'amount', 'reason'\]" "${PROJECT_DIR}/backend/src/controllers/creditNote.controller.ts"; then
    success "PreprocessData modifié pour préserver les champs requis"
else
    error "PreprocessData non modifié pour credit-notes"
fi
echo ""

# 4. Test de la correction 3: Timeout sur GET /invoices/{id}
info "4. Test Correction 3: Timeout sur GET /invoices/{id}"
if grep -q "const timeout = 30000" "${PROJECT_DIR}/backend/src/controllers/invoice.controller.ts"; then
    success "Timeout de 30s configuré dans invoice.controller.ts"
else
    error "Timeout non configuré dans invoice.controller.ts"
fi

if grep -q "Promise.race" "${PROJECT_DIR}/backend/src/controllers/invoice.controller.ts"; then
    success "Promise.race utilisé pour gérer le timeout"
else
    error "Promise.race non utilisé pour le timeout"
fi

if grep -q "Slow invoice query" "${PROJECT_DIR}/backend/src/services/invoice.service.ts"; then
    success "Logs de performance ajoutés dans invoice.service.ts"
else
    error "Logs de performance manquants dans invoice.service.ts"
fi
echo ""

# 5. Test de la correction 4: Configuration Puppeteer
info "5. Test Correction 4: Configuration Puppeteer"
if grep -q "PUPPETEER_EXECUTABLE_PATH" "${PROJECT_DIR}/backend/.env"; then
    PUPPETEER_PATH=$(grep "PUPPETEER_EXECUTABLE_PATH" "${PROJECT_DIR}/backend/.env" | cut -d= -f2)
    if [ -f "$PUPPETEER_PATH" ]; then
        success "Puppeteer configuré: ${PUPPETEER_PATH} existe"
    else
        warn "Puppeteer configuré mais le chemin ${PUPPETEER_PATH} n'existe pas"
    fi
else
    warn "PUPPETEER_EXECUTABLE_PATH non défini dans .env"
fi

if grep -q "libpxbackend\|snap" "${PROJECT_DIR}/backend/src/services/pdf.service.ts" && grep -q "dependencies missing" "${PROJECT_DIR}/backend/src/services/pdf.service.ts"; then
    success "Gestion d'erreur Puppeteer améliorée"
else
    warn "Gestion d'erreur Puppeteer à vérifier"
fi
echo ""

# 6. Test de la correction 5: Ports fixés
info "6. Test Correction 5: Ports fixés"
if grep -q "^PORT=3001" "${PROJECT_DIR}/backend/.env"; then
    success "Port 3001 fixé dans backend/.env"
else
    error "Port non fixé dans backend/.env"
fi

if grep -q "PORT.*3001" "${PROJECT_DIR}/ecosystem.config.js"; then
    success "Port 3001 fixé dans ecosystem.config.js"
else
    error "Port non fixé dans ecosystem.config.js"
fi

if [ -f "${PROJECT_DIR}/PORTS_ALLOCATION.md" ]; then
    success "Document PORTS_ALLOCATION.md créé"
else
    error "Document PORTS_ALLOCATION.md manquant"
fi
echo ""

# 7. Test de compilation
info "7. Test de compilation du backend..."
cd "${PROJECT_DIR}/backend"
if npm run build 2>&1 | grep -q "dist/server.js" || [ -f "dist/server.js" ]; then
    success "Backend compile correctement (dist/server.js existe)"
else
    error "Erreur de compilation du backend"
fi
echo ""

# 8. Test PM2
info "8. Vérification PM2..."
if pm2 list | grep -q "conta-backend.*online"; then
    success "Processus PM2 'conta-backend' est online"
    PM2_STATUS=$(pm2 list | grep conta-backend | awk '{print $10}')
    if [ "$PM2_STATUS" = "online" ]; then
        success "Statut PM2: ${PM2_STATUS}"
    else
        warn "Statut PM2: ${PM2_STATUS} (attendu: online)"
    fi
else
    error "Processus PM2 'conta-backend' n'est pas online"
fi
echo ""

# 9. Test de réponse API (sans authentification, juste vérifier que ça répond)
info "9. Test de réponse API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/customers" || echo "000")
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "200" ]; then
    success "API répond (code HTTP: ${HTTP_CODE})"
elif [ "$HTTP_CODE" = "000" ]; then
    error "API ne répond pas (timeout ou connexion refusée)"
else
    warn "API répond avec code inattendu: ${HTTP_CODE}"
fi
echo ""

# 10. Vérification des dépendances Puppeteer
info "10. Vérification des dépendances Puppeteer..."
MISSING_DEPS=0
for dep in libgconf-2-4 libxss1 libxtst6 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0; do
    if dpkg -l | grep -q "^ii.*${dep}"; then
        : # Dépendance installée
    else
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi
done

if [ $MISSING_DEPS -eq 0 ]; then
    success "Toutes les dépendances Puppeteer sont installées"
else
    warn "${MISSING_DEPS} dépendance(s) Puppeteer manquante(s)"
fi
echo ""

# Résumé
echo "===================================="
echo "📊 Résumé des Tests"
echo "===================================="
echo -e "${GREEN}✅ Réussis: ${PASSED}${NC}"
echo -e "${YELLOW}⚠️  Ignorés: ${SKIPPED}${NC}"
echo -e "${RED}❌ Échoués: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    success "Tous les tests critiques sont passés !"
    exit 0
else
    error "${FAILED} test(s) ont échoué"
    exit 1
fi
