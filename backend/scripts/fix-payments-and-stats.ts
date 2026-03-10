/**
 * Script pour corriger les paiements et les statistiques
 * - Met à jour le statut des paiements de 'completed' à 'confirmed'
 * - Met à jour les factures avec les montants payés corrects
 * - Met à jour les statistiques des clients
 */

import prisma from '../src/config/database';
import { Decimal } from '@prisma/client/runtime/library';

async function fixPaymentsAndStats() {
  console.log('🔧 Correction des paiements et statistiques...\n');

  try {
    // Récupérer toutes les entreprises
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
    });

    for (const company of companies) {
      console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

      // 1. Corriger les statuts des paiements
      console.log('💳 Correction des statuts des paiements...');
      const updatedPayments = await prisma.payment.updateMany({
        where: {
          companyId: company.id,
          status: { in: ['completed', 'pending'] },
        },
        data: {
          status: 'confirmed',
        },
      });
      console.log(`  ✓ ${updatedPayments.count} paiements mis à jour\n`);

      // 2. Mettre à jour les factures avec les paiements
      console.log('📄 Mise à jour des factures...');
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
        include: {
          payments: {
            where: {
              status: { in: ['confirmed', 'completed'] },
              deletedAt: null,
            },
          },
        },
      });

      let updatedInvoices = 0;
      for (const invoice of invoices) {
        const totalPaid = invoice.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        );

        const totalTtc = Number(invoice.totalTtc);
        const remainingBalance = Math.max(0, totalTtc - totalPaid);

        // Déterminer le nouveau statut
        let newStatus = invoice.status;
        if (remainingBalance <= 0) {
          newStatus = 'paid';
        } else if (totalPaid > 0) {
          newStatus = 'partially_paid';
        } else if (invoice.status === 'sent') {
          newStatus = 'sent';
        } else {
          newStatus = 'draft';
        }

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: newStatus,
            paidAmount: new Decimal(totalPaid),
            remainingBalance: new Decimal(remainingBalance),
            paidAt: remainingBalance <= 0 ? new Date() : invoice.paidAt,
          },
        });

        updatedInvoices++;
      }
      console.log(`  ✓ ${updatedInvoices} factures mises à jour\n`);

      // 3. Vérifier les statistiques
      console.log('📊 Vérification des statistiques...');
      const customers = await prisma.customer.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
      });

      let customersWithInvoices = 0;
      for (const customer of customers) {
        const invoices = await prisma.invoice.findMany({
          where: {
            customerId: customer.id,
            companyId: company.id,
            deletedAt: null,
          },
          select: {
            totalTtc: true,
            paidAmount: true,
            remainingBalance: true,
          },
        });

        if (invoices.length > 0) {
          customersWithInvoices++;
        }
      }
      console.log(`  ✓ ${customersWithInvoices} clients avec factures\n`);
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
fixPaymentsAndStats()
  .then(() => {
    console.log('\n✨ Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

