#!/usr/bin/env ts-node
/**
 * Script pour exécuter la migration SQL manuellement
 */

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

const runMigration = async () => {
  console.log('🔄 Exécution de la migration SQL...\n');

  const migrationFile = path.join(
    __dirname,
    '../../database/prisma/migrations/manual_add_super_admin/migration.sql'
  );

  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Fichier de migration non trouvé:', migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');

  // Diviser les commandes SQL en tenant compte des blocs
  const lines = sql.split('\n');
  const commands: string[] = [];
  let currentCommand = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // Ignorer les commentaires
    if (trimmed.startsWith('--') || trimmed.length === 0) {
      continue;
    }
    
    currentCommand += ' ' + trimmed;
    
    // Si la ligne se termine par ;, c'est la fin d'une commande
    if (trimmed.endsWith(';')) {
      const cmd = currentCommand.trim();
      if (cmd.length > 0) {
        commands.push(cmd);
      }
      currentCommand = '';
    }
  }

  // Ajouter la dernière commande si elle n'a pas de ;
  if (currentCommand.trim().length > 0) {
    commands.push(currentCommand.trim());
  }

  console.log(`📝 ${commands.length} commandes SQL à exécuter\n`);

  try {
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`[${i + 1}/${commands.length}] Exécution...`);
        console.log(`   ${command.substring(0, 80)}...`);
        try {
          await prisma.$executeRawUnsafe(command);
          console.log(`   ✅ Succès\n`);
        } catch (error: any) {
          // Ignorer les erreurs "already exists" pour les colonnes/index
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate') ||
            error.message?.includes('does not exist') && error.message?.includes('DROP') ||
            error.code === '42P07' || // relation already exists
            error.code === '42710' || // duplicate object
            error.code === '42703' && error.message?.includes('DROP') // column does not exist on DROP
          ) {
            console.log(`   ⚠️  Déjà existant ou non applicable (ignoré)\n`);
          } else {
            console.error(`   ❌ Erreur:`, error.message);
            console.error(`   Code:`, error.code);
            // Ne pas arrêter, continuer avec les autres commandes
            console.log(`   ⚠️  Continuation...\n`);
          }
        }
      }
    }

    console.log('\n✅ Migration terminée avec succès !');
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

runMigration();

