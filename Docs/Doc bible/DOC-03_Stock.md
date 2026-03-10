# DOC-03 — Module Stock avancé (standards ERP complets)
**(Spécification métier + technique, exécutable par Cursor)**

---

## 1. Rôle du module Stock (rappel fondamental)

Le module Stock **n'est pas** :
- ❌ une table de quantités
- ❌ un champ `quantity`

Le module Stock **est** :
- ✅ un registre de mouvements immuables permettant de calculer un état fiable à tout instant

**Toute autre approche produit des chiffres faux tôt ou tard.**

---

## 2. Concepts métiers incontournables

### 2.1 Entités cœur

- **Produit**
- **Entrepôt (Warehouse)**
- **Mouvement de stock**
- **Ligne de mouvement (stock_movement_items)**

Optionnels selon configuration au datarissage :
- **Lot** (avec date d'expiration)
- **Numéro de série** (traçabilité unitaire)

### 2.2 Types de mouvements (standard ERP)

- **IN** : entrée (achat, retour client, ajustement +)
- **OUT** : sortie (vente, perte, ajustement -)
- **TRANSFER** : transfert entre entrepôts
- **ADJUSTMENT** : correction inventaire

**Aucun autre type ne doit exister.**
Le sens du mouvement est déterminé par le type, jamais par le signe de la quantité.

---

## 3. Modèle de données (conceptuel)

### 3.1 stock_movements

- `id`
- `company_id`
- `type` (IN / OUT / TRANSFER / ADJUSTMENT)
- `reference` (ID facture, ID inventaire, ID ajustement)
- `status` (DRAFT / VALIDATED)
- `created_by`
- `validated_by` (≠ created_by — SOD obligatoire)
- `validated_at`
- `reversed_from_id` (si inversion d'un mouvement existant)
- `justification` (obligatoire pour ADJUSTMENT et inversions)
- `created_at`

### 3.2 stock_movement_items

- `id`
- `stock_movement_id`
- `product_id`
- `warehouse_id` (entrepôt source)
- `warehouse_to_id` (entrepôt destination — TRANSFER uniquement)
- `quantity` (toujours positive — le sens est dans le type)
- `unit_cost` (pour valorisation — obligatoire si valorisation activée)
- `batch_id` (optionnel — si suivi par lots activé)
- `serial_id` (optionnel — si suivi par numéros de série activé)

---

## 4. Calcul du stock (règle non négociable)

Le stock courant est :
- ✅ une vue calculée (vue DB ou calcul à la demande)
- ❌ jamais une valeur stockée directement

**Formule :**
```
stock_courant(produit, entrepôt) =
  SUM(quantity WHERE type=IN AND warehouse_id=X AND status=VALIDATED)
  - SUM(quantity WHERE type=OUT AND warehouse_id=X AND status=VALIDATED)
  - SUM(quantity WHERE type=TRANSFER AND warehouse_id=X AND status=VALIDATED)  [sortie]
  + SUM(quantity WHERE type=TRANSFER AND warehouse_to_id=X AND status=VALIDATED) [entrée]
  + SUM(quantity WHERE type=ADJUSTMENT AND warehouse_id=X AND status=VALIDATED AND sens=positif)
  - SUM(quantity WHERE type=ADJUSTMENT AND warehouse_id=X AND status=VALIDATED AND sens=negatif)
```

Seuls les mouvements au statut **VALIDATED** entrent dans le calcul.
Les mouvements DRAFT n'affectent pas le stock courant.

---

## 5. Règles métier critiques

### 5.1 Validation d'un mouvement

**Avant validation — vérifications obligatoires :**
- Produit actif dans le catalogue
- Entrepôt valide et actif
- Module Stock activé au datarissage
- Datarissage complété (`companies.datarissage_completed = true`)
- Période stock non clôturée
- Ségrégation : `validated_by ≠ created_by`
- Si OUT ou TRANSFER : stock suffisant (sauf stock négatif autorisé)

**À la validation — effets atomiques :**
- Changement statut DRAFT → VALIDATED (transaction unique)
- Génération des écritures comptables si valorisation activée
- Émission de l'événement `StockMovementValidated`
- Entrée dans les audit_logs

### 5.2 Stock négatif

- **Interdit par défaut** pour tous les nouveaux entreprises
- **Autorisé uniquement** si configuré explicitement au datarissage
- Cas d'usage légitime : commerce qui vend sur commande avant réception fournisseur
- Si stock négatif interdit et tentative OUT dépassant le stock → **blocage immédiat avec message explicite**

### 5.3 Inversion d'un mouvement validé

Un mouvement validé :
- ❌ ne se supprime jamais
- ❌ ne se modifie jamais

**Correction = créer un nouveau mouvement inverse :**
- Même type mais sens inversé (ou type ADJUSTMENT avec sens opposé)
- Champ `reversed_from_id` référençant le mouvement original
- Justification obligatoire
- Soumis au même workflow de validation (SOD)

### 5.4 Activation tardive du Stock

Si le module Stock est activé **après** que l'entreprise a commencé à facturer :
- Les mouvements rétroactifs ne sont **pas** générés automatiquement
- Un **inventaire d'ouverture** (mouvement IN de type ADJUSTMENT) est obligatoire
- Cet inventaire est daté du jour d'activation, justifié, traçable
- Les factures antérieures restent sans lien stock (elles ont été émises hors module stock)
- À partir de l'activation : toutes les nouvelles factures validées génèrent des mouvements OUT

---

## 6. Intégration avec la facturation (DOC-07)

### 6.1 Flux standard

- Facture créée (DRAFT) → aucun impact stock
- Facture validée → événement `InvoiceValidated` → mouvement OUT généré automatiquement
- Facture annulée → événement `InvoiceCancelled` → mouvement OUT inversé automatiquement

**La facture n'écrit jamais directement dans le stock.**
Elle émet un événement. Le handler stock le consomme.

### 6.2 Cas achat fournisseur

- Bon de commande → aucun impact stock
- Réception marchandises → mouvement IN
- Facture fournisseur → écriture comptable uniquement

---

## 7. Cas avancés (selon configuration datarissage)

### 7.1 Multi-entrepôts

- Stock calculé indépendamment par entrepôt
- Transfert = 1 événement logique, 2 effets physiques (OUT source + IN destination)
- Même transaction atomique pour les deux effets

### 7.2 Lots / dates d'expiration

- Affectation obligatoire à l'entrée (batch_id requis)
- Sélection contrôlée à la sortie (FIFO sur les lots par défaut)
- Alerte automatique avant expiration (configurable)

### 7.3 Numéros de série

- Quantité toujours = 1 par ligne de mouvement
- Traçabilité unitaire complète : IN → OUT → chez quel client

---

## 8. Sécurité et cohérence

- Services comme unique point d'écriture (jamais depuis les controllers)
- Middleware obligatoires :
  - Module Stock activé
  - Datarissage complété
  - Période stock non clôturée
  - Permissions (DOC-06)
- Verrouillage après validation (statut immuable)
- SOD vérifiée : created_by ≠ validated_by

---

## 9. Indicateurs de contrôle (obligatoires dès V1)

Ces alertes doivent être visibles dans le dashboard et les rapports :
- Produit facturé mais sans mouvement de stock (si module actif)
- Stock théorique calculé ≠ stock inventaire physique
- Mouvement de stock sans référence métier (facture ou inventaire)
- Stock négatif détecté (si règle de blocage activée)

---

*DOC-03 — Version 2.0 — Mars 2026*
*Aligné avec : DOC-01, DOC-02, DOC-06, DOC-07, DOC-08, DOC-09*
