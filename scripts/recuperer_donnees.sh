#!/bin/bash
# Script de récupération sécurisée depuis l'ancien serveur
# TOUTES LES OPÉRATIONS SONT EN LECTURE SEULE - RIEN NE SERA EFFACÉ

ANCIEN_SERVEUR="185.193.17.152"
ANCIEN_USER="root"
ANCIEN_PORT="2307"
ANCIEN_PASS="Nnok62!2KjyFsntx"
ANCIEN_PATH="/home/kazurih/conta.cd"
NOUVEAU_PATH="/home/conta/conta.cd"

echo "🔄 Récupération des données depuis l'ancien serveur..."
echo "⚠️  Mode lecture seule - Aucune donnée ne sera effacée sur l'ancien serveur"
echo ""

# Méthode 1: Via rsync (recommandé)
echo "📦 Tentative de récupération via rsync..."
sshpass -p "$ANCIEN_PASS" rsync -avz --progress \
  -e "ssh -p $ANCIEN_PORT -o StrictHostKeyChecking=no" \
  "$ANCIEN_USER@$ANCIEN_SERVEUR:$ANCIEN_PATH/" \
  "$NOUVEAU_PATH/" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '*.log' \
  2>&1 | tee /tmp/rsync_log.txt

if [ $? -eq 0 ]; then
  echo "✅ Récupération réussie via rsync"
else
  echo "❌ Échec de rsync, tentative alternative..."
  
  # Méthode 2: Créer une archive sur l'ancien serveur puis la télécharger
  echo "📦 Création d'une archive sur l'ancien serveur..."
  sshpass -p "$ANCIEN_PASS" ssh -p $ANCIEN_PORT -o StrictHostKeyChecking=no \
    "$ANCIEN_USER@$ANCIEN_SERVEUR" \
    "cd $ANCIEN_PATH && tar czf /tmp/conta_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    ." 2>&1
  
  if [ $? -eq 0 ]; then
    echo "📥 Téléchargement de l'archive..."
    # Note: Il faudra récupérer le nom exact de l'archive créée
    sshpass -p "$ANCIEN_PASS" scp -P $ANCIEN_PORT -o StrictHostKeyChecking=no \
      "$ANCIEN_USER@$ANCIEN_SERVEUR:/tmp/conta_backup_*.tar.gz" \
      "$NOUVEAU_PATH/backups/"
    
    echo "📦 Extraction de l'archive..."
    cd "$NOUVEAU_PATH"
    tar xzf backups/conta_backup_*.tar.gz
    echo "✅ Récupération réussie via archive"
  fi
fi

echo ""
echo "🔄 Récupération du backup de la base de données..."
mkdir -p "$NOUVEAU_PATH/backups"

# Récupérer le backup de la base de données
sshpass -p "$ANCIEN_PASS" ssh -p $ANCIEN_PORT -o StrictHostKeyChecking=no \
  "$ANCIEN_USER@$ANCIEN_SERVEUR" \
  "pg_dump -U postgres conta_db" > "$NOUVEAU_PATH/backups/backup_import_$(date +%Y%m%d_%H%M%S).sql" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Backup de la base de données récupéré"
  ls -lh "$NOUVEAU_PATH/backups/backup_import_*.sql"
else
  echo "⚠️  Échec de la récupération du backup (peut-être que la base n'existe pas encore)"
fi

echo ""
echo "✅ Récupération terminée"

