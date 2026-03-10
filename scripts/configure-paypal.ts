/**
 * Script pour configurer PayPal Super Admin
 * Usage: npx ts-node scripts/configure-paypal.ts
 */

import prisma from '../backend/src/config/database';

async function configurePayPal() {
  try {
    console.log('🔧 Configuration PayPal Super Admin...\n');

    // Identifiants PayPal Sandbox
    const paypalConfig = {
      paypalEnabled: true,
      paypalClientId: 'ASHv7mnvRhQti9m6fbJfQizIlA1ASpOUNs1Fj5LhC9Ygbj9vUx8jOOxBfgfI-sk9ErCqs18-SmHdapDG',
      paypalSecretKey: 'EMzG_Fl3Y7qXl3Xs5WPhlfceQvWX6L7bNiyG9YmI-effKvvkXw6IpW0tCKR7zSY2FnE2vMoFo7EVALgw',
      paypalMode: 'sandbox' as const,
    };

    // Vérifier si une entrée existe
    let settings = await prisma.platformSettings.findFirst();

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
  } catch (error: any) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
configurePayPal();

