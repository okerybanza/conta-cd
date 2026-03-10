#!/bin/bash

# Script d'installation de Chromium pour Puppeteer
# Usage: ./install-chromium.sh

set -e

echo "🔧 Installation de Chromium pour Puppeteer..."

# Détecter le système d'exploitation
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Impossible de détecter le système d'exploitation"
    exit 1
fi

case $OS in
    ubuntu|debian)
        echo "📦 Installation sur Ubuntu/Debian..."
        sudo apt-get update
        sudo apt-get install -y chromium-browser
        echo "✅ Chromium installé: $(which chromium-browser)"
        ;;
    centos|rhel|fedora|almalinux)
        echo "📦 Installation sur CentOS/RHEL/Fedora/AlmaLinux..."
        if [ "$OS" = "fedora" ]; then
            sudo dnf install -y chromium
        else
            sudo yum install -y chromium
        fi
        # Sur AlmaLinux/RHEL, Chromium est dans /usr/bin/chromium-browser
        if [ -f "/usr/bin/chromium-browser" ]; then
            CHROMIUM_PATH="/usr/bin/chromium-browser"
        elif [ -f "/usr/bin/chromium" ]; then
            CHROMIUM_PATH="/usr/bin/chromium"
        else
            CHROMIUM_PATH=$(which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "")
        fi
        echo "✅ Chromium installé: $CHROMIUM_PATH"
        ;;
    *)
        echo "⚠️  Système non supporté automatiquement: $OS"
        echo "Veuillez installer Chromium manuellement:"
        echo "  - Ubuntu/Debian: sudo apt-get install -y chromium-browser"
        echo "  - CentOS/RHEL: sudo yum install -y chromium"
        echo "  - Fedora: sudo dnf install -y chromium"
        exit 1
        ;;
esac

# Vérifier l'installation
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_PATH=$(which chromium-browser)
elif command -v chromium &> /dev/null; then
    CHROMIUM_PATH=$(which chromium)
else
    echo "❌ Chromium non trouvé après installation"
    exit 1
fi

echo ""
echo "✅ Installation terminée!"
echo ""
echo "📝 Ajoutez dans votre fichier .env:"
echo "   PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH"
echo ""
echo "🧪 Test de Puppeteer:"
echo "   cd backend && node -e \"const p=require('puppeteer');(async()=>{const b=await p.launch({headless:true,args:['--no-sandbox']});console.log('✅ OK');await b.close();})();\""

