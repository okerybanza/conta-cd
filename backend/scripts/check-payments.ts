/**
 * Script pour vérifier les paiements dans la base de données
 */

import prisma from '../src/config/database';

async function checkPayments() {
  console.log('🔍 Vérification des paiements...\n');

  try {
    const company = await prisma.companies.findFirst({
      where: { name: { contains: 'Test Enterprise' } },
    });

    if (!company) {
      throw new Error('Aucune entreprise trouvée.');
    }

    console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

    // Vérifier les paiements
    const payments = await prisma.payments.findMany({
      where: {
        company_id: company.id,
      },
      take: 10,
      include: {
        invoices: {
          select: {
            invoice_number: true,
            total_amount: true,
            paid_amount: true,
            status: true,
          },
        },
      },
    });

    console.log(`📊 ${payments.length} paiements trouvés (affichage des 10 premiers):\n`);
    for (const payment of payments) {
      const inv = payment.invoices;
      const total = inv ? Number(inv.total_amount) : 0;
      const paid = inv ? Number(inv.paid_amount || 0) : 0;
      const remaining = inv ? total - paid : 0;
      console.log(`  💳 Paiement ${payment.id}:`);
      console.log(`     - Facture: ${inv?.invoice_number || 'N/A'}`);
      console.log(`     - Montant: ${payment.amount} ${payment.currency}`);
      console.log(`     - Statut: ${payment.status}`);
      console.log(`     - Méthode: ${payment.payment_method}`);
      console.log(`     - Facture total TTC: ${inv ? total : 'N/A'}`);
      console.log(`     - Facture paid_amount: ${inv ? paid : 'N/A'}`);
      console.log(`     - Solde restant (calculé): ${inv ? remaining : 'N/A'}`);
      console.log(`     - Facture status: ${inv?.status || 'N/A'}`);
      console.log('');
    }

    // Vérifier les factures payées
    const paidInvoices = await prisma.invoices.findMany({
      where: {
        company_id: company.id,
        status: 'paid',
        deleted_at: null,
      },
      include: {
        payments: {
          where: {
            deleted_at: null,
          },
        },
      },
      take: 5,
    });

    console.log(`📄 ${paidInvoices.length} factures payées (affichage des 5 premières):\n`);
    for (const invoice of paidInvoices) {
      const total = Number(invoice.total_amount);
      const paidAmt = Number(invoice.paid_amount || 0);
      const remaining = total - paidAmt;
      console.log(`  📄 Facture ${invoice.invoice_number}:`);
      console.log(`     - Total TTC: ${invoice.total_amount}`);
      console.log(`     - Payé: ${invoice.paid_amount || 0}`);
      console.log(`     - Solde (calculé): ${remaining}`);
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
