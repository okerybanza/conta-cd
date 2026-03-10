#!/bin/bash
# Script pour mettre à jour tous les templates email au format simple

TEMPLATES_DIR="/home/conta/conta.cd/backend/src/templates/emails"

# Fonction pour créer un template simple avec logo
create_simple_template() {
    local file=$1
    local title=$2
    local content=$3
    
    cat > "$file" << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Conta</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    {{#if platformLogo}}
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="{{platformLogo}}" alt="Conta" style="max-width: 150px; height: auto;">
    </div>
    {{/if}}
    
    ${content}
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666; margin: 0;">
      Conta - Application de Facturation<br>
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    </p>
  </div>
</body>
</html>
EOF
}

echo "Mise à jour des templates email..."

# Template password-reset est déjà fait, on le garde
echo "✓ password-reset.html déjà à jour"

# Template email-verification-code
create_simple_template "$TEMPLATES_DIR/email-verification-code.html" "Confirmez votre email" '
    <h2 style="color: #0D3B66;">Confirmez votre adresse email</h2>
    
    <p>Bonjour {{firstName}},</p>
    
    <p>Bienvenue sur <strong>Conta</strong> ! Pour activer votre compte{{#if companyName}} (<strong>{{companyName}}</strong>){{/if}}, veuillez saisir le code ci-dessous :</p>
    
    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #0D3B66; font-family: monospace;">{{verificationCode}}</div>
    </div>
    
    <p>Ce code est valide {{verificationMinutes}} minutes.</p>
    
    {{#if verifyUrl}}
    <p style="margin: 20px 0;">
      <a href="{{verifyUrl}}" style="color: #0D3B66; text-decoration: underline; font-size: 16px;">{{verifyUrl}}</a>
    </p>
    {{/if}}
    
    <p>Si vous n'\''êtes pas à l'\''origine de cette demande, ignorez cet email.</p>
    <p>Besoin d'\''aide ? {{supportEmail}}</p>
'

echo "✓ email-verification-code.html mis à jour"

# Template welcome
create_simple_template "$TEMPLATES_DIR/welcome.html" "Bienvenue sur Conta" '
    <h2 style="color: #0D3B66;">Bienvenue sur Conta !</h2>
    
    <p>Bonjour {{firstName}},</p>
    
    <p>Bienvenue sur Conta, votre application de facturation complète !</p>
    
    <p>Votre compte a été créé avec succès pour l'\''entreprise <strong>{{companyName}}</strong>.</p>
    
    <p>Vous pouvez maintenant :</p>
    <ul>
      <li>Gérer vos clients et articles</li>
      <li>Créer et envoyer des factures</li>
      <li>Suivre les paiements</li>
      <li>Générer des rapports</li>
    </ul>
    
    {{#if loginUrl}}
    <p style="margin: 20px 0;">
      <a href="{{loginUrl}}" style="color: #0D3B66; text-decoration: underline; font-size: 16px;">{{loginUrl}}</a>
    </p>
    {{/if}}
    
    <p>Si vous avez des questions, n'\''hésitez pas à nous contacter.</p>
    
    <p>Cordialement,<br>L'\''équipe Conta</p>
'

echo "✓ welcome.html mis à jour"

echo "Templates principaux mis à jour !"
