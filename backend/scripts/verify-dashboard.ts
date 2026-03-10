/**
 * Script pour vérifier la cohérence des données du dashboard
 */

import prisma from '../src/config/database';
import { Decimal } from '@prisma/client/runtime/library';

async function verifyDashboard() {
  console.log('🔍 Vérification de la cohérence du dashboard...\n');

  try {
    // Récupérer toutes les entreprises
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
      take: 3, // Limiter pour l'exemple
    });

    for (const company of companies) {
      console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

      // 1. Revenus (paiements confirmés)
      const totalPayments = await prisma.payment.aggregate({
        where: {
          companyId: company.id,
          status: 'confirmed',
          deletedAt: null,
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });
      console.log(`💰 Revenus (paiements confirmés):`);
      console.log(`  - Total: ${Number(totalPayments._sum.amount || 0).toLocaleString('fr-FR')} CDF`);
      console.log(`  - Nombre de paiements: ${totalPayments._count.id}\n`);

      // 2. Factures totales
      const totalInvoices = await prisma.invoice.count({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
      });
      console.log(`📄 Factures totales: ${totalInvoices}\n`);

      // 3. Factures par statut
      const invoicesByStatus = await prisma.invoice.groupBy({
        by: ['status'],
        where: {
          companyId: company.id,
          deletedAt: null,
        },
        _count: {
          id: true,
        },
        _sum: {
          totalTtc: true,
          remainingBalance: true,
        },
      });
      console.log(`📊 Factures par statut:`);
      for (const status of invoicesByStatus) {
        console.log(`  - ${status.status}: ${status._count.id} factures`);
        console.log(`    Total TTC: ${Number(status._sum.totalTtc || 0).toLocaleString('fr-FR')} CDF`);
        console.log(`    Solde restant: ${Number(status._sum.remainingBalance || 0).toLocaleString('fr-FR')} CDF`);
      }
      console.log('');

      // 4. Factures impayées
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
          status: {
            in: ['sent', 'partially_paid'],
          },
        },
        select: {
          remainingBalance: true,
        },
      });
      const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.remainingBalance), 0);
      console.log(`⚠️ Factures impayées:`);
      console.log(`  - Nombre: ${unpaidInvoices.length}`);
      console.log(`  - Montant: ${unpaidAmount.toLocaleString('fr-FR')} CDF\n`);

      // 5. Factures en retard
      const now = new Date();
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
          status: {
            in: ['sent', 'partially_paid'],
          },
          dueDate: {
            lt: now,
          },
        },
        select: {
          remainingBalance: true,
          dueDate: true,
        },
      });
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.remainingBalance), 0);
      console.log(`🔴 Factures en retard:`);
      console.log(`  - Nombre: ${overdueInvoices.length}`);
      console.log(`  - Montant: ${overdueAmount.toLocaleString('fr-FR')} CDF\n`);

      // 6. Dépenses
      const totalExpenses = await prisma.expense.aggregate({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
        _sum: {
          amountTtc: true,
        },
        _count: {
          id: true,
        },
      });
      console.log(`💸 Dépenses:`);
      console.log(`  - Total: ${Number(totalExpenses._sum.amountTtc || 0).toLocaleString('fr-FR')} CDF`);
      console.log(`  - Nombre: ${totalExpenses._count.id}\n`);

      // 7. Bénéfice net (revenus - dépenses)
      const revenue = Number(totalPayments._sum.amount || 0);
      const expenses = Number(totalExpenses._sum.amountTtc || 0);
      const profit = revenue - expenses;
      console.log(`📈 Bénéfice net:`);
      console.log(`  - Revenus: ${revenue.toLocaleString('fr-FR')} CDF`);
      console.log(`  - Dépenses: ${expenses.toLocaleString('fr-FR')} CDF`);
      console.log(`  - Bénéfice: ${profit.toLocaleString('fr-FR')} CDF`);
      console.log(`  - Marge: ${revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0}%\n`);

      // 8. Taux de recouvrement
      const totalInvoiced = invoicesByStatus.reduce((sum, s) => sum + Number(s._sum.totalTtc || 0), 0);
      const totalPaid = revenue;
      const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
      console.log(`📊 Taux de recouvrement:`);
      console.log(`  - Facturé: ${totalInvoiced.toLocaleString('fr-FR')} CDF`);
      console.log(`  - Payé: ${totalPaid.toLocaleString('fr-FR')} CDF`);
      console.log(`  - Taux: ${collectionRate.toFixed(2)}%\n`);

      console.log('─'.repeat(60) + '\n');
    }

    console.log('\n✅ Vérification terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
verifyDashboard()
  .then(() => {
    console.log('\n✨ Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

