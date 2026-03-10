#!/usr/bin/env ts-node
/**
 * Script pour appliquer la migration account_type
 */

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

const runMigration = async () => {
  console.log('🔄 Application de la migration account_type...\n');

  const migrationFile = path.join(
    __dirname,
    '../../database/prisma/migrations/20251217120000_add_account_type_to_companies/migration.sql'
  );

  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Fichier de migration non trouvé:', migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('📝 Exécution de la migration SQL...\n');
  console.log('Contenu de la migration:');
  console.log(sql);
  console.log('\n');

  try {
    // Exécuter le bloc DO $$ ... END $$;
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migration appliquée avec succès !\n');

    // Vérifier que la colonne existe maintenant
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
        AND column_name = 'account_type'
    `;

    if (result.length > 0) {
      console.log('✅ Vérification: La colonne account_type existe bien dans la table companies');
    } else {
      console.log('⚠️  Attention: La colonne account_type n\'a pas été trouvée après la migration');
    }

    // Vérifier le type enum
    const enumResult = await prisma.$queryRaw<Array<{ typname: string }>>`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'AccountType'
    `;

    if (enumResult.length > 0) {
      console.log('✅ Vérification: Le type enum AccountType existe bien');
    } else {
      console.log('⚠️  Attention: Le type enum AccountType n\'a pas été trouvé');
    }

  } catch (error: any) {
    // Ignorer les erreurs "already exists" pour les colonnes/enum
    if (
      error.message?.includes('already exists') ||
      error.message?.includes('duplicate') ||
      error.code === '42P07' || // relation already exists
      error.code === '42710' || // duplicate object
      error.code === '42723' // type already exists
    ) {
      console.log('⚠️  La migration a déjà été appliquée (ignoré)');
      console.log('   Message:', error.message);
    } else {
      console.error('\n❌ Erreur lors de la migration:', error.message);
      console.error('   Code:', error.code);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
};

runMigration();

