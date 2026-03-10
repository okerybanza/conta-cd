/**
 * Script pour configurer PayPal Super Admin
 * Usage: node scripts/configure-paypal.js
 */

// Utiliser le client Prisma généré depuis le backend
const { PrismaClient } = require('../backend/node_modules/.prisma/client');
const fs = require('fs');
const path = require('path');

// Lire le fichier .env manuellement
const envPath = path.join(__dirname, '../backend/.env');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (match) {
    databaseUrl = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL non trouvé. Veuillez configurer la variable d\'environnement.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function configurePayPal() {
  try {
    console.log('🔧 Configuration PayPal Super Admin...\n');

    // Identifiants PayPal Sandbox
    const paypalConfig = {
      paypalEnabled: true,
      paypalClientId: 'ASHv7mnvRhQti9m6fbJfQizIlA1ASpOUNs1Fj5LhC9Ygbj9vUx8jOOxBfgfI-sk9ErCqs18-SmHdapDG',
      paypalSecretKey: 'EMzG_Fl3Y7qXl3Xs5WPhlfceQvWX6L7bNiyG9YmI-effKvvkXw6IpW0tCKR7zSY2FnE2vMoFo7EVALgw',
      paypalMode: 'sandbox',
      paypalWebhookId: '8M1694684N5547459', // Webhook ID configuré dans PayPal Developer
    };

    // Vérifier si une entrée existe
    let settings = await prisma.platformSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!settings) {
      // Créer une nouvelle entrée
      console.log('📝 Création d\'une nouvelle configuration...');
      settings = await prisma.platformSettings.create({
        data: paypalConfig,
      });
      console.log('✅ Configuration créée avec succès!\n');
    } else {
      // Mettre à jour l'entrée existante
      console.log('📝 Mise à jour de la configuration existante...');
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: paypalConfig,
      });
      console.log('✅ Configuration mise à jour avec succès!\n');
    }

    // Afficher la configuration
    console.log('📋 Configuration PayPal actuelle:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ PayPal activé: ${settings.paypalEnabled ? 'Oui' : 'Non'}`);
    console.log(`🌐 Mode: ${settings.paypalMode}`);
    console.log(`🔑 Client ID: ${settings.paypalClientId?.substring(0, 30)}...`);
    console.log(`🔐 Secret Key: ${settings.paypalSecretKey ? '***' + settings.paypalSecretKey.substring(settings.paypalSecretKey.length - 10) : 'Non défini'}`);
    console.log(`🆔 Webhook ID: ${settings.paypalWebhookId || 'Non configuré'}`);
    console.log(`📅 Dernière mise à jour: ${settings.updatedAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Configuration PayPal terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
configurePayPal();

