#!/bin/bash
# Script pour remplacer toutes les références conta.cd par conta.cd
# Mode sécurisé : crée des backups avant modification

PROJECT_DIR="/home/conta/conta.cd"
OLD_DOMAIN="conta.cd"
NEW_DOMAIN="conta.cd"

echo "🔄 Remplacement de $OLD_DOMAIN par $NEW_DOMAIN"
echo "📁 Répertoire: $PROJECT_DIR"
echo ""

# Créer un backup timestamp
BACKUP_DIR="$PROJECT_DIR/backups/replace_domain_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Fonction pour sauvegarder un fichier avant modification
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local backup_path="$BACKUP_DIR/$(echo "$file" | sed 's|/|_|g')"
        cp "$file" "$backup_path"
        echo "✅ Backup: $file → $backup_path"
    fi
}

# Fonction pour remplacer dans un fichier
replace_in_file() {
    local file="$1"
    if [ -f "$file" ] && grep -q "$OLD_DOMAIN" "$file" 2>/dev/null; then
        backup_file "$file"
        sed -i "s|$OLD_DOMAIN|$NEW_DOMAIN|g" "$file"
        echo "✅ Modifié: $file"
        return 0
    fi
    return 1
}

# Compteur de fichiers modifiés
COUNT=0

echo "🔍 Recherche des fichiers à modifier..."
echo ""

# Backend
if [ -d "$PROJECT_DIR/backend" ]; then
    echo "📂 Backend..."
    find "$PROJECT_DIR/backend" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name ".env*" -o -name "*.md" \) | while read file; do
        if replace_in_file "$file"; then
            COUNT=$((COUNT + 1))
        fi
    done
fi

# Frontend
if [ -d "$PROJECT_DIR/frontend" ]; then
    echo "📂 Frontend..."
    find "$PROJECT_DIR/frontend" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name ".env*" -o -name "*.md" \) | while read file; do
        if replace_in_file "$file"; then
            COUNT=$((COUNT + 1))
        fi
    done
fi

# Scripts et autres fichiers
echo "📂 Scripts et autres..."
find "$PROJECT_DIR" -maxdepth 2 -type f \( -name "*.sh" -o -name "*.md" -o -name "*.config.js" \) | while read file; do
    if replace_in_file "$file"; then
        COUNT=$((COUNT + 1))
    fi
done

echo ""
echo "✅ Remplacement terminé"
echo "📊 Fichiers modifiés: $COUNT"
echo "💾 Backups sauvegardés dans: $BACKUP_DIR"
echo ""
echo "🔍 Vérification des occurrences restantes..."
REMAINING=$(grep -r "$OLD_DOMAIN" "$PROJECT_DIR" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=backups 2>/dev/null | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Il reste $REMAINING occurrence(s) de $OLD_DOMAIN"
    echo "   Vérifiez manuellement: grep -r '$OLD_DOMAIN' $PROJECT_DIR"
else
    echo "✅ Aucune occurrence restante de $OLD_DOMAIN"
fi

