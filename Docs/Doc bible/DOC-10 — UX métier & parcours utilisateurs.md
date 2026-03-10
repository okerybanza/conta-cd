# DOC-10 — UX métier & parcours utilisateurs

**(Niveau 3 — adoption, clarté, prévention des erreurs)**

## 1. Principe fondamental

Une bonne UX ERP n’accélère pas l’utilisateur.
**Elle l’empêche de se tromper.**

L’UX n’a pas pour mission de cacher la complexité métier,
mais de la rendre compréhensible au bon moment.

## 2. Séparation stricte Lecture / Action

Toute interface distingue clairement :

- **lecture** (consulter, analyser, comparer)
- **action** (créer, valider, annuler, clôturer)

**Règles :**
- aucune action critique depuis un écran “lecture”
- les boutons d’action sont rares, visibles, explicites
- aucune action critique en un clic

## 3. Parcours par rôle (non par module)

L’UX est pensée par rôle, pas par fonctionnalités.

**Exemples :**
- **Owner** : vision globale, validations finales
- **Comptable** : périodes, écritures, clôtures
- **RH** : employés, contrats, préparation paie
- **Manager** : validation intermédiaire
- **Employé** : demandes personnelles
- **Expert-comptable** : lecture + validation déléguée

Un rôle :
- voit d’abord ce qui est utile
- découvre le reste si nécessaire

## 4. États visibles et compréhensibles

Tout objet métier affiche clairement :
- son état
- ce que cet état autorise
- ce que cet état interdit

**Exemples :**
- Facture “Validée” → non modifiable
- Période “Clôturée” → écriture bloquée
- Paie “Validée” → correction par inversion uniquement

L’utilisateur ne doit jamais deviner.

## 5. Prévention avant sanction

Avant toute action bloquante :
- expliquer pourquoi
- indiquer quoi faire à la place

**Exemples :**
- “Période clôturée → créez une écriture d’ajustement”
- “Facture validée → annulez par inversion”
- “Stock clôturé → ajustement période suivante”

Un refus sans explication est une mauvaise UX.

## 6. Confirmations intelligentes

Les confirmations ne sont utilisées que pour :
- validation définitive
- annulation
- clôture
- réouverture exceptionnelle

**Une confirmation doit :**
- rappeler l’impact
- rappeler l’irréversibilité
- exiger une action consciente

Jamais de confirmation générique (“Êtes-vous sûr ?”).

## 7. Hiérarchie visuelle de gravité

**Visuellement :**
- actions dangereuses = rares, isolées
- couleurs neutres par défaut
- couleurs fortes réservées aux actions irréversibles

L’UX doit ralentir volontairement les décisions critiques.

## 8. Gestion des erreurs humaines

Toute erreur possible doit être :
- anticipée
- expliquée
- récupérable (par inversion / correction)

**Aucune erreur ne doit :**
- casser un écran
- laisser l’utilisateur bloqué
- produire une donnée incohérente

## 9. Alignement avec l’audit et les périodes

L’UX :
- affiche les conséquences temporelles
- indique la période concernée
- montre l’impact dans l’audit

L’utilisateur comprend :
*“Ce que je fais maintenant aura un effet plus tard.”*

## 10. Ce que DOC-10 ne fait pas volontairement

- ❌ pas de design graphique
- ❌ pas de choix de composants UI
- ❌ pas d’animations
- ❌ pas de microcopy marketing

DOC-10 définit le comportement, pas l’esthétique.

---

## Résumé clair

DOC-10 :
- réduit les erreurs humaines
- améliore l’adoption
- renforce la confiance
- protège la logique métier sans la rendre lourde

**Un ERP avec une bonne UX est calme, pas spectaculaire.**
