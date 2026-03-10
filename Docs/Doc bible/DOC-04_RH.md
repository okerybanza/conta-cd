# DOC-04 — Module RH complet
**Portée :** logique métier uniquement (norme ERP)
**Aucun écran – aucun code – aucune UX**

---

## 1. Principes fondamentaux RH (non négociables)

### Un employé ≠ un utilisateur

- **Employé** : entité RH, liée à l'entreprise.
- **Utilisateur** : entité système, liée à l'authentification.
- Un employé peut avoir un compte utilisateur applicatif.
- Un utilisateur peut ne pas être un employé (ex. expert-comptable externe).
- La hiérarchie RH (manager → subordonné) n'est **pas** la hiérarchie des permissions applicatives.

### La RH est événementielle

- Aucune donnée RH ne modifie la comptabilité directement.
- Chaque action RH génère des événements métier traçables.
- La comptabilité consomme ces événements. Jamais l'inverse.

### La paie ne calcule pas toute seule

Elle résulte obligatoirement de :
- un contrat actif
- un temps travaillé validé
- des événements RH (absences, primes, sanctions, bonus)

---

## 2. Entités métier RH (conceptuelles)

### 2.1 Employé

- Identité interne (matricule unique par entreprise)
- Informations personnelles minimales nécessaires
- Statut : `actif`, `suspendu`, `sorti`
- Date d'entrée / date de sortie
- Rattachement organisationnel (département, poste)

⚠️ Aucune information sensible non nécessaire par défaut.

### 2.2 Organisation

- Départements
- Unités / équipes
- Hiérarchie (manager → subordonné)
- Postes / fonctions

La structure organisationnelle est configurée au datarissage (voir DOC-01 Étape 5).

### 2.3 Contrat

- Type : CDI, CDD, journalier, consultant
- Dates de validité (début / fin)
- Rémunération de base
- Devise du contrat (CDF ou USD — les deux possibles en RDC)
- Règles de travail : temps plein, partiel, horaire

**Règle absolue :** Un employé actif peut avoir plusieurs contrats successifs.
Jamais deux contrats actifs simultanément pour le même employé.
Un contrat expiré ne produit plus aucun événement de paie.

---

## 3. Temps de travail & absences

### 3.1 Temps de travail

- Jours travaillés
- Heures travaillées
- Périodes validées par un responsable autorisé

Le temps est déclaré ou collecté. **Jamais déduit implicitement.**

### 3.2 Types d'absences

- Congé payé
- Maladie
- Absence justifiée
- Absence non justifiée

Chaque absence est :
1. Demandée (par l'employé ou saisie par RH)
2. Validée (par un responsable autorisé)
3. Enregistrée comme événement RH immuable

---

## 4. Paie (logique métier)

### 4.1 Principe clé

**La paie est un résultat calculé, jamais une saisie directe.**

Elle est construite à partir de :
- Le contrat actif de l'employé
- Le temps de travail validé pour la période
- Les événements RH de la période (absences, primes, retenues)

### 4.2 Éléments de paie

- Salaire de base (issu du contrat)
- Primes (avec source et justification)
- Indemnités (transport, logement, etc.)
- Retenues (avances, sanctions)
- Cotisations légales (INSS, IPR, ONEM — voir note RDC)

Chaque élément de paie :
- A une source traçable
- A une justification obligatoire
- Est historisé et immuable après validation

### 4.3 Note spécifique RDC — Phase 3

Les règles fiscales obligatoires en RDC (INSS, IPR, ONEM) ne sont pas encore implémentées.
Jusqu'à leur implémentation (Phase 3 de la roadmap) :
- La paie fonctionne en mode **éléments manuels**
- Les cotisations légales sont saisies comme éléments de retenue manuels
- L'entreprise reste responsable de leur calcul correct

Cette limitation est documentée et connue. Elle ne bloque pas le lancement.

### 4.4 Cycle de validation de la paie

```
RH prépare la paie (statut : DRAFT)
  → Vérification automatique : contrat actif ? temps validé ?
    → Soumission pour validation
      → Validation par Owner ou Admin (jamais par RH lui-même)
        → Paie VALIDÉE (immutable)
          → Événement comptable émis automatiquement
            → Écritures générées dans le journal
```

**Ségrégation obligatoire :** Le rôle RH prépare. Le rôle Owner ou Admin valide.
Ces deux actions ne peuvent jamais être effectuées par la même personne sur la même paie.
Voir DOC-06.

---

## 5. Lien RH ↔ Comptabilité

**Principe fondamental (DOC-02) :**

- La RH ne touche **jamais** les soldes comptables directement.
- Elle émet des **événements** → la comptabilité les consomme.

**Événements émis par la RH :**
- `PayrollValidated` → génère les écritures de charges salariales
- `SalaryPaid` → génère l'écriture de décaissement
- `PayrollCorrected` → génère une écriture d'inversion + nouvelle écriture

**Jamais de modification silencieuse.**

---

## 6. Permissions RH — Matrice claire

| Action | RH | Manager | Admin | Owner |
|--------|----|---------|----|-------|
| Créer un employé | ✅ | ❌ | ✅ | ✅ |
| Gérer les contrats | ✅ | ❌ | ✅ | ✅ |
| Valider le temps de travail | ❌ | ✅ | ✅ | ✅ |
| Préparer la paie | ✅ | ❌ | ❌ | ❌ |
| Valider la paie | ❌ | ❌ | ✅ | ✅ |
| Modifier la devise | ❌ | ❌ | ❌ | ❌ (verrouillé) |
| Clôturer une période | ❌ | ❌ | ✅ | ✅ |

Le rôle RH ne peut jamais valider sa propre paie préparée.
Voir DOC-06 pour la logique complète du RBAC.

---

## 7. Invariants métier (règles absolues)

- Un employé actif doit toujours avoir un contrat actif
- Un contrat expiré ne produit plus d'événement de paie
- Une paie validée est **immutable** sans exception
- Toute correction de paie passe par : annulation de la paie erronée + nouvelle paie correcte
- Aucune suppression physique de données RH (soft delete uniquement)
- La hiérarchie RH n'influence pas les permissions applicatives

---

## 8. Ce que DOC-04 ne fait pas volontairement

- ❌ Pas de calcul fiscal détaillé (viendra en Phase 3)
- ❌ Pas de règles pays spécifiques automatisées (INSS, IPR, ONEM — Phase 3)
- ❌ Pas de modèle UI
- ❌ Pas d'automatisation avancée de la paie

Ces éléments viendront après, sans casser la logique actuelle.

---

## Résumé exécutif

DOC-04 :
- Stabilise la structure RH
- Prépare une paie propre et traçable
- Empêche les erreurs comptables silencieuses
- Rend le système auditable dès le premier jour

---

*DOC-04 — Version 2.0 — Mars 2026*
*Aligné avec : DOC-01, DOC-02, DOC-06, DOC-07, DOC-08, DOC-09*
