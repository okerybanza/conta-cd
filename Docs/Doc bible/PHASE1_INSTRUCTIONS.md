# PHASE 1 — STABILISATION
> Instructions pour Cursor — à exécuter dans l'ordre strict.
> Une tâche terminée et validée avant de passer à la suivante.
> Travailler dans : /home/conta/conta.cd-prod/

---

## RÈGLE GÉNÉRALE

Avant chaque tâche :
1. Lire MASTER_CONTEXT.md
2. Identifier le fichier concerné
3. Proposer le code corrigé
4. Attendre validation avant de passer à la suivante

---

## BLOC 1 — SÉCURITÉ (priorité absolue)

---

### TÂCHE S1 — Corriger le CORS ouvert en production

**Fichier :** `backend/src/app.ts` (ligne ~96)

**Problème :**
```typescript
origin: true  // ← accepte TOUTES les origines — dangereux en prod
```

**Correction attendue :**
- Lire la variable d'environnement `CORS_ORIGIN`
- Supporter plusieurs origines séparées par une virgule
- Fallback sécurisé si la variable est absente
- Ne jamais utiliser `origin: true` en production

**Comportement attendu :**
- En développement (`NODE_ENV=development`) : autoriser `localhost:3000`
- En production : lire `CORS_ORIGIN` depuis `.env`

**Variable à ajouter dans `.env.example` :**
```
CORS_ORIGIN=https://conta.cd,https://www.conta.cd
```

**Vérification :**
- Tester qu'une requête depuis une origine non autorisée reçoit une erreur CORS
- Tester qu'une requête depuis l'origine autorisée fonctionne

---

### TÂCHE S2 — Corriger la route dev exposée en production

**Fichier :** `backend/src/routes/auth.routes.ts` (ligne ~24)

**Problème :**
La route `GET /api/v1/auth/dev/email-status` est accessible en production sans authentification.

**Correction attendue :**
- Conditionner l'enregistrement de cette route à `NODE_ENV !== 'production'`
- Si `NODE_ENV=production` → la route n'existe pas (404)
- Pas de middleware — la route ne doit simplement pas être enregistrée

**Code attendu :**
```typescript
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/email-status', ...);
}
```

**Vérification :**
- En dev : route accessible
- En prod : route retourne 404

---

### TÂCHE S3 — Sécuriser le webhook PayPal

**Fichier :** `backend/src/services/paypal.service.ts` (ligne ~618)

**Problème :**
Le webhook PayPal ne vérifie pas la signature de PayPal.
N'importe qui peut envoyer une fausse notification de paiement.

**Correction attendue :**
- Implémenter la vérification de signature PayPal via le SDK officiel
- Utiliser `paypal.notification.webhookEvent.verify()`
- Si vérification échoue → retourner 400 et logger la tentative
- Si vérification réussit → continuer le traitement

**Variables d'environnement nécessaires :**
```
PAYPAL_WEBHOOK_ID=your_webhook_id
```

**Vérification :**
- Une requête avec une signature invalide doit retourner 400
- Une requête valide doit être traitée normalement

---

### TÂCHE S4 — Sécuriser le JWT (migration localStorage → cookies httpOnly)

**Contexte :**
Le JWT stocké dans localStorage est vulnérable aux attaques XSS.
La correction complète est une migration importante — à faire proprement.

**Fichiers concernés :**
- `frontend/src/services/api.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/middleware/auth.middleware.ts`

**Correction attendue côté backend :**
- À la connexion : envoyer le token dans un cookie `httpOnly; Secure; SameSite=Strict`
- Nom du cookie : `access_token`
- Refresh token : cookie séparé `refresh_token`
- Route logout : supprimer les deux cookies

**Correction attendue côté frontend :**
- Supprimer la lecture/écriture de `localStorage` pour les tokens
- Le cookie est envoyé automatiquement par le navigateur
- Adapter `api.ts` pour ne plus injecter le token dans les headers manuellement (le cookie le fait)
- Conserver la logique de refresh sur erreur 401

**⚠️ Points d'attention :**
- Ne pas casser les utilisateurs actuellement connectés — prévoir une période de transition
- Tester le flux complet : login → appel API → refresh → logout

---

## BLOC 2 — BUGS FONCTIONNELS

---

### TÂCHE B1 — Corriger les routes dupliquées dans App.tsx

**Fichier :** `frontend/src/App.tsx`

**Problème 1 — `/hr/employees/new` dupliquée :**
La route est déclarée deux fois. La première pointe vers `EmployeesListPage` au lieu de `EmployeeFormPage`.

**Correction :** Supprimer la première déclaration incorrecte. Garder uniquement celle qui pointe vers `EmployeeFormPage`.

**Problème 2 — `/payments/paypal/return` dupliquée :**
Deux déclarations. La version sans `PrivateRoute` est inaccessible et confuse.

**Correction :** Supprimer la déclaration sans `PrivateRoute`. Garder uniquement la version protégée.

**Problème 3 — `/payments/visapay/return` dupliquée :**
Même problème que PayPal.

**Correction :** Même traitement.

**Vérification :**
- Naviguer vers `/hr/employees/new` → doit afficher le formulaire de création
- Naviguer vers `/payments/paypal/return` → doit être accessible uniquement si connecté
- Aucun warning React Router dans la console

---

### TÂCHE B2 — Corriger les relations Prisma manquantes

**Fichier :** `database/prisma/schema.prisma`

**Problème 1 — `employee_contracts` sans @relation :**
Les champs `company_id` et `employee_id` n'ont pas de directive `@relation`.
Conséquence : pas de clé étrangère en base de données — intégrité référentielle non garantie.

**Correction :**
Ajouter les directives `@relation` correctes pour les deux champs.
Vérifier que les modèles `Company` et `Employee` ont les champs inverses correspondants.

**Problème 2 — `stock_movement_items.warehouse_to_id` sans @relation :**
Même problème — pas de FK vers `warehouses`.

**Correction :**
Ajouter la directive `@relation` pour `warehouse_to_id`.
Vérifier que le modèle `Warehouse` a le champ inverse.

**⚠️ Après correction du schema :**
- Générer une nouvelle migration : `npx prisma migrate dev --name fix_missing_relations`
- Vérifier que la migration ne casse pas les données existantes
- Appliquer la migration

**Vérification :**
- `npx prisma validate` → aucune erreur
- `npx prisma migrate status` → migration appliquée

---

### TÂCHE B3 — Implémenter le middleware conta-permissions

**Fichiers concernés :**
- `backend/src/middleware/conta-permissions.middleware.ts` (retourne toujours `true`)
- `backend/src/services/conta-permissions.service.ts` (fichier absent — à créer)

**Problème :**
Le middleware est en place mais ne fait rien. Toutes les permissions passent.

**Correction attendue :**

Créer `conta-permissions.service.ts` avec la logique suivante :
1. Récupérer le rôle de l'utilisateur depuis le token JWT
2. Récupérer le plan tarifaire actif de l'entreprise
3. Vérifier que le module demandé est :
   - activé au datarissage (`companies.modules_config`)
   - inclus dans le plan tarifaire actif
4. Vérifier que l'action demandée est autorisée pour le rôle (matrice DOC-06)

**Structure minimale du service :**
```typescript
// conta-permissions.service.ts
checkModuleAccess(companyId, module): boolean
checkActionPermission(userId, role, action, module): boolean
checkQuota(companyId, resource): { allowed: boolean, current: number, limit: number }
```

**Mettre à jour le middleware** pour appeler ce service au lieu de retourner `true`.

**⚠️ Attention :**
- Ne pas bloquer les routes qui n'ont pas encore de permissions définies — logger uniquement
- Implémenter progressivement : commencer par les modules P0 (Facturation, Paiements, Dashboard)

---

## BLOC 3 — MIGRATIONS

> ⚠️ Ce bloc est le plus risqué. Faire un backup de la base avant de commencer.
> Commande : `pg_dump conta_prod > backup_avant_migrations_$(date +%Y%m%d).sql`

---

### TÂCHE M1 — Auditer et corriger les migrations en doublon

**Avant de toucher quoi que ce soit :**
1. Faire le backup DB
2. Lister l'état actuel : `npx prisma migrate status`
3. Documenter quelles migrations sont déjà appliquées en production

**Migrations à corriger (9 anomalies) :**

| Anomalie | Action |
|----------|--------|
| 3 migrations avec timestamp `20250101000000` | Renommer avec timestamps uniques (ex: `20250101000001`, `20250101000002`) |
| `add_stock_movements` en double | Fusionner le contenu en une migration propre |
| `add_advanced_stock_module` en double | Fusionner |
| `add_recurring_invoices_and_reminders` en double | Fusionner |
| `add_reversed_entry_id` en double | Fusionner |
| `$(date +%Y%m%d%H%M%S)_add_platform_branding` | Renommer avec timestamp réel |
| `1769178710_add_reason_fields` | Renommer au format `YYYYMMDDHHMMSS` |
| `create_hr_tables.sql` | Convertir en migration Prisma standard |
| `manual_add_super_admin` | Convertir en migration Prisma standard |

**Règle pour les migrations déjà appliquées en prod :**
- Ne PAS les modifier (Prisma vérifie le checksum)
- Créer une migration de correction qui applique le delta manquant
- Documenter dans un commentaire dans la migration

**Vérification finale :**
- `npx prisma migrate status` → toutes les migrations appliquées, aucun conflit
- `npx prisma validate` → schema valide

---

## BLOC 4 — FLUX DE VALIDATION

> À faire après les Blocs 1, 2 et 3.
> Tester le parcours complet en conditions réelles.

---

### TÂCHE V1 — Tester le flux complet P0

**Parcours à valider :**

```
1. Inscription nouvelle entreprise
   → Formulaire d'inscription
   → Vérification email
   → Datarissage (7 étapes)
   → Dashboard chargé

2. Création et envoi d'une facture
   → Créer un client
   → Créer un produit
   → Créer une facture (DRAFT)
   → Valider la facture
   → Envoyer par email
   → Vérifier que l'email est reçu

3. Paiement VisaPay
   → Depuis une facture validée
   → Initier le paiement VisaPay
   → Simuler le retour de paiement
   → Vérifier que la facture passe en PAYÉE
   → Vérifier l'écriture comptable générée

4. Paiement PayPal
   → Même flux avec PayPal
   → Vérifier la signature webhook (après S3)
```

**Pour chaque étape :**
- Documenter le résultat (OK / KO + détail)
- Si KO → créer une issue avec le détail exact

---

### TÂCHE V2 — Créer le README.md à la racine

**Fichier :** `/home/conta/conta.cd-prod/README.md`

**Contenu attendu :**
```markdown
# Conta — Plateforme SaaS Comptable Afrique Centrale

## Vision
[2-3 phrases sur le produit et la différenciation]

## Stack technique
[Résumé de la Section 2 du MASTER_CONTEXT]

## Démarrage rapide
### Prérequis
### Installation
### Variables d'environnement
### Démarrer en développement
### Déployer en production

## Structure du projet
[Arborescence des dossiers principaux]

## Documentation
[Lien vers Docs/Doc bible/MASTER_CONTEXT.md]
[Lien vers Docs/Doc bible/ pour les DOC-00 à DOC-11]

## Roadmap
[Résumé des 3 phases]
```

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

```
S2 → S1 → S3 → B1 → B2 → M1 (backup d'abord) → B3 → S4 → V1 → V2
```

**Pourquoi cet ordre :**
- S2 et S1 sont les plus simples et les plus rapides — démarrer par des victoires faciles
- S3 est isolé — ne touche qu'un service
- B1 est frontend uniquement — sans risque sur les données
- B2 requiert une migration — faire avant B3 pour avoir un schema propre
- M1 est le plus risqué — backup obligatoire
- B3 est long — après que tout le reste est stable
- S4 est le plus impactant côté UX — garder pour la fin du bloc sécurité
- V1 valide tout ce qui précède
- V2 clôture la Phase 1

---

*Phase 1 — Version 1.0 — Mars 2026*
*À archiver dans : /home/conta/conta.cd-prod/Docs/PHASE1_INSTRUCTIONS.md*
