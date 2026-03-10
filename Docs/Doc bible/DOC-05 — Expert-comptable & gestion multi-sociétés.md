# DOC-05 — Expert-comptable & gestion multi-sociétés

**(logique métier ERP uniquement, pas d'implémentation)**

## 1. Principe fondamental

Un expert-comptable n'est ni un employé, ni un administrateur, ni un propriétaire.

C'est un acteur externe, intervenant par délégation contrôlée, avec des droits limités, traçables et révocables.

**Il n'est jamais source de vérité métier.**

Il est garant de la conformité, pas de la stratégie.

## 2. Modèle conceptuel

Il existe trois niveaux distincts :

### Utilisateur

- identité système
- authentification

### Cabinet / Expert-comptable

- entité logique représentant une structure ou un individu
- peut regrouper plusieurs utilisateurs

### Entreprise cliente

- entité métier autonome
- peut déléguer des droits à un cabinet

**Relation clé :**

- un cabinet peut gérer plusieurs entreprises
- une entreprise peut avoir au plus un cabinet actif à un instant donné
- la relation est temporaire et révocable

## 3. Délégation et périmètre

La délégation est toujours :

- explicite
- limitée dans le temps (optionnel)
- limitée par module
- auditée

**Exemples :**

- accès comptabilité : oui
- accès stock : lecture seule
- accès RH : non
- accès configuration entreprise : jamais

**L'expert-comptable ne choisit jamais :**

- la devise
- le type d'activité
- les méthodes de valorisation
- les modules activés

## 4. Permissions effectives

**Par défaut, un expert-comptable peut :**

- consulter toutes les données financières
- valider des écritures préparées
- clôturer une période comptable (si autorisé)
- exporter des états financiers
- proposer des corrections (par inversion)

**Il ne peut jamais :**

- créer ou modifier une facture commerciale
- modifier le stock directement
- gérer les utilisateurs internes
- modifier le datarissage
- supprimer des données

## 5. Logique multi-sociétés

L'expert-comptable accède à une liste d'entreprises déléguées.

Chaque entreprise est :

- strictement isolée
- avec ses propres règles
- ses propres périodes
- ses propres journaux

**Aucune action inter-entreprise n'est possible.**

## 6. Audit et responsabilité

Toute action d'un expert-comptable :

- est marquée comme telle
- conserve l'identité de l'utilisateur réel
- est historisée
- est visible par le propriétaire de l'entreprise

**L'entreprise reste pleinement responsable de ses données.**

## 7. Alignement avec les autres modules

- **DOC-01** : le datarissage ignore l'expert-comptable
- **DOC-02** : aucune écriture directe, uniquement via événements
- **DOC-03** : pas de manipulation stock directe
- **DOC-04** : pas de gestion RH

## 8. Invariants métier

- un expert-comptable n'a jamais de droits implicites
- toute délégation est révocable instantanément
- aucune donnée n'est modifiée sans trace
- aucune logique métier ne dépend d'un acteur externe

## 9. Ce que ce module ne fait pas volontairement

- ❌ pas de gestion de facturation du cabinet
- ❌ pas de gestion de contrat légal
- ❌ pas de calcul fiscal spécifique
- ❌ pas de conseil automatisé

---

## Résumé clair

Ce rôle :

- augmente la crédibilité
- sécurise les chiffres
- professionnalise l'application

**Mal pensé, il détruit la confiance.**  
**Bien pensé, il devient un avantage concurrentiel.**

---

## Suite logique

Le dernier document à poser pour fermer la boucle métier est :

📄 **DOC-07 — Facturation & Comptabilité (normalisation finale)**

C'est lui qui garantit définitivement que l'application ne produira jamais de chiffres faux.

