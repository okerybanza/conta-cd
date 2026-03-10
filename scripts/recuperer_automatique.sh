#!/bin/bash
# Script de récupération automatique depuis l'ancien serveur
# Ce script fonctionnera une fois les accès SSH configurés

set -e

ANCIEN_SERVEUR="185.193.17.152"
ANCIEN_USER="devops"
ANCIEN_PORT="2307"
SSH_KEY="/home/conta/.ssh/id_rsa_ancien_serveur"
ANCIEN_PATH="/home/kazurih/conta.cd"
NOUVEAU_PATH="/home/conta/conta.cd"

echo "🔄 Récupération automatique depuis l'ancien serveur"
echo "=================================================="
echo ""

# Vérifier la connexion
echo "1. Test de connexion..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 -p $ANCIEN_PORT $ANCIEN_USER@$ANCIEN_SERVEUR "echo 'OK'" >/dev/null 2>&1; then
    echo "✅ Connexion SSH réussie"
else
    echo "❌ Impossible de se connecter"
    echo ""
    echo "Options pour activer la récupération automatique :"
    echo ""
    echo "Option A : Activer l'authentification par mot de passe sur l'ancien serveur"
    echo "  Sur l'ancien serveur, éditer /etc/ssh/sshd_config :"
    echo "    PasswordAuthentication yes"
    echo "  Puis : sudo systemctl restart sshd"
    echo ""
    echo "Option B : Configurer une clé SSH"
    echo "  Sur ce serveur : ssh-keygen -t rsa -b 4096"
    echo "  Puis copier la clé : ssh-copy-id -p $ANCIEN_PORT $ANCIEN_USER@$ANCIEN_SERVEUR"
    echo ""
    echo "Option C : Fournir la clé SSH privée"
    echo "  Placer la clé dans ~/.ssh/id_rsa_ancien_serveur"
    echo "  Puis utiliser : ssh -i ~/.ssh/id_rsa_ancien_serveur ..."
    exit 1
fi

# Créer les dossiers de backup
mkdir -p "$NOUVEAU_PATH/backups"

# 2. Récupérer le code source
echo ""
echo "2. Récupération du code source..."
rsync -avz --progress \
  -e "ssh -i $SSH_KEY -p $ANCIEN_PORT" \
  "$ANCIEN_USER@$ANCIEN_SERVEUR:$ANCIEN_PATH/" \
  "$NOUVEAU_PATH/" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '*.log' \
  --exclude 'backups' \
  --exclude '.env' \
  2>&1 | tee /tmp/rsync_log.txt

if [ $? -eq 0 ]; then
    echo "✅ Code source récupéré"
else
    echo "❌ Erreur lors de la récupération du code"
    exit 1
fi

# 3. Récupérer le backup de la base de données
echo ""
echo "3. Récupération du backup de la base de données..."
BACKUP_FILE="$NOUVEAU_PATH/backups/backup_import_$(date +%Y%m%d_%H%M%S).sql"

ssh -i "$SSH_KEY" -p $ANCIEN_PORT $ANCIEN_USER@$ANCIEN_SERVEUR \
  "sudo -u postgres pg_dump conta_db" > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    echo "✅ Backup de la base de données récupéré"
    echo "   Fichier : $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
else
    echo "⚠️  Échec de la récupération du backup (peut-être que la base n'existe pas)"
fi

# 4. Vérifier ce qui a été récupéré
echo ""
echo "4. Vérification des fichiers récupérés..."
if [ -f "$NOUVEAU_PATH/backend/package.json" ]; then
    echo "✅ Code backend présent"
else
    echo "⚠️  Code backend manquant"
fi

if [ -f "$NOUVEAU_PATH/frontend/package.json" ]; then
    echo "✅ Code frontend présent"
else
    echo "⚠️  Code frontend manquant"
fi

if [ -f "$NOUVEAU_PATH/database/prisma/schema.prisma" ]; then
    echo "✅ Schéma Prisma présent"
else
    echo "⚠️  Schéma Prisma manquant"
fi

echo ""
echo "✅ Récupération terminée !"
echo ""
echo "Prochaines étapes :"
echo "1. bash scripts/remplacer_domaine.sh"
echo "2. sudo bash scripts/configurer_ssl.sh"
echo "3. bash scripts/deploy.sh"

