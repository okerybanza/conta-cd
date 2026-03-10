# DOC-01 — Datarissage Entreprise & Choix Structurants
**(Fondation produit – version exécutable pour Cursor)**

---

## 1. Rôle du datarissage (principe fondamental)

Le datarissage **n'est pas** :
- un simple formulaire d'inscription,
- une étape marketing.

Le datarissage **est** :
- l'acte de naissance comptable, organisationnel et opérationnel de l'entreprise dans le système.

**Tout ce qui est mal décidé ici :**
- ne pourra pas être corrigé sans migration,
- ou générera des incohérences silencieuses.

---

## 2. Objectifs du datarissage

Le datarissage doit permettre de :
- Définir le cadre légal et organisationnel
- Choisir les modules actifs
- Verrouiller les règles métier structurantes
- Préparer Stock, RH et Comptabilité sans ambiguïté
- Garantir que les chiffres futurs seront fiables

---

## 3. Étapes obligatoires du datarissage (ordre strict)

### Étape 1 — Identification de l'entreprise

**Informations non négociables :**
- Raison sociale
- Pays / juridiction (impact comptable direct)
- Devise principale (voir règle devise ci-dessous)
- Fuseau horaire
- Type d'activité principale

⚠️ Ces éléments ne sont pas modifiables librement après validation.

#### Règle devise (spécifique marché RDC)

La **devise principale** est verrouillée après datarissage.
Elle détermine la devise de tenue de comptabilité officielle.

Cependant, la réalité économique de l'Afrique Centrale impose une règle complémentaire :

- Si le pays choisi est la **RDC** → la devise secondaire **USD est toujours disponible** pour les transactions, quelle que soit la devise principale choisie.
- Les factures, devis et paiements peuvent être libellés en USD ou en CDF.
- La **comptabilité est tenue dans la devise principale**.
- Les montants en devise secondaire sont convertis automatiquement via les taux BCC (Banque Centrale du Congo).

**Ce qui est verrouillé :** la devise de tenue comptable.
**Ce qui reste flexible :** la devise de facturation transaction par transaction.

---

### Étape 2 — Choix du type d'entreprise (clé stratégique)

L'utilisateur choisit un **type d'entreprise** parmi une liste contrôlée.

**Types disponibles :**
- Commerce / Négoce
- Services
- Production / Fabrication
- Logistique
- ONG / Institution
- Multi-activité

Ce choix conditionne :
- le comportement du stock (pertinence des mouvements)
- la structure RH (types de contrats proposés)
- certaines règles comptables par défaut

---

### Étape 3 — Activation des modules (fondation modulaire)

**Modules activables au datarissage :**
- Facturation (toujours activée — non désactivable)
- Comptabilité
- Stock
- RH

**Règles strictes :**
- Un module activé initialise ses règles et paramètres
- Un module non activé est fonctionnellement inexistant
- L'activation ultérieure est possible uniquement si les prérequis sont remplis (voir règle ci-dessous)
- Le Stock et la RH ne doivent pas être activés à moitié

#### Règle d'activation ultérieure d'un module

Si une entreprise souhaite activer le Stock **après** avoir commencé à facturer :
- Les mouvements rétroactifs ne sont **pas** générés automatiquement
- L'entreprise doit effectuer un **inventaire d'ouverture** (mouvement IN initial)
- Cet inventaire est traçable, daté, justifié
- Les factures antérieures ne sont **pas** reliées rétroactivement au stock

Cette règle évite des incohérences silencieuses entre stock et comptabilité.

#### Relation modules ↔ plans tarifaires

L'activation d'un module au datarissage est nécessaire mais pas suffisante.
Le module doit aussi être **inclus dans le plan tarifaire actif** de l'entreprise.

Règle de priorité :
- Plan tarifaire insuffisant → module inaccessible même si activé au datarissage
- Plan tarifaire suffisant + module non activé au datarissage → module inaccessible
- Les deux conditions doivent être vraies simultanément

Voir DOC-11 pour les modules inclus par plan.

---

### Étape 4 — Configuration du module Stock (si activé)

**Choix structurants — certains sont irréversibles :**

**Type de gestion :**
- Stock simple (un seul entrepôt logique)
- Multi-entrepôts (plusieurs entrepôts physiques ou logiques)

**Suivi des articles :**
- Par quantité seule
- Par lots (avec date d'expiration)
- Par numéros de série (traçabilité unitaire)

**Gestion des ruptures :**
- Autoriser stock négatif : NON par défaut
- Autoriser stock négatif : OUI (uniquement pour certains types d'activité — ex. commerce avec commandes fournisseur en attente)

**Méthode de valorisation :**
- FIFO (First In, First Out)
- Moyenne pondérée

⚠️ La méthode de valorisation et le mode multi-entrepôts sont **irréversibles** après validation.
⚠️ Le suivi par lots ou numéros de série peut être activé ultérieurement mais jamais désactivé.

---

### Étape 5 — Configuration du module RH (si activé)

**Choix structurants :**

**Organisation :**
- Simple (sans hiérarchie formelle)
- Départementale (départements + postes)
- Multi-entités (plusieurs structures)

**Paie :**
- Activée / non activée

**Cycle de paie :**
- Mensuel (par défaut)
- Bimensuel
- Autre (à définir)

**Lien RH ↔ Comptabilité :**
- Écritures automatiques à la validation de paie : OUI (recommandé)
- Écritures manuelles uniquement : NON (déconseillé — risque d'oubli)

⚠️ Une paie activée sans règles claires produit des chiffres faux garantis.
⚠️ Pour la RDC : les règles fiscales INSS, IPR, ONEM ne sont pas encore implémentées. La paie est utilisable en mode manuel jusqu'à leur implémentation (Phase 3).

---

### Étape 6 — Création de l'administrateur principal

**Rôle attribué :** Owner

**Droits Owner :**
- Accès à tous les modules activés
- Validation des actions finales
- Délégation des rôles aux autres utilisateurs

**Règles immuables sur l'Owner :**
- Ne peut pas être supprimé
- Ne peut pas être rétrogradé
- Peut être transféré à un autre utilisateur via processus contrôlé et traçable

---

### Étape 7 — Validation finale (verrouillage)

**Avant validation :**
- Récapitulatif complet de tous les choix
- Avertissement explicite sur les éléments verrouillés
- Confirmation consciente requise

**Après validation :**
- Initialisation des règles et paramètres système
- Génération du plan comptable (SYSCOHADA par défaut pour RDC)
- Champ `companies.datarissage_completed` → `true`
- Démarrage de l'application

---

## 4. Ce qui est VERROUILLÉ après datarissage

**Non modifiable sans migration ou processus administratif contrôlé :**
- Devise de tenue comptable (devise principale)
- Type d'entreprise
- Mode de gestion du stock (simple / multi-entrepôts)
- Méthode de valorisation du stock (FIFO / moyenne pondérée)
- Activation de la paie
- Suivi par lots ou numéros de série (une fois activé)

**Modifiable via processus contrôlé :**
- Modules supplémentaires (ajout possible si prérequis remplis)
- Administrateur principal (transfert contrôlé uniquement)
- Cycle de paie (avec justification et période propre)

---

## 5. Erreurs à éviter absolument

- Activer le Stock après avoir commencé à facturer sans faire l'inventaire d'ouverture
- Ajouter la RH sans revoir les rôles et la séparation des responsabilités
- Modifier la devise principale après des écritures comptables
- Activer des modules "pour tester" en production
- Laisser l'utilisateur modifier les choix verrouillés sans garde-fou technique

**Ces erreurs expliquent 80 % des ERP non fiables.**

---

*DOC-01 — Version 2.0 — Mars 2026*
*Aligné avec : DOC-02, DOC-03, DOC-04, DOC-06, DOC-09, DOC-11*
