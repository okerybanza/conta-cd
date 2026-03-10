#!/bin/bash

# Script de test pour l'intégration Visa Direct en sandbox
# Usage: ./test-visapay-sandbox.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🧪 Test de l'intégration Visa Direct Sandbox"
echo "============================================"
echo ""

# Vérifier que les variables d'environnement sont définies
if [ -z "$VISA_API_KEY" ] || [ -z "$VISA_SHARED_SECRET" ]; then
  echo "⚠️  Variables d'environnement manquantes"
  echo ""
  echo "Définissez les variables suivantes:"
  echo "  export VISA_API_KEY='votre_api_key'"
  echo "  export VISA_SHARED_SECRET='votre_shared_secret'"
  echo ""
  echo "Ou créez un fichier .env.test avec:"
  echo "  VISA_API_KEY=votre_api_key"
  echo "  VISA_SHARED_SECRET=votre_shared_secret"
  echo ""
  exit 1
fi

VISA_API_KEY="${VISA_API_KEY}"
VISA_SHARED_SECRET="${VISA_SHARED_SECRET}"
VISA_BASE_URL="https://sandbox.api.visa.com"

echo "📋 Configuration:"
echo "   API Key: ${VISA_API_KEY:0:10}..."
echo "   Base URL: $VISA_BASE_URL"
echo ""

# Fonction pour générer un X-Pay-Token
generate_x_pay_token() {
  local api_key="$1"
  local shared_secret="$2"
  local timestamp=$(date +%s)
  local data_to_hash="${api_key}${timestamp}${shared_secret}"
  local hash=$(echo -n "$data_to_hash" | openssl dgst -sha256 -binary | base64)
  echo "${api_key}:${timestamp}:${hash}" | base64
}

# Test 1: Génération du X-Pay-Token
echo "🔐 Test 1: Génération du X-Pay-Token"
echo "-----------------------------------"
X_PAY_TOKEN=$(generate_x_pay_token "$VISA_API_KEY" "$VISA_SHARED_SECRET")
echo "✅ X-Pay-Token généré: ${X_PAY_TOKEN:0:50}..."
echo ""

# Test 2: Vérification de la connectivité
echo "🌐 Test 2: Vérification de la connectivité"
echo "------------------------------------------"
if curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${VISA_BASE_URL}/visadirect/v1/querytransaction/test" > /dev/null 2>&1; then
  echo "✅ Connexion à l'API Visa réussie"
else
  echo "⚠️  Impossible de vérifier la connectivité (normal si l'endpoint nécessite une authentification)"
fi
echo ""

# Test 3: Test de requête PushFunds (simulation)
echo "💳 Test 3: Simulation de requête PushFunds"
echo "------------------------------------------"

# Générer des valeurs de test
RETRIEVAL_REF_NUMBER=$(date +%y%j%H%M%S | head -c 12)
SYSTEMS_TRACE_AUDIT_NUMBER=$(shuf -i 100000-999999 -n 1)

PAYLOAD=$(cat <<EOF
{
  "acquirerCountryCode": 840,
  "acquiringBin": 408999,
  "amount": "10.00",
  "businessApplicationId": "AA",
  "cardAcceptor": {
    "idCode": "CA-IDCode-77765",
    "name": "Visa Inc. VDP-CNP - CA 01",
    "terminalId": "TID-9999",
    "address": {
      "country": "USA",
      "zipCode": "94404"
    }
  },
  "localTransactionDateTime": "$(date -u +"%Y-%m-%dT%H:%M:%S")",
  "merchantCategoryCode": 6012,
  "pointOfServiceData": {
    "panEntryMode": "01",
    "posConditionCode": "00"
  },
  "recipientPrimaryAccountNumber": "4957030420210454",
  "retrievalReferenceNumber": "$RETRIEVAL_REF_NUMBER",
  "senderAccountNumber": "4957030420210454",
  "senderName": "John Doe",
  "senderReference": "TEST-REF-$(date +%s)",
  "systemsTraceAuditNumber": $SYSTEMS_TRACE_AUDIT_NUMBER,
  "transactionCurrencyCode": "USD"
}
EOF
)

echo "📤 Payload de test:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

echo "⚠️  Note: Pour tester réellement PushFunds, utilisez l'API avec:"
echo "   curl -X POST ${VISA_BASE_URL}/visadirect/fundstransfer/v1/pushfundstransactions \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'x-pay-token: ${X_PAY_TOKEN}' \\"
echo "     -d '$PAYLOAD'"
echo ""

# Test 4: Test de Query API
echo "🔍 Test 4: Simulation de Query API"
echo "-----------------------------------"
echo "⚠️  Pour tester Query API, utilisez:"
echo "   curl -X GET ${VISA_BASE_URL}/visadirect/v1/querytransaction/{statusIdentifier} \\"
echo "     -H 'x-pay-token: ${X_PAY_TOKEN}'"
echo ""

# Test 5: Vérification des certificats MLE
echo "🔐 Test 5: Vérification des certificats MLE"
echo "--------------------------------------------"
VISA_KEYS_DIR="$PROJECT_ROOT/visa-keys"

if [ -d "$VISA_KEYS_DIR" ]; then
  echo "📁 Répertoire visa-keys trouvé"
  
  # Vérifier les certificats
  if [ -f "$VISA_KEYS_DIR/client_certificate.pem" ] || [ -f "$VISA_KEYS_DIR/client_certificate.p12" ]; then
    echo "✅ Certificat client trouvé"
  else
    echo "⚠️  Certificat client non trouvé"
  fi
  
  if [ -f "$VISA_KEYS_DIR/server_certificate.pem" ] || [ -f "$VISA_KEYS_DIR/server_certificate.crt" ]; then
    echo "✅ Certificat serveur trouvé"
  else
    echo "⚠️  Certificat serveur non trouvé"
  fi
  
  if [ -f "$VISA_KEYS_DIR/client_private_key.pem" ]; then
    echo "✅ Clé privée client trouvée"
  else
    echo "⚠️  Clé privée client non trouvée (exécutez extract_mle_certificates.sh)"
  fi
  
  if [ -f "$VISA_KEYS_DIR/visa_public_key.pem" ] || [ -f "$VISA_KEYS_DIR/visa_server_public_key.pem" ]; then
    echo "✅ Clé publique Visa trouvée"
  else
    echo "⚠️  Clé publique Visa non trouvée (exécutez extract_mle_certificates.sh)"
  fi
else
  echo "⚠️  Répertoire visa-keys non trouvé"
fi
echo ""

# Test 6: Cartes de test Visa
echo "💳 Test 6: Cartes de test Visa"
echo "-----------------------------"
echo "Cartes de test disponibles dans le dashboard Visa Developer Platform:"
echo "  - Voir section 'Test Data' dans le dashboard"
echo "  - Utilisez ces cartes pour tester les paiements"
echo ""

echo "✅ Tests de base terminés!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Testez l'initiation de paiement via l'interface web"
echo "2. Utilisez une carte de test pour un paiement réel"
echo "3. Vérifiez les webhooks dans les logs"
echo ""

