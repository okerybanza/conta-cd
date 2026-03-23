# Standards de Design pour les Templates Email

## Principes de Design Uniforme

Tous les emails envoyés par le système Conta doivent suivre les mêmes standards de design et de branding pour garantir une expérience utilisateur cohérente.

## Structure Standard

### 1. En-tête (Header)
- **Couleur de fond** : `#0D3B66` (bleu Conta)
- **Couleur du texte** : `white !important`
- **Padding** : `20px`
- **Logo** : Affiché si `platformLogo` est disponible
- **Titre** : Centré, taille 22-24px

### 2. Contenu (Content)
- **Padding** : `20px 0`
- **Couleur du texte** : `#333`
- **Line-height** : `1.6`
- **Police** : Arial, sans-serif

### 3. Boutons (Buttons)
Tous les boutons doivent avoir :
- **Background** : `#0D3B66`
- **Couleur du texte** : `white !important` (CRITIQUE pour la visibilité)
- **Padding** : `12px 24px`
- **Border-radius** : `6px`
- **Font-weight** : `500`
- **Hover** : `background-color: #0a2d4d`

**Exemple CSS :**
```css
.button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #0D3B66;
  color: white !important;
  text-decoration: none;
  border-radius: 6px;
  margin: 20px 0;
  font-weight: 500;
}
.button:hover {
  background-color: #0a2d4d;
}
```

**Exemple HTML avec styles inline (recommandé pour compatibilité email) :**
```html
<a href="{{url}}" class="button" style="color: white !important; background-color: #0D3B66; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Texte du bouton</a>
```

### 4. Pied de page (Footer)
- **Padding** : `20px 0`
- **Couleur** : `#666`
- **Taille de police** : `12px`
- **Border-top** : `1px solid #eee`
- **Texte** : "Conta - Application de Facturation" + message automatique

## Variables Disponibles

Tous les templates reçoivent automatiquement :
- `platformLogo` : Logo de la plateforme Conta (ajouté automatiquement par EmailService)
- `supportEmail` : Email de support (doit être fourni dans les données)

## Exemple de Template Minimal

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Titre de l'email - Conta</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #0D3B66;
      color: white !important;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .header-logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0D3B66;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background-color: #0a2d4d;
    }
    .muted {
      color: #666;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #eee;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#if platformLogo}}
      <img src="{{platformLogo}}" alt="Conta" class="header-logo">
      {{/if}}
      <h1>Titre de l'email</h1>
    </div>
    <div class="content">
      <p>Bonjour {{firstName}},</p>
      
      <!-- Contenu de l'email -->
      
      <p class="muted">Besoin d'aide ? {{supportEmail}}</p>
    </div>
    <div class="footer">
      <p>Conta - Application de Facturation</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
```

## Checklist pour Nouveaux Templates

- [ ] Utilise la structure standard (header, content, footer)
- [ ] Boutons avec `color: white !important`
- [ ] Border-radius de 6px pour les boutons
- [ ] Logo platformLogo dans le header
- [ ] SupportEmail dans le footer
- [ ] Styles inline pour les boutons (compatibilité email)
- [ ] Même palette de couleurs (#0D3B66 pour les boutons/header)
- [ ] Même police (Arial, sans-serif)
- [ ] Même structure de footer

## Notes Importantes

1. **Compatibilité Email** : Les clients email (Gmail, Outlook, etc.) ne supportent pas toujours les CSS externes. Utilisez des styles inline pour les éléments critiques comme les boutons.

2. **Couleur du texte des boutons** : Toujours utiliser `color: white !important;` pour éviter que le texte soit invisible sur fond bleu.

3. **Logo** : Le logo est ajouté automatiquement par EmailService via `getEmailLogoUrl()`. Ne pas le hardcoder dans les templates.

4. **Support Email** : Toujours inclure `supportEmail` dans les données envoyées au template.
