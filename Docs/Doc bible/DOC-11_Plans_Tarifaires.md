# DOC-11 — Plans tarifaires & Quotas
> **Modèle économique codifiable — logique métier uniquement.**
> Ce document définit ce que chaque plan autorise, ses limites et ses règles d'application.
> Il est la source de vérité pour `package.service.ts`, `quota.service.ts` et `subscription.service.ts`.

---

## 1. Principe fondamental

Un plan tarifaire dans Conta n'est pas un simple badge.

**Il détermine :**
- quels modules sont accessibles
- quelles limites s'appliquent
- quels comportements sont débloqués

**Il ne détermine pas :**
- les règles métier (elles sont dans les DOC-01 à DOC-10)
- la qualité des données produites
- les droits des utilisateurs entre eux (c'est le RBAC — DOC-06)

---

## 2. Deux familles de plans

Conta sert deux types de clients distincts avec des modèles séparés.

### Famille A — Entreprise / PME
Pour une entreprise qui gère sa propre comptabilité.

### Famille B — Expert-Comptable / Cabinet
Pour un professionnel qui gère les comptes de ses clients.

**Ces deux familles ne sont pas interchangeables.**
Un plan Entreprise ne donne pas accès à l'espace Expert-Comptable et inversement.

---

## 3. Plans Famille A — Entreprise

### Plan STARTER (Gratuit / Essai)

**Objectif :** Découverte du produit. Pas d'engagement.

**Durée :** 14 jours d'essai, puis conversion obligatoire ou désactivation.

**Modules accessibles :**
- Facturation ✅ (limité)
- Devis ✅ (limité)
- Clients ✅ (limité)
- Dashboard ✅ (vue basique)

**Modules bloqués :**
- Comptabilité ❌
- Stock ❌
- RH ❌
- Rapports financiers ❌
- Expert-Comptable ❌
- Export fiscal ❌

**Quotas :**
- Factures : 5 maximum
- Devis : 5 maximum
- Clients : 10 maximum
- Utilisateurs : 1 (owner uniquement)
- Devises : 1 (CDF ou USD, pas les deux)
- Templates : 1 template de facture
- Stockage fichiers : 50 Mo

**Comportement à l'atteinte des quotas :**
- Blocage avec message d'upgrade
- Les données existantes restent accessibles
- Aucune suppression automatique

---

### Plan ESSENTIEL

**Objectif :** PME débutante, besoins de base couverts.

**Modules accessibles :**
- Facturation ✅ (complet)
- Devis ✅ (complet)
- Avoirs / Notes de crédit ✅
- Clients ✅ (complet)
- Fournisseurs ✅
- Dépenses ✅
- Produits / Catalogue ✅
- Dashboard ✅
- Notifications ✅
- Paiements (VisaPay + PayPal) ✅
- TVA ✅
- Paramètres ✅
- Recherche ✅

**Modules bloqués :**
- Comptabilité générale ❌
- Stock ❌
- RH ❌
- Rapports financiers avancés ❌
- Export fiscal ❌
- Rapprochement bancaire ❌
- Factures récurrentes ❌
- Multi-devises ❌

**Quotas :**
- Factures : illimitées
- Clients : 100 maximum
- Utilisateurs : 3
- Templates de facture : 5
- Stockage fichiers : 500 Mo

---

### Plan PROFESSIONNEL

**Objectif :** PME établie, besoin de comptabilité complète.

**Modules accessibles :**
Tout le plan Essentiel, plus :
- Comptabilité générale ✅
- Journal comptable ✅
- Rapports financiers ✅ (bilan, P&L, flux)
- Balance âgée ✅
- Périodes fiscales ✅
- Export fiscal ✅
- Rapprochement bancaire ✅
- Factures récurrentes ✅
- Multi-devises ✅ (CDF + USD)
- Audit trail ✅
- Amortissements ✅
- Support prioritaire ✅

**Modules bloqués :**
- Stock ❌ (voir plan Entreprise)
- RH ❌ (voir plan Entreprise)

**Quotas :**
- Factures : illimitées
- Clients : illimités
- Utilisateurs : 10
- Templates de facture : tous (24)
- Stockage fichiers : 5 Go
- Périodes comptables : illimitées

---

### Plan ENTREPRISE

**Objectif :** Entreprise mature, besoin ERP complet.

**Modules accessibles :**
Tout le plan Professionnel, plus :
- Stock ✅ (selon configuration datarissage)
- Entrepôts ✅
- RH — Employés ✅
- RH — Présences ✅
- RH — Congés ✅
- RH — Paie ✅
- RH — Conformité ✅
- Contrats ✅
- Validation des soldes ✅
- WhatsApp notifications ✅ (si activé)
- API accès ✅ (webhooks sortants)
- Branding personnalisé ✅
- Support dédié ✅

**Quotas :**
- Tout illimité
- Utilisateurs : 50
- Stockage fichiers : 20 Go
- Entrepôts : selon configuration datarissage

---

## 4. Plans Famille B — Expert-Comptable

### Plan COMPTABLE SOLO

**Objectif :** Expert-comptable indépendant, clientèle limitée.

**Ce que ce plan donne :**
- Espace Expert-Comptable ✅
- Tableau de bord multi-clients ✅
- Accès délégué aux entreprises clientes ✅
- Profil public Conta ✅ (référencement marketplace)

**Quotas :**
- Entreprises clientes gérées : 5 maximum
- Utilisateurs du cabinet : 1 (le comptable seul)
- Exports par mois : 50

**Contrainte importante :**
Le plan de CHAQUE ENTREPRISE CLIENTE est indépendant.
L'expert-comptable ne "débloque" pas les modules d'une entreprise.
Il accède uniquement à ce que l'entreprise a activé dans son propre plan.

---

### Plan CABINET

**Objectif :** Cabinet d'expertise comptable avec équipe.

**Ce que ce plan donne :**
Tout le plan Comptable Solo, plus :
- Entreprises clientes : 30 maximum
- Utilisateurs du cabinet : 10 (collaborateurs)
- Gestion des droits par collaborateur ✅
- Tableau de bord consolidé ✅
- Exports illimités ✅
- Support prioritaire ✅

---

### Plan CABINET PRO

**Objectif :** Grand cabinet, volume élevé.

**Ce que ce plan donne :**
Tout le plan Cabinet, plus :
- Entreprises clientes : illimitées
- Utilisateurs du cabinet : illimités
- API accès ✅
- Whitelabel partiel ✅
- Account manager dédié ✅

---

## 5. Règles transverses (tous plans)

### 5.1 Quotas et blocages

```
À l'atteinte d'un quota :
- L'action est bloquée avec message explicite
- Un bouton d'upgrade est proposé
- Les données existantes ne sont jamais supprimées
- Aucune dégradation silencieuse

En cas de downgrade de plan :
- Les données au-dessus du quota sont conservées (lecture seule)
- La création de nouvelles données est bloquée
- L'utilisateur est notifié clairement
```

### 5.2 Période d'essai

```
- Durée : 14 jours
- Accès : plan Professionnel complet (hors Stock et RH)
- Pas de carte bancaire requise pour l'essai
- Rappels automatiques : J-7, J-3, J-1, J0
- À expiration : basculement automatique sur plan STARTER
- Les données restent accessibles (lecture seule si quota dépassé)
```

### 5.3 Upgrade et downgrade

```
Upgrade :
- Effectif immédiatement
- Prorata calculé sur la période restante
- Nouveaux modules accessibles instantanément

Downgrade :
- Effectif à la fin de la période en cours
- Modules perdus deviennent inaccessibles à la date effective
- Données conservées (lecture seule si hors quota)
```

### 5.4 Résiliation

```
- Effective à la fin de la période payée
- Données conservées 90 jours après résiliation
- Export possible pendant ces 90 jours
- Suppression définitive après 90 jours (conformité RGPD)
- Processus documenté dans account.deletion.service.ts
```

---

## 6. Règles d'application technique

### 6.1 Vérification des quotas

Chaque action qui peut atteindre un quota doit être vérifiée AVANT exécution :

```
Flux obligatoire :
  Controller reçoit la requête
  → quota.service.checkQuota(companyId, 'invoices')
  → Si quota atteint → erreur 403 avec code QUOTA_EXCEEDED
  → Si quota OK → continuer vers le service métier
```

### 6.2 Vérification des modules

Chaque accès à un module doit vérifier que le plan actif l'inclut :

```
Flux obligatoire :
  Middleware vérifie : company.activeSubscription.plan
  → Si module non inclus dans le plan → erreur 403 avec code MODULE_NOT_AVAILABLE
  → Message UI : "Ce module n'est pas inclus dans votre plan actuel."
```

### 6.3 Champs DB impliqués

```
companies.subscription_status    : 'trial' | 'active' | 'past_due' | 'cancelled'
companies.plan_type              : 'starter' | 'essentiel' | 'professionnel' | 'entreprise' | 'comptable_solo' | 'cabinet' | 'cabinet_pro'
companies.trial_ends_at          : timestamp
companies.subscription_ends_at  : timestamp
packages.*                       : définition des plans (table packages)
subscriptions.*                  : abonnements actifs par entreprise
```

### 6.4 Source de vérité des plans

La table `packages` en DB est la source de vérité des plans actifs.
Le code ne doit jamais avoir des plans en dur (hardcodé).
Toute modification de plan passe par la table `packages` (admin uniquement).

---

## 7. Ce que DOC-11 ne définit pas volontairement

- ❌ Pas de prix (variables selon marché et stratégie commerciale)
- ❌ Pas de devises de facturation du SaaS lui-même
- ❌ Pas de règles de remise ou de promotion
- ❌ Pas de programmes de parrainage

Ces éléments sont commerciaux, pas métier. Ils sont gérés séparément.

---

## 8. Alignement avec les autres documents

- **DOC-01** : le datarissage est disponible pour tous les plans (acte fondateur)
- **DOC-03** : le Stock n'est accessible qu'à partir du plan Entreprise
- **DOC-04** : la RH n'est accessible qu'à partir du plan Entreprise
- **DOC-05** : l'espace Expert-Comptable est exclusif aux plans Famille B
- **DOC-06** : les permissions RBAC s'appliquent À L'INTÉRIEUR d'un plan (pas à la place)
- **DOC-08** : l'audit trail est actif sur tous les plans (pas négociable)
- **DOC-09** : les périodes fiscales sont disponibles à partir du plan Professionnel

---

## Résumé des accès par module

| Module | Starter | Essentiel | Pro | Entreprise | Comptable Solo/Cabinet |
|--------|---------|-----------|-----|------------|----------------------|
| Facturation | ✅ (limité) | ✅ | ✅ | ✅ | Via client |
| Comptabilité | ❌ | ❌ | ✅ | ✅ | Via client |
| Stock | ❌ | ❌ | ❌ | ✅ | Via client |
| RH | ❌ | ❌ | ❌ | ✅ | Via client |
| Rapports | ❌ | ❌ | ✅ | ✅ | Via client |
| Multi-devises | ❌ | ❌ | ✅ | ✅ | Via client |
| Export fiscal | ❌ | ❌ | ✅ | ✅ | Via client |
| Audit trail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Espace Expert-Comptable | ❌ | ❌ | ❌ | ❌ | ✅ |

---

*Fin du DOC-11 — Plans tarifaires & Quotas — Version 1.0 — Mars 2026*
*Les prix sont définis séparément dans la stratégie commerciale.*
