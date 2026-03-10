#!/usr/bin/env node
/**
 * Script de test SMTP pour vérifier la configuration email
 * Usage: node scripts/test-smtp.js [email_destinataire]
 */

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const testEmail = process.argv[2] || 'test@example.com';

async function testSMTP() {
  console.log('🧪 Test de la configuration SMTP...\n');

  const config = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV !== 'production',
    },
  };

  console.log('📋 Configuration SMTP:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.auth ? config.auth.user : 'Aucun (relay local)'}`);
  console.log(`   From: ${process.env.SMTP_FROM || 'noreply@conta.cd'}\n`);

  // Créer le transporteur
  const transporter = nodemailer.createTransport(config);

  // Test 1: Vérifier la connexion
  console.log('1️⃣  Test de connexion SMTP...');
  try {
    await transporter.verify();
    console.log('   ✅ Connexion SMTP réussie\n');
  } catch (error) {
    console.log(`   ❌ Erreur de connexion: ${error.message}\n`);
    process.exit(1);
  }

  // Test 2: Envoyer un email de test
  console.log('2️⃣  Test d\'envoi d\'email...');
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@conta.cd',
      to: testEmail,
      subject: 'Test SMTP - Conta.cd',
      text: 'Ceci est un email de test pour vérifier la configuration SMTP de Conta.cd.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0D3B66;">Test SMTP - Conta.cd</h2>
          <p>Ceci est un email de test pour vérifier la configuration SMTP de Conta.cd.</p>
          <p><strong>Configuration utilisée:</strong></p>
          <ul>
            <li>Host: ${config.host}</li>
            <li>Port: ${config.port}</li>
            <li>Secure: ${config.secure}</li>
            <li>User: ${config.auth ? config.auth.user : 'Aucun'}</li>
          </ul>
          <p style="color: #28a745;">✅ Si vous recevez cet email, la configuration SMTP fonctionne correctement !</p>
        </div>
      `,
    });

    console.log(`   ✅ Email envoyé avec succès !`);
    console.log(`   📧 Message ID: ${info.messageId}`);
    console.log(`   📬 Destinataire: ${testEmail}\n`);

    console.log('✅ Tous les tests SMTP ont réussi !\n');
    console.log('💡 Vous pouvez maintenant utiliser le système de mot de passe oublié.');
  } catch (error) {
    console.log(`   ❌ Erreur d'envoi: ${error.message}\n`);
    console.log('💡 Suggestions:');
    console.log('   - Vérifiez que le serveur SMTP est accessible');
    console.log('   - Vérifiez les identifiants (SMTP_USER, SMTP_PASS)');
    console.log('   - Vérifiez que le port est correct (587 pour TLS, 465 pour SSL, 25 pour non-SSL)');
    console.log('   - Pour localhost, vérifiez que Postfix/Sendmail est configuré\n');
    process.exit(1);
  }
}

testSMTP().catch(console.error);
