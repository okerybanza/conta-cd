# 📄 Conta - Application de Facturation SaaS

Application SaaS complète de gestion de facturation pour entrepreneurs en République Démocratique du Congo (RDC).

## 📚 Documentation

**⚠️ IMPORTANT:** Pour la documentation complète et à jour de l'application, consultez **[DOCUMENTATION_COMPLETE.md](./DOCUMENTATION_COMPLETE.md)**. Ce fichier est la source unique de vérité et est mis à jour à chaque modification importante.

Pour les documents techniques détaillés, consultez:
- `/apres-audit/README.md` - Documentation fondamentale (DOC-01, DOC-02, DOC-03)
- `/Docs/` - Documentation technique et guides

## 🎯 Vue d'ensemble

Conta est une application web moderne permettant de gérer :
- **Clients** : Gestion complète de la base clients (particuliers et entreprises)
- **Articles** : Catalogue produits/services avec gestion de stock
- **Factures** : Création, édition, envoi de factures avec support factures RDC normalisées
- **Paiements** : Enregistrement et suivi des paiements
- **Notifications** : Envoi automatique d'emails et SMS
- **Dashboard** : Statistiques et graphiques en temps réel
- **Rapports** : Rapports détaillés avec exports CSV
- **Audit** : Traçabilité complète des actions

## 🚀 Technologies

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **JWT** pour l'authentification
- **Puppeteer** pour génération PDF
- **Nodemailer** pour emails
- **BullMQ** pour queues
- **Handlebars** pour templates

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **React Router** pour navigation
- **Zustand** pour state management
- **Tailwind CSS** pour styling
- **Recharts** pour graphiques
- **Axios** pour API calls

## 📋 Prérequis

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **Redis** (optionnel, pour queues)
- **Chromium/Chrome** (pour génération PDF)

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd conta.cd
```

### 2. Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp ../env.example .env

# Éditer .env avec vos configurations
nano .env

# Générer le client Prisma
npm run prisma:generate

# Exécuter les migrations
npm run prisma:migrate
```

### 3. Configuration Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos configurations
nano .env
```

### 4. Configuration Base de Données

Créer une base de données PostgreSQL :

```sql
CREATE DATABASE conta_db;
CREATE USER conta_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE conta_db TO conta_user;
```

### 5. Configuration Variables d'Environnement

#### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://conta_user:password@localhost:5432/conta_db

# JWT
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
JWT_REFRESH_SECRET=votre_secret_refresh_jwt

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Email (SMTP)
# Serveur SMTP: mail.kazurihost.com
# Port SSL/TLS: 465 (recommandé) ou 25 (non-SSL, non recommandé)
SMTP_HOST=mail.kazurihost.com
SMTP_PORT=465
SMTP_USER=votre_email@conta.cd
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=noreply@conta.cd
# Email spécifique pour les factures (optionnel)
SMTP_INVOICE_FROM=facture@conta.cd
# Email spécifique pour les notifications (optionnel)
SMTP_NOTIF_FROM=notifications@conta.cd

# SMS (Africa's Talking)
SMS_API_KEY=votre_api_key
SMS_USERNAME=votre_username
SMS_SENDER_ID=CONTA

# Redis (optionnel, pour les queues d'emails et SMS)
# Redis est DÉSACTIVÉ par défaut. Pour l'activer:
# Option 1: Utiliser REDIS_URL (recommandé)
REDIS_URL=redis://localhost:6379
# Option 2: Utiliser les paramètres individuels (définir REDIS_ENABLED=true)
# REDIS_ENABLED=true
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# Encryption
ENCRYPTION_KEY=votre_cle_64_caracteres_hex
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## 🏃 Démarrage

### Mode Développement

#### Backend

```bash
cd backend
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

#### Frontend

```bash
cd frontend
npm run dev
```

L'application démarre sur `http://localhost:3000`

### Mode Production

#### Backend

```bash
cd backend
npm run build
npm start
```

#### Frontend

```bash
cd frontend
npm run build
# Servir le dossier dist/ avec un serveur web (nginx, apache, etc.)
```

## 📁 Structure du Projet

```
conta.cd/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Controllers API
│   │   ├── middleware/     # Middlewares
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services métier
│   │   ├── templates/      # Templates email/facture
│   │   ├── utils/          # Utilitaires
│   │   └── server.ts       # Point d'entrée
│   ├── prisma/             # Schéma Prisma
│   └── package.json
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   ├── store/          # State management
│   │   └── App.tsx         # Point d'entrée
│   └── package.json
├── database/               # Scripts base de données
├── docs/                   # Documentation
└── README.md
```

## 🔐 Sécurité

- **Authentification JWT** avec refresh tokens
- **2FA** (Authentification à deux facteurs)
- **Chiffrement** des données sensibles (AES-256-GCM)
- **Audit trail** complet
- **Rate limiting** sur les endpoints sensibles
- **Validation** stricte des inputs (Zod)
- **Helmet.js** pour sécuriser les headers HTTP

## 📊 Fonctionnalités Principales

### Gestion Clients
- Création/édition clients (particuliers et entreprises)
- Identifiants fiscaux (NIF, RCCM)
- Historique factures et paiements
- Statistiques par client

### Gestion Articles
- Catalogue produits/services
- Gestion de stock (optionnel)
- Catégories et tags
- Prix et taxes configurables

### Facturation
- Création factures avec lignes multiples
- Calcul automatique (HT, TVA, TTC)
- Templates personnalisables
- Factures RDC normalisées avec QR code
- Génération PDF
- Numérotation automatique

### Paiements
- Enregistrement paiements
- Méthodes multiples (espèces, mobile money, virement, etc.)
- Mise à jour automatique statut facture
- Suivi solde restant

### Notifications
- Emails automatiques (factures, paiements, rappels)
- SMS via Africa's Talking
- Templates personnalisables
- Queue system (BullMQ)

### Dashboard & Rapports
- Statistiques en temps réel
- Graphiques interactifs
- Rapports détaillés
- Exports CSV
- Journal comptable

### Paramètres
- Configuration entreprise
- Paramètres factures
- Paramètres utilisateur
- Upload logo

## 🧪 Tests

```bash
# Backend - Tests unitaires
cd backend
npm test

# Backend - Test connexion SMTP
npm run test:smtp

# Backend - Vérifier configuration
npm run check:config

# Frontend
cd frontend
npm test
```

## 📚 Documentation API

L'API est documentée avec les endpoints suivants :

- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `GET /api/v1/customers` - Liste clients
- `GET /api/v1/invoices` - Liste factures
- `GET /api/v1/payments` - Liste paiements
- `GET /api/v1/dashboard/stats` - Statistiques dashboard
- `GET /api/v1/reports/*` - Rapports
- `GET /api/v1/audit` - Logs d'audit

Voir `docs/API.md` pour la documentation complète.

## 🚢 Déploiement

### Préparation Production

1. **Variables d'environnement** : Configurer toutes les variables en production
2. **Base de données** : Créer la base de données et exécuter les migrations
3. **SSL/HTTPS** : Configurer certificat SSL
4. **Nginx** : Configurer reverse proxy
5. **PM2** : Utiliser PM2 pour gérer le processus Node.js

### Exemple Configuration Nginx

```nginx
server {
    listen 80;
    server_name conta.cd;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name conta.cd;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /path/to/uploads;
    }
}
```

## 🐛 Dépannage

### Problèmes courants

**Erreur connexion base de données**
- Vérifier DATABASE_URL dans .env
- Vérifier que PostgreSQL est démarré
- Vérifier les permissions utilisateur

**Erreur génération PDF**
- Installer Chromium : `sudo yum install chromium` (AlmaLinux/RHEL)
- Configurer PUPPETEER_EXECUTABLE_PATH dans .env

**Erreur envoi email**
- Vérifier configuration SMTP dans .env
- Tester connexion SMTP : `npm run test:smtp` (dans backend/)
- Vérifier la configuration : `npm run check:config` (dans backend/)
- Vérifier que SMTP_HOST, SMTP_PORT, SMTP_USER et SMTP_PASS sont corrects
- Pour les factures, vérifier SMTP_INVOICE_FROM
- Pour les notifications, vérifier SMTP_NOTIF_FROM

**Erreur envoi SMS**
- Vérifier credentials Africa's Talking
- Vérifier format numéros téléphone (+243...)

## 📝 Licence

Propriétaire - Tous droits réservés

## 👥 Support

Pour toute question ou problème :
- Email : support@conta.cd
- Documentation : Voir dossier `docs/`

## 🎉 Remerciements

Application développée pour les entrepreneurs en RDC.

---

## 📚 DOCUMENTATION MIGRATION

### Pour reprendre la migration
- **`ETAT_ACTUEL_MIGRATION.md`** ⭐ - **ÉTAT COMPLET ACTUEL** (à lire en premier)
- **`QUICK_START.md`** - Guide rapide pour reprendre
- **`RESUMÉ_POUR_NOUVEAU_CHAT.txt`** - Résumé ultra-court

### Documentation générale
- **`GUIDE_DEPLOIEMENT.md`** - Guide complet de déploiement
- **`STATUT_MIGRATION.md`** - Statut détaillé
- **`INSTRUCTIONS_RECUPERATION.md`** - Instructions pour récupérer les données

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2025
