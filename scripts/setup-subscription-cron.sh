#!/bin/bash

# Script de configuration du cron job pour le renouvellement automatique des abonnements

set -e

echo "=========================================="
echo "Configuration du Cron Job - Abonnements"
echo "=========================================="
echo ""

# Vérifier si on est root ou si on a les permissions
if [ "$EUID" -ne 0 ] && [ ! -w "/etc/cron.d" ]; then
    echo "⚠️  Ce script doit être exécuté en tant que root ou avec sudo pour configurer le cron système"
    echo "   Vous pouvez aussi l'ajouter à votre crontab personnel avec: crontab -e"
    echo ""
fi

# Générer un secret aléatoire si non fourni
if [ -z "$CRON_SECRET" ]; then
    CRON_SECRET=$(openssl rand -hex 32)
    echo "🔑 Secret généré automatiquement: $CRON_SECRET"
    echo ""
fi

# URL de l'API (par défaut)
API_URL="${API_URL:-https://conta.cd}"
ENDPOINT="$API_URL/api/v1/cron/renew-subscriptions"

# Heure d'exécution (par défaut 2h du matin)
CRON_HOUR="${CRON_HOUR:-2}"
CRON_MINUTE="${CRON_MINUTE:-0}"

echo "Configuration:"
echo "  - URL API: $ENDPOINT"
echo "  - Heure d'exécution: $CRON_HOUR:$CRON_MINUTE (quotidien)"
echo "  - Secret: $CRON_SECRET"
echo ""

# Créer le fichier cron
CRON_FILE="/tmp/conta-subscription-renewal.cron"
cat > "$CRON_FILE" <<EOF
# Renouvellement automatique des abonnements Conta
# Exécution quotidienne à ${CRON_HOUR}:${CRON_MINUTE}
${CRON_MINUTE} ${CRON_HOUR} * * * curl -X POST "$ENDPOINT" -H "X-Cron-Secret: $CRON_SECRET" -H "Content-Type: application/json" --max-time 300 --silent --show-error --fail > /dev/null 2>&1 || logger -t conta-subscription "Erreur lors du renouvellement automatique des abonnements"
EOF

echo "📝 Fichier cron créé: $CRON_FILE"
echo ""
cat "$CRON_FILE"
echo ""

# Proposer d'ajouter au crontab
read -p "Voulez-vous ajouter cette tâche à votre crontab ? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    # Ajouter au crontab de l'utilisateur actuel
    (crontab -l 2>/dev/null; cat "$CRON_FILE") | crontab -
    echo "✅ Tâche ajoutée au crontab avec succès !"
    echo ""
    echo "Pour vérifier: crontab -l"
    echo "Pour supprimer: crontab -e (puis supprimer la ligne)"
else
    echo "⚠️  Tâche non ajoutée. Vous pouvez l'ajouter manuellement avec:"
    echo "   crontab -e"
    echo "   Puis copier le contenu de: $CRON_FILE"
fi

echo ""
echo "=========================================="
echo "⚠️  IMPORTANT: Ajouter CRON_SECRET au .env"
echo "=========================================="
echo ""
echo "Ajoutez cette ligne dans backend/.env:"
echo "CRON_SECRET=$CRON_SECRET"
echo ""
echo "Puis redémarrez le backend:"
echo "pm2 restart conta-backend"
echo ""

