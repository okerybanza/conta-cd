# 05_ISSUES — Incohérences, TODOs et Anomalies

## 1. CORS non restreint en production

**Fichier :** `backend/src/app.ts` (ligne 96-99)

```typescript
app.use(cors({
  origin: true, // Accepter toutes les origines temporairement
  credentials: true,
}));
```

Le commentaire à la ligne 95 indique : `// TEMPORAIRE: Accepter toutes les origines pour faciliter les tests` et `// TODO: Restreindre en production`. La variable `CORS_ORIGIN` est définie dans `config/env.ts` mais n'est pas utilisée. Toutes les origines sont acceptées en production.

---

## 2. TODO fonctionnels non résolus dans le code source

### Backend

| Fichier | Ligne | TODO |
|---------|-------|------|
| `controllers/webhook.controller.ts` | 70 | `// TODO: Implémenter la logique de traitement des messages entrants` (WhatsApp) |
| `controllers/webhook.controller.ts` | 84 | `// TODO: Mettre à jour le statut dans la base de données` |
| `controllers/package.controller.ts` | 108, 159, 201 | `// TODO: Implémenter l'audit pour les packages` (3 occurrences) |
| `services/invoiceHistory.service.ts` | 35 | `// TODO: Créer une table InvoiceHistory dans Prisma et enregistrer ici` |
| `services/paypal.service.ts` | 618 | `// TODO: Implémenter la validation de webhook PayPal selon la documentation` |
| `services/contract.service.ts` | 324, 369 | `// TODO: Envoyer notification [...] si les deux parties ont signé` (2 occurrences) |
| `services/payroll.service.ts` | 185, 188, 285 | TODO calcul primes, règles fiscales, devise du contrat |
| `middleware/conta-permissions.middleware.ts` | 4, 32, 63 | `// TODO: Implémenter conta-permissions.service` (3 occurrences — service non créé) |
| `events/handlers/stock.handlers.ts` | 54, 65 | `// TODO: Implémenter selon stock_valuation_method (FIFO, weighted_average)` |

### Frontend

| Fichier | Ligne | TODO |
|---------|-------|------|
| `components/layout/Sidebar.tsx` | 579 | `// TODO: Implémenter le changement d'entreprise` |
| `components/layout/Header.tsx` | 169 | `// TODO: Ouvrir les notifications` |
| `components/dashboard/EmployeeDashboard.tsx` | 21 | `// TODO: Charger les demandes personnelles (congés, documents, etc.)` |
| `components/dashboard/RHDashboard.tsx` | 36, 39 | TODO contrats actifs, paies en attente |
| `components/dashboard/AccountantDashboard.tsx` | 41 | `// TODO: Charger les écritures non équilibrées` |
| `components/dashboard/ExpertComptableDashboard.tsx` | 23 | `// TODO: Charger les entreprises clientes (DOC-05)` |
| `pages/profile/UserProfilePage.tsx` | 74, 75 | TODO langue et timezone depuis préférences |
| `pages/accountingReports/AccountingReportsPage.tsx` | 140 | `// TODO: Implémenter l'export PDF/Excel` |
| `pages/accountant/AccountantDashboardPage.tsx` | 84 | `// TODO: Créer une route API pour obtenir les stats consolidées` |
| `pages/accountant/AccountantCompaniesPage.tsx` | 67 | `// TODO: Implémenter la navigation vers le contexte de l'entreprise` |
| `pages/contracts/ContractEditorPage.tsx` | 142 | `// TODO: Implémenter l'upload de fichier` |
| `pages/landing/ContactPage.tsx` | 18 | `// TODO: Implémenter l'envoi du formulaire` |
| `utils/featureToggle.ts` | 29 | `// TODO: Optimiser en mettant les features dans le store après login` |

---

## 3. Migrations en doublon ou conflict

### 3.1 Timestamp identique `20250101000000`

Trois migrations ont exactement le même timestamp `20250101000000` :
- `20250101000000_add_expense_attachments`
- `20250101000000_add_fiscal_periods`
- `20250101000000_add_recurring_invoices_and_reminders`

Prisma ne peut pas gérer plusieurs migrations avec le même timestamp. Le comportement lors d'un `prisma migrate deploy` est indéterminé.

### 3.2 Noms dupliqués — `add_stock_movements`

- `20260105112732_add_stock_movements`
- `20260105120000_add_stock_movements`

Deux migrations avec le même nom fonctionnel, créées le même jour à 7 minutes d'intervalle puis 8 minutes plus tard.

### 3.3 Noms dupliqués — `add_advanced_stock_module`

- `20260105114741_add_advanced_stock_module`
- `20260105130000_add_advanced_stock_module`

Même situation : deux migrations de même nom le même jour.

### 3.4 Noms dupliqués — `add_recurring_invoices_and_reminders`

- `20250101000000_add_recurring_invoices_and_reminders`
- `20251124150815_add_recurring_invoices_and_reminders`

Deux migrations avec le même nom fonctionnel mais des timestamps différents.

### 3.5 Noms dupliqués — `add_reversed_entry_id`

- `20260125092248_add_reversed_entry_id`
- `20260125_add_reversed_entry_id`

Deux migrations avec le même nom fonctionnel créées le même jour, mais l'une utilise le format standard avec heure, l'autre non.

### 3.6 Dossier avec variable shell non résolue

Le dossier `$(date +%Y%m%d%H%M%S)_add_platform_branding` porte littéralement le nom de la variable shell non interpolée. Ce dossier ne sera jamais reconnu par Prisma comme une migration valide.

### 3.7 Timestamp UNIX au lieu de format date

`1769178710_add_reason_fields` : utilise un timestamp UNIX (1769178710 = environ 2026-01-24) au lieu du format Prisma `YYYYMMDDHHMMSS`.

### 3.8 Formats non standard

- `create_hr_tables.sql` : fichier SQL direct à la racine du dossier migrations (pas un dossier de migration Prisma)
- `manual_add_super_admin` : dossier sans timestamp
- `9999_add_supplier_account` : numérotation `9999` non standard

---

## 4. Modèle `employee_contracts` sans relations Prisma

**Fichier :** `database/prisma/schema.prisma`

Le modèle `employee_contracts` déclare les champs `company_id` et `employee_id` mais sans aucune directive `@relation`. Prisma ne génère donc pas de FK en base de données pour ce modèle. Les relations avec `companies` et `employees` ne sont pas appliquées par Prisma.

```prisma
model employee_contracts {
  id          String @id
  company_id  String       // pas de @relation
  employee_id String       // pas de @relation
  ...
}
```

---

## 5. Champ `warehouse_to_id` sans relation Prisma

**Fichier :** `database/prisma/schema.prisma`, modèle `stock_movement_items`

```prisma
warehouse_to_id   String?
```

Le champ `warehouse_to_id` est déclaré sans directive `@relation`. La FK vers `warehouses` n'est pas appliquée par Prisma.

---

## 6. Route dupliquée `/hr/employees/new` dans App.tsx

**Fichier :** `frontend/src/App.tsx`

La route `/hr/employees/new` est déclarée deux fois :
- Ligne ~1318 : pointe vers `EmployeesListPage.tsx`
- Ligne ~1402 : pointe vers `EmployeeFormPage.tsx`

React Router v6 utilisera la première définition rencontrée. La seconde définition est donc ignorée, et `/hr/employees/new` affiche `EmployeesListPage.tsx` au lieu du formulaire de création.

---

## 7. Middleware `conta-permissions` non implémenté

**Fichier :** `backend/src/middleware/conta-permissions.middleware.ts`

Le middleware est déclaré et importable, mais les vérifications réelles sont désactivées et remplacées par `return true` (accès accordé à toutes les permissions). La fonction `checkContaPermission` retourne toujours `true`. Le service `conta-permissions.service.ts` n'existe pas dans `backend/src/services/`.

---

## 8. Table `InvoiceHistory` absente du schéma Prisma

**Fichier :** `backend/src/services/invoiceHistory.service.ts`

Le service référence une future table `invoiceHistory` via un code commenté (`prisma.invoiceHistory.create(...)`), mais cette table n'existe pas dans `schema.prisma`. L'historique des changements de statut est uniquement loggé via `winston`, non persisté en base.

---

## 9. Tokens JWT stockés dans `localStorage`

**Fichier :** `frontend/src/services/api.ts` (lignes 15, 69-86)

```typescript
const token = localStorage.getItem('accessToken');
localStorage.setItem('accessToken', accessToken);
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

Le stockage des tokens JWT en `localStorage` expose les tokens à des attaques XSS. La pratique recommandée pour une SPA est d'utiliser des cookies `httpOnly` + `Secure`.

---

## 10. Route de diagnostic email exposée sans garde en production

**Fichier :** `backend/src/routes/auth.routes.ts` (ligne 24)

```typescript
router.get('/dev/email-status', authController.emailStatus.bind(authController));
```

La route `/api/v1/auth/dev/email-status` est accessible sans authentification et sans vérification de l'environnement. Elle est déclarée inconditionnellement, accessible en production.

---

## 11. Fichiers orphelins — non déclarés dans App.tsx

| Fichier | Statut |
|---------|--------|
| `frontend/src/pages/admin/AdminBrandingPage.tsx` | Exporté via `AdminSettingsPage.tsx` (`export { default } from './AdminBrandingPage'`). Accessible via `/admin/settings`. Pas d'entrée directe dans App.tsx. |
| `frontend/src/pages/settings/UserSettingsPage.tsx` | Importé et rendu dans `UsersUnifiedPage.tsx` (composant tab). Pas de route dédiée dans App.tsx. |
| `frontend/src/pages/settings/UsersPage.tsx` | Importé et rendu dans `UsersUnifiedPage.tsx` (composant tab). Pas de route dédiée dans App.tsx. |

---

## 12. Service frontend `syscohadaChartOfAccounts.service.ts` sans usage détecté

**Fichier :** `frontend/src/services/syscohadaChartOfAccounts.service.ts`

Aucune page ou composant frontend n'importe ce fichier (aucune occurrence détectée via `grep -r "syscohada" frontend/src/`). Le fichier est présent dans le répertoire des services mais non utilisé.

---

## 13. Numéros de téléphone fictifs exposés dans le code source

Plusieurs fichiers frontend contiennent des numéros fictifs en dur dans le code source (pas des données utilisateur) :

| Fichier | Valeur |
|---------|--------|
| `components/payments/PaymentFormSlideIn.tsx` (ligne 526) | `"+243 XXX XXX XXX"` |
| `pages/payments/PaymentFormPage.tsx` (ligne 578) | `"+243 XXX XXX XXX"` |
| `pages/accountant/AccountantProfilePage.tsx` (ligne 312) | `"+243 XXX XXX XXX"` |
| `pages/settings/NotificationsSettingsPage.tsx` (ligne 123) | `"+243XXXXXXXXX"` |
| `pages/landing/ContactPage.tsx` (lignes 105-106) | `"+243 XXX XXX XXX"` (×2) |

Ces valeurs sont des placeholders dans des attributs `placeholder` ou du contenu statique — non bloquant, mais à remplacer par de vraies coordonnées pour la page de contact.

---

## 14. PayPal — validation de webhook non implémentée

**Fichier :** `backend/src/services/paypal.service.ts` (ligne 618)

```typescript
// TODO: Implémenter la validation de webhook PayPal selon la documentation
```

Les webhooks PayPal sont reçus mais la signature n'est pas vérifiée. Un attaquant pourrait forger des notifications de paiement.

---

## 15. MaxiCash — service backend absent

Le modèle `companies` contient 5 champs MaxiCash (`maxicash_enabled`, `maxicash_merchant_id`, `maxicash_secret_key`, `maxicash_sub_merchant_id`, `maxicash_webhook_url`). Aucun fichier de service, controller ou route `maxicash` n'a été trouvé dans `backend/src/`.

---

## 16. Valorisation stock non implémentée

**Fichier :** `backend/src/events/handlers/stock.handlers.ts` (lignes 54, 65)

La méthode de valorisation du stock (FIFO, moyenne pondérée) référencée dans le champ `companies.stock_valuation_method` n'est pas implémentée dans les handlers d'événements stock. La logique est marquée `// TODO`.

---

## 17. Packages — audit non implémenté

**Fichier :** `backend/src/controllers/package.controller.ts` (lignes 108, 159, 201)

Les 3 opérations de modification (create, update, delete) des packages n'enregistrent pas d'entrée dans les `audit_logs`. La traçabilité des changements de plans tarifaires est absente.

---

## 18. Dépendance `sharp` non utilisée dans le code source analysé

**Package :** `sharp ^0.33.1` dans `backend/package.json`

Aucun fichier TypeScript dans `backend/src/` n'importe `sharp`. La dépendance est déclarée mais son usage n'est pas déterminable depuis les fichiers sources (peut être utilisée dans des scripts non listés dans `backend/scripts/`).

---

## 19. Double définition de route PayPal et VisaPay return dans App.tsx

**Fichier :** `frontend/src/App.tsx`

Les routes suivantes sont définies deux fois avec des guards différents :
- `/payments/paypal/return` : une fois sans guard (ligne ~239), une fois avec `PrivateRoute` (ligne ~880)
- `/payments/visapay/return` : une fois sans guard (ligne ~246), une fois avec `PrivateRoute` (ligne ~889)

React Router v6 utilisera la première définition. Les routes avec `PrivateRoute` sont donc inaccessibles (shadowed).

---

## Récapitulatif par catégorie

| Catégorie | Nombre |
|-----------|--------|
| Migrations en doublon ou format invalide | 9 |
| TODO fonctionnels non résolus | 23 |
| Incohérences de schéma Prisma | 2 (employee_contracts, warehouse_to_id) |
| Routes dupliquées dans App.tsx | 3 |
| Fichiers orphelins (non importés) | 1 (`syscohadaChartOfAccounts.service.ts`) |
| Fichiers sans route directe dans App.tsx | 3 (AdminBrandingPage, UserSettingsPage, UsersPage) |
| Problèmes de sécurité identifiés | 4 (CORS, localStorage JWT, webhook PayPal, route dev) |
| Services référencés mais absents | 2 (`conta-permissions.service`, `maxicash`) |
