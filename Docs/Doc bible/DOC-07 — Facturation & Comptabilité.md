# DOC-07 — Facturation & Comptabilité

**(normalisation finale – logique métier uniquement)**

## 1. Principe fondamental

La facturation crée des obligations.

La comptabilité enregistre des vérités.

**Les deux ne sont jamais confondues.**

- Une facture n'est pas une écriture comptable.
- Une écriture comptable n'est pas une facture.

## 2. États de la facture (cycle de vie strict)

Une facture passe obligatoirement par ces états :

### Draft

- modifiable
- non comptable
- non engageante

### Validée

- figée
- engageante
- génère des événements comptables

### Payée (partiellement ou totalement)

- statut financier
- n'altère pas la facture

### Annulée

- uniquement par inversion
- jamais supprimée

**Aucun saut d'état n'est autorisé.**

## 3. Génération comptable (événementielle)

À la validation d'une facture :

- la facture émet des événements
- la comptabilité consomme ces événements
- des écritures sont produites

**Aucune écriture n'est créée :**

- avant validation
- sans source
- sans référence métier

## 4. Paiements

Un paiement :

- est une entité indépendante
- peut être partiel
- peut concerner plusieurs factures (optionnel)

Un paiement :

- ne modifie jamais la facture
- produit ses propres écritures
- est réconcilié, pas fusionné

## 5. Comptabilité générale

La comptabilité est structurée autour de :

- journaux
- comptes
- périodes
- écritures

Chaque écriture :

- est équilibrée
- appartient à une période
- est datée
- est justifiée

## 6. Clôture comptable

Une période clôturée :

- interdit toute nouvelle écriture
- interdit toute modification
- accepte uniquement :
  - des écritures d'ajustement dans une période ouverte ultérieure

La clôture est :

- explicite
- volontaire
- traçable

## 7. Corrections et erreurs

**Aucune donnée financière n'est modifiée directement.**

Toute correction se fait par :

- écriture inverse
- nouvelle écriture correcte

**La somme de l'erreur + correction = 0.**

## 8. Alignement avec le Stock (DOC-03)

- vente → sortie de stock
- achat → entrée de stock
- valorisation stock → écriture comptable
- inventaire → ajustement traçable

**Aucun ajustement stock silencieux.**

## 9. Alignement avec RH (DOC-04)

- paie validée → événement comptable
- paiement salaire → écriture financière
- charges sociales → écritures distinctes

**La RH ne touche jamais les soldes.**

## 10. Rôles et responsabilités

- **facturation** : création / validation
- **comptabilité** : enregistrement / clôture
- **direction** : validation finale
- **expert-comptable** : audit / validation déléguée

**Aucun rôle ne cumule tout.**

## 11. Invariants métier absolus

- aucune suppression de facture
- aucune modification après validation
- aucune écriture sans source
- aucun paiement sans référence
- aucun calcul rétroactif silencieux

## 12. Ce que ce module ne fait pas volontairement

- ❌ pas de fiscalité pays spécifique
- ❌ pas de rapprochement bancaire automatique
- ❌ pas de prévision financière
- ❌ pas de comptabilité analytique avancée

Ces couches viennent après, sans casser la base.

---

## Résumé final

Avec DOC-01 à DOC-07 :

- votre application ne ment pas
- elle est auditable
- elle est extensible
- elle est professionnelle

**C'est le socle ERP.**

---

## Conclusion globale

Vous disposez maintenant :

- d'une logique métier complète
- indépendante du code
- indépendante de l'UI
- alignée avec les standards du marché

À partir de là :

- chaque feature future est cadrée
- chaque choix est défendable
- chaque chiffre est justifiable

