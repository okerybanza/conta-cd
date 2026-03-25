# AUDIT ÉCART BACKEND/FRONTEND CONTA.CD

**Date**: 2026-03-25  
**Objectif**: Identifier les fonctionnalités backend non exposées dans le frontend

---

## RÉSUMÉ EXÉCUTIF

Sur 54 routes backend analysées:
- ✅ **40 routes** ont un service frontend correspondant (74%)
- ❌ **14 routes** n'ont PAS de service frontend (26%)
- ⚠️ **2 interfaces** frontend sont incomplètes (Supplier, Product)
- ⚠️ **5 fonctionnalités** partiellement implémentées

---

## 1. ROUTES BACKEND SANS SERVICE FRONTEND

### 🔴 PRIORITÉ HAUTE (Impact utilisateur direct)

#### 1.1 expenseCategory - Catégories de dépenses
- **Route backend**: `/api/v1/expense-categories/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Impossible de créer/gérer des catégories de dépenses
- **Utilité**: Organiser les dépenses par catégorie (Loyer, Salaires, Fournitures, etc.)
- **Action**: Créer `expenseCategory.service.ts`

#### 1.2 mobileMoney - Paiements mobile money
- **Route backend**: `/api/v1/mobile-money/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Impossible d'intégrer les paiements mobile money (M-Pesa, Orange Money, Airtel Money)
- **Utilité**: Accepter paiements via mobile money en RDC
- **Action**: Créer `mobileMoney.service.ts`

#### 1.3 settings - Paramètres système
- **Route backend**: `/api/v1/settings/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Paramètres système non configurables depuis l'interface
- **Utilité**: Configuration globale de l'application
- **Action**: Créer `settings.service.ts`

### 🟡 PRIORITÉ MOYENNE (Fonctionnalités avancées)

#### 1.4 accountingReports - Rapports comptables
- **Route backend**: `/api/v1/accounting-reports/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Rapports comptables non générables depuis le frontend
- **Utilité**: Bilan, compte de résultat, flux de trésorerie
- **Note**: `financialStatements.service.ts` existe mais ne couvre pas tous les rapports
- **Action**: Créer `accountingReports.service.ts` ou étendre `financialStatements`

#### 1.5 ohadaExport - Export OHADA
- **Route backend**: `/api/v1/ohada-export/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Export comptable OHADA non accessible
- **Utilité**: Export des données comptables au format OHADA
- **Action**: Créer `ohadaExport.service.ts`

#### 1.6 approvalWorkflow - Workflow d'approbation
- **Route backend**: `/api/v1/approval-workflow/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Pas de gestion des workflows d'approbation
- **Utilité**: Validation multi-niveaux des documents (factures, dépenses)
- **Action**: Créer `approvalWorkflow.service.ts`

#### 1.7 subscription - Gestion abonnements
- **Route backend**: `/api/v1/subscription/*`
- **Service frontend**: ❌ MANQUANT (mais `package.service.ts` existe)
- **Impact**: Gestion abonnements limitée
- **Utilité**: Upgrade/downgrade plans, historique facturation
- **Action**: Créer `subscription.service.ts` ou étendre `package.service.ts`

### 🟢 PRIORITÉ BASSE (Fonctionnalités optionnelles)

#### 1.8 assistant - Assistant IA
- **Route backend**: `/api/v1/assistant/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Fonctionnalité assistant IA non accessible
- **Utilité**: Aide contextuelle, suggestions automatiques
- **Action**: Créer `assistant.service.ts`

#### 1.9 realtime - WebSocket temps réel
- **Route backend**: `/api/v1/realtime/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Pas de notifications temps réel
- **Utilité**: Notifications instantanées, collaboration temps réel
- **Action**: Créer `realtime.service.ts` avec WebSocket

#### 1.10 webPush - Notifications push web
- **Route backend**: `/api/v1/web-push/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Pas de notifications push navigateur
- **Utilité**: Notifications même quand l'app est fermée
- **Action**: Créer `webPush.service.ts`

#### 1.11 webhook - Webhooks
- **Route backend**: `/api/v1/webhook/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Intégrations webhook non configurables
- **Utilité**: Intégrations tierces (Zapier, Make, etc.)
- **Action**: Créer `webhook.service.ts`

#### 1.12 referral - Programme de parrainage
- **Route backend**: `/api/v1/referral/*`
- **Service frontend**: ❌ MANQUANT
- **Impact**: Programme parrainage non accessible
- **Utilité**: Système de parrainage avec récompenses
- **Action**: Créer `referral.service.ts`

### ⚪ ROUTES OBSOLÈTES OU DUPLIQUÉES

#### 1.13 datarissage - Onboarding initial
- **Route backend**: `/api/v1/datarissage/*`
- **Service frontend**: ❌ MANQUANT (mais onboarding existe)
- **Impact**: Possible doublon
- **Note**: Le composant `OnboardingWizard.tsx` existe déjà
- **Action**: Vérifier si route obsolète ou si onboarding utilise une autre route

#### 1.14 hr - Ressources Humaines (route générale)
- **Route backend**: `/api/v1/hr/*`
- **Service frontend**: ⚠️ PARTIEL (employee, payroll, attendance, etc. existent)
- **Impact**: Services RH fragmentés
- **Note**: Les services RH sont éclatés en plusieurs fichiers
- **Action**: Vérifier si tous les endpoints HR sont couverts

---

## 2. INTERFACES FRONTEND INCOMPLÈTES

### 2.1 Supplier - Interface incomplète

**Champs backend disponibles**:
```typescript
{
  id: string;
  name: string;
  businessName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  nif?: string;
  rccm?: string;
  notes?: string;
  accountId?: string;  // Lien avec compte comptable
  logoUrl?: string;
  isActive?: boolean;
}
```

**Champs frontend actuels**:
```typescript
{
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
}
```

**❌ Champs manquants**:
- `businessName` - Nom entreprise fournisseur
- `contactPerson` - Personne de contact
- `address` - Adresse complète
- `postalCode` - Code postal
- `nif` - Numéro identification fiscale
- `rccm` - Registre de commerce
- `notes` - Notes internes
- `accountId` - Lien compte comptable (important pour comptabilité)
- `logoUrl` - Logo fournisseur
- `isActive` - Statut actif/inactif

**Impact**: Formulaire fournisseur incomplet, données perdues

---

### 2.2 Product - Interface incomplète

**Champs backend disponibles**:
```typescript
{
  id: string;
  name: string;
  description?: string;
  sku?: string;              // Code article
  category?: string;         // Catégorie produit
  unitPrice: number;
  costPrice?: number;        // Prix de revient
  taxRate?: number;
  unit?: string;             // Unité (pièce, kg, m, etc.)
  stockTracking?: boolean;   // Suivi stock activé
  minStock?: number;         // Stock minimum
  maxStock?: number;         // Stock maximum
  active?: boolean;
}
```

**Champs frontend actuels**:
```typescript
{
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  taxRate?: number;
  unit?: string;
  active?: boolean;
}
```

**❌ Champs manquants**:
- `sku` - Code article (important pour gestion stock)
- `category` - Catégorie produit (organisation)
- `costPrice` - Prix de revient (calcul marge)
- `stockTracking` - Activer suivi stock
- `minStock` - Alerte stock minimum
- `maxStock` - Alerte stock maximum

**Impact**: Gestion produits limitée, pas de suivi stock avancé

---

## 3. FONCTIONNALITÉS PARTIELLEMENT IMPLÉMENTÉES

### 3.1 Customer Logo Upload
- **Backend**: Route `/customers/:id/logo` existe
- **Frontend**: Service `uploadLogo()` existe mais pas utilisé dans formulaire
- **Status**: ✅ CORRIGÉ (2026-03-25) - Upload logo ajouté au formulaire entreprise

### 3.2 Quotation Convert to Invoice
- **Backend**: Route `/quotations/:id/convert` existe
- **Frontend**: Service existe mais nécessite devis accepté d'abord
- **Status**: ✅ CORRIGÉ (2026-03-25) - Route `/convert` ajoutée

### 3.3 Invoice PDF Generation
- **Backend**: Route `/invoices/:id/pdf` existe
- **Frontend**: Pas de bouton "Télécharger PDF" dans liste/détail facture
- **Status**: ⚠️ À IMPLÉMENTER

### 3.4 Stock Movements
- **Backend**: Route `/stock-movements/*` existe
- **Frontend**: Service `stockMovement.service.ts` existe mais interface limitée
- **Status**: ⚠️ À AMÉLIORER

### 3.5 Recurring Invoices Manual Generation
- **Backend**: Route `/recurring-invoices/:id/generate` existe
- **Frontend**: Pas de bouton "Générer maintenant" dans l'interface
- **Status**: ⚠️ À IMPLÉMENTER

---

## 4. RECOMMANDATIONS PAR PRIORITÉ

### 🔴 PRIORITÉ 1 - À IMPLÉMENTER IMMÉDIATEMENT

1. **Compléter interface Supplier**
   - Ajouter tous les champs manquants
   - Mettre à jour formulaire fournisseur
   - Fichier: `frontend/src/services/supplier.service.ts`

2. **Compléter interface Product**
   - Ajouter champs SKU, category, costPrice, stock tracking
   - Mettre à jour formulaire produit
   - Fichier: `frontend/src/services/product.service.ts`

3. **Créer service expenseCategory**
   - Permettre gestion catégories de dépenses
   - Ajouter page liste/formulaire catégories
   - Fichier: `frontend/src/services/expenseCategory.service.ts`

4. **Créer service mobileMoney**
   - Intégrer paiements mobile money
   - Ajouter dans options de paiement
   - Fichier: `frontend/src/services/mobileMoney.service.ts`

### 🟡 PRIORITÉ 2 - À IMPLÉMENTER PROCHAINEMENT

5. **Créer service settings**
   - Page paramètres système
   - Configuration globale app
   - Fichier: `frontend/src/services/settings.service.ts`

6. **Créer service accountingReports**
   - Génération rapports comptables
   - Export PDF/Excel
   - Fichier: `frontend/src/services/accountingReports.service.ts`

7. **Créer service ohadaExport**
   - Export OHADA
   - Conformité comptable RDC
   - Fichier: `frontend/src/services/ohadaExport.service.ts`

8. **Ajouter bouton PDF factures**
   - Télécharger PDF depuis liste
   - Télécharger PDF depuis détail
   - Fichier: `frontend/src/pages/invoices/*`

### 🟢 PRIORITÉ 3 - FONCTIONNALITÉS AVANCÉES

9. **Créer service approvalWorkflow**
10. **Créer service subscription**
11. **Créer service assistant**
12. **Créer service realtime**
13. **Créer service webPush**
14. **Créer service webhook**
15. **Créer service referral**

---

## 5. PLAN D'ACTION

### Phase 1 - Interfaces complètes (1-2 jours)
- [ ] Compléter `supplier.service.ts` avec tous les champs
- [ ] Compléter `product.service.ts` avec tous les champs
- [ ] Mettre à jour formulaires correspondants
- [ ] Tests TypeScript 0 erreurs

### Phase 2 - Services critiques (2-3 jours)
- [ ] Créer `expenseCategory.service.ts`
- [ ] Créer `mobileMoney.service.ts`
- [ ] Créer `settings.service.ts`
- [ ] Créer pages/formulaires associés

### Phase 3 - Fonctionnalités manquantes (2-3 jours)
- [ ] Ajouter boutons PDF factures
- [ ] Ajouter génération manuelle factures récurrentes
- [ ] Améliorer interface stock movements

### Phase 4 - Services avancés (5-7 jours)
- [ ] Créer `accountingReports.service.ts`
- [ ] Créer `ohadaExport.service.ts`
- [ ] Créer `approvalWorkflow.service.ts`
- [ ] Créer `subscription.service.ts`

### Phase 5 - Fonctionnalités optionnelles (selon besoin)
- [ ] Assistant IA
- [ ] WebSocket temps réel
- [ ] Notifications push
- [ ] Webhooks
- [ ] Programme parrainage

---

## 6. MÉTRIQUES

### Couverture actuelle
- Routes backend: 54
- Services frontend: 40
- **Taux de couverture: 74%**

### Interfaces complètes
- Customer: ✅ 100%
- Invoice: ✅ 100%
- Supplier: ❌ 50%
- Product: ❌ 60%

### Objectif
- **Taux de couverture cible: 90%** (49/54 routes)
- **Interfaces complètes: 100%**
- **Délai: 2-3 semaines**

---

## CONCLUSION

L'écart backend/frontend est **modéré** (26% de routes non couvertes) mais impacte des fonctionnalités importantes:
- Gestion catégories de dépenses
- Paiements mobile money
- Paramètres système
- Interfaces Supplier et Product incomplètes

**Priorité immédiate**: Compléter les interfaces Supplier et Product, puis créer les services manquants critiques (expenseCategory, mobileMoney, settings).

**Statut global**: 🟡 ÉCART MODÉRÉ - ACTION REQUISE
