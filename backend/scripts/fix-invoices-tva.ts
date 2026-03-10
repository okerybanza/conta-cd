/**
 * Script pour corriger les statuts des factures et vérifier la TVA
 */

import prisma from '../src/config/database';
import { Decimal } from '@prisma/client/runtime/library';

async function fixInvoicesTVA() {
  console.log('🔧 Correction des factures et vérification de la TVA...\n');

  try {
    // Récupérer toutes les entreprises
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
    });

    for (const company of companies) {
      console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

      // 1. Corriger les statuts invalides
      console.log('📄 Correction des statuts de factures...');
      
      // Remplacer 'pending' par 'sent'
      const updatedPending = await prisma.invoice.updateMany({
        where: {
          companyId: company.id,
          status: 'pending',
        },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });
      console.log(`  ✓ ${updatedPending.count} factures 'pending' → 'sent'\n`);

      // 2. Vérifier les factures avec TVA
      console.log('💰 Vérification de la TVA...');
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
        include: {
          lines: true,
        },
      });

      let invoicesWithTVA = 0;
      let invoicesWithoutTVA = 0;
      let invoicesWithInvalidStatus = 0;

      for (const invoice of invoices) {
        const totalTax = Number(invoice.totalTax);
        const hasTVA = totalTax > 0;
        
        // Vérifier si les lignes ont de la TVA
        const linesWithTVA = invoice.lines.filter(line => {
          const lineTax = Number(line.taxAmount || 0);
          return lineTax > 0;
        });

        if (hasTVA && linesWithTVA.length > 0) {
          invoicesWithTVA++;
          
          // Si la facture a de la TVA mais est en 'draft', la passer à 'sent' pour qu'elle apparaisse dans les rapports
          if (invoice.status === 'draft') {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: 'sent',
                sentAt: invoice.sentAt || new Date(),
              },
            });
            invoicesWithInvalidStatus++;
          }
        } else {
          invoicesWithoutTVA++;
        }
      }

      console.log(`  ✓ ${invoicesWithTVA} factures avec TVA`);
      console.log(`  ✓ ${invoicesWithoutTVA} factures sans TVA`);
      if (invoicesWithInvalidStatus > 0) {
        console.log(`  ✓ ${invoicesWithInvalidStatus} factures avec TVA passées de 'draft' à 'sent'`);
      }
      console.log('');

      // 3. Statistiques par statut
      console.log('📊 Statistiques par statut:');
      const statusCounts = await prisma.invoice.groupBy({
        by: ['status'],
        where: {
          companyId: company.id,
          deletedAt: null,
        },
        _count: {
          id: true,
        },
      });

      for (const statusCount of statusCounts) {
        console.log(`  - ${statusCount.status}: ${statusCount._count.id} factures`);
      }
      console.log('');

      // 4. Vérifier la TVA dans les rapports
      console.log('📈 Vérification de la TVA dans les rapports...');
      const invoicesForTVA = await prisma.invoice.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
          status: {
            in: ['sent', 'paid', 'partially_paid'],
          },
          totalTax: {
            gt: 0,
          },
          invoiceDate: {
            gte: new Date(2024, 0, 1),
            lte: new Date(2024, 11, 31),
          },
        },
        select: {
          totalTax: true,
        },
      });

      const totalTVA = invoicesForTVA.reduce((sum, inv) => sum + Number(inv.totalTax), 0);
      console.log(`  ✓ ${invoicesForTVA.length} factures avec TVA dans les rapports`);
      console.log(`  ✓ Total TVA collectée: ${totalTVA.toLocaleString('fr-FR')} CDF\n`);
    }

    console.log('\n✅ Correction terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixInvoicesTVA()
  .then(() => {
    console.log('\n✨ Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

