import dotenv from 'dotenv';
import prisma from '../src/config/database';
import journalEntryService from '../src/services/journalEntry.service';

dotenv.config({ path: '../.env' });

async function main() {
  console.log('🔄 Démarrage du rattrapage des écritures comptables (factures & dépenses)...');

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });

  console.log(`🏢 Sociétés trouvées: ${companies.length}`);

  for (const company of companies) {
    console.log(`\n=== Société: ${company.name} (${company.id}) ===`);

    // FACTURES
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: company.id,
        deletedAt: null,
        status: {
          notIn: ['draft', 'cancelled'],
        },
      },
      include: {
        customer: true,
      },
    });

    console.log(`🧾 Factures éligibles: ${invoices.length}`);

    let createdInvoiceEntries = 0;

    for (const invoice of invoices) {
      const customer = invoice.customer;
      if (!customer) continue;

      const customerName =
        customer.type === 'particulier'
          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
          : customer.businessName || '';

      try {
        await journalEntryService.ensureForInvoice(company.id, invoice.id, {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerId: invoice.customerId,
          customerName,
          amountHt: Number(invoice.subtotal),
          taxAmount: Number(invoice.taxAmount),
          amountTtc: Number(invoice.totalAmount),
          currency: invoice.currency || 'CDF',
          createdBy: invoice.createdBy || undefined,
        });
        createdInvoiceEntries++;
      } catch (error: any) {
        console.error(
          `⚠️ Impossible de créer l'écriture pour la facture ${invoice.invoiceNumber}: ${error.code || error.message}`,
        );
      }
    }

    console.log(`✅ Écritures factures traitées pour ${company.name}: ${createdInvoiceEntries}`);

    // DÉPENSES
    const expenses = await prisma.expense.findMany({
      where: {
        companyId: company.id,
        deletedAt: null,
        status: {
          notIn: ['draft', 'cancelled'],
        },
      },
      include: {
        supplier: true,
        account: true,
      },
    });

    console.log(`💸 Dépenses éligibles: ${expenses.length}`);

    let createdExpenseEntries = 0;

    for (const expense of expenses) {
      try {
        await journalEntryService.ensureForExpense(company.id, expense.id, {
          expenseNumber: expense.expenseNumber,
          expenseDate: expense.expenseDate,
          supplierId: expense.supplierId || undefined,
          supplierName: expense.supplierName || undefined,
          accountId: expense.accountId || undefined,
          amountHt: Number(expense.amountHt || expense.amount || 0),
          taxAmount: Number(expense.taxAmount || 0),
          amountTtc: Number(expense.amountTtc || expense.totalAmount || 0),
          currency: expense.currency || 'CDF',
          createdBy: expense.createdBy || undefined,
        });
        createdExpenseEntries++;
      } catch (error: any) {
        console.error(
          `⚠️ Impossible de créer l'écriture pour la dépense ${expense.expenseNumber}: ${error.code || error.message}`,
        );
      }
    }

    console.log(`✅ Écritures dépenses traitées pour ${company.name}: ${createdExpenseEntries}`);
  }

  console.log('\n🎉 Rattrapage des écritures comptables terminé.');
}

main()
  .catch((err) => {
    console.error('❌ Erreur lors du rattrapage des écritures comptables:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


