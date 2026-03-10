# 01_STACK — Architecture & Dépendances

## Architecture générale

| Dimension | Valeur |
|-----------|--------|
| Type | Monorepo (3 packages indépendants : `backend/`, `frontend/`, `database/`) |
| Gestionnaire de packages | npm (backend) / npm (frontend) |
| Langage | TypeScript 5.3.3 (backend + frontend) |

---

## Backend

### Versions des dépendances principales

| Package | Version déclarée |
|---------|-----------------|
| express | ^4.18.2 |
| typescript | ^5.3.3 |
| tsx (dev runner) | ^4.7.0 |
| @prisma/client | ^5.22.0 |
| prisma (CLI, devDep) | ^5.7.1 |
| jsonwebtoken | ^9.0.2 |
| jose | ^6.1.3 |
| bcrypt | ^5.1.1 |
| ioredis | ^5.3.2 |
| bullmq | ^5.1.1 |
| node-cron | ^4.2.1 |
| nodemailer | ^6.9.7 |
| axios | ^1.13.3 |
| @paypal/paypal-server-sdk | ^2.1.0 |
| puppeteer | ^21.6.1 |
| handlebars | ^4.7.8 |
| helmet | ^7.1.0 |
| cors | ^2.8.5 |
| express-rate-limit | ^7.1.5 |
| express-validator | ^7.0.1 |
| multer | ^1.4.5-lts.1 |
| speakeasy | ^2.0.0 |
| qrcode | ^1.5.3 |
| sharp | ^0.33.1 |
| uuid | ^13.0.0 |
| winston | ^3.11.0 |
| zod | ^3.22.4 |
| xml2js | ^0.6.2 |
| cheerio | ^1.2.0 |
| date-fns | ^4.1.0 |

### Runtime & Build

| Élément | Valeur |
|---------|--------|
| Entrée dev | `tsx watch src/server.ts` |
| Build | `tsc` → `dist/server.js` |
| Entrée prod | `node dist/server.js` |
| Framework test | Jest 29.7.0 + ts-jest 29.4.5 |
| Linter | ESLint 8.56.0 + @typescript-eslint/parser 6.17.0 |

---

## Frontend

### Versions des dépendances principales

| Package | Version déclarée |
|---------|-----------------|
| react | ^18.2.0 |
| react-dom | ^18.2.0 |
| react-router-dom | ^6.21.1 |
| vite | ^5.0.8 |
| typescript | ^5.3.3 |
| tailwindcss | ^3.3.6 |
| zustand | ^4.4.7 |
| axios | ^1.6.2 |
| react-hook-form | ^7.49.2 |
| @hookform/resolvers | ^3.3.2 |
| yup | ^1.3.3 |
| lucide-react | ^0.554.0 |
| recharts | ^2.15.4 |
| @headlessui/react | ^1.7.17 |
| date-fns | ^3.0.6 |
| clsx | ^2.0.0 |

### Build

| Élément | Valeur |
|---------|--------|
| Dev | `vite` |
| Build | `tsc && vite build` |
| Preview | `vite preview --port 3000 --host 0.0.0.0` |
| Module type | ESM (`"type": "module"`) |

---

## PM2 — ecosystem.config.js

| Paramètre | Valeur |
|-----------|--------|
| App name | `conta-backend` |
| Script | `./backend/dist/server.js` |
| CWD | `/home/conta/conta.cd-prod` |
| Instances | `1` |
| Exec mode | `fork` |
| PORT prod | `3001` (fixé dans env PM2) |
| NODE_ENV | `production` |
| max_memory_restart | `1G` |
| autorestart | `true` |
| watch | `false` |
| error_file | `./logs/backend-error.log` |
| out_file | `./logs/backend-out.log` |

### Ports utilisés

| Service | Port |
|---------|------|
| Backend API | 3001 |
| Frontend dev (Vite) | 3000 |
| Redis (défaut) | 6379 |
| PostgreSQL (défaut) | 5432 |

---

## Base de données

| Paramètre | Valeur |
|-----------|--------|
| Nom | Déterminé par `DATABASE_URL` (variable d'environnement) |
| Provider Prisma | `postgresql` |
| Schema Prisma | `database/prisma/schema.prisma` |
| Output client | `../../backend/node_modules/.prisma/client` |
| Preview features | `views` |
| Nombre de modèles | 58 modèles |
| Nombre de vues | 1 (`account_balances_view`) |
| Nombre d'enums | 1 (`AccountType`) |
| Serveur de lecture optionnel | `DATABASE_READ_URL` |

---

## Cache — Redis

| Paramètre | Valeur |
|-----------|--------|
| Client | ioredis 5.3.2 |
| Activé par défaut | NON (désactivé si `REDIS_DISABLED=true` ou variables absentes) |
| Activation via URL | `REDIS_URL` (ex: `redis://localhost:6379`) |
| Activation via host | `REDIS_ENABLED=true` + `REDIS_HOST` + `REDIS_PORT` + `REDIS_PASSWORD` |
| Port par défaut | 6379 |
| Retry strategy | délai = min(attempts × 50ms, 2000ms) |
| maxRetriesPerRequest | 3 |
| lazyConnect | true (connexion uniquement à la première commande) |
| Usage | Cache invalidation, BullMQ (queue), revocation des sessions JWT |

---

## Auth — Stratégies utilisées

| Stratégie | Détail |
|-----------|--------|
| Authentification principale | JWT (jsonwebtoken 9.0.2) via header `Authorization: Bearer <token>` |
| Access token | durée par défaut `15m` (configurable via `JWT_EXPIRES_IN`) |
| Refresh token | durée par défaut `7d` (configurable via `JWT_REFRESH_EXPIRES_IN`) |
| Token revocation | via `jti` (JWT ID), état stocké en Redis (`revocation.service.ts`) |
| Hachage password | bcrypt, `BCRYPT_ROUNDS` (défaut : 10) |
| 2FA | TOTP via speakeasy 2.0.0 + codes de backup |
| CSRF | middleware `csrf.middleware.ts` présent |
| Cookies | middleware `cookie.middleware.ts` présent |
| Rate limiting auth | 10 tentatives/heure par IP sur `/api/v1/auth/login` |
| Rate limiting global | 100 req/15min par IP sur `/api/` |
| Roles | `manager`, `owner`, `employee`, `rh`, `accountant`, `super_admin`, `conta_user` (défaut: `manager`) |
| Verrouillage compte | champ `locked_until` en base |
| Vérification email | token + expiration en base |
| JWE/JWS | service `jwe-jws.service.ts` présent (usage NON DÉTERMINABLE depuis le code sans lecture approfondie) |

---

## Services externes connectés

| Service | Intégration | Fichiers |
|---------|-------------|---------|
| **PayPal** | SDK officiel `@paypal/paypal-server-sdk ^2.1.0` | `services/paypal.service.ts`, `controllers/paypal.controller.ts`, `routes/paypal.routes.ts` |
| **VisaPay** | Intégration custom via axios (API propre) | `services/` (référencé dans `companies` schema), `pages/payments/VisapayReturnPage.tsx`, `VisapayCardCollectionPage.tsx`, frontend `services/visapay.service.ts` |
| **MaxiCash** | Champs de config en base (`maxicash_*` sur `companies`) | NON DÉTERMINABLE (aucun service backend trouvé dans les fichiers listés) |
| **WhatsApp** | Meta API Cloud (`meta.provider.ts`) | `services/whatsapp/whatsapp.service.ts`, `services/whatsapp/providers/meta.provider.ts`, scripts de génération de token (`generate-whatsapp-token*.js`) |
| **SMTP Email** | nodemailer 6.9.7 | `services/email.service.ts`, config via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| **BCC API** | Taux de change BCC (Banque Centrale du Congo) | `services/currency/providers/bcc.provider.ts`, URL `https://www.bcc.cd/api/v1/rates` |
| **ECB** | Taux de change BCE (Banque Centrale Européenne) | `services/currency/providers/ecb.provider.ts` |
| **Redis** | ioredis | Cache, queues BullMQ, revocation JWT |
| **PostgreSQL** | Prisma | Base de données principale |

---

## Variables d'environnement clés (backend)

| Variable | Défaut | Usage |
|----------|--------|-------|
| `PORT` | 3001 | Port du serveur Express |
| `DATABASE_URL` | — | URL PostgreSQL |
| `DATABASE_READ_URL` | — | Réplica lecture (optionnel) |
| `JWT_SECRET` | `secret` | Signer les access tokens |
| `JWT_REFRESH_SECRET` | `refresh_secret` | Signer les refresh tokens |
| `JWT_EXPIRES_IN` | `15m` | Durée access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Durée refresh token |
| `REDIS_URL` | `redis://localhost:6379` | Redis (si `REDIS_ENABLED=true`) |
| `REDIS_DISABLED` | — | Désactiver Redis explicitement |
| `CORS_ORIGIN` | `http://localhost:3000` | Origine CORS autorisée |
| `FRONTEND_URL` | `http://localhost:3000` | URL du frontend |
| `SMTP_HOST` | `localhost` | Serveur SMTP |
| `WHATSAPP_API_URL` | — | URL API WhatsApp Meta |
| `WHATSAPP_API_TOKEN` | — | Token WhatsApp Meta |
| `BCC_API_URL` | `https://www.bcc.cd/api/v1/rates` | API BCC taux de change |
