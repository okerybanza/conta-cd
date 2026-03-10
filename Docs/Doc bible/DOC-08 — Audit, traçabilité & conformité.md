# DOC-08 — Audit, traçabilité & conformité

**(logique métier ERP – niveau gouvernance)**

## 1. Principe fondamental

Dans un ERP fiable, rien d'important ne disparaît,  
et rien d'important n'est silencieux.

**L'audit n'est pas une fonctionnalité.**  
**C'est une condition de confiance.**

## 2. Objectifs du système d'audit

Le système doit permettre de répondre sans ambiguïté à :

- **Qui** a fait l'action ?
- **Quand** ?
- **Sur quelle entité** ?
- **Avant / après** quoi ?
- **Par quel rôle** ?
- **Dans quel contexte** (module, société) ?

Si une action ne peut pas répondre à ces questions,  
👉 **elle n'a pas le droit d'exister.**

## 3. Événement métier vs log technique

### Événement métier

- correspond à une action fonctionnelle réelle
- compréhensible par un humain

**Exemples :**
- facture validée
- stock ajusté
- période clôturée
- paie validée

### Log technique

- erreur serveur
- performance
- debug

👉 **DOC-08 ne concerne que les événements métier.**

## 4. Journal d'événements global

Il existe un journal centralisé, transverse à tous les modules.

Chaque événement contient au minimum :

- identifiant unique
- type d'événement
- entité concernée (facture, employé, mouvement stock, etc.)
- identifiant de l'entité
- société concernée
- utilisateur réel
- rôle au moment de l'action
- date / heure
- état avant
- état après
- justification (si requise)

## 5. Immutabilité logique

Un événement :

- **n'est jamais modifié**
- **n'est jamais supprimé**
- **n'est jamais recalculé**

Toute correction :

- génère un nouvel événement
- lié explicitement à l'événement corrigé

## 6. Justification obligatoire

Certaines actions exigent une justification textuelle :

- annulation de facture
- ajustement de stock
- correction comptable
- réouverture de période
- suppression logique (soft delete)

**Sans justification :**

- l'action est refusée
- aucune exception

## 7. Visibilité de l'audit

Par défaut :

- l'audit est visible en lecture seule
- filtrable par :
  - période
  - utilisateur
  - module
  - type d'événement

L'audit :

- n'est jamais exporté sans trace
- n'est jamais modifiable

## 8. Cas spécifique : expert-comptable

Les actions d'un expert-comptable :

- sont explicitement marquées comme **externes**
- affichent :
  - le cabinet
  - l'utilisateur réel
  - la société cliente

👉 **Cela protège l'entreprise et le cabinet.**

## 9. Alignement avec les documents précédents

- **DOC-02** : aucune modification directe → audit naturel
- **DOC-03** : mouvements stock toujours tracés
- **DOC-04** : paie validée = événement audité
- **DOC-05** : délégation expert-comptable visible
- **DOC-06** : rôle au moment de l'action conservé
- **DOC-07** : écritures et clôtures auditables

**DOC-08 est le filet de sécurité global.**

## 10. Ce que DOC-08 ne fait pas volontairement

- ❌ pas d'alertes automatiques
- ❌ pas d'IA de détection de fraude
- ❌ pas de reporting graphique

Ces couches viennent après, sur un audit propre.

---

## Résumé clair

DOC-08 garantit que :

- rien de critique ne se perd
- aucune action n'est anonyme
- toute erreur est explicable
- toute responsabilité est traçable

**Sans lui, même un bon ERP devient juridiquement fragile.**
