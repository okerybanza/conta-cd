/**
 * Script pour poster toutes les écritures comptables en draft
 * Nécessaire pour que les écritures apparaissent dans le Grand Livre
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import prisma from '../src/config/database';
import journalEntryService from '../src/services/journalEntry.service';

async function main() {
  console.log('🔄 Postage de toutes les écritures comptables en draft...\n');

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });

  console.log(`🏢 Sociétés trouvées: ${companies.length}\n`);

  for (const company of companies) {
    console.log(`=== Société: ${company.name} (${company.id}) ===`);

    // Récupérer toutes les écritures en draft
    const draftEntries = await prisma.journalEntry.findMany({
      where: {
        companyId: company.id,
        status: 'draft',
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    console.log(`📝 Écritures en draft: ${draftEntries.length}`);

    let postedCount = 0;
    let errorCount = 0;

    for (const entry of draftEntries) {
      try {
        await journalEntryService.post(company.id, entry.id);
        postedCount++;
        if (postedCount % 10 === 0) {
          console.log(`  ✅ ${postedCount} écritures postées...`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(
          `  ⚠️  Erreur lors du postage de l'écriture ${entry.entryNumber}: ${error.message || error.code}`
        );
      }
    }

    console.log(`✅ ${postedCount} écritures postées pour ${company.name}`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} erreurs`);
    }
    console.log('');
  }

  console.log('🎉 Postage terminé !');
}

main()
  .catch((err) => {
    console.error('❌ Erreur lors du postage des écritures:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

