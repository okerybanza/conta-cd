import dotenv from 'dotenv';
import prisma from '../src/config/database';
import journalEntryService from '../src/services/journalEntry.service';

dotenv.config({ path: '../.env' });

async function main() {
  console.log('🔄 Démarrage du rattrapage des écritures comptables (factures & dépenses)...');

  const companies = await prisma.companies.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true },
  });

  console.log(`🏢 Sociétés trouvées: ${companies.length}`);

  for (const company of companies) {
    console.log(`\n=== Société: ${company.name} (${company.id}) ===`);

    // FACTURES
    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: company.id,
        deleted_at: null,
        status: {
          notIn: ['draft', 'cancelled'],
        },
      },
      include: {
        customers: true,
      },
    });

    console.log(`🧾 Factures éligibles: ${invoices.length}`);

    let createdInvoiceEntries = 0;

    for (const invoice of invoices) {
      const customer = invoice.customers;
      if (!customer) continue;

      const customerName =
        customer.type === 'particulier'
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : customer.business_name || '';

      try {
        await journalEntryService.ensureForInvoice(company.id, invoice.id, {
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date,
          customerId: invoice.customer_id,
          customerName,
          amountHt: Number(invoice.subtotal),
          taxAmount: Number(invoice.tax_amount),
          amountTtc: Number(invoice.total_amount),
          currency: invoice.currency || 'CDF',
          createdBy: invoice.created_by || undefined,
        });
        createdInvoiceEntries++;
      } catch (error: any) {
        console.error(
          `⚠️ Impossible de créer l'écriture pour la facture ${invoice.invoice_number}: ${error.code || error.message}`,
        );
      }
    }

    console.log(`✅ Écritures factures traitées pour ${company.name}: ${createdInvoiceEntries}`);

    // DÉPENSES
    const expenses = await prisma.expenses.findMany({
      where: {
        company_id: company.id,
        deleted_at: null,
        status: {
          notIn: ['draft', 'cancelled'],
        },
      },
      include: {
        suppliers: true,
        accounts: true,
      },
    });

    console.log(`💸 Dépenses éligibles: ${expenses.length}`);

    let createdExpenseEntries = 0;

    for (const expense of expenses) {
      try {
        await journalEntryService.ensureForExpense(company.id, expense.id, {
          expenseNumber: expense.expense_number,
          expenseDate: expense.expense_date,
          supplierId: expense.supplier_id || undefined,
          supplierName: expense.supplier_name || undefined,
          accountId: expense.account_id || undefined,
          amountHt: Number(expense.amount_ht || expense.amount || 0),
          taxAmount: Number(expense.tax_amount || 0),
          amountTtc: Number(expense.amount_ttc || expense.total_amount || 0),
          currency: expense.currency || 'CDF',
          createdBy: expense.created_by || undefined,
        });
        createdExpenseEntries++;
      } catch (error: any) {
        console.error(
          `⚠️ Impossible de créer l'écriture pour la dépense ${expense.expense_number}: ${error.code || error.message}`,
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
