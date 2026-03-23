/**
 * Script de nettoyage automatique des comptes supprimés
 * 
 * À exécuter quotidiennement via un cron job :
 * 0 2 * * * cd /path/to/backend && npm run cleanup-accounts
 * 
 * Ce script anonymise les comptes supprimés après la période d'anonymisation
 */

import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from '../config/database';
import accountDeletionService from '../services/account-deletion.service';
import logger from '../utils/logger';

async function cleanupAnonymizedAccounts() {
  console.log('🧹 Démarrage du nettoyage des comptes anonymisés...\n');

  try {
    const result = await accountDeletionService.cleanupAnonymizedAccounts();

    console.log(`\n📊 Résumé du nettoyage:`);
    console.log(`   📋 Total de comptes vérifiés: ${result.total}`);
    console.log(`   ✅ Comptes anonymisés: ${result.anonymized}`);
    if (result.errors > 0) {
      console.log(`   ❌ Erreurs: ${result.errors}`);
    }
    console.log(`\n✅ Nettoyage terminé\n`);

    logger.info('Account cleanup script completed', result);
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    logger.error('Account cleanup script failed', { error: error.message });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanupAnonymizedAccounts();
