/**
 * Script pour vérifier les paiements dans la base de données
 */

import prisma from '../src/config/database';

async function checkPayments() {
  console.log('🔍 Vérification des paiements...\n');

  try {
    const company = await prisma.company.findFirst({
      where: { name: { contains: 'Test Enterprise' } },
    });

    if (!company) {
      throw new Error('Aucune entreprise trouvée.');
    }

    console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

    // Vérifier les paiements
    const payments = await prisma.payment.findMany({
      where: {
        companyId: company.id,
      },
      take: 10,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            totalTtc: true,
            paidAmount: true,
            remainingBalance: true,
            status: true,
          },
        },
      },
    });

    console.log(`📊 ${payments.length} paiements trouvés (affichage des 10 premiers):\n`);
    for (const payment of payments) {
      console.log(`  💳 Paiement ${payment.id}:`);
      console.log(`     - Facture: ${payment.invoice?.invoiceNumber || 'N/A'}`);
      console.log(`     - Montant: ${payment.amount} ${payment.currency}`);
      console.log(`     - Statut: ${payment.status}`);
      console.log(`     - Méthode: ${payment.paymentMethod}`);
      console.log(`     - Facture totalTtc: ${payment.invoice?.totalTtc || 'N/A'}`);
      console.log(`     - Facture paidAmount: ${payment.invoice?.paidAmount || 'N/A'}`);
      console.log(`     - Facture remainingBalance: ${payment.invoice?.remainingBalance || 'N/A'}`);
      console.log(`     - Facture status: ${payment.invoice?.status || 'N/A'}`);
      console.log('');
    }

    // Vérifier les factures payées
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        companyId: company.id,
        status: 'paid',
        deletedAt: null,
      },
      include: {
        payments: {
          where: {
            deletedAt: null,
          },
        },
      },
      take: 5,
    });

    console.log(`📄 ${paidInvoices.length} factures payées (affichage des 5 premières):\n`);
    for (const invoice of paidInvoices) {
      console.log(`  📄 Facture ${invoice.invoiceNumber}:`);
      console.log(`     - Total TTC: ${invoice.totalTtc}`);
      console.log(`     - Payé: ${invoice.paidAmount || 0}`);
      console.log(`     - Solde: ${invoice.remainingBalance}`);
      console.log(`     - Statut: ${invoice.status}`);
      console.log(`     - Nombre de paiements: ${invoice.payments.length}`);
      if (invoice.payments.length > 0) {
        const totalPayments = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        console.log(`     - Total des paiements: ${totalPayments}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkPayments()
  .then(() => {
    console.log('\n✨ Vérification terminée!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

