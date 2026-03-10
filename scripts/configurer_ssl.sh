#!/bin/bash
# Script pour configurer SSL avec Let's Encrypt

echo "🔒 Configuration SSL pour conta.cd avec Let's Encrypt..."
echo ""

# Vérifier que Nginx est configuré et fonctionne
if ! sudo nginx -t > /dev/null 2>&1; then
    echo "❌ Erreur dans la configuration Nginx. Corrigez d'abord."
    exit 1
fi

# Obtenir le certificat SSL
echo "📜 Obtention du certificat SSL..."
sudo certbot --nginx -d conta.cd -d www.conta.cd --non-interactive --agree-tos --email admin@conta.cd --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificat SSL obtenu avec succès"
    echo ""
    echo "🔄 Redémarrage de Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx rechargé"
    echo ""
    echo "🔍 Vérification du renouvellement automatique..."
    sudo certbot renew --dry-run
    echo ""
    echo "✅ SSL configuré avec succès!"
    echo "🌐 Votre site est maintenant accessible en HTTPS: https://conta.cd"
else
    echo "❌ Erreur lors de l'obtention du certificat SSL"
    echo "   Vérifiez que:"
    echo "   1. Le domaine conta.cd pointe bien vers ce serveur (185.250.37.250)"
    echo "   2. Les ports 80 et 443 sont ouverts"
    echo "   3. Nginx est bien configuré et fonctionne"
    exit 1
fi

