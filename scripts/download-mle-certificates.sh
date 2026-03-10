
#!/bin/bash

# Script pour télécharger les certificats MLE depuis le dashboard Visa Developer Platform
# 
# Usage:
#   ./download-mle-certificates.sh
#
# Prérequis:
#   - Être connecté au dashboard Visa Developer Platform
#   - Avoir un projet Visa Direct avec MLE configuré
#   - Avoir les credentials (Key ID, etc.)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VISA_KEYS_DIR="$PROJECT_ROOT/visa-keys"

# Créer le répertoire si nécessaire
mkdir -p "$VISA_KEYS_DIR"

echo "🔐 Script de téléchargement des certificats MLE Visa Direct"
echo "============================================================"
echo ""

# Instructions pour l'utilisateur
echo "📋 Instructions:"
echo "1. Connectez-vous au dashboard Visa Developer Platform"
echo "2. Allez dans votre projet Visa Direct"
echo "3. Naviguez vers: Credentials → Message Level Encryption"
echo "4. Téléchargez les certificats suivants:"
echo "   - Client Certificate (contient la clé privée client)"
echo "   - Server Certificate (contient la clé publique Visa)"
echo ""
echo "5. Placez les fichiers téléchargés dans: $VISA_KEYS_DIR"
echo ""
echo "Fichiers attendus:"
echo "  - client_certificate.pem (ou .crt)"
echo "  - server_certificate.pem (ou .crt)"
echo ""
read -p "Appuyez sur Entrée une fois les fichiers téléchargés et placés dans $VISA_KEYS_DIR..."

# Vérifier la présence des fichiers
CLIENT_CERT=""
SERVER_CERT=""

for file in "$VISA_KEYS_DIR"/*.pem "$VISA_KEYS_DIR"/*.crt; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    if [[ "$filename" == *"client"* ]] || [[ "$filename" == *"Client"* ]]; then
      CLIENT_CERT="$file"
    elif [[ "$filename" == *"server"* ]] || [[ "$filename" == *"Server"* ]]; then
      SERVER_CERT="$file"
    fi
  fi
done

if [ -z "$CLIENT_CERT" ] || [ -z "$SERVER_CERT" ]; then
  echo "❌ Erreur: Certificats non trouvés"
  echo ""
  echo "Fichiers trouvés dans $VISA_KEYS_DIR:"
  ls -la "$VISA_KEYS_DIR"/*.pem "$VISA_KEYS_DIR"/*.crt 2>/dev/null || echo "Aucun fichier .pem ou .crt trouvé"
  echo ""
  echo "Veuillez télécharger les certificats depuis le dashboard et les placer dans $VISA_KEYS_DIR"
  exit 1
fi

echo "✅ Certificats trouvés:"
echo "   Client: $CLIENT_CERT"
echo "   Server: $SERVER_CERT"
echo ""

# Extraire les clés des certificats
echo "🔑 Extraction des clés des certificats..."

# Extraire la clé privée du certificat client
if openssl x509 -in "$CLIENT_CERT" -noout -text > /dev/null 2>&1; then
  echo "   ✓ Certificat client valide"
  # Note: Le certificat client peut contenir la clé privée, mais généralement
  # la clé privée est dans un fichier séparé (.key)
  CLIENT_KEY="${CLIENT_CERT%.*}.key"
  if [ ! -f "$CLIENT_KEY" ]; then
    echo "   ⚠️  Clé privée client non trouvée. Elle doit être extraite séparément."
    echo "      Généralement, la clé privée est générée lors de la création du CSR."
  fi
fi

# Extraire la clé publique du certificat serveur (Visa)
if openssl x509 -in "$SERVER_CERT" -noout -text > /dev/null 2>&1; then
  echo "   ✓ Certificat serveur valide"
  # Extraire la clé publique
  openssl x509 -in "$SERVER_CERT" -pubkey -noout > "$VISA_KEYS_DIR/visa_server_public_key.pem" 2>/dev/null || true
  echo "   ✓ Clé publique Visa extraite: visa_server_public_key.pem"
fi

echo ""
echo "✅ Certificats MLE prêts!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Vérifiez que les clés sont correctement extraites"
echo "2. Configurez les clés dans CompanySettingsPage"
echo "3. Testez l'intégration avec l'environnement sandbox"
echo ""

