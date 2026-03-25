# PLAN D'ADAPTATION DASHBOARD CONTA
**Date**: 2026-03-25  
**Objectif**: Adapter le dashboard avec les fonctionnalités disponibles dans Conta

---

## ANALYSE IMAGE DE RÉFÉRENCE

### Sections identifiées dans l'image
1. **KPIs principaux** (4 cartes en haut)
   - Income (Revenus) avec variation
   - Expense (Dépenses) avec variation
   - Savings (Épargne) avec variation
   - Investment (Investissements) avec variation

2. **Cashflow** (graphique ligne)
   - Évolution sur 7 jours
   - Income vs Expense
   - Total Balance affiché

3. **Expense Breakdown** (graphique donut)
   - Répartition par catégorie
   - Food & Dining 50%
   - Utilities 30%
   - Investment 20%

4. **Finance Score**
   - Score de santé financière (92%)
   - Barre de progression

5. **Balance** (cartes bancaires)
   - Soldes par compte
   - Numéros de carte

6. **Recent Transactions** (liste)
   - Nom transaction
   - Compte/méthode
   - Date
   - Montant
   - Statut

7. **Saving Plans** (barres de progression)
   - Emergency Fund
   - Retirement Fund
   - Vacation Fund

8. **Recent Activities** (timeline)
   - Activités récentes avec timestamps

---

## ADAPTATION POUR CONTA

### 1. KPIs PRINCIPAUX (4 cartes) ✅ DISPONIBLE

**Données disponibles dans DashboardStats**:
- ✅ `revenueThisMonth` → Income
- ✅ `expensesThisMonth` → Expense
- ✅ `revenueGrowth` → Variation Income
- ✅ `expensesGrowth` → Variation Expense

**Adaptation Conta**:
```typescript
KPI 1: Revenus du mois
- Valeur: revenueThisMonth
- Variation: revenueGrowth (%)
- Icône: TrendingUp
- Couleur: Vert si positif, Rouge si négatif

KPI 2: Dépenses du mois
- Valeur: expensesThisMonth
- Variation: expensesGrowth (%)
- Icône: Receipt
- Couleur: Orange

KPI 3: Profit du mois
- Valeur: profitThisMonth (revenueThisMonth - expensesThisMonth)
- Variation: profitMargin (%)
- Icône: DollarSign
- Couleur: Vert si positif, Rouge si négatif

KPI 4: Factures impayées
- Valeur: unpaidAmount
- Nombre: unpaidInvoices
- Icône: FileText
- Couleur: Rouge si > 0
```

---

### 2. CASHFLOW (Graphique ligne) ✅ DISPONIBLE

**Données disponibles**:
- ✅ `revenueByMonth` → Income par mois
- ✅ `expensesByMonth` → Expense par mois
- ✅ `profitByMonth` → Profit par mois

**Adaptation Conta**:
```typescript
Graphique: Revenus vs Dépenses (6 derniers mois)
- Ligne verte: Revenus (revenueByMonth)
- Ligne rouge: Dépenses (expensesByMonth)
- Ligne bleue: Profit (profitByMonth)
- Total Balance: totalRevenue - totalExpenses
```

**Amélioration suggérée**:
- Ajouter filtre période (7 jours, 30 jours, 3 mois, 6 mois, 1 an)
- Ajouter zoom sur graphique
- Ajouter tooltip détaillé

---

### 3. EXPENSE BREAKDOWN (Graphique donut) ⚠️ PARTIELLEMENT DISPONIBLE

**Données disponibles**:
- ✅ `topSuppliers` → Top fournisseurs par dépenses
- ❌ Catégories de dépenses (pas dans DashboardStats)

**Adaptation Conta**:
```typescript
Option 1: Dépenses par fournisseur (DISPONIBLE)
- Utiliser topSuppliers
- Afficher top 5 fournisseurs
- Graphique donut avec pourcentages

Option 2: Dépenses par catégorie (À AJOUTER)
- Créer nouvelle méthode getExpensesByCategory()
- Grouper par expense_category_id
- Afficher top 5 catégories
```

**Recommandation**: Implémenter Option 2 (plus pertinent)

**Nouvelle méthode backend à ajouter**:
```typescript
private async getExpensesByCategory(
  companyId: string
): Promise<Array<{ category: string; amount: number; percentage: number }>> {
  // Grouper dépenses par catégorie
  // Calculer pourcentages
  // Retourner top 5
}
```

---

### 4. FINANCE SCORE ❌ NON DISPONIBLE

**Données disponibles**:
- ✅ `collectionRate` → Taux de recouvrement
- ✅ `profitMargin` → Marge bénéficiaire
- ✅ `averageDaysToPay` → Délai moyen paiement

**Adaptation Conta - Créer "Score de Santé Financière"**:
```typescript
Calcul du score (0-100):
- 40% : Taux de recouvrement (collectionRate)
- 30% : Marge bénéficiaire (profitMargin)
- 20% : Délai de paiement (100 - averageDaysToPay/60*100)
- 10% : Ratio factures en retard (100 - overdueInvoices/totalInvoices*100)

Affichage:
- Score 90-100: Excellent (vert)
- Score 70-89: Bon (bleu)
- Score 50-69: Moyen (orange)
- Score 0-49: Faible (rouge)
```

**Nouvelle méthode backend à ajouter**:
```typescript
private calculateFinanceScore(stats: DashboardStats): {
  score: number;
  rating: string;
  color: string;
} {
  // Calculer score selon formule
  // Retourner score + rating
}
```

---

### 5. BALANCE (Comptes bancaires) ❌ NON DISPONIBLE

**Données disponibles**:
- ❌ Pas de gestion comptes bancaires dans DashboardStats

**Adaptation Conta - Créer "Soldes de Trésorerie"**:
```typescript
Option 1: Solde global (SIMPLE)
- Afficher: totalRevenue - totalExpenses
- Label: "Trésorerie nette"

Option 2: Soldes par compte (AVANCÉ)
- Nécessite table bank_accounts
- Afficher soldes par compte
- Afficher total
```

**Recommandation**: Option 1 pour MVP, Option 2 pour version avancée

**Nouvelle route backend à ajouter** (si Option 2):
```typescript
GET /bank-accounts
- Retourner liste comptes avec soldes
- Filtrer par companyId
```

---

### 6. RECENT TRANSACTIONS ✅ DISPONIBLE

**Données disponibles**:
- ✅ `recentPayments` → Paiements récents (10)

**Adaptation Conta**:
```typescript
Liste: Paiements récents
- Nom: customerName
- Facture: invoiceNumber
- Date: paymentDate
- Montant: amount + currency
- Statut: "Confirmé" (badge vert)

Amélioration:
- Ajouter méthode de paiement (cash, bank, mobile money)
- Ajouter icône selon méthode
- Ajouter lien vers facture
```

---

### 7. SAVING PLANS (Plans d'épargne) ❌ NON APPLICABLE

**Adaptation Conta - Créer "Objectifs Financiers"**:
```typescript
Option 1: Objectifs de CA (PERTINENT)
- Objectif CA mensuel
- CA actuel
- Progression (%)
- Barre de progression

Option 2: Objectifs de recouvrement (PERTINENT)
- Objectif: 100% factures payées
- Actuel: collectionRate
- Progression
- Barre de progression

Option 3: Objectifs personnalisés (AVANCÉ)
- Table goals (id, name, target, current, deadline)
- Afficher top 3 objectifs
- Barres de progression
```

**Recommandation**: Option 1 + Option 2 pour MVP

**Nouvelle méthode backend à ajouter**:
```typescript
private async getFinancialGoals(
  companyId: string
): Promise<Array<{
  name: string;
  target: number;
  current: number;
  percentage: number;
}>> {
  // Objectif CA mensuel
  // Objectif recouvrement
  // Retourner liste
}
```

---

### 8. RECENT ACTIVITIES (Timeline) ⚠️ PARTIELLEMENT DISPONIBLE

**Données disponibles**:
- ❌ Pas de log d'activités dans DashboardStats

**Adaptation Conta - Créer "Activités Récentes"**:
```typescript
Sources d'activités:
- Factures créées (invoices)
- Paiements reçus (payments)
- Dépenses créées (expenses)
- Clients créés (customers)

Affichage:
- Icône selon type
- Description
- Timestamp relatif (il y a 2h)
- Couleur selon type
```

**Nouvelle méthode backend à ajouter**:
```typescript
private async getRecentActivities(
  companyId: string,
  limit: number = 10
): Promise<Array<{
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}>> {
  // Union de plusieurs tables
  // Trier par date DESC
  // Limiter à 10
}
```

---

## FONCTIONNALITÉS SUPPLÉMENTAIRES CONTA

### 9. TOP CLIENTS ✅ DISPONIBLE
**Données**: `topCustomers`
```typescript
Section: Meilleurs clients
- Nom client
- CA total
- Nombre factures
- Graphique barre horizontale
```

### 10. FACTURES PAR STATUT ✅ DISPONIBLE
**Données**: `invoicesByStatus`
```typescript
Section: Répartition factures
- Graphique donut
- Draft, Sent, Paid, Overdue, Cancelled
- Pourcentages
```

### 11. CRÉANCES EN COURS ✅ DISPONIBLE
**Données**: `outstandingByMonth`
```typescript
Section: Évolution créances
- Graphique ligne
- Créances par mois (12 mois)
- Tendance
```

### 12. ALERTES ET NOTIFICATIONS ⚠️ À CRÉER
```typescript
Section: Alertes importantes
- Factures en retard (overdueInvoices)
- Stock faible (si module activé)
- Abonnement expire bientôt
- Quota atteint
```

---

## LAYOUT PROPOSÉ POUR CONTA

### Version Desktop (3 colonnes)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Dashboard - Période: [Filtre]                      │
├─────────────────────────────────────────────────────────────┤
│  KPI 1        KPI 2        KPI 3        KPI 4               │
│  Revenus      Dépenses     Profit       Impayés             │
├─────────────────────────────────────────────────────────────┤
│  CASHFLOW (Graphique ligne - 2/3 largeur)  │ FINANCE SCORE │
│  Revenus vs Dépenses (6 mois)              │ Score: 92%    │
│                                             │ Excellent     │
│                                             ├───────────────┤
│                                             │ TRÉSORERIE    │
│                                             │ Solde net     │
├─────────────────────────────────────────────┴───────────────┤
│  DÉPENSES PAR CATÉGORIE  │  TOP CLIENTS                     │
│  (Graphique donut)       │  (Liste avec barres)             │
├──────────────────────────┴──────────────────────────────────┤
│  PAIEMENTS RÉCENTS       │  OBJECTIFS FINANCIERS            │
│  (Liste 10)              │  (Barres progression)            │
├──────────────────────────┴──────────────────────────────────┤
│  ACTIVITÉS RÉCENTES      │  ALERTES                         │
│  (Timeline)              │  (Liste alertes)                 │
└─────────────────────────────────────────────────────────────┘
```

### Version Mobile (1 colonne)
```
┌─────────────────────┐
│  KPI 1 - Revenus    │
├─────────────────────┤
│  KPI 2 - Dépenses   │
├─────────────────────┤
│  KPI 3 - Profit     │
├─────────────────────┤
│  KPI 4 - Impayés    │
├─────────────────────┤
│  FINANCE SCORE      │
├─────────────────────┤
│  CASHFLOW           │
│  (Graphique)        │
├─────────────────────┤
│  DÉPENSES           │
│  (Donut)            │
├─────────────────────┤
│  PAIEMENTS RÉCENTS  │
├─────────────────────┤
│  TOP CLIENTS        │
├─────────────────────┤
│  OBJECTIFS          │
├─────────────────────┤
│  ACTIVITÉS          │
└─────────────────────┘
```

---

## PLAN D'IMPLÉMENTATION

### Phase 1 - Améliorer OwnerDashboard existant (2-3h)
**Priorité**: HAUTE

1. ✅ Garder KPIs actuels (déjà OK)
2. ✅ Garder graphique CA mensuel (déjà OK)
3. ✅ Garder listes factures/paiements (déjà OK)
4. ➕ Ajouter Finance Score (calculé frontend)
5. ➕ Ajouter Trésorerie nette (calculé frontend)
6. ➕ Ajouter Dépenses par catégorie (nouveau graphique donut)
7. ➕ Ajouter Top clients (graphique barres horizontales)
8. ➕ Améliorer responsive mobile

**Fichiers à modifier**:
- `frontend/src/components/dashboard/OwnerDashboard.tsx`

**Nouvelles dépendances**:
- recharts (déjà installé) pour donut chart
- Composant FinanceScore (à créer)
- Composant ExpenseBreakdown (à créer)

---

### Phase 2 - Ajouter méthodes backend (2-3h)
**Priorité**: MOYENNE

1. ➕ `getExpensesByCategory()` → Dépenses par catégorie
2. ➕ `calculateFinanceScore()` → Score santé financière
3. ➕ `getFinancialGoals()` → Objectifs financiers
4. ➕ `getRecentActivities()` → Activités récentes

**Fichiers à modifier**:
- `backend/src/services/dashboard.service.ts`
- `backend/src/controllers/dashboard.controller.ts`
- Interface `DashboardStats`

---

### Phase 3 - Créer composants réutilisables (2-3h)
**Priorité**: MOYENNE

1. `FinanceScoreCard.tsx` → Carte score financier
2. `ExpenseBreakdownChart.tsx` → Graphique donut dépenses
3. `FinancialGoalsCard.tsx` → Carte objectifs avec barres
4. `RecentActivitiesTimeline.tsx` → Timeline activités
5. `AlertsCard.tsx` → Carte alertes importantes

**Dossier**: `frontend/src/components/dashboard/cards/`

---

### Phase 4 - Ajouter filtres et interactions (1-2h)
**Priorité**: BASSE

1. Filtre période (7j, 30j, 3m, 6m, 1an)
2. Refresh manuel
3. Export PDF dashboard
4. Personnalisation widgets (drag & drop)

---

## MÉTRIQUES CIBLES

### Performance
- Temps de chargement: < 2s
- Taille bundle: < 500KB
- Requêtes API: 1-2 max

### UX
- Responsive: Mobile + Tablet + Desktop
- Accessibilité: WCAG AA
- Animations: Smooth transitions

### Données
- Mise à jour: Temps réel (WebSocket)
- Cache: 15 minutes
- Invalidation: Automatique sur événements

---

## COMPARAISON AVANT/APRÈS

### AVANT (Dashboard actuel)
- 4 KPIs basiques
- 1 graphique CA mensuel
- 2 listes (factures, paiements)
- Design simple
- Pas de score santé
- Pas de catégorisation dépenses
- Pas d'objectifs

### APRÈS (Dashboard adapté)
- 4 KPIs avec variations
- 3 graphiques (CA, Dépenses, Créances)
- Score santé financière
- Dépenses par catégorie (donut)
- Top clients (barres)
- Objectifs financiers (progression)
- Activités récentes (timeline)
- Alertes importantes
- Design moderne et responsive
- Temps réel (WebSocket)

---

## CONCLUSION

### Fonctionnalités disponibles immédiatement
✅ KPIs avec variations  
✅ Graphique Cashflow  
✅ Paiements récents  
✅ Top clients  
✅ Factures par statut  
✅ Créances en cours  

### Fonctionnalités à développer
➕ Finance Score (calcul frontend simple)  
➕ Dépenses par catégorie (backend + frontend)  
➕ Objectifs financiers (backend + frontend)  
➕ Activités récentes (backend + frontend)  
➕ Alertes (frontend simple)  

### Estimation totale
- Phase 1: 2-3h (améliorer dashboard)
- Phase 2: 2-3h (backend)
- Phase 3: 2-3h (composants)
- Phase 4: 1-2h (filtres)
- **Total: 7-11h de développement**

### Recommandation
Commencer par Phase 1 (améliorer OwnerDashboard) car:
- Impact immédiat visible
- Utilise données déjà disponibles
- Pas de changement backend requis
- Peut être déployé rapidement

Ensuite Phase 2 pour enrichir les données, puis Phase 3 pour les autres dashboards.
