# CONTA — MASTER CONTEXT
> **Fichier de référence unique pour Cursor.**
> Lire ce fichier EN ENTIER avant toute session de travail.
> Dernière mise à jour : Mars 2026
> ⚠️ Ce fichier fait autorité sur tout autre document.

---

## SECTION 0 — RÈGLE D'OR POUR CURSOR

Avant d'écrire la moindre ligne de code, répondre à ces 3 questions :
1. **Quel module est concerné ?** → Vérifier son statut dans la Section 4
2. **Quelle règle métier s'applique ?** → Vérifier la Section 3
3. **Y a-t-il une issue ouverte sur ce point ?** → Vérifier la Section 6

Si impossible de répondre aux 3 → **demander avant de coder.**

---

## SECTION 1 — QU'EST-CE QUE CONTA ?

**Conta** est une plateforme SaaS de gestion financière et comptable conçue pour l'Afrique Centrale.

**Différenciation clé (non négociable) :**
Les experts-comptables disposent d'un espace dédié depuis lequel ils gèrent l'ensemble de leurs clients entreprises — un seul login, toutes les sociétés accessibles, droits strictement délégués et révocables.

**Deux profils utilisateurs :**
- **Entreprise / PME** : gère sa comptabilité en autonomie (factures, dépenses, TVA, RH, stock, rapports)
- **Expert-Comptable** : gère tous ses clients depuis un tableau de bord consolidé, avec profil public et marketplace

**Marché cible :**
- Priorité absolue : RDC (Kinshasa, Lubumbashi, Goma)
- Extension planifiée : Congo-Brazzaville, Cameroun, Côte d'Ivoire

**Devises :**
- Principale : CDF (Franc Congolais)
- Secondaire : USD (réalité économique locale — les deux coexistent)
- La devise principale est verrouillée après datarissage mais USD reste toujours disponible comme devise de transaction secondaire.

**Paiements locaux :**
- VisaPay (mobile africain) — déjà intégré, avantage concurrentiel fort
- PayPal — déjà intégré

**"Datarissage" (terme propre à Conta) :**
Le datarissage est l'acte de naissance de l'entreprise dans le système.
C'est l'étape d'initialisation obligatoire qui configure les modules, les règles métier
et les choix structurants AVANT que l'entreprise puisse opérer.
Certains choix faits au datarissage sont VERROUILLÉS ensuite.
Voir DOC-01 pour le détail complet.

---

## SECTION 2 — ARCHITECTURE TECHNIQUE

### 2.1 Stack complète

| Couche | Technologie | Version |
|--------|-------------|---------|
| Backend | Node.js + Express + TypeScript | TS 5.3.3 |
| Frontend | React + Vite + TypeScript | React 18.2 |
| Base de données | PostgreSQL + Prisma ORM | Prisma 5.22 |
| Cache | Redis + ioredis | 5.3.2 |
| Queues | BullMQ | 5.1.1 |
| Auth | JWT + bcrypt + 2FA TOTP + JWE/JWS | JWT 9.0.2 |
| PDF | Puppeteer + Handlebars | Puppeteer 21 |
| CSS | Tailwind CSS | 3.3.6 |
| State management | Zustand | 4.4.7 |
| Formulaires | React Hook Form + Yup | RHF 7.49 |
| Process manager | PM2 (fork mode, 1 instance) | — |
| Tests | Jest + ts-jest + Playwright | Jest 29.7 |

### 2.2 Ports

| Service | Port |
|---------|------|
| Backend API | 3001 |
| Frontend dev (Vite) | 3000 |
| Redis | 6379 |
| PostgreSQL | 5432 |

### 2.3 Structure critique des dossiers

```
/home/conta/
├── conta.cd-dev/              ← Environnement DEV
│   ├── backend/dist/          ← Compilé seulement (⚠️ pas de src/ complet)
│   ├── frontend/dist/         ← Build React
│   └── database/prisma/       ← Migrations + schema
│
└── conta.cd-prod/             ← Environnement PROD (sources complètes ✅)
    ├── backend/src/            ← Sources TypeScript — TRAVAILLE ICI
    │   ├── controllers/
    │   ├── services/
    │   ├── routes/
    │   ├── middleware/
    │   ├── events/
    │   ├── templates/
    │   └── utils/
    ├── frontend/src/           ← Sources React — TRAVAILLE ICI
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   ├── store/
    │   ├── hooks/
    │   └── contexts/
    └── database/prisma/
        ├── schema.prisma       ← 58 modèles + 1 vue (source de vérité DB)
        └── migrations/         ← ⚠️ Voir issues migrations Section 6
```

### 2.4 Pattern architectural (Event-Driven — DOC-02)

```
Action utilisateur
  → Controller (validation input uniquement)
    → Service (logique métier)
      → Event Bus (domain events)
        → Handlers (effets de bord : stock, compta, RH)
          → DB via Prisma (transaction atomique unique)
```

**Règle absolue :** Aucune écriture directe sur les agrégats.
Tout passe par un événement métier. Voir DOC-02.

### 2.5 Auth — Résumé technique

- Access token : 15min (`JWT_EXPIRES_IN`)
- Refresh token : 7j (`JWT_REFRESH_EXPIRES_IN`)
- Révocation via `jti` stocké en Redis
- 2FA TOTP via speakeasy
- Rate limit login : 10 tentatives/heure/IP
- Roles : `owner`, `manager`, `employee`, `rh`, `accountant`, `super_admin`, `conta_user`

### 2.6 Fichiers de configuration clés

| Fichier | Rôle |
|---------|------|
| `ecosystem.config.js` | Config PM2 production |
| `backend/.env` | Variables d'environnement backend |
| `frontend/.env` | Variables d'environnement frontend |
| `database/prisma/schema.prisma` | Schéma DB — source de vérité |
| `frontend/src/config/api.config.ts` | URL API selon environnement |

---

## SECTION 3 — RÈGLES MÉTIER NON NÉGOCIABLES

Ces règles viennent des DOC-01 à DOC-10.
**Elles ne sont JAMAIS contournées, même pour un hotfix.**

### 3.1 Règles fondamentales (DOC-02)

```
❌ INTERDIT — Ne jamais faire :
  - UPDATE quantity = quantity - x  (stock)
  - Modifier un solde comptable directement
  - Modifier un cumul RH directement
  - Supprimer un mouvement de stock validé
  - Supprimer une écriture comptable
  - Modifier une facture après validation

✅ OBLIGATOIRE — Toujours faire :
  - Passer par un événement métier (Event Bus)
  - Transaction atomique pour tout flux critique
  - Inversion (nouvel événement lié) pour corriger une erreur
  - Commit unique : stock + compta + RH synchronisés
```

### 3.2 Datarissage — Éléments verrouillés (DOC-01)

```
VERROUILLÉ après datarissage (non modifiable sans migration) :
  - Devise principale
  - Type d'entreprise
  - Mode de gestion du stock (simple / multi-entrepôts)
  - Méthode de valorisation stock (FIFO / moyenne pondérée)
  - Activation de la paie

MODIFIABLE avec processus contrôlé :
  - Modules activés (ajout possible si prérequis remplis)
  - Administrateur principal (transfert contrôlé uniquement)
```

### 3.3 Cycle de vie des entités métier (DOC-07)

```
Facture :
  DRAFT → VALIDÉE → PAYÉE (partiel ou total)
                ↘ ANNULÉE (par inversion uniquement, jamais supprimée)

Mouvement stock :
  DRAFT → VALIDÉ
             ↘ INVERSÉ (jamais supprimé)

Écriture comptable :
  Générée → VALIDÉE → figée par clôture de période
                          ↘ CORRIGÉE via inversion en période suivante

Paie :
  PRÉPARÉE → VALIDÉE (immutable)
                 ↘ CORRIGÉE via annulation + nouvelle paie
```

### 3.4 Périodes comptables (DOC-09)

```
Période OUVERTE  → opérations autorisées
Période CLÔTURÉE → TOUTES opérations BLOQUÉES

Correction sur période clôturée :
  1. Ouvrir nouvelle période
  2. Créer écriture d'inversion référençant l'erreur
  3. JAMAIS modifier le passé directement

Réouverture d'une période clôturée :
  - Rôle élevé requis (owner ou admin)
  - Justification textuelle OBLIGATOIRE
  - Événement audité
  - Doit rester EXCEPTIONNEL
```

### 3.5 Expert-comptable (DOC-05)

```
PEUT :
  - Consulter toutes données financières de ses clients
  - Valider des écritures préparées
  - Clôturer une période (si délégation explicite)
  - Exporter états financiers
  - Proposer corrections (par inversion uniquement)

NE PEUT JAMAIS :
  - Créer ou modifier une facture commerciale
  - Modifier le stock directement
  - Gérer les utilisateurs internes d'une entreprise
  - Modifier le datarissage
  - Supprimer des données
  - Choisir la devise, le type d'activité, les modules

Toutes ses actions sont marquées "externe" dans les audit_logs.
```

### 3.6 Ségrégation des fonctions (DOC-06)

```
Une même personne ne peut PAS :
  - Créer ET valider la même facture
  - Créer ET valider la même écriture comptable
  - Préparer ET valider la même paie
  - Créer ET valider le même mouvement de stock

Implémenté dans : services/segregationOfDuties.service.ts
```

### 3.7 Audit obligatoire (DOC-08)

```
Toute action critique DOIT enregistrer dans audit_logs :
  - Qui (utilisateur réel + rôle au moment de l'action)
  - Quand (timestamp)
  - Sur quoi (entité + ID)
  - Société concernée
  - État avant / état après
  - Justification (si action sensible)

Actions nécessitant justification obligatoire :
  - Annulation de facture
  - Ajustement de stock
  - Correction comptable
  - Réouverture de période
  - Soft delete de toute entité
```

### 3.8 Stock (DOC-03)

```
Stock courant = VUE CALCULÉE (jamais valeur stockée directement)
  SUM(mouvements IN) - SUM(mouvements OUT) par produit/entrepôt

Types de mouvements autorisés UNIQUEMENT :
  - IN        : entrée (achat, retour client, ajustement +)
  - OUT       : sortie (vente, perte, ajustement -)
  - TRANSFER  : transfert entre entrepôts
  - ADJUSTMENT: correction inventaire

Stock négatif :
  - INTERDIT par défaut
  - Autorisé UNIQUEMENT si configuré explicitement au datarissage
```

### 3.9 RH (DOC-04)

```
Employé ≠ Utilisateur (entités séparées, ne pas confondre)

Paie = résultat de : contrat actif + temps validé + événements RH
Paie validée = IMMUTABLE
Correction paie = annulation + nouvelle paie (jamais modification directe)

La RH ne touche JAMAIS les soldes comptables directement.
Elle émet des événements → la comptabilité les consomme.
```

---

## SECTION 4 — INVENTAIRE DES MODULES

### Légende statuts
- ✅ COMPLET : tous les fichiers présents, logique implémentée
- ⚡ PARTIEL : implémenté mais avec TODOs structurels bloquants
- 🔧 SQUELETTE : fichiers présents, logique manquante

### Légende priorités
- 🔴 P0 : Bloquant pour le lancement
- 🟠 P1 : Important, premier trimestre post-lancement
- 🔵 P2 : Roadmap future

---

### MODULES P0 — BLOQUANTS LANCEMENT

| # | Module | Statut | Notes |
|---|--------|--------|-------|
| 01 | Auth & Utilisateurs | ✅ COMPLET | JWT + 2FA + révocation Redis. Stable. |
| 02 | Facturation | ✅ COMPLET | 9 sous-services, 24 templates HTML, workflow complet. |
| 03 | Devis | ✅ COMPLET | Conversion devis → facture opérationnelle. |
| 04 | Clients | ✅ COMPLET | CRUD + SlideIn + détail. |
| 05 | Fournisseurs | ✅ COMPLET | CRUD complet. |
| 06 | Paiements | ✅ COMPLET | PayPal + VisaPay intégrés. Avantage concurrentiel. |
| 07 | Dashboard | ✅ COMPLET | Cache Redis. 7 dashboards par rôle. |
| 08 | TVA | ✅ COMPLET | Critique conformité fiscale RDC. |
| 09 | Espace Expert-Comptable | ✅ COMPLET | Multi-clients. Profil public. Différenciation Conta. |
| 10 | Abonnements / Plans | ✅ COMPLET | Modèle SaaS. Critique pour revenus. |
| 11 | Datarissage | ✅ COMPLET | Initialisation entreprise. Middleware présent. |
| 12 | Notifications | ✅ COMPLET | Email + Realtime WebSocket. |
| 13 | SuperAdmin | ✅ COMPLET | Dashboard admin plateforme. |

---

### MODULES P1 — IMPORTANT POST-LANCEMENT

| # | Module | Statut | Notes |
|---|--------|--------|-------|
| 14 | Journal Comptable | ✅ COMPLET | Double entrée. 4 sous-services. Automation. |
| 15 | Rapports financiers | ✅ COMPLET | Bilan, P&L, flux trésorerie. |
| 16 | Rapprochement bancaire | ✅ COMPLET | Feature différenciante. |
| 17 | Notes de crédit (Avoirs) | ✅ COMPLET | Cycle facture complet. |
| 18 | Factures récurrentes | ✅ COMPLET | Automatisation + scheduler. |
| 19 | Dépenses | ✅ COMPLET | Workflow approbation + pièces jointes. |
| 20 | Produits / Catalogue | ✅ COMPLET | Lié facturation. |
| 21 | Audit Trail | ✅ COMPLET | Immuable + chain. Conforme DOC-08. |
| 22 | Périodes fiscales | ✅ COMPLET | Verrous implémentés. Conforme DOC-09. |
| 23 | Export Fiscal | ✅ COMPLET | Pour experts-comptables. |
| 24 | Plan comptable | ✅ COMPLET | SYSCOHADA natif. |
| 25 | Reporting | ✅ COMPLET | Multi-devises. |
| 26 | Recherche globale | ✅ COMPLET | Cross-modules. |
| 27 | Support tickets | ✅ COMPLET | Templates email inclus. |
| 28 | Paramètres | ✅ COMPLET | Company + utilisateurs + notifications. |

---

### MODULES P2 — ROADMAP FUTURE

| # | Module | Statut | Notes critiques |
|---|--------|--------|-----------------|
| 29 | Stock | ⚡ PARTIEL | ⚠️ Valorisation FIFO/weighted_average NON implémentée (TODO stock.handlers.ts L54,65) |
| 30 | Entrepôts | ✅ COMPLET | Multi-entrepôts. Lié au stock. |
| 31 | RH — Employés | ✅ COMPLET | CRUD + contrats + documents. |
| 32 | RH — Présences | ✅ COMPLET | Attendance tracking. |
| 33 | RH — Congés | ✅ COMPLET | Demandes + soldes + politiques. |
| 34 | RH — Paie | ⚡ PARTIEL | ⚠️ TODOs calcul primes + règles fiscales. Pas de règles RDC (INSS, IPR, ONEM). |
| 35 | RH — Conformité | ✅ COMPLET | HR Compliance. |
| 36 | Amortissements | ✅ COMPLET | Module avancé. Fonctionnel. |
| 37 | Balance âgée | ✅ COMPLET | Aged balance clients/fournisseurs. |
| 38 | Validation des soldes | ✅ COMPLET | Balance validation. |
| 39 | WhatsApp | ⚡ PARTIEL | ⚠️ Meta provider présent. Webhook entrant NON implémenté. |
| 40 | Contrats | ✅ COMPLET | Éditeur contrats. TODO : upload fichier + notifications signature. |
| 41 | Multi-devises | ✅ COMPLET | ECB + BCC (Banque Centrale Congo). Taux automatiques. |
| 42 | Branding plateforme | ✅ COMPLET | White-label. Admin uniquement. |
| 43 | MaxiCash | 🔧 SQUELETTE | Champs DB présents. Aucun service backend. |
| 44 | PDF & Templates | ✅ COMPLET | 24 templates factures + 16 emails + payslip. |
| 45 | File Upload | ✅ COMPLET | Storage service + multer. |
| 46 | Event Bus | ✅ COMPLET | Domain events + handlers (stock partiel). |
| 47 | Cache / Queues | ✅ COMPLET | Redis + BullMQ + monitoring. |
| 48 | Cron / Scheduler | ✅ COMPLET | Jobs planifiés. |
| 49 | Realtime | ✅ COMPLET | WebSocket. |
| 50 | Account Deletion | ✅ COMPLET | Soft delete + anonymisation. |

---

## SECTION 5 — SITUATION DEV VS PROD

```
⚠️ CRITIQUE À COMPRENDRE :

conta.cd-DEV  → sources backend ABSENTES (seulement dist/ compilé)
                 Cursor NE PEUT PAS modifier le code source ici.

conta.cd-PROD → sources TypeScript COMPLÈTES ✅
                 C'est ici que Cursor travaille toujours.
```

**Flux de travail correct :**
```
1. Développer dans : /home/conta/conta.cd-prod/backend/src/
                 et : /home/conta/conta.cd-prod/frontend/src/
2. Compiler backend : npm run build → génère dist/
3. Redémarrer PM2 : pm2 restart conta-backend
4. Tester sur PROD
```

**Ne jamais :**
- Éditer des fichiers dans `dist/` directement
- Supposer que DEV et PROD sont identiques

---

## SECTION 6 — ISSUES CRITIQUES À RÉSOUDRE

Traitées dans l'ordre de criticité.

### SÉCURITÉ — Traiter en priorité absolue

| # | Issue | Fichier | Correction |
|---|-------|---------|------------|
| S1 | CORS ouvert en prod | `backend/src/app.ts` L96 | Remplacer `origin: true` par `process.env.CORS_ORIGIN` |
| S2 | JWT dans localStorage | `frontend/src/services/api.ts` L15 | Migrer vers cookies httpOnly + Secure |
| S3 | Webhook PayPal non vérifié | `services/paypal.service.ts` L618 | Implémenter validation signature |
| S4 | Route dev exposée en prod | `routes/auth.routes.ts` L24 | Conditionner à `NODE_ENV !== 'production'` |

### BUGS FONCTIONNELS — Traiter avant lancement

| # | Issue | Fichier | Correction |
|---|-------|---------|------------|
| B1 | Route `/hr/employees/new` dupliquée | `App.tsx` | Supprimer première définition (mauvais composant) |
| B2 | Routes PayPal/VisaPay return dupliquées | `App.tsx` | Supprimer définitions sans PrivateRoute |
| B3 | `conta-permissions` middleware vide | `middleware/conta-permissions.middleware.ts` | Créer `conta-permissions.service.ts` |
| B4 | `employee_contracts` sans @relation Prisma | `schema.prisma` | Ajouter @relation sur `company_id` et `employee_id` |
| B5 | `warehouse_to_id` sans @relation | `schema.prisma` | Ajouter @relation |

### MIGRATIONS — Consolider avant déploiement

| # | Issue | Correction |
|---|-------|------------|
| M1 | 3 migrations avec timestamp `20250101000000` | Renommer avec timestamps uniques |
| M2 | `add_stock_movements` en double | Fusionner |
| M3 | `add_advanced_stock_module` en double | Fusionner |
| M4 | `add_recurring_invoices` en double | Fusionner |
| M5 | `add_reversed_entry_id` en double | Fusionner |
| M6 | Dossier `$(date +%Y%m%d%H%M%S)_add_platform_branding` | Renommer — variable shell non interpolée |
| M7 | `1769178710_add_reason_fields` | Renommer — timestamp UNIX non standard |
| M8 | `create_hr_tables.sql` | Convertir en migration Prisma standard |
| M9 | `manual_add_super_admin` | Convertir en migration Prisma standard |

### TODOs FONCTIONNELS PRIORITAIRES

| # | TODO | Fichier | Priorité |
|---|------|---------|---------|
| T1 | Valorisation stock FIFO/weighted_average | `events/handlers/stock.handlers.ts` L54,65 | P2 |
| T2 | Audit packages (create/update/delete) | `controllers/package.controller.ts` L108,159,201 | P1 |
| T3 | Table `InvoiceHistory` manquante en DB | `services/invoiceHistory.service.ts` L35 | P1 |
| T4 | Changement d'entreprise dans sidebar | `components/layout/Sidebar.tsx` L579 | P1 |
| T5 | Stats consolidées dashboard expert-comptable | `pages/accountant/AccountantDashboardPage.tsx` L84 | P1 |
| T6 | Export PDF/Excel rapports comptables | `pages/accountingReports/AccountingReportsPage.tsx` L140 | P1 |
| T7 | Webhook WhatsApp entrant | `controllers/webhook.controller.ts` L70,84 | P2 |
| T8 | Service MaxiCash backend | Aucun fichier — à créer | P2 |

---

## SECTION 7 — SERVICES EXTERNES

| Service | Statut | Variables env requises |
|---------|--------|----------------------|
| PostgreSQL | ✅ Actif | `DATABASE_URL`, `DATABASE_READ_URL` |
| Redis | ✅ Actif | `REDIS_URL` ou `REDIS_HOST/PORT/PASSWORD` |
| SMTP Email | ✅ Actif | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| PayPal | ✅ Actif | Config PayPal SDK |
| VisaPay | ✅ Actif | Clés dans `visa-keys/` |
| BCC (Banque Centrale Congo) | ✅ Actif | Auto — `https://www.bcc.cd/api/v1/rates` |
| ECB (Banque Centrale Européenne) | ✅ Actif | Auto |
| WhatsApp Meta | ⚡ Partiel | `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN` |
| MaxiCash | 🔧 Non implémenté | Champs DB présents, service absent |

---

## SECTION 8 — RÈGLES DE TRAVAIL POUR CURSOR

### TOUJOURS faire

```
✅ Lire ce fichier avant de commencer
✅ Respecter le pattern Event-Driven (Section 3.1)
✅ Écrire dans les Services — jamais directement dans les Controllers
✅ Utiliser des transactions Prisma pour tout flux multi-tables
✅ Ajouter une entrée audit_logs pour toute action sensible
✅ Vérifier qu'une période n'est pas clôturée avant toute écriture
✅ Travailler dans conta.cd-prod/src/ (jamais dans dist/)
✅ Terminer une tâche avant d'en commencer une autre
✅ Créer la migration Prisma si schema.prisma est modifié
```

### NE JAMAIS faire

```
❌ Modifier directement un stock, solde comptable ou cumul RH
❌ Supprimer des données financières (soft delete uniquement)
❌ Modifier une facture validée (inversion obligatoire)
❌ Créer de nouveaux modules sans instruction explicite
❌ Toucher aux fichiers dist/ (code compilé)
❌ Contourner le middleware d'auth ou de permissions
❌ Bypasser la vérification des périodes fiscales
❌ Ignorer une règle des DOC même si le code actuel ne la respecte pas
```

### Format de réponse attendu

Quand tu proposes du code, toujours indiquer :
1. Quel module et quel(s) fichier(s) sont modifiés
2. Pourquoi (règle métier ou issue résolue)
3. Si une migration DB est nécessaire
4. Si un test doit être créé ou mis à jour

---

## SECTION 9 — ROADMAP

### Phase 1 — STABILISATION (Maintenant)
- [ ] Corriger les 4 issues sécurité (S1 à S4)
- [ ] Corriger les 5 bugs fonctionnels (B1 à B5)
- [ ] Consolider les 9 migrations en doublon (M1 à M9)
- [ ] Tester flux complet : inscription → plan → facture → paiement VisaPay
- [ ] Créer README.md à la racine du projet
- [ ] Geler tout nouveau module pendant cette phase

### Phase 2 — BETA
- Onboarding 5-10 experts-comptables pilotes RDC
- Validation modules P1 en conditions réelles
- Monitoring production (alertes, métriques)
- Landing page conta.cd complète

### Phase 3 — CROISSANCE
- WhatsApp notifications complet
- RH avec règles fiscales RDC (INSS, IPR, ONEM)
- Valorisation stock FIFO/weighted_average
- MaxiCash intégration complète
- Extension pays (Congo-B, Cameroun)

---

## SECTION 10 — DOCUMENTS MÉTIER DE RÉFÉRENCE

En cas de conflit entre le code existant et un DOC → **le DOC prime.**

| Document | Contenu | Criticité |
|----------|---------|-----------|
| DOC-01 | Datarissage — choix structurants et verrouillage | 🔴 Fondation |
| DOC-02 | Architecture event-driven — règles anti-données fausses | 🔴 Fondation |
| DOC-03 | Module Stock — standards ERP | 🟠 Important |
| DOC-04 | Module RH — logique métier complète | 🟠 Important |
| DOC-05 | Expert-comptable — gestion multi-sociétés | 🔴 Différenciation clé |
| DOC-06 | Permissions RBAC — ségrégation des fonctions | 🔴 Sécurité |
| DOC-07 | Facturation & Comptabilité — normalisation finale | 🔴 Core business |
| DOC-08 | Audit & traçabilité — conformité | 🟠 Gouvernance |
| DOC-09 | Gestion des périodes & verrous | 🟠 Gouvernance |
| DOC-10 | UX métier — parcours utilisateurs | 🔵 Adoption |

**Prochains documents à créer :**
- DOC-00 : Glossaire (définitions formelles de tous les termes métier)
- DOC-11 : Plans tarifaires et quotas (modèle économique codifiable)

---

*Fin du MASTER_CONTEXT.md — Version 1.0 — Mars 2026*
