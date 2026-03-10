/**
 * Script de test pour envoyer un message WhatsApp
 * Usage: npx ts-node test-whatsapp.ts
 */

import whatsappService from './src/services/whatsapp/whatsapp.service';
import logger from './src/utils/logger';

async function testWhatsApp() {
  const testNumber = '+243820142020';
  const testMessage = `Bonjour !\n\nCeci est un test de notification WhatsApp depuis Conta.\n\nSi vous recevez ce message, l'intégration WhatsApp Business fonctionne correctement ! ✅\n\nDate: ${new Date().toLocaleString('fr-FR')}`;

  console.log('🧪 Test d\'envoi WhatsApp...');
  console.log(`📱 Numéro: ${testNumber}`);
  console.log(`💬 Message: ${testMessage}`);
  console.log('');

  // Vérifier si le service est configuré
  if (!whatsappService.isServiceConfigured()) {
    console.error('❌ WhatsApp service is not configured!');
    console.error('Vérifiez vos variables d\'environnement:');
    console.error('- WHATSAPP_META_ACCESS_TOKEN');
    console.error('- WHATSAPP_META_PHONE_NUMBER_ID');
    process.exit(1);
  }

  try {
    console.log('📤 Envoi en cours...');
    const result = await whatsappService.sendText({
      to: testNumber,
      message: testMessage,
    });

    if (result.ok) {
      console.log('✅ Message envoyé avec succès!');
      console.log(`📨 ID du message: ${result.providerMessageId || 'N/A'}`);
      console.log('');
      console.log('Vérifiez votre téléphone pour confirmer la réception.');
    } else {
      console.error('❌ Échec de l\'envoi');
      console.error(`Erreur: ${result.error || 'Erreur inconnue'}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi:');
    console.error(error.message);
    if (error.response) {
      console.error('Détails:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Exécuter le test
testWhatsApp()
  .then(() => {
    console.log('');
    console.log('✨ Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });

