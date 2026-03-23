# Templates Email - Format Simple

Tous les templates email suivent maintenant un format simple et uniforme :

## Structure Standard

- **Logo Conta** en haut (si disponible via `platformLogo`)
- **Contenu** : Texte simple avec liens cliquables
- **Footer** : "Conta - Application de Facturation"

## Caractéristiques

- ✅ Format simple et lisible
- ✅ Compatible avec tous les clients email
- ✅ Logo Conta automatique
- ✅ Liens cliquables directs (pas de boutons complexes)
- ✅ Styles inline minimaux

## Templates Disponibles

1. **password-reset.html** - Réinitialisation de mot de passe
2. **email-verification-code.html** - Code de vérification d'email
3. **welcome.html** - Email de bienvenue
4. **user-invitation.html** - Invitation utilisateur
5. **invoice-sent.html** - Facture envoyée
6. **payment-received.html** - Paiement reçu
7. **payment-reminder.html** - Rappel de paiement
8. **subscription-renewed.html** - Abonnement renouvelé
9. **subscription-upgraded.html** - Abonnement mis à jour
10. **support-ticket-created.html** - Ticket de support créé
11. **support-ticket-notification.html** - Notification de ticket
12. **support-ticket-response.html** - Réponse à un ticket
13. **accountant-invitation.html** - Invitation expert-comptable
14. **accountant-invitation-accepted.html** - Invitation acceptée
15. **accountant-invitation-rejected.html** - Invitation déclinée
16. **accountant-revoked.html** - Fin de collaboration

## Variables Communes

- `platformLogo` - Logo Conta (ajouté automatiquement)
- `firstName` - Prénom de l'utilisateur
- `companyName` - Nom de l'entreprise
- `supportEmail` - Email de support

## Format du Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Titre - Conta</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    {{#if platformLogo}}
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="{{platformLogo}}" alt="Conta" style="max-width: 150px; height: auto;">
    </div>
    {{/if}}
    
    <!-- Contenu spécifique au template -->
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; margin: 0;">
      Conta - Application de Facturation<br>
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    </p>
  </div>
</body>
</html>
```

## Notes

- Tous les styles sont inline pour une meilleure compatibilité
- Les liens sont simples et cliquables
- Le logo est optionnel (affiché si disponible)
- Format uniforme pour tous les emails
