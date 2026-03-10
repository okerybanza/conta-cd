#!/bin/bash

# Guide interactif pour la configuration Visa Developer Platform

echo "🚀 Guide de Configuration Visa Developer Platform"
echo "=================================================="
echo ""

echo "📋 Ce script va vous guider pour compléter la configuration Visa."
echo ""

# Étape 1: Vérifier les clés RSA
echo "1️⃣  Vérification des clés RSA..."
if [ -f "visa-keys/visapay_public_key.pem" ]; then
    echo "   ✅ Clés RSA trouvées"
    echo ""
    echo "   📝 PROCHAINE ÉTAPE:"
    echo "   1. Aller dans le dashboard Visa: https://developer.visa.com/portal/app/v2/a0542faa-542f-4dd6-9fa1-f05b3848db99/SBX"
    echo "   2. Naviguer vers: X-Pay Token"
    echo "   3. Copier le contenu de visa-keys/visapay_public_key.pem"
    echo "   4. Coller dans le champ 'Public Key'"
    echo "   5. Cliquer sur 'Submit'"
    echo "   6. Une fois acceptée, copier le Shared Secret chiffré"
    echo "   7. Sauvegarder dans visa-keys/shared_secret_encrypted.txt"
    echo "   8. Exécuter: cd visa-keys && ./decrypt_shared_secret.sh shared_secret_encrypted.txt"
    echo ""
else
    echo "   ❌ Clés RSA non trouvées"
    echo "   Génération des clés..."
    cd visa-keys
    openssl genrsa -out visapay_private_key.pem 2048
    openssl rsa -in visapay_private_key.pem -pubout -out visapay_public_key.pem
    echo "   ✅ Clés générées!"
    echo ""
    echo "   📝 PROCHAINE ÉTAPE: Voir les instructions ci-dessus"
    echo ""
fi

# Étape 2: Vérifier les certificats MLE
echo "2️⃣  Vérification des certificats MLE..."
if [ -f "visa-keys/client_certificate.p12" ] || [ -f "visa-keys/client_certificate.pem" ]; then
    echo "   ✅ Certificat client trouvé"
else
    echo "   ⏳ Certificat client non trouvé"
    echo ""
    echo "   📝 PROCHAINE ÉTAPE:"
    echo "   1. Aller dans le dashboard Visa → Message Level Encryption"
    echo "   2. Télécharger le 'Client Certificate'"
    echo "   3. Télécharger le 'Server Certificate'"
    echo "   4. Placer les fichiers dans visa-keys/"
    echo "   5. Exécuter: cd visa-keys && ./extract_mle_certificates.sh"
    echo ""
fi

if [ -f "visa-keys/server_certificate.pem" ] || [ -f "visa-keys/server_certificate.crt" ]; then
    echo "   ✅ Certificat serveur trouvé"
else
    echo "   ⏳ Certificat serveur non trouvé"
    echo ""
    echo "   📝 PROCHAINE ÉTAPE: Voir les instructions ci-dessus"
    echo ""
fi

# Étape 3: Résumé
echo "3️⃣  Résumé de la configuration:"
echo ""
echo "   ✅ Two-Way SSL: Configuré"
echo "   ⏳ X-Pay Token Shared Secret: À obtenir"
echo "   ⏳ Certificats MLE: À télécharger et extraire"
echo "   ⏳ Endpoints API: À identifier dans l'API Reference"
echo ""
echo "📚 Documentation:"
echo "   - Checklist: VISA_CONFIGURATION_CHECKLIST.md"
echo "   - Credentials: VISA_PROJECT_CREDENTIALS.md"
echo "   - Guide JWE/JWS: VISA_JWE_JWS_GUIDE.md"
echo ""

