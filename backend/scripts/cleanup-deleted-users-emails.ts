#!/usr/bin/env tsx
/**
 * Script pour nettoyer les emails des utilisateurs supprimés
 * Modifie les emails des utilisateurs supprimés qui n'ont pas encore été modifiés
 * pour libérer les adresses email et permettre leur réutilisation
 */

import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from '../src/config/database';
import logger from '../src/utils/logger';

async function cleanupDeletedUsersEmails() {
  console.log('🧹 Nettoyage des emails des utilisateurs supprimés...\n');

  try {
    // Trouver tous les utilisateurs supprimés dont l'email n'a pas été modifié
    // (email ne commence pas par "deleted_")
    const deletedUsers = await prisma.users.findMany({
      where: {
        deleted_at: { not: null },
        email: { not: { startsWith: 'deleted_' } },
      },
      select: {
        id: true,
        email: true,
        deleted_at: true,
      },
    });

    console.log(`📊 ${deletedUsers.length} utilisateur(s) supprimé(s) trouvé(s) avec email non modifié\n`);

    if (deletedUsers.length === 0) {
      console.log('✅ Aucun email à nettoyer\n');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const user of deletedUsers) {
      try {
        const newEmail = `deleted_${user.id}_${user.email}`;
        
        await prisma.users.update({
          where: { id: user.id },
          data: {
            email: newEmail,
          },
        });

        console.log(`✅ Email modifié: ${user.email} → ${newEmail}`);
        updated++;
      } catch (error: any) {
        console.error(`❌ Erreur lors de la modification de l'email pour ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ ${updated} email(s) modifié(s)`);
    if (errors > 0) {
      console.log(`   ❌ ${errors} erreur(s)`);
    }
    console.log(`\n✅ Nettoyage terminé\n`);

    logger.info('Deleted users emails cleanup completed', {
      total: deletedUsers.length,
      updated,
      errors,
    });
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    logger.error('Deleted users emails cleanup failed', { error: error.message });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le nettoyage
cleanupDeletedUsersEmails()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
