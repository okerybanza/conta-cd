# 📚 Documentation Fondamentale — Conta.cd

## Vue d'ensemble

Cette documentation constitue **la base de référence** pour le développement de Conta.cd. Elle définit les principes, règles et standards qui garantissent la cohérence, la fiabilité et la qualité du produit.

**⚠️ IMPORTANT : Ces documents sont la source de vérité. Tout écart peut compromettre la fiabilité du système.**

---

## 📋 Documents Fondamentaux

### [DOC-01 — Datarissage Entreprise & Choix Structurants](./DOC-01%20—%20Datarissage%20Entreprise%20&%20Choix%20Structurants.md)

**Rôle :** Définit le processus de configuration initiale de l'entreprise et les choix structurants verrouillés.

**Points critiques :**
- 7 étapes obligatoires de datarissage
- Éléments verrouillés après validation (currency, business_type, stock_management_type, etc.)
- Aucune modification possible après validation
- Intégration avec modules Stock et RH

**Quand consulter :**
- Implémentation du flux de datarissage
- Modification des paramètres entreprise
- Intégration de nouveaux modules
- Validation de règles métier

---

### [DOC-02 — Architecture cible & mécanismes anti-données erronées](./DOC-02%20—%20Architecture%20cible%20&%20mécanismes%20anti-données%20erronées.md)

**Rôle :** Définit l'architecture technique et les règles pour éviter les données erronées.

**Principe cardinal :**
> **Aucune donnée critique ne doit être modifiée directement.**
> Toute modification doit passer par un événement métier validé.

**Points critiques :**
- Event Bus interne léger
- Aucune écriture directe sur les agrégats (stock, soldes comptables, etc.)
- Événements immuables = source de vérité
- Transactions atomiques
- Services comme uniques points d'écriture

**Quand consulter :**
- Refactorisation de modules
- Ajout de nouvelles fonctionnalités
- Modification de données critiques
- Implémentation de nouveaux services

**Règles à respecter :**
- ❌ Plus de `UPDATE quantity = quantity - x`
- ❌ Plus de recalcul implicite
- ❌ Plus de logique dispersée
- ✅ Tout devient traçable, vérifiable, réversible

---

### [DOC-03 — Module Stock avancé (standards ERP complets)](./DOC-03%20—%20Module%20Stock%20avancé%20(standards%20ERP%20complets).md)

**Rôle :** Spécification complète du module Stock selon les standards ERP.

**Principe fondamental :**
> Le module Stock **n'est pas** une table de quantités.
> Le module Stock **est** un registre de mouvements immuables permettant de calculer un état fiable à tout instant.

**Points critiques :**
- Mouvements immuables (DRAFT → VALIDATED)
- Stock calculé, jamais stocké
- Types stricts : IN, OUT, ADJUSTMENT, TRANSFER uniquement
- Inversion = nouveau mouvement inverse
- Support multi-entrepôts, lots, numéros de série
- Indicateurs de contrôle obligatoires

**Quand consulter :**
- Développement du module Stock
- Gestion des mouvements de stock
- Intégration Stock ↔ Facturation
- Validation de mouvements
- Calcul de stock

---

## 🎯 Comment utiliser cette documentation

### Pour les développeurs

1. **Avant de commencer une tâche :**
   - Consulter les documents pertinents
   - Identifier les règles et contraintes
   - Vérifier les principes à respecter

2. **Pendant le développement :**
   - Respecter strictement les règles définies
   - Utiliser les services et événements existants
   - Ne pas contourner les garde-fous

3. **Avant de valider :**
   - Vérifier la conformité avec les documents
   - Tester les règles métier critiques
   - S'assurer qu'aucun écart n'a été introduit

### Pour les code reviews

1. **Vérifier la conformité :**
   - Le code respecte-t-il DOC-02 (événements, pas d'écriture directe) ?
   - Les règles DOC-03 sont-elles respectées (mouvements immuables) ?
   - Le datarissage est-il correctement vérifié (DOC-01) ?

2. **Détecter les écarts :**
   - Écritures directes sur agrégats
   - Modifications de données verrouillées
   - Logique dispersée au lieu d'événements

### Pour les décisions techniques

1. **Nouvelle fonctionnalité :**
   - Consulter DOC-02 pour l'architecture
   - Vérifier l'impact sur les modules existants
   - S'assurer de la cohérence avec les principes

2. **Modification de règles métier :**
   - Vérifier DOC-01 (éléments verrouillés)
   - Consulter DOC-03 pour les règles Stock
   - Évaluer l'impact sur la fiabilité

---

## ⚠️ Règles d'or

### 1. Ne jamais violer les principes cardinaux

- ❌ **JAMAIS** d'écriture directe sur les agrégats
- ❌ **JAMAIS** de modification de données verrouillées
- ❌ **JAMAIS** de suppression de mouvements validés
- ❌ **JAMAIS** de stockage du stock (toujours calculé)

### 2. Toujours utiliser les services

- ✅ Tous les changements passent par les services
- ✅ Les services publient des événements
- ✅ Les événements sont la source de vérité

### 3. Toujours valider avant d'implémenter

- ✅ Vérifier la conformité avec les documents
- ✅ Identifier les impacts sur les autres modules
- ✅ S'assurer de la cohérence globale

---

## 🔍 Vérifications régulières

### Checklist avant chaque release

- [ ] Aucune écriture directe sur agrégats détectée
- [ ] Tous les mouvements de stock passent par validation
- [ ] Les données verrouillées ne sont pas modifiables
- [ ] Les événements sont correctement émis et gérés
- [ ] Les transactions sont atomiques
- [ ] Les indicateurs de contrôle fonctionnent
- [ ] Les tests couvrent les règles critiques

### Audit de code

Utiliser les scripts de détection :
- `stock-control.service.ts` : Détecte les incohérences
- `prevent-direct-aggregate-updates.middleware.ts` : Bloque les écritures directes
- Vérifications d'intégrité régulières

---

## 📊 État d'implémentation

### ✅ Implémenté

- [x] DOC-01 : Datarissage entreprise complet
- [x] DOC-02 : Event Bus et architecture anti-erreurs
- [x] DOC-03 : Module Stock avancé (structure de base)
- [x] Garde-fous techniques (middleware)
- [x] Indicateurs de contrôle (stock-control.service)

### 🚧 En cours / À compléter

- [ ] API REST complète pour Stock (routes, controllers)
- [ ] Valorisation stock (FIFO, weighted_average)
- [ ] Gestion complète lots et numéros de série
- [ ] Intégration Stock ↔ Facturation (refactorisation InvoiceService)
- [ ] Module RH avec événements (DOC-02)
- [ ] Module Comptabilité avec événements (DOC-02)

---

## 🆘 En cas de doute

1. **Consulter les documents** : Ils contiennent la réponse
2. **Vérifier les exemples** : Code existant conforme
3. **Demander clarification** : Mieux vaut clarifier que créer un écart

---

## 📝 Maintenance de la documentation

Cette documentation doit être :
- **À jour** : Refléter l'état actuel du système
- **Précise** : Chaque règle est claire et non ambiguë
- **Complète** : Couvrir tous les cas critiques
- **Accessible** : Facilement consultable par toute l'équipe

**Toute modification des principes doit être documentée et validée.**

---

## 🎓 Formation

Tout nouveau développeur doit :
1. Lire et comprendre les 3 documents fondamentaux
2. Comprendre les principes cardinaux
3. Consulter les exemples d'implémentation
4. Valider sa compréhension avant de coder

---

**Ces documents sont la garantie de la fiabilité et de la cohérence de Conta.cd. Respectons-les scrupuleusement.**

