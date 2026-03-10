# DOC-02 — Architecture cible & mécanismes anti-données erronées

(Fondation technique – version exécutable pour Cursor)

## 1. Principe cardinal (à ne jamais violer)

**Aucune donnée critique ne doit être modifiée directement.**

Toute modification doit passer par un événement métier validé.

### Conséquence immédiate :

- ❌ plus de `UPDATE quantity = quantity - x`
- ❌ plus de recalcul implicite
- ❌ plus de logique "dispersée"

👉 **Tout devient traçable, vérifiable, réversible.**

## 2. Architecture cible (vue globale)

### 2.1 Modules comme domaines métiers

Chaque module est un domaine autonome :

- **Facturation**
- **Stock**
- **Comptabilité**
- **RH**

Ils communiquent uniquement par événements.

### 2.2 Event Bus interne (léger)

Pas besoin de Kafka.

Un simple mécanisme interne suffit :

- `DomainEvent`
- `EventHandler`
- transaction partagée

**Exemples :**

- `InvoiceValidated`
- `StockMovementCreated`
- `PayrollValidated`

## 3. Règles anti-chiffres faux (le cœur du système)

### Règle 1 — Aucune écriture directe sur les agrégats

**Interdiction stricte de :**

- modifier un stock courant
- modifier un solde comptable
- modifier un cumul RH

Ces valeurs sont **calculées à partir d'événements**.

### Règle 2 — Un événement = une vérité

Chaque événement :

- est immuable
- a un auteur
- a un horodatage
- peut être audité

**Exemples :**

- Mouvement de stock
- Écriture comptable
- Paiement de salaire

### Règle 3 — Inversion, jamais suppression

Une erreur n'est jamais supprimée.

On crée :

- un événement inverse
- explicitement lié à l'original

👉 **C'est la norme comptable et ERP.**

## 4. Application concrète par module

### 4.1 Stock

- **Table `stock_movements`**
- **Types :** `IN`, `OUT`, `ADJUST`, `TRANSFER`
- Le stock courant = **vue calculée**
- Support multi-entrepôts natif

**Interdiction :**

- ❌ modifier un stock sans mouvement
- ❌ supprimer un mouvement validé

### 4.2 Facturation

- Facture = document métier
- Validation = événement
- Annulation = événement inverse
- La facture ne touche jamais le stock directement

### 4.3 Comptabilité

- Écritures générées automatiquement
- Journal immuable
- Balance calculée, pas stockée

### 4.4 RH

- Salaire = événement de paie
- Paie validée → écritures comptables
- Congés/absences historisés

## 5. Transactions atomiques (non négociable)

Un flux métier critique doit être :

- **tout ou rien**
- stock + compta + RH synchronisés

**Exemple :**

```
Validation facture
→ création événement facture
→ mouvement stock
→ écritures comptables
→ commit unique
```

Sinon : **rollback total**.

## 6. Garde-fous techniques obligatoires

### 6.1 Services comme uniques points d'écriture

Pas d'update direct via controller

Pas de script sauvage

Pas de seed destructif

**Tout passe par :**

- `InvoiceService`
- `StockService`
- `AccountingService`
- `HRService`

### 6.2 Middleware & policies

- Vérification datarissage
- Vérification modules activés
- Vérification permissions

## 7. Indicateurs de fiabilité (monitoring métier)

À implémenter :

- stock négatif interdit si désactivé
- incohérence stock ↔ factures
- écriture comptable manquante
- paie sans écriture

👉 **Un ERP pro se surveille lui-même.**

## 8. Ce document est exécutable par Cursor

**Prompt type :**

> "Refactorise les modules existants pour respecter strictement les règles du DOC-02.
> Supprime toute écriture directe sur les agrégats.
> Implémente un Event Bus interne léger et des services atomiques."

