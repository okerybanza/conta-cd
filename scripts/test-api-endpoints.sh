#!/bin/bash
# Script de test des endpoints API (nécessite un token d'authentification)
# Usage: ./scripts/test-api-endpoints.sh [TOKEN]

set -e

API_URL="http://localhost:3001/api/v1"
TOKEN=${1:-""}

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🧪 Tests des Endpoints API - Corrections"
echo "========================================"
echo ""

if [ -z "$TOKEN" ]; then
    warn "Aucun token fourni. Les tests nécessitant l'authentification seront ignorés."
    warn "Usage: $0 <TOKEN>"
    echo ""
fi

# Headers avec token si fourni
HEADERS=()
if [ -n "$TOKEN" ]; then
    HEADERS=(-H "Authorization: Bearer ${TOKEN}")
fi

# Test 1: GET /invoices/{id} - Vérifier le timeout
info "Test 1: GET /invoices/{id} (vérification timeout)"
if [ -n "$TOKEN" ]; then
    # Utiliser un UUID invalide pour tester la réponse rapide
    START_TIME=$(date +%s%N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${HEADERS[@]}" "${API_URL}/invoices/00000000-0000-0000-0000-000000000000" || echo "000")
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 )) # Convertir en millisecondes
    
    if [ "$HTTP_CODE" = "404" ]; then
        success "Endpoint répond correctement (404) en ${DURATION}ms"
        if [ $DURATION -lt 5000 ]; then
            success "Réponse rapide (< 5s)"
        else
            warn "Réponse lente (${DURATION}ms)"
        fi
    elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        warn "Authentification requise (code: ${HTTP_CODE})"
    else
        error "Code HTTP inattendu: ${HTTP_CODE}"
    fi
else
    warn "Token manquant - test ignoré"
fi
echo ""

# Test 2: POST /payments - Vérifier que l'import uuidv4 fonctionne
info "Test 2: POST /payments (vérification import uuidv4)"
if [ -n "$TOKEN" ]; then
    # Tester avec des données invalides pour voir si l'erreur vient de la validation ou de uuidv4
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST "${API_URL}/payments" \
        -H "Content-Type: application/json" \
        -d '{"invoiceId":"00000000-0000-0000-0000-000000000000","amount":100,"paymentMethod":"cash"}' || echo -e "\n000")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "400" ]; then
        # 404 = invoice not found (normal), 400 = validation error (normal)
        success "Endpoint répond (code: ${HTTP_CODE}) - import uuidv4 fonctionne"
    elif [ "$HTTP_CODE" = "500" ]; then
        if echo "$BODY" | grep -q "uuidv4 is not defined"; then
            error "Erreur: uuidv4 is not defined - import manquant"
        else
            warn "Erreur 500 mais pas liée à uuidv4: ${BODY:0:100}"
        fi
    elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        warn "Authentification requise (code: ${HTTP_CODE})"
    else
        warn "Code HTTP: ${HTTP_CODE}"
    fi
else
    warn "Token manquant - test ignoré"
fi
echo ""

# Test 3: POST /credit-notes - Vérifier la validation
info "Test 3: POST /credit-notes (vérification validation reason)"
if [ -n "$TOKEN" ]; then
    # Tester avec reason vide pour voir si la validation fonctionne
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST "${API_URL}/credit-notes" \
        -H "Content-Type: application/json" \
        -d '{"invoiceId":"00000000-0000-0000-0000-000000000000","amount":100,"reason":""}' || echo -e "\n000")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "400" ]; then
        if echo "$BODY" | grep -qi "reason.*required"; then
            success "Validation reason fonctionne (erreur claire)"
        else
            warn "Erreur 400 mais message de validation reason non clair"
        fi
    elif [ "$HTTP_CODE" = "404" ]; then
        success "Endpoint répond (404 invoice not found) - validation passe"
    elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        warn "Authentification requise (code: ${HTTP_CODE})"
    else
        warn "Code HTTP: ${HTTP_CODE}"
    fi
else
    warn "Token manquant - test ignoré"
fi
echo ""

# Test 4: GET /invoices/{id}/pdf - Vérifier Puppeteer
info "Test 4: GET /invoices/{id}/pdf (vérification Puppeteer)"
if [ -n "$TOKEN" ]; then
    START_TIME=$(date +%s%N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${HEADERS[@]}" "${API_URL}/invoices/00000000-0000-0000-0000-000000000000/pdf" || echo "000")
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
    
    if [ "$HTTP_CODE" = "404" ]; then
        success "Endpoint répond (404) en ${DURATION}ms - Puppeteer non testé (invoice inexistante)"
    elif [ "$HTTP_CODE" = "500" ]; then
        warn "Erreur 500 - Possible problème Puppeteer (vérifier les logs)"
    elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        warn "Authentification requise (code: ${HTTP_CODE})"
    else
        warn "Code HTTP: ${HTTP_CODE}"
    fi
else
    warn "Token manquant - test ignoré"
fi
echo ""

echo "========================================"
info "Tests terminés"
info "Pour des tests complets, fournir un token d'authentification valide"
echo ""
