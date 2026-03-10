# DOC-09 — Gestion des périodes & verrous transverses
**(Niveau 2 – gouvernance temporelle ERP)**

---

## 1. Principe fondamental

**Le temps est une contrainte métier.**
Une donnée n'est correcte que dans sa période.

Une application de gestion fiable ne permet jamais de modifier le passé sans laisser de trace et sans changer de période.

---

## 2. Notion de période

Une période est un intervalle de temps métier, généralement mensuel, qui structure :
- la comptabilité
- le stock
- la paie
- la facturation validée

Chaque période possède :
- une date de début
- une date de fin
- un statut : `OUVERTE` ou `CLÔTURÉE`
- un identifiant de la personne qui l'a clôturée (audit)

---

## 3. Types de périodes

Il existe plusieurs périodes logiques, pouvant être distinctes ou synchronisées selon la configuration :

- **Période comptable** (obligatoire pour toutes les entreprises)
- **Période stock** (si module Stock activé)
- **Période paie** (si module RH + Paie activé)
- **Période facturation** (liée et synchronisée avec la période comptable)

Par défaut, une période ouverte autorise les opérations.
Une période clôturée les interdit sans exception.

---

## 4. Règle centrale de verrouillage

**Aucune écriture, aucun mouvement, aucune validation ne peut affecter une période clôturée.**

Cela concerne sans exception :
- Écritures comptables
- Mouvements de stock
- Paies validées
- Factures validées

**Toute tentative doit être bloquée explicitement avec message clair.**
Le message doit indiquer quoi faire à la place (DOC-10).

---

## 5. Correction des erreurs sur période clôturée

Les erreurs ne sont jamais corrigées dans une période clôturée.

**Procédure obligatoire :**
1. Ouvrir ou utiliser une période ouverte ultérieure
2. Créer une écriture d'inversion ou un mouvement inverse
3. Référencer explicitement l'erreur d'origine (`reversed_from_id`)
4. Justification obligatoire

**Résultat :**
- Le passé reste intact et vérifiable
- La correction est datée après l'erreur
- L'audit est complet et clair

---

## 6. Qui peut ouvrir et clôturer les périodes

### Ouverture d'une période

| Rôle | Peut ouvrir ? |
|------|--------------|
| Employé | ❌ |
| RH | ❌ |
| Manager | ❌ |
| Comptable | ✅ |
| Admin | ✅ |
| Owner | ✅ |
| Expert-Comptable | ✅ (si délégation explicite accordée par l'entreprise) |

Chaque ouverture est journalisée.

### Clôture d'une période

| Rôle | Peut clôturer ? | Conditions |
|------|----------------|------------|
| Employé | ❌ | — |
| RH | ❌ | — |
| Manager | ❌ | — |
| Comptable | ✅ | Toutes les écritures équilibrées + aucune opération en attente |
| Admin | ✅ | Mêmes conditions |
| Owner | ✅ | Mêmes conditions |
| Expert-Comptable | ✅ | Si délégation explicite + mêmes conditions |

**Conditions préalables à toute clôture :**
- Toutes les écritures comptables de la période sont équilibrées
- Tous les mouvements de stock sont validés (si module actif)
- Aucune paie en statut DRAFT pour la période (si module actif)
- Aucune facture en statut DRAFT datée dans la période

Si une condition n'est pas remplie → **clôture bloquée avec liste des éléments bloquants**.

### Réouverture d'une période clôturée

| Rôle | Peut réouvrir ? |
|------|----------------|
| Tous sauf Owner | ❌ (sans exception) |
| Owner | ✅ avec conditions strictes |
| Expert-Comptable | ❌ (jamais) |

**Conditions de réouverture (Owner uniquement) :**
1. Justification textuelle obligatoire (minimum 20 caractères)
2. Confirmation explicite en deux étapes
3. Événement audité immédiatement avec justification
4. Notification automatique envoyée au Comptable et Admin

**La réouverture est un événement grave, pas une option courante.**
Elle doit rester exceptionnelle et visible dans l'audit.

---

## 7. Alignement inter-modules

### Stock

Une période stock clôturée bloque :
- Toute entrée de stock
- Toute sortie de stock
- Tout ajustement d'inventaire
- Tout transfert entre entrepôts

### Facturation

- Une facture validée appartient à la période de sa date de validation
- Elle ne peut plus être modifiée après clôture de cette période
- Son annulation (par inversion) crée un mouvement dans la période courante ouverte

### RH / Paie

- Une paie validée dans une période clôturée est définitivement figée
- Correction : annulation + nouvelle paie dans une période ouverte

### Expert-Comptable

- Peut clôturer si délégation explicite accordée par l'entreprise (DOC-05)
- Ne peut **jamais** réouvrir une période clôturée
- Toutes ses actions sur les périodes sont marquées `source: 'external'` dans l'audit

---

## 8. Interaction avec l'audit (DOC-08)

Chaque action liée aux périodes génère un événement d'audit obligatoire :

| Action | Niveau audit |
|--------|-------------|
| Ouverture de période | INFO |
| Clôture de période | IMPORTANT |
| Tentative d'écriture sur période clôturée | WARNING (bloqué) |
| Réouverture de période | CRITIQUE — justification conservée |

Ces événements permettent de :
- Comprendre les écarts entre périodes
- Attribuer les responsabilités avec certitude
- Prouver la conformité en cas de contrôle

---

## 9. Invariants métier

- Une période clôturée est intouchable (sauf réouverture Owner avec justification)
- Aucune suppression rétroactive de données dans une période clôturée
- Aucune modification silencieuse du passé
- Toute correction est datée après l'erreur
- La vérité du passé est conservée en permanence

---

## 10. Ce que DOC-09 ne fait pas volontairement

- ❌ Pas de calendrier fiscal pays spécifique (RDC, Cameroun, etc.)
- ❌ Pas d'automatisation de clôture (action volontaire requise)
- ❌ Pas de synchronisation bancaire automatique

Ces couches viendront plus tard, sur une base temporelle saine.

---

## Résumé clair

DOC-09 :
- Fige le temps métier de manière contrôlée
- Empêche les manipulations rétroactives
- Définit précisément qui peut faire quoi sur les périodes
- Protège comptabilité, stock et paie simultanément
- Rend l'audit réellement utile et complet

**Sans lui, DOC-08 enregistre des actions mais ne peut pas les défendre.**

---

*DOC-09 — Version 2.0 — Mars 2026*
*Aligné avec : DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07, DOC-08*
