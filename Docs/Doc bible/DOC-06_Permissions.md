# DOC-06 — Permissions & rôles transverses (RBAC métier)
**(logique métier ERP uniquement)**

---

## 1. Principe fondamental

Les permissions ne servent pas à "donner accès".

Elles servent à **empêcher les erreurs irréversibles**.

Dans un ERP :
- tout ce qui est critique est volontairement difficile
- tout ce qui est dangereux est segmenté
- personne ne peut être juge et partie sur le même objet

---

## 2. Concepts de base

### Rôle
Ensemble cohérent de permissions liées à une fonction métier.
Un rôle représente ce que la personne est censée faire, pas ce qu'elle veut faire.

### Permission
Autorisation explicite d'exécuter une action métier précise.

### Portée
Contexte dans lequel la permission s'applique :
- Par société (contexte principal)
- Par module (conditionné par activation au datarissage + plan tarifaire)
- Globale : réservée au SuperAdmin plateforme uniquement

---

## 3. Séparation obligatoire des responsabilités (SOD)

**Aucune personne ne doit pouvoir créer ET valider le même objet métier.**

Cette règle s'applique sans exception à :
- Factures
- Écritures comptables
- Paies
- Mouvements de stock
- Clôtures de période

Implémenté dans : `services/segregationOfDuties.service.ts`

---

## 4. Rôles standards — Définitions précises

### Owner (Propriétaire de la société)

Le seul rôle qui ne peut pas être supprimé.

**Peut :**
- Valider le datarissage
- Déléguer tous les rôles
- Valider les paies
- Clôturer et réouvrir les périodes
- Révoquer la délégation expert-comptable
- Accéder à tous les modules activés

**Ne peut pas :**
- Modifier les choix verrouillés au datarissage (devise principale, méthode stock, etc.)
- Être rétrogradé ou supprimé (transfert uniquement via processus contrôlé)

---

### Admin

Bras droit opérationnel de l'Owner. Gestion quotidienne.

**Peut :**
- Tout ce que Manager peut faire
- Gérer les utilisateurs et leurs rôles
- Valider les paies
- Clôturer une période comptable
- Modifier les paramètres courants de l'entreprise

**Ne peut pas :**
- Modifier les choix verrouillés au datarissage
- Réouvrir une période clôturée (Owner uniquement)
- Révoquer la délégation expert-comptable (Owner uniquement)

---

### Manager

Supervision métier et validation intermédiaire.

**Peut :**
- Valider les factures
- Valider le temps de travail des employés
- Approuver les dépenses
- Consulter tous les rapports

**Ne peut pas :**
- Créer des écritures comptables
- Clôturer une période
- Valider une paie
- Gérer les utilisateurs

---

### Comptable

Responsable de la comptabilité et de la conformité financière.

**Peut :**
- Créer des écritures comptables
- Valider des écritures préparées par d'autres
- Clôturer une période comptable (avec accord Owner/Admin)
- Effectuer des corrections par inversion
- Exporter les états financiers

**Ne peut pas :**
- Valider une facture qu'il a créée (SOD)
- Valider une paie
- Gérer les employés
- Réouvrir une période clôturée

**Règle de priorité Comptable vs Expert-Comptable :**
Un comptable interne et un expert-comptable délégué peuvent tous deux clôturer une période.
En cas de conflit ou doublon, la règle est :
- La clôture est une action idempotente : une période ne peut être clôturée qu'une fois.
- Qui clôture en premier prend l'action. L'autre voit la période déjà clôturée.
- Toute clôture est auditée avec l'identité de l'acteur.

---

### RH

Responsable de la gestion des ressources humaines.

**Peut :**
- Créer et gérer les employés
- Gérer les contrats
- Préparer les paies (statut DRAFT uniquement)
- Gérer les absences et congés
- Gérer les présences

**Ne peut jamais :**
- Valider une paie qu'il a préparée (SOD absolue)
- Modifier la devise ou la structure comptable
- Clôturer une période
- Créer des écritures comptables directement

---

### Employé

Accès personnel limité.

**Peut :**
- Consulter son propre profil RH
- Soumettre des demandes de congé
- Consulter ses bulletins de paie validés
- Consulter ses documents personnels

**Ne peut pas :**
- Accéder aux données d'autres employés
- Écrire dans aucun module métier

---

### Expert-Comptable (rôle externe délégué)

Acteur externe géré par DOC-05. Résumé des permissions ici pour cohérence.

**Peut (selon délégation explicite de l'entreprise) :**
- Consulter toutes les données financières de l'entreprise cliente
- Valider des écritures préparées par le comptable interne
- Clôturer une période (si délégation explicite accordée)
- Exporter des états financiers
- Proposer des corrections par inversion

**Ne peut jamais (sans exception) :**
- Créer ou modifier une facture commerciale
- Modifier le stock
- Gérer les utilisateurs internes
- Modifier le datarissage
- Supprimer des données
- Réouvrir une période clôturée (Owner uniquement)

Toutes ses actions sont marquées `source: 'external'` dans les audit_logs.
Voir DOC-05 pour le modèle complet.

---

## 5. Matrice des permissions par module

### Facturation

| Action | Employé | RH | Manager | Comptable | Admin | Owner | Expert-Comptable |
|--------|---------|----|---------|-----------|----|-------|-----------------|
| Créer facture | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider facture | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Annuler (inversion) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Consulter | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (lecture) |

### Comptabilité

| Action | Employé | RH | Manager | Comptable | Admin | Owner | Expert-Comptable |
|--------|---------|----|---------|-----------|----|-------|-----------------|
| Créer écriture | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Valider écriture | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ (si délégué) |
| Clôturer période | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ (si délégué) |
| Réouvrir période | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

### Stock

| Action | Employé | RH | Manager | Comptable | Admin | Owner | Expert-Comptable |
|--------|---------|----|---------|-----------|----|-------|-----------------|
| Créer mouvement | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Valider mouvement | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Inventaire | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Consulter | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (lecture seule si délégué) |

### RH / Paie

| Action | Employé | RH | Manager | Comptable | Admin | Owner | Expert-Comptable |
|--------|---------|----|---------|-----------|----|-------|-----------------|
| Créer employé | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Gérer contrats | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Valider temps | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Préparer paie | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Valider paie | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## 6. Règles non négociables

- Aucun rôle n'est omnipotent (pas de "super admin magique" par entreprise)
- Les rôles système sont immuables (pas de renommage, pas de suppression)
- Les permissions sont révocables à tout moment par Owner ou Admin
- Toute action sensible est auditée (DOC-08)
- Les champs verrouillés au datarissage **ignorent toutes les permissions** — même l'Owner ne peut pas les modifier librement
- La SOD est vérifiée automatiquement par le service `segregationOfDuties.service.ts`

---

## 7. Alignement avec les autres documents

- **DOC-01** : les modules activés au datarissage et le plan tarifaire conditionnent les permissions disponibles
- **DOC-02** : aucune écriture directe autorisée quel que soit le rôle
- **DOC-03** : stock protégé par validation avec SOD
- **DOC-04** : paie préparée par RH, validée par Admin/Owner uniquement
- **DOC-05** : expert-comptable strictement encadré, permissions auditées
- **DOC-09** : la réouverture de période est réservée à l'Owner

---

## 8. Ce que DOC-06 ne fait pas volontairement

- ❌ Pas de gestion UI des rôles
- ❌ Pas de rôles personnalisables librement par l'entreprise
- ❌ Pas de "super admin magique" par société

Ces choix sont volontaires pour garantir la stabilité et la sécurité.

---

## Résumé clair

DOC-06 :
- Protège la logique métier contre les abus
- Empêche les erreurs irréversibles par segmentation
- Rend toutes les actions critiques traçables
- Sécurise la croissance sans complexité inutile

**Sans lui, même un bon ERP devient dangereux.**

---

*DOC-06 — Version 2.0 — Mars 2026*
*Aligné avec : DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-08, DOC-09*
