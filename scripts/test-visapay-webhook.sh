#!/bin/bash

# Script pour simuler un webhook Visa Direct
# Usage: ./test-visapay-webhook.sh [transactionId] [status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration par défaut
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/api/v1/webhooks/visapay}"
MERCHANT_ID="${MERCHANT_ID:-MERCHANT_123}"
TRANSACTION_ID="${1:-TXN-$(date +%s)}"
STATUS="${2:-success}"

echo "🔔 Simulation de webhook Visa Direct"
echo "===================================="
echo ""
echo "📋 Configuration:"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Merchant ID: $MERCHANT_ID"
echo "   Transaction ID: $TRANSACTION_ID"
echo "   Status: $STATUS"
echo ""

# Générer un payload de webhook
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
REFERENCE="INV-TEST-$(date +%s)"

PAYLOAD=$(cat <<EOF
{
  "merchantId": "$MERCHANT_ID",
  "transactionId": "$TRANSACTION_ID",
  "reference": "$REFERENCE",
  "amount": 100.00,
  "currency": "USD",
  "status": "$STATUS",
  "paymentMethod": "visa",
  "cardType": "Visa",
  "cardLast4": "1234",
  "timestamp": "$TIMESTAMP"
}
EOF
)

echo "📤 Payload du webhook:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

# Générer une signature HMAC (simulation)
# En production, Visa génère cette signature
SHARED_SECRET="${VISA_SHARED_SECRET:-test_secret}"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SHARED_SECRET" -binary | base64)

echo "🔐 Signature (HMAC SHA256):"
echo "   $SIGNATURE"
echo ""

# Ajouter la signature au payload
PAYLOAD_WITH_SIG=$(echo "$PAYLOAD" | jq ". + {\"signature\": \"$SIGNATURE\"}" 2>/dev/null || echo "$PAYLOAD")

echo "📨 Envoi du webhook..."
echo ""

# Envoyer le webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_WITH_SIG" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Réponse du serveur:"
echo "   HTTP Code: $HTTP_CODE"
echo "   Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Webhook traité avec succès!"
else
  echo "⚠️  Webhook retourné le code HTTP $HTTP_CODE"
fi

echo ""
echo "💡 Pour tester avec différents statuts:"
echo "   ./test-visapay-webhook.sh TXN-123 success"
echo "   ./test-visapay-webhook.sh TXN-456 failed"
echo "   ./test-visapay-webhook.sh TXN-789 pending"
echo ""

