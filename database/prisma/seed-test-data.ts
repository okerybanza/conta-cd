import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Importer les services pour créer les écritures comptables
let journalEntryService: any;
let accountService: any;

async function initServices() {
  try {
    // Import dynamique pour éviter les erreurs si les services ne sont pas disponibles
    const journalEntryModule = await import('../../backend/src/services/journalEntry.service');
    journalEntryService = journalEntryModule.default;
    const accountModule = await import('../../backend/src/services/account.service');
    accountService = accountModule.default;
  } catch (error) {
    console.warn('⚠️  Services non disponibles, les écritures comptables automatiques seront ignorées');
  }
}

/**
 * Script de seed pour créer des données de test cohérentes
 * Génère : clients, produits, factures, paiements, dépenses, écritures comptables, logs d'audit
 */
async function main() {
  console.log('🌱 Création de données de test...\n');

  // Initialiser les services
  await initServices();

  // Récupérer la première entreprise et le premier utilisateur
  const company = await prisma.company.findFirst({
    include: {
      users: {
        where: { deletedAt: null },
        take: 1,
      },
    },
  });

  if (!company) {
    console.log('❌ Aucune entreprise trouvée. Créez d\'abord une entreprise.');
    return;
  }

  const user = company.users[0];
  if (!user) {
    console.log('❌ Aucun utilisateur trouvé. Créez d\'abord un utilisateur.');
    return;
  }

  console.log(`📊 Entreprise: ${company.name}`);
  console.log(`👤 Utilisateur: ${user.email}\n`);

  // Dates pour les données (derniers 12 mois pour avoir plus de données)
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  
  // 1. Créer des clients
  console.log('👥 Création de clients...');
  const customers: any[] = [];
  const customerNames = [
    { type: 'particulier' as const, firstName: 'Jean', lastName: 'Mukamba' },
    { type: 'particulier' as const, firstName: 'Marie', lastName: 'Kabila' },
    { type: 'entreprise' as const, businessName: 'Tech Solutions RDC' },
    { type: 'entreprise' as const, businessName: 'Commerce Général Kinshasa' },
    { type: 'entreprise' as const, businessName: 'Services Pro SARL' },
  ];

  for (const customerData of customerNames) {
    const email = customerData.type === 'particulier'
      ? `${customerData.firstName?.toLowerCase()}.${customerData.lastName?.toLowerCase()}@example.com`
      : `${customerData.businessName?.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    
    // Vérifier si le client existe déjà
    const existing = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        email,
      },
    });

    let customer;
    if (existing) {
      customer = existing;
    } else {
      customer = await prisma.customer.create({
        data: {
        companyId: company.id,
        type: customerData.type,
        firstName: customerData.type === 'particulier' ? customerData.firstName : null,
        lastName: customerData.type === 'particulier' ? customerData.lastName : null,
        businessName: customerData.type === 'entreprise' ? customerData.businessName : null,
        email: customerData.type === 'particulier'
          ? `${customerData.firstName?.toLowerCase()}.${customerData.lastName?.toLowerCase()}@example.com`
          : `${customerData.businessName?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: `+243${Math.floor(Math.random() * 900000000) + 100000000}`,
        city: 'Kinshasa',
          country: 'RDC',
        },
      });
    }
    customers.push(customer);
  }
  console.log(`✅ ${customers.length} clients créés\n`);

  // 2. Créer des produits
  console.log('📦 Création de produits...');
  const products: any[] = [];
  const productData = [
    { name: 'Consultation IT', type: 'service' as const, unitPrice: 50000, taxRate: 16 },
    { name: 'Développement Web', type: 'service' as const, unitPrice: 150000, taxRate: 16 },
    { name: 'Ordinateur Portable', type: 'product' as const, unitPrice: 800000, taxRate: 16 },
    { name: 'Imprimante', type: 'product' as const, unitPrice: 300000, taxRate: 16 },
    { name: 'Formation', type: 'service' as const, unitPrice: 200000, taxRate: 16 },
  ];

  for (const prodData of productData) {
    const sku = `SKU-${prodData.name.toUpperCase().replace(/\s+/g, '-')}`;
    const existing = await prisma.product.findFirst({
      where: {
        companyId: company.id,
        sku: sku,
      },
    });
    
    let product;
    if (existing) {
      product = existing;
    } else {
      product = await prisma.product.create({
        data: {
          companyId: company.id,
          name: prodData.name,
          sku: sku,
          type: prodData.type,
          unitPrice: new Prisma.Decimal(prodData.unitPrice),
          taxRate: new Prisma.Decimal(prodData.taxRate),
          currency: 'CDF',
          category: prodData.type === 'service' ? 'Services' : 'Équipements',
          isActive: true,
          trackStock: prodData.type === 'product',
          stockQuantity: prodData.type === 'product' ? Math.floor(Math.random() * 50) + 10 : null,
        },
      });
    }
    products.push(product);
  }
  console.log(`✅ ${products.length} produits créés\n`);

  // 3. Créer des fournisseurs
  console.log('🏢 Création de fournisseurs...');
  const suppliers: any[] = [];
  const supplierNames = [
    'Fournisseur Équipements SARL',
    'Services Généraux RDC',
    'Matériel Informatique Pro',
  ];

  for (const supplierName of supplierNames) {
    const existing = await prisma.supplier.findFirst({
      where: {
        companyId: company.id,
        name: supplierName,
      },
    });
    
    let supplier;
    if (existing) {
      supplier = existing;
    } else {
      supplier = await prisma.supplier.create({
        data: {
          companyId: company.id,
          name: supplierName,
          email: `${supplierName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: `+243${Math.floor(Math.random() * 900000000) + 100000000}`,
          city: 'Kinshasa',
          country: 'RDC',
        },
      });
    }
    suppliers.push(supplier);
  }
  console.log(`✅ ${suppliers.length} fournisseurs créés\n`);

  // 4. Créer des catégories de dépenses
  console.log('📁 Création de catégories de dépenses...');
  const categories: any[] = [];
  const categoryNames = ['Fournitures', 'Services', 'Équipements', 'Transport'];

  for (const categoryName of categoryNames) {
    const existing = await prisma.expenseCategory.findFirst({
      where: {
        companyId: company.id,
        name: categoryName,
      },
    });
    
    let category;
    if (existing) {
      category = existing;
    } else {
      category = await prisma.expenseCategory.create({
        data: {
          companyId: company.id,
          name: categoryName,
          description: `Catégorie pour ${categoryName.toLowerCase()}`,
          isActive: true,
        },
      });
    }
    categories.push(category);
  }
  console.log(`✅ ${categories.length} catégories créées\n`);

  // 5. Créer des factures avec paiements (derniers 12 mois)
  console.log('📄 Création de factures et paiements...');
  const invoices: any[] = [];
  const payments: any[] = [];
  
  // Créer 60 factures pour avoir plus de données
  for (let i = 0; i < 60; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const invoiceDate = new Date(
      twelveMonthsAgo.getTime() + Math.random() * (now.getTime() - twelveMonthsAgo.getTime())
    );
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Créer 1-4 lignes de facture
    const lines: any[] = [];
    const numLines = Math.floor(Math.random() * 4) + 1;
    let subtotalHt = 0;
    let totalTax = 0;

    for (let j = 0; j < numLines; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const unitPrice = Number(product.unitPrice);
      const taxRate = Number(product.taxRate);
      const lineSubtotal = quantity * unitPrice;
      const lineTax = lineSubtotal * (taxRate / 100);
      
      subtotalHt += lineSubtotal;
      totalTax += lineTax;

      lines.push({
        productId: product.id,
        productName: product.name,
        description: product.description || `${product.name}`,
        quantity,
        unitPrice,
        taxRate,
        subtotal: lineSubtotal,
      });
    }

    const totalTtc = subtotalHt + totalTax;
    // Plus de factures payées pour avoir des données TVA
    const statuses: ('draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue')[] = 
      ['sent', 'paid', 'paid', 'paid', 'partially_paid', 'overdue'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Générer le numéro de facture avec un timestamp pour éviter les doublons
    const timestamp = Date.now();
    const invoiceNumber = `FAC-${invoiceDate.getFullYear()}-${String(i + 1).padStart(4, '0')}-${timestamp.toString().slice(-6)}`;

    // Vérifier si la facture existe déjà
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        companyId: company.id,
        invoiceNumber: invoiceNumber,
      },
    });

    if (existingInvoice) {
      console.warn(`⚠️  Facture ${invoiceNumber} existe déjà, passage à la suivante`);
      continue;
    }

    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        invoiceNumber,
        invoicePrefix: 'FAC',
        sequentialNumber: i + 1,
        invoiceDate,
        dueDate,
        status,
        subtotalHt: new Prisma.Decimal(subtotalHt),
        totalTax: new Prisma.Decimal(totalTax),
        totalTtc: new Prisma.Decimal(totalTtc),
        remainingBalance: status === 'paid' 
          ? new Prisma.Decimal(0)
          : status === 'partially_paid'
          ? new Prisma.Decimal(totalTtc * 0.5)
          : new Prisma.Decimal(totalTtc),
        paidAmount: status === 'paid' 
          ? new Prisma.Decimal(totalTtc)
          : status === 'partially_paid'
          ? new Prisma.Decimal(totalTtc * 0.5)
          : new Prisma.Decimal(0),
        currency: 'CDF',
        lines: {
          create: lines.map((line, idx) => {
            const lineSubtotal = line.quantity * line.unitPrice;
            const lineTax = lineSubtotal * (line.taxRate / 100);
            const lineTotal = lineSubtotal + lineTax;
            return {
              lineNumber: idx + 1,
              productId: line.productId,
              name: line.productName,
              description: line.description,
              quantity: new Prisma.Decimal(line.quantity),
              unitPrice: new Prisma.Decimal(line.unitPrice),
              taxRate: new Prisma.Decimal(line.taxRate),
              taxAmount: new Prisma.Decimal(lineTax),
              subtotal: new Prisma.Decimal(lineSubtotal),
              total: new Prisma.Decimal(lineTotal),
            };
          }),
        },
        createdBy: user.id,
        sentAt: status !== 'draft' ? invoiceDate : null,
        sentVia: status !== 'draft' ? 'email' : null,
      },
      include: {
        customer: true,
      },
    });
    invoices.push(invoice);

    // Créer l'écriture comptable pour la facture (si les services sont disponibles)
    if (journalEntryService && accountService && status !== 'draft') {
      try {
        const customerName = invoice.customer.type === 'particulier'
          ? `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim()
          : invoice.customer.businessName || '';
        
        await journalEntryService.createForInvoice(company.id, invoice.id, {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerId: invoice.customerId,
          customerName,
          amountHt: subtotalHt,
          taxAmount: totalTax,
          amountTtc: totalTtc,
          currency: 'CDF',
          createdBy: user.id,
        });
      } catch (error: any) {
        // Ignorer les erreurs (comptes peut-être non créés)
        console.warn(`⚠️  Impossible de créer l'écriture comptable pour ${invoice.invoiceNumber}: ${error.message}`);
      }
    }

    // Créer des paiements pour les factures payées ou partiellement payées
    if (status === 'paid' || status === 'partially_paid') {
      const paymentAmount = status === 'paid' ? totalTtc : totalTtc * 0.5;
      const paymentDate = new Date(invoiceDate);
      paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 30));

      const payment = await prisma.payment.create({
        data: {
          companyId: company.id,
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(paymentAmount),
          currency: 'CDF',
          paymentDate,
          paymentMethod: ['cash', 'mobile_money', 'bank_transfer'][Math.floor(Math.random() * 3)],
          status: 'confirmed',
          reference: `PAY-${invoiceNumber}-${Date.now()}`,
          createdBy: user.id,
        },
      });
      payments.push(payment);

      // Créer l'écriture comptable pour le paiement
      if (journalEntryService && accountService) {
        try {
          await journalEntryService.createForPayment(company.id, payment.id, {
            paymentDate: payment.paymentDate,
            amount: paymentAmount,
            currency: 'CDF',
            invoiceId: invoice.id,
            paymentMethod: payment.paymentMethod,
            createdBy: user.id,
          });
        } catch (error: any) {
          // Ignorer les erreurs
          console.warn(`⚠️  Impossible de créer l'écriture comptable pour le paiement ${payment.id}: ${error.message}`);
        }
      }
    }

    // Créer un log d'audit pour la création de facture
    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: user.id,
        userEmail: user.email,
        action: 'CREATE',
        entityType: 'invoice',
        entityId: invoice.id,
        changes: { created: { invoiceNumber, totalTtc } },
        metadata: { operation: 'create', source: 'seed' },
        createdAt: invoiceDate,
      },
    });
  }
  console.log(`✅ ${invoices.length} factures créées`);
  console.log(`✅ ${payments.length} paiements créés\n`);

  // 6. Créer des dépenses (derniers 12 mois)
  console.log('💰 Création de dépenses...');
  const expenses: any[] = [];
  
  // Créer 40 dépenses pour avoir plus de données
  for (let i = 0; i < 40; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const expenseDate = new Date(
      twelveMonthsAgo.getTime() + Math.random() * (now.getTime() - twelveMonthsAgo.getTime())
    );

    const amountHt = Math.floor(Math.random() * 500000) + 50000;
    const taxRate = 16;
    const taxAmount = amountHt * (taxRate / 100);
    const amountTtc = amountHt + taxAmount;

    // Plus de dépenses validées/payées pour avoir des données TVA
    const statuses: ('draft' | 'pending' | 'validated' | 'paid' | 'cancelled')[] = 
      ['validated', 'paid', 'paid', 'paid', 'pending'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Générer le numéro de dépense avec un timestamp pour éviter les doublons
    const timestamp = Date.now();
    const expenseNumber = `DEP-${expenseDate.getFullYear()}-${String(i + 1).padStart(4, '0')}-${timestamp.toString().slice(-6)}`;

    // Vérifier si la dépense existe déjà
    const existingExpense = await prisma.expense.findFirst({
      where: {
        companyId: company.id,
        expenseNumber: expenseNumber,
      },
    });

    if (existingExpense) {
      console.warn(`⚠️  Dépense ${expenseNumber} existe déjà, passage à la suivante`);
      continue;
    }

    const expense = await prisma.expense.create({
      data: {
        companyId: company.id,
        expenseNumber,
        expenseDate,
        supplierId: supplier.id,
        categoryId: category.id,
        amountHt: new Prisma.Decimal(amountHt),
        taxRate: new Prisma.Decimal(taxRate),
        taxAmount: new Prisma.Decimal(taxAmount),
        amountTtc: new Prisma.Decimal(amountTtc),
        paymentMethod: ['cash', 'mobile_money', 'bank_transfer'][Math.floor(Math.random() * 3)],
        paymentDate: status === 'paid' ? expenseDate : null,
        status,
        currency: 'CDF',
        description: `Dépense pour ${category.name.toLowerCase()}`,
        createdBy: user.id,
      },
      include: {
        supplier: true,
      },
    });
    expenses.push(expense);

    // Créer l'écriture comptable pour la dépense (si validée ou payée)
    if (journalEntryService && accountService && (status === 'validated' || status === 'paid')) {
      try {
        await journalEntryService.createForExpense(company.id, expense.id, {
          expenseNumber: expense.expenseNumber,
          expenseDate: expense.expenseDate,
          supplierId: expense.supplierId || undefined,
          supplierName: expense.supplier?.name || expense.supplierName || undefined,
          amountHt: amountHt,
          taxAmount: taxAmount,
          amountTtc: amountTtc,
          currency: 'CDF',
          createdBy: user.id,
        });
      } catch (error: any) {
        // Ignorer les erreurs (comptes peut-être non créés)
        console.warn(`⚠️  Impossible de créer l'écriture comptable pour ${expense.expenseNumber}: ${error.message}`);
      }
    }

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: user.id,
        userEmail: user.email,
        action: 'CREATE',
        entityType: 'expense',
        entityId: expense.id,
        changes: { created: { expenseNumber, amountTtc } },
        metadata: { operation: 'create', source: 'seed' },
        createdAt: expenseDate,
      },
    });
  }
  console.log(`✅ ${expenses.length} dépenses créées\n`);

  // 7. Créer des écritures comptables manuelles supplémentaires
  console.log('📚 Création d\'écritures comptables manuelles...');
  
  // Récupérer quelques comptes
  const accounts = await prisma.account.findMany({
    where: { companyId: company.id },
    take: 20,
  });

  if (accounts.length > 0) {
    for (let i = 0; i < 20; i++) {
      const entryDate = new Date(
        twelveMonthsAgo.getTime() + Math.random() * (now.getTime() - twelveMonthsAgo.getTime())
      );
      // Générer le numéro d'écriture avec un timestamp pour éviter les doublons
      const timestamp = Date.now();
      const entryNumber = `EC-${entryDate.getFullYear()}-${String(i + 1).padStart(4, '0')}-${timestamp.toString().slice(-6)}`;

      // Vérifier si l'écriture existe déjà
      const existingEntry = await prisma.journalEntry.findFirst({
        where: {
          companyId: company.id,
          entryNumber: entryNumber,
        },
      });

      if (existingEntry) {
        console.warn(`⚠️  Écriture ${entryNumber} existe déjà, passage à la suivante`);
        continue;
      }
      
      const debitAccount = accounts[Math.floor(Math.random() * accounts.length)];
      const creditAccount = accounts[Math.floor(Math.random() * accounts.length)];
      const amount = Math.floor(Math.random() * 1000000) + 100000;

      const journalEntry = await prisma.journalEntry.create({
        data: {
          companyId: company.id,
          entryNumber,
          entryDate,
          description: `Écriture comptable manuelle ${i + 1}`,
          sourceType: 'manual',
          status: 'posted',
          createdBy: user.id,
          lines: {
            create: [
              {
                accountId: debitAccount.id,
                description: 'Débit',
                debit: new Prisma.Decimal(amount),
                credit: new Prisma.Decimal(0),
                currency: 'CDF',
              },
              {
                accountId: creditAccount.id,
                description: 'Crédit',
                debit: new Prisma.Decimal(0),
                credit: new Prisma.Decimal(amount),
                currency: 'CDF',
              },
            ],
          },
        },
      });

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          userEmail: user.email,
          action: 'CREATE',
          entityType: 'journal_entry',
          entityId: journalEntry.id,
          changes: { created: { entryNumber } },
          metadata: { operation: 'create', source: 'seed' },
          createdAt: entryDate,
        },
      });
    }
    console.log(`✅ 20 écritures comptables manuelles créées\n`);
  }

  // 8. Créer des logs d'audit supplémentaires avec des IDs réels
  console.log('📝 Création de logs d\'audit supplémentaires...');
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'READ'];
  const entityTypes = ['customer', 'product', 'invoice', 'payment', 'expense', 'journal_entry'];

  // Créer des logs d'audit pour les entités existantes
  for (let i = 0; i < 100; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const logDate = new Date(
      twelveMonthsAgo.getTime() + Math.random() * (now.getTime() - twelveMonthsAgo.getTime())
    );

    // Utiliser des IDs réels selon le type d'entité
    let entityId: string;
    if (entityType === 'customer' && customers.length > 0) {
      entityId = customers[Math.floor(Math.random() * customers.length)].id;
    } else if (entityType === 'product' && products.length > 0) {
      entityId = products[Math.floor(Math.random() * products.length)].id;
    } else if (entityType === 'invoice' && invoices.length > 0) {
      entityId = invoices[Math.floor(Math.random() * invoices.length)].id;
    } else if (entityType === 'payment' && payments.length > 0) {
      entityId = payments[Math.floor(Math.random() * payments.length)].id;
    } else if (entityType === 'expense' && expenses.length > 0) {
      entityId = expenses[Math.floor(Math.random() * expenses.length)].id;
    } else {
      entityId = `seed-${i}`;
    }

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: user.id,
        userEmail: user.email,
        action,
        entityType,
        entityId,
        changes: { 
          action: action.toLowerCase(),
          timestamp: logDate.toISOString(),
        },
        metadata: { operation: action.toLowerCase(), source: 'seed', index: i },
        createdAt: logDate,
      },
    });
  }
  console.log(`✅ 100 logs d'audit supplémentaires créés\n`);

  // 9. Mettre à jour les statistiques des clients
  console.log('📊 Mise à jour des statistiques...');
  for (const customer of customers) {
    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
    const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + Number(inv.totalTtc), 0);
    const totalPaid = customerInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.totalTtc), 0);
    const totalOutstanding = totalInvoiced - totalPaid;

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalInvoiced: new Prisma.Decimal(totalInvoiced),
        totalPaid: new Prisma.Decimal(totalPaid),
        totalOutstanding: new Prisma.Decimal(totalOutstanding),
        invoiceCount: customerInvoices.length,
      },
    });
  }
  console.log(`✅ Statistiques clients mises à jour\n`);

  console.log('🎉 Données de test créées avec succès!');
  console.log(`\n📊 Résumé:`);
  console.log(`   - ${customers.length} clients`);
  console.log(`   - ${products.length} produits`);
  console.log(`   - ${suppliers.length} fournisseurs`);
  console.log(`   - ${categories.length} catégories de dépenses`);
  console.log(`   - ${invoices.length} factures`);
  console.log(`   - ${payments.length} paiements`);
  console.log(`   - ${expenses.length} dépenses`);
  console.log(`   - 20 écritures comptables manuelles`);
  console.log(`   - ${100 + invoices.length + expenses.length} logs d'audit`);
  console.log(`\n💡 Note: Les écritures comptables automatiques pour factures et dépenses`);
  console.log(`   ont été créées si les comptes comptables (445710, 445660, etc.) existent.`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

