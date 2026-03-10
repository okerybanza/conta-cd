#!/usr/bin/env ts-node
/**
 * Script utilitaire pour vérifier les configurations
 * 
 * Usage:
 *   npm run check:config
 *   ou
 *   ts-node backend/scripts/check-config.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface ConfigCheck {
  name: string;
  required: boolean;
  value: string | undefined;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

const checks: ConfigCheck[] = [];

// Vérifier la configuration SMTP
const checkSMTP = () => {
  console.log('📧 Configuration SMTP:\n');
  
  checks.push({
    name: 'SMTP_HOST',
    required: true,
    value: process.env.SMTP_HOST,
    status: process.env.SMTP_HOST ? 'ok' : 'error',
    message: process.env.SMTP_HOST || 'NON DÉFINI',
  });

  checks.push({
    name: 'SMTP_PORT',
    required: true,
    value: process.env.SMTP_PORT,
    status: process.env.SMTP_PORT ? 'ok' : 'error',
    message: process.env.SMTP_PORT || 'NON DÉFINI',
  });

  checks.push({
    name: 'SMTP_USER',
    required: true,
    value: process.env.SMTP_USER,
    status: process.env.SMTP_USER ? 'ok' : 'error',
    message: process.env.SMTP_USER || 'NON DÉFINI',
  });

  checks.push({
    name: 'SMTP_PASS',
    required: true,
    value: process.env.SMTP_PASS,
    status: process.env.SMTP_PASS ? 'ok' : 'error',
    message: process.env.SMTP_PASS ? '***' : 'NON DÉFINI',
  });

  checks.push({
    name: 'SMTP_FROM',
    required: false,
    value: process.env.SMTP_FROM,
    status: process.env.SMTP_FROM ? 'ok' : 'warning',
    message: process.env.SMTP_FROM || 'NON DÉFINI (utilisera SMTP_USER)',
  });

  checks.push({
    name: 'SMTP_INVOICE_FROM',
    required: false,
    value: process.env.SMTP_INVOICE_FROM,
    status: process.env.SMTP_INVOICE_FROM ? 'ok' : 'warning',
    message: process.env.SMTP_INVOICE_FROM || 'NON DÉFINI (utilisera SMTP_FROM)',
  });

  checks.push({
    name: 'SMTP_NOTIF_FROM',
    required: false,
    value: process.env.SMTP_NOTIF_FROM,
    status: process.env.SMTP_NOTIF_FROM ? 'ok' : 'warning',
    message: process.env.SMTP_NOTIF_FROM || 'NON DÉFINI (utilisera SMTP_FROM)',
  });

  // Afficher les résultats
  checks.forEach((check) => {
    const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  });

  // Vérifier la configuration du port
  const port = parseInt(process.env.SMTP_PORT || '0', 10);
  if (port === 465) {
    console.log('\n  ℹ️  Port 465 détecté: SSL/TLS activé (recommandé)');
  } else if (port === 587) {
    console.log('\n  ℹ️  Port 587 détecté: TLS activé');
  } else if (port === 25) {
    console.log('\n  ⚠️  Port 25 détecté: Non-SSL (non recommandé pour la sécurité)');
  }
};

// Vérifier la configuration Redis
const checkRedis = () => {
  console.log('\n📦 Configuration Redis:\n');

  const redisDisabled = process.env.REDIS_DISABLED === 'true';
  const redisUrl = process.env.REDIS_URL;
  const redisEnabled = process.env.REDIS_ENABLED === 'true';

  if (redisDisabled) {
    console.log('  ⚠️  Redis est explicitement désactivé (REDIS_DISABLED=true)');
    console.log('  ℹ️  Les emails seront envoyés directement, sans queue');
  } else if (redisUrl) {
    console.log('  ✅ Redis configuré via REDIS_URL');
    console.log(`     ${redisUrl.replace(/:[^:@]+@/, ':****@')}`); // Masquer le mot de passe
  } else if (redisEnabled) {
    console.log('  ✅ Redis activé (REDIS_ENABLED=true)');
    console.log(`     Host: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`     Port: ${process.env.REDIS_PORT || '6379'}`);
    console.log(`     Password: ${process.env.REDIS_PASSWORD ? '***' : 'non défini'}`);
  } else {
    console.log('  ⚠️  Redis non configuré (désactivé par défaut)');
    console.log('  ℹ️  Pour activer Redis, définir REDIS_ENABLED=true ou REDIS_URL');
    console.log('  ℹ️  Les emails seront envoyés directement, sans queue');
  }
};

// Vérifier les autres configurations importantes
const checkOther = () => {
  console.log('\n🔐 Autres configurations:\n');

  const importantVars = [
    { name: 'DATABASE_URL', required: true },
    { name: 'JWT_SECRET', required: true },
    { name: 'FRONTEND_URL', required: false },
  ];

  importantVars.forEach(({ name, required }) => {
    const value = process.env[name];
    const icon = value ? '✅' : (required ? '❌' : '⚠️');
    const display = value ? (name.includes('SECRET') || name.includes('PASS') ? '***' : value) : 'NON DÉFINI';
    console.log(`  ${icon} ${name}: ${display}`);
  });
};

// Résumé
const printSummary = () => {
  console.log('\n📊 Résumé:\n');

  const errors = checks.filter((c) => c.status === 'error' && c.required).length;
  const warnings = checks.filter((c) => c.status === 'warning').length;
  const ok = checks.filter((c) => c.status === 'ok').length;

  if (errors > 0) {
    console.log(`  ❌ ${errors} erreur(s) critique(s) - Configuration incomplète`);
  } else if (warnings > 0) {
    console.log(`  ⚠️  ${warnings} avertissement(s) - Configuration fonctionnelle mais optimisable`);
  } else {
    console.log(`  ✅ Configuration complète`);
  }

  console.log(`  ✅ ${ok} configuration(s) OK`);
  console.log(`  ⚠️  ${warnings} avertissement(s)`);
  console.log(`  ❌ ${errors} erreur(s)`);

  if (errors > 0) {
    console.log('\n💡 Actions recommandées:');
    console.log('   - Vérifiez le fichier .env');
    console.log('   - Assurez-vous que toutes les variables requises sont définies');
    console.log('   - Consultez env.example pour un exemple de configuration');
  }
};

// Exécuter toutes les vérifications
console.log('🔍 Vérification de la configuration Conta\n');
console.log('='.repeat(50));

checkSMTP();
checkRedis();
checkOther();
printSummary();

console.log('\n' + '='.repeat(50));
console.log('\n💡 Commandes utiles:');
console.log('   - npm run test:smtp     : Tester la connexion SMTP');
console.log('   - npm run check:config   : Vérifier la configuration (ce script)');

