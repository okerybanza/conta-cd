# Configuration Puppeteer pour Conta

## 🎯 Solutions pour Puppeteer

Puppeteer nécessite Chrome/Chromium pour générer des PDF. Voici plusieurs solutions selon votre environnement.

---

## Solution 1 : Installation Chromium système (Recommandé)

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

### CentOS/RHEL
```bash
sudo yum install -y chromium
```

### Vérifier l'installation
```bash
chromium-browser --version
# ou
chromium --version
```

### Configurer le chemin (optionnel)
Si Chromium est installé dans un emplacement non standard, définir la variable d'environnement :

```bash
# Dans .env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## Solution 2 : Utiliser Google Chrome

### Installation Google Chrome
```bash
# Ubuntu/Debian
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb

# CentOS/RHEL
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum install ./google-chrome-stable_current_x86_64.rpm
```

### Configurer le chemin
```bash
# Dans .env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

---

## Solution 3 : Docker avec Chromium

Si vous utilisez Docker, ajouter Chromium dans votre Dockerfile :

```dockerfile
FROM node:20-slim

# Installer Chromium et dépendances
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Configurer Puppeteer pour utiliser Chromium système
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]
```

---

## Solution 4 : Utiliser Puppeteer avec Chrome inclus

Par défaut, Puppeteer télécharge Chrome automatiquement. Si vous préférez cette approche :

```bash
# Dans le répertoire backend
npm install puppeteer
```

Le Chrome sera téléchargé dans `node_modules/.cache/puppeteer/`.

**Note :** Cette méthode est plus lourde (~300MB) mais fonctionne partout.

---

## Solution 5 : Alternative légère avec pdfkit (Fallback)

Si Puppeteer pose problème, on peut utiliser pdfkit comme solution de fallback. Cependant, pdfkit ne supporte pas le rendu HTML/CSS complet.

---

## 🔧 Configuration dans .env

Ajouter dans `backend/.env` :

```env
# Chemin vers Chrome/Chromium (optionnel, auto-détecté si non défini)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Timeout pour génération PDF (en ms)
PUPPETEER_TIMEOUT=30000
```

---

## ✅ Vérification

Tester la génération PDF :

```bash
# Dans le répertoire backend
node -e "
const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Puppeteer fonctionne correctement!');
    await browser.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
})();
"
```

---

## 🐛 Dépannage

### Erreur : "Could not find Chrome"
- Installer Chromium : `sudo apt-get install -y chromium-browser`
- Ou définir `PUPPETEER_EXECUTABLE_PATH` dans `.env`

### Erreur : "Failed to launch the browser process"
- Vérifier les permissions
- Ajouter `--no-sandbox` dans les args (déjà fait)
- Vérifier que Chromium est bien installé

### Erreur : "Navigation timeout"
- Augmenter le timeout dans le code
- Vérifier la connexion réseau si le HTML charge des ressources externes

### Performance lente
- Réutiliser l'instance de navigateur (déjà implémenté)
- Désactiver les images si non nécessaires
- Utiliser un cache pour les PDF générés

---

## 📝 Notes

- Le service PDF réutilise maintenant une instance de navigateur pour améliorer les performances
- Le navigateur est fermé automatiquement à l'arrêt de l'application
- Les chemins Chromium sont auto-détectés si `PUPPETEER_EXECUTABLE_PATH` n'est pas défini

---

**Dernière mise à jour :** 22 Novembre 2025

