# Checklist d'exécution — Stabilisation MVP Comptable

## Étape 1 — Verrouiller les sources de vérité

### Objectif
Éliminer toute ambiguïté sur ce qui fait foi.

### À faire par Cursor

- Considérer les écritures comptables comme source unique de vérité
- Considérer les mouvements de stock comme source unique de vérité
- Marquer explicitement les champs de solde et de stock comme cache dérivé

### Interdictions

- Aucune logique métier basée sur un solde stocké
- Aucune décision métier basée sur products.stock

### Validation par vous

Cursor confirme par écrit :
« Les soldes et stocks sont des caches recalculables, jamais des vérités. »

---

## Étape 2 — Rendre les flux critiques atomiques

### Objectif
Empêcher tout succès partiel silencieux.

### À faire par Cursor

- Facture validée = écriture comptable + mouvement stock dans la même transaction logique
- Paie validée = écriture comptable obligatoire
- Paiement validé = écriture comptable obligatoire

### Interdictions

- try/catch non bloquant sur ces flux
- Validation métier sans effets comptables/stock complets

### Validation par vous

Cursor décrit le comportement en cas d'échec :
« Rien n'est validé si un sous-processus échoue. »

---

## Étape 3 — Supprimer les doubles logiques dangereuses

### Objectif
Réduire les incohérences futures.

### À faire par Cursor

- Centraliser le calcul des soldes (un seul endroit)
- Supprimer ou isoler toute logique de recalcul dupliquée
- Éliminer toute mise à jour directe des soldes métier

### Interdictions

- Mise à jour directe des agrégats métier
- Calculs divergents selon le service appelé

### Validation par vous

Cursor identifie l'unique point de calcul des soldes.

---

## Étape 4 — Normaliser la gestion d'erreurs

### Objectif
Rendre les échecs visibles et traçables.

### À faire par Cursor

Toute erreur critique doit :

- bloquer l'opération
- être loggée clairement
- Préparer un mécanisme explicite de rattrapage (sans l'implémenter si trop lourd)

### Interdictions

- console.log sans propagation
- erreurs silencieuses

### Validation par vous

Cursor vous donne un exemple clair d'erreur bloquante.

---

## Étape 5 — Geler le périmètre fonctionnel

### Objectif
Stabiliser sans dérive.

### À faire par Cursor

- Aucun ajout fonctionnel
- Aucun changement UI
- Aucun refactor esthétique non demandé

### Interdictions

- « J'en ai profité pour… »
- Optimisation non demandée

### Validation par vous

Cursor confirme :
« Aucun comportement fonctionnel nouveau n'a été ajouté. »

---

## Résumé/Rapport

Dans le résumé/rapport, inclure les réponses à ces questions :

- Qu'est-ce qui échoue maintenant alors que ça passait avant ?
- Qu'est-ce qui est bloquant volontairement ?
- Qu'est-ce qui est devenu impossible par design ?
