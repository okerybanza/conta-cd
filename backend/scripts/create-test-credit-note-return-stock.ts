import prisma from '../src/config/database';
import creditNoteService from '../src/services/creditNote.service';

async function main() {
  const company = await prisma.companies.findFirst({
    where: { deleted_at: null },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error('Aucune entreprise trouvée.');
  }

  const user = await prisma.users.findFirst({
    where: {
      company_id: company.id,
      deleted_at: null,
    },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error('Aucun utilisateur trouvé pour cette entreprise.');
  }

  const invoice = await prisma.invoices.findFirst({
    where: {
      company_id: company.id,
      deleted_at: null,
      paid_amount: 0,
    },
    include: {
      invoice_lines: {
        where: { product_id: { not: null } },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!invoice || invoice.invoice_lines.length === 0) {
    console.log('Aucune facture avec lignes de stock et non payée trouvée.');
    return;
  }

  const lines = invoice.invoice_lines
    .map((line) => {
      const maxQty = Number(line.quantity || 0);
      const quantity = Number((maxQty / 2).toFixed(2));
      if (quantity <= 0) return null;

      return {
        productId: line.product_id || undefined,
        description: line.description || 'Produit',
        quantity,
        unitPrice: Number(line.unit_price || 0),
        taxRate: Number(line.tax_rate || 0),
      };
    })
    .filter((line): line is NonNullable<typeof line> => !!line);

  if (lines.length === 0) {
    console.log('Impossible de générer des lignes d\'avoir à partir des lignes de facture.');
    return;
  }

  const creditNote = await creditNoteService.create(company.id, user.id, {
    invoiceId: invoice.id,
    amount: 0,
    taxAmount: 0,
    reason: 'Test retour stock partiel',
    reference: `TEST-RET-STOCK-${new Date().toISOString().slice(0, 10)}`,
    creditNoteDate: new Date(),
    returnStock: true,
    lines,
  });

  const appliedCreditNote = await creditNoteService.applyCreditNote(company.id, creditNote.id, user.id);

  console.log('Avoir créé et appliqué avec retour stock partiel.');
  console.log('Entreprise:', company.name, company.id);
  console.log('Utilisateur:', user.email, user.id);
  console.log('Facture:', invoice.invoice_number, invoice.id);
  console.log('Avoir:', appliedCreditNote.credit_note_number, appliedCreditNote.id);
}

main()
  .catch((error) => {
    console.error('Erreur script avoir retour stock:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
