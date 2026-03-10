#!/bin/bash

# Script de validation globale pour Conta
set -e

echo "--- Démarrage de la validation globale ---"

echo "1. Validation Backend..."
cd /home/conta/conta.cd-prod/backend
npm run build
echo "✅ Backend OK"

echo "2. Validation Frontend..."
cd /home/conta/conta.cd-prod/frontend
npm run build
sudo systemctl reload nginx
echo "✅ Frontend OK (Nginx rechargé)"

echo "--- Validation terminée avec succès ! ---"
