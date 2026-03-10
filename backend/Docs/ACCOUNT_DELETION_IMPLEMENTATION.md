# Implémentation de la Gestion de Suppression et Restauration de Comptes

## 📋 Vue d'ensemble

Cette implémentation fournit une solution complète et robuste pour gérer la suppression de comptes utilisateur, la réutilisation d'emails, et la restauration de comptes avec les meilleures pratiques de l'industrie.

## ✨ Fonctionnalités

### 1. **Suppression de compte avec période de grâce**
- Soft delete (pas de suppression définitive)
- Période de grâce de 30 jours (configurable via `ACCOUNT_DELETION_GRACE_PERIOD_DAYS`)
- Anonymisation progressive après 90 jours (configurable via `ACCOUNT_ANONYMIZATION_PERIOD_DAYS`)
- Gestion automatique des abonnements (expiration si dernier utilisateur)
- Email de confirmation de suppression

### 2. **Restauration de compte**
- Restauration possible pendant la période de grâce
- Réinitialisation automatique du mot de passe ou envoi d'un lien
- Email de confirmation de restauration

### 3. **Réutilisation d'email intelligente**
- Vérification de la période de grâce avant réutilisation
- Messages clairs pour l'utilisateur
- Support de la restauration pendant la période de grâce

### 4. **Nettoyage automatique**
- Script cron pour anonymiser les comptes après la période d'anonymisation
- Conservation des données pour audit (soft delete)

## 🏗️ Architecture

### Services créés

1. **`account-deletion.service.ts`**
   - `deleteAccount()` : Suppression avec période de grâce
   - `restoreAccount()` : Restauration pendant la période de grâce
   - `canReuseEmail()` : Vérification de réutilisation d'email
   - `cleanupAnonymizedAccounts()` : Nettoyage automatique
   - `getDeletedAccountInfo()` : Informations sur un compte supprimé

2. **`account-deletion.controller.ts`**
   - Routes REST pour toutes les opérations

3. **`account-deletion.routes.ts`**
   - Routes publiques et protégées

### Modifications apportées

1. **`user.service.ts`**
   - `deleteUser()` délègue maintenant à `accountDeletionService.deleteAccount()`

2. **`app.ts`**
   - Ajout de la route `/api/v1/account`

## 🔧 Configuration

### Variables d'environnement

```env
# Période de grâce en jours (défaut: 30)
ACCOUNT_DELETION_GRACE_PERIOD_DAYS=30

# Période avant anonymisation en jours (défaut: 90)
ACCOUNT_ANONYMIZATION_PERIOD_DAYS=90

# Email de support (pour les emails)
SUPPORT_EMAIL=support@conta.cd
```

### Script cron pour nettoyage automatique

Ajouter dans votre crontab :

```bash
# Nettoyage quotidien à 2h du matin
0 2 * * * cd /path/to/backend && npm run cleanup-accounts
```

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "cleanup-accounts": "tsx src/scripts/cleanup-anonymized-accounts.ts"
  }
}
```

## 📡 API Endpoints

### Supprimer un compte
```http
DELETE /api/v1/account/delete/:userId?
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Raison de la suppression (optionnel)",
  "anonymizeImmediately": false
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "success": true,
    "userId": "...",
    "originalEmail": "user@example.com",
    "gracePeriodEnd": "2024-02-15T00:00:00.000Z",
    "canRestore": true,
    "message": "Compte supprimé. Vous avez 30 jours pour le restaurer."
  }
}
```

### Restaurer un compte
```http
POST /api/v1/account/restore
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "NouveauMotDePasse123" // Optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "success": true,
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "restoredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Vérifier si un email peut être réutilisé
```http
POST /api/v1/account/check-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "canReuse": false,
    "reason": "Un compte avec cet email a été supprimé récemment. Vous pouvez le restaurer dans les 15 jours restants, ou attendre la fin de la période de grâce.",
    "gracePeriodEnd": "2024-02-15T00:00:00.000Z"
  }
}
```

### Obtenir les infos d'un compte supprimé
```http
GET /api/v1/account/deleted-info?email=user@example.com
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "found": true,
    "deletedAt": "2024-01-15T10:00:00.000Z",
    "gracePeriodEnd": "2024-02-15T00:00:00.000Z",
    "canRestore": true,
    "daysRemaining": 15,
    "anonymized": false
  }
}
```

## 🔄 Intégration avec le service d'authentification

### Mise à jour de la logique d'inscription

**À faire :** Modifier la fonction `register()` dans `auth.service.ts` (ou le contrôleur d'authentification) pour utiliser `accountDeletionService.canReuseEmail()` avant de créer un nouveau compte.

**Exemple d'intégration :**

```typescript
import accountDeletionService from './account-deletion.service';

async register(data) {
  // 1. Vérifier si l'email peut être réutilisé
  const emailCheck = await accountDeletionService.canReuseEmail(data.email);
  
  if (!emailCheck.canReuse) {
    if (emailCheck.gracePeriodEnd) {
      // Période de grâce encore active
      throw new CustomError(
        emailCheck.reason || 'Email non disponible',
        409,
        'EMAIL_IN_GRACE_PERIOD',
        {
          gracePeriodEnd: emailCheck.gracePeriodEnd,
          canRestore: true,
        }
      );
    } else {
      // Email déjà utilisé par un compte actif
      throw new CustomError('Email already exists', 409, 'EMAIL_EXISTS');
    }
  }

  // 2. Continuer avec l'inscription normale...
  // ... reste du code d'inscription
}
```

## 📧 Templates d'email à créer

### 1. `account-deleted.html`
Email envoyé lors de la suppression d'un compte.

**Variables disponibles :**
- `firstName` : Prénom de l'utilisateur
- `gracePeriodDays` : Nombre de jours de période de grâce
- `restoreUrl` : URL pour restaurer le compte
- `reason` : Raison de la suppression
- `supportEmail` : Email de support

### 2. `account-restored.html`
Email envoyé lors de la restauration d'un compte.

**Variables disponibles :**
- `firstName` : Prénom de l'utilisateur
- `resetPasswordUrl` : URL pour réinitialiser le mot de passe (si pas de nouveau mot de passe fourni)
- `loginUrl` : URL de connexion

## ✅ Bonnes pratiques implémentées

1. **Soft delete** : Aucune donnée n'est supprimée définitivement
2. **Période de grâce** : 30 jours pour restaurer un compte
3. **Anonymisation progressive** : Données sensibles anonymisées après 90 jours
4. **Gestion des abonnements** : Expiration automatique si dernier utilisateur
5. **Audit trail** : Toutes les opérations sont loggées
6. **Sécurité** : Vérification des permissions, protection contre l'auto-suppression de super admin
7. **UX** : Messages clairs, emails informatifs, possibilité de restauration

## 🧪 Tests recommandés

1. **Test de suppression**
   - Supprimer un compte normal
   - Vérifier que l'email est libéré
   - Vérifier que l'abonnement est géré

2. **Test de restauration**
   - Restaurer un compte pendant la période de grâce
   - Vérifier que l'email original est restauré
   - Vérifier que le compte fonctionne normalement

3. **Test de réutilisation d'email**
   - Essayer de créer un compte avec un email supprimé (période de grâce active)
   - Vérifier le message d'erreur approprié
   - Essayer après expiration de la période de grâce

4. **Test de nettoyage**
   - Exécuter le script de nettoyage
   - Vérifier que les comptes sont anonymisés

## 📝 Notes importantes

1. **Migration des données existantes** : Les comptes déjà supprimés avec l'ancienne méthode (email modifié immédiatement) ne bénéficient pas de la période de grâce. Seuls les nouveaux suppressions utilisent cette logique.

2. **Performance** : Le script de nettoyage peut être long si beaucoup de comptes sont à traiter. Considérer l'exécution en arrière-plan ou par batch.

3. **RGPD** : L'anonymisation après 90 jours respecte les exigences RGPD pour la conservation des données.

4. **Backup** : Assurez-vous d'avoir des backups réguliers avant d'exécuter le script de nettoyage.

## 🚀 Prochaines étapes

1. ✅ Créer les templates d'email (`account-deleted.html`, `account-restored.html`)
2. ✅ Intégrer `canReuseEmail()` dans la logique d'inscription
3. ✅ Configurer le cron job pour le nettoyage automatique
4. ✅ Tester tous les scénarios
5. ✅ Documenter pour les utilisateurs finaux (page de restauration dans le frontend)
