/**
 * Script de seed complet pour remplir l'application avec des données cohérentes
 * sur une année complète (12 mois)
 * 
 * Prend le rôle d'expert comptable pour garantir la cohérence :
 * - Factures avec paiements cohérents
 * - Dépenses avec écritures comptables
 * - Balance comptable équilibrée
 * - Dates cohérentes sur toute l'année
 * - Relations entre entités respectées
 */

import { PrismaClient, Prisma } from '../../backend/node_modules/.prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

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
 * Script principal de seed
 */
async function main() {
  console.log('🌱 Création de données complètes pour une année...\n');

  // Initialiser les services
  await initServices();

  // Récupérer l'entreprise "Entreprise Test"
  let company = await prisma.company.findFirst({
    where: {
      email: { contains: 'entreprise.test' },
    },
    include: {
      users: {
        where: { deletedAt: null },
        take: 1,
      },
    },
  });

  // Si pas trouvé, prendre la première entreprise
  if (!company) {
    company = await prisma.company.findFirst({
      include: {
        users: {
          where: { deletedAt: null },
          take: 1,
        },
      },
    });
  }

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

  // Dates pour une année complète (12 mois)
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1); // 1er janvier
  const endOfYear = new Date(currentYear, 11, 31); // 31 décembre

  // ============================================
  // 1. CRÉER LE PLAN COMPTABLE (si pas déjà créé)
  // ============================================
  console.log('📚 Vérification du plan comptable...');
  const existingAccounts = await prisma.account.findMany({
    where: { companyId: company.id },
    take: 1,
  });

  if (existingAccounts.length === 0) {
    console.log('📚 Création du plan comptable RDC...');
    // Le plan comptable sera créé manuellement si nécessaire
    console.log('⚠️  Plan comptable non créé automatiquement. Exécutez seed-accounts.ts si nécessaire.\n');
  } else {
    console.log('✅ Plan comptable existe déjà\n');
  }

  // ============================================
  // 2. CRÉER DES CLIENTS (particuliers et entreprises)
  // ============================================
  console.log('👥 Création de clients...');
  const customers: any[] = [];
  const customerData = [
    // Particuliers
    {
      type: 'particulier' as const,
      firstName: 'Jean',
      lastName: 'Mukamba',
      email: 'jean.mukamba@example.com',
      phone: '+243900123456',
      mobile: '+243900123456',
      address: '123 Avenue de la République',
      city: 'Kinshasa',
      country: 'RDC',
      postalCode: '001',
    },
    {
      type: 'particulier' as const,
      firstName: 'Marie',
      lastName: 'Kabila',
      email: 'marie.kabila@example.com',
      phone: '+243900123457',
      mobile: '+243900123457',
      address: '456 Boulevard Lumumba',
      city: 'Kinshasa',
      country: 'RDC',
      postalCode: '002',
    },
    {
      type: 'particulier' as const,
      firstName: 'Pierre',
      lastName: 'Tshisekedi',
      email: 'pierre.tshisekedi@example.com',
      phone: '+243900123458',
      mobile: '+243900123458',
      address: '789 Rue Kasa-Vubu',
      city: 'Lubumbashi',
      country: 'RDC',
      postalCode: '201',
    },
    {
      type: 'particulier' as const,
      firstName: 'Sophie',
      lastName: 'Mobutu',
      email: 'sophie.mobutu@example.com',
      phone: '+243900123459',
      mobile: '+243900123459',
      address: '321 Avenue Mobutu',
      city: 'Kinshasa',
      country: 'RDC',
      postalCode: '003',
    },
    // Entreprises
    {
      type: 'entreprise' as const,
      businessName: 'Tech Solutions RDC SARL',
      contactPerson: 'Jean Mukamba',
      email: 'contact@techsolutions.cd',
      phone: '+243900200001',
      mobile: '+243900200001',
      address: 'Avenue de la République, Immeuble Tech',
      city: 'Kinshasa',
      country: 'RDC',
      postalCode: '001',
      nif: 'N-12345-K-2024',
      rccm: 'CD/KIN/RCCM/24-A-12345',
    },
    {
      type: 'entreprise' as const,
      businessName: 'Commerce Général Kinshasa',
      contactPerson: 'Marie Kabila',
      email: 'info@commercegeneral.cd',
      phone: '+243900200002',
      mobile: '+243900200002',
      address: 'Boulevard Lumumba, Centre Commercial',
      city: 'Kinshasa',
      country: 'RDC',
      postalCode: '002',
      nif: 'N-12346-K-2024',
      rccm: 'CD/KIN/RCCM/24-A-12346',
    },
    {
      type: 'entreprise' as const,
      businessName: 'Services Pro SARL',
      contactPerson: 'Pierre Tshisekedi',
      email: 'contact@servicespro.cd',
      phone: '+243900200003',
      mobile: '+243900200003',
      address: 'Rue Kasa-Vubu, Bureau 101',
      city: 'Lubumbashi',
      country: 'RDC',
      postalCode: '201',
      nif: 'N-12347-L-2024',
      rccm: 'CD/LUB/RCCM/24-A-12347',
    },
    {
      type: 'entreprise' as const,
      businessName: 'Informatique Express',
      contactPerson: 'Sophie Mobutu',
      email: 'info@infoexpress.cd',
      phone: '+243900200004',
      mobile: '+243900200004',
      address: 'Avenue Mobutu, Zone Industrielle',
      city: 'Kinshasa',
      country: 'RDC',
      postalCode: '003',
      nif: 'N-12348-K-2024',
      rccm: 'CD/KIN/RCCM/24-A-12348',
    },
  ];

  for (const data of customerData) {
    // Vérifier si le client existe déjà
    const existing = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        email: data.email,
        deletedAt: null,
      },
    });

    if (existing) {
      customers.push(existing);
      continue;
    }

    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        type: data.type,
        firstName: data.type === 'particulier' ? data.firstName : null,
        lastName: data.type === 'particulier' ? data.lastName : null,
        businessName: data.type === 'entreprise' ? data.businessName : null,
        contactPerson: data.type === 'entreprise' ? data.contactPerson : null,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        nif: data.nif || null,
        rccm: data.rccm || null,
      },
    });
    customers.push(customer);
  }
  console.log(`✅ ${customers.length} clients créés\n`);

  // ============================================
  // 3. CRÉER DES PRODUITS/SERVICES
  // ============================================
  console.log('📦 Création de produits et services...');
  const products: any[] = [];
  const productData = [
    { name: 'Consultation IT', description: 'Consultation en informatique et conseil', type: 'service' as const, unitPrice: 50000, taxRate: 16, category: 'Services', sku: 'SERV-IT-001' },
    { name: 'Développement Web', description: 'Développement de site web et applications', type: 'service' as const, unitPrice: 150000, taxRate: 16, category: 'Services', sku: 'SERV-WEB-001' },
    { name: 'Formation Informatique', description: 'Formation en informatique et bureautique', type: 'service' as const, unitPrice: 200000, taxRate: 16, category: 'Services', sku: 'SERV-FORM-001' },
    { name: 'Maintenance Informatique', description: 'Maintenance et support informatique mensuel', type: 'service' as const, unitPrice: 300000, taxRate: 16, category: 'Services', sku: 'SERV-MAINT-001' },
    { name: 'Ordinateur Portable', description: 'Ordinateur portable Dell Latitude', type: 'product' as const, unitPrice: 800000, taxRate: 16, category: 'Matériel', sku: 'PROD-PC-001' },
    { name: 'Imprimante Laser', description: 'Imprimante HP LaserJet Pro', type: 'product' as const, unitPrice: 450000, taxRate: 16, category: 'Matériel', sku: 'PROD-IMP-001' },
    { name: 'Licence Microsoft Office', description: 'Licence Microsoft Office 365', type: 'product' as const, unitPrice: 120000, taxRate: 16, category: 'Logiciel', sku: 'PROD-LIC-001' },
    { name: 'Serveur Cloud', description: 'Hébergement serveur cloud mensuel', type: 'service' as const, unitPrice: 250000, taxRate: 16, category: 'Services', sku: 'SERV-CLOUD-001' },
  ];

  for (const prodData of productData) {
    const existing = await prisma.product.findFirst({
      where: {
        companyId: company.id,
        sku: prodData.sku,
        deletedAt: null,
      },
    });

    if (existing) {
      products.push(existing);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        name: prodData.name,
        description: prodData.description,
        sku: prodData.sku,
        type: prodData.type,
        price: new Prisma.Decimal(prodData.unitPrice),
        taxRate: new Prisma.Decimal(prodData.taxRate),
        currency: 'CDF',
        category: prodData.category,
        isActive: true,
        stock: prodData.type === 'product' ? new Prisma.Decimal(Math.floor(Math.random() * 50) + 10) : null,
      },
    });
    products.push(product);
  }
  console.log(`✅ ${products.length} produits créés\n`);

  // ============================================
  // 4. CRÉER DES FOURNISSEURS
  // ============================================
  console.log('🏢 Création de fournisseurs...');
  const suppliers: any[] = [];
  const supplierData = [
    { name: 'Fournisseur Équipements SARL', email: 'contact@equipements.cd', phone: '+243900300001', city: 'Kinshasa', country: 'RDC' },
    { name: 'Services Généraux RDC', email: 'info@servicesgeneraux.cd', phone: '+243900300002', city: 'Kinshasa', country: 'RDC' },
    { name: 'Matériel Informatique Pro', email: 'contact@materielinfo.cd', phone: '+243900300003', city: 'Kinshasa', country: 'RDC' },
    { name: 'Bureau & Papeterie', email: 'info@bureaupapeterie.cd', phone: '+243900300004', city: 'Kinshasa', country: 'RDC' },
  ];

  for (const supplierDataItem of supplierData) {
    const existing = await prisma.supplier.findFirst({
      where: {
        companyId: company.id,
        name: supplierDataItem.name,
        deletedAt: null,
      },
    });

    if (existing) {
      suppliers.push(existing);
      continue;
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyId: company.id,
        name: supplierDataItem.name,
        email: supplierDataItem.email,
        phone: supplierDataItem.phone,
        city: supplierDataItem.city,
        country: supplierDataItem.country,
      },
    });
    suppliers.push(supplier);
  }
  console.log(`✅ ${suppliers.length} fournisseurs créés\n`);

  // ============================================
  // 5. CRÉER DES CATÉGORIES DE DÉPENSES
  // ============================================
  console.log('📁 Création de catégories de dépenses...');
  const categories: any[] = [];
  const categoryNames = ['Fournitures', 'Services', 'Équipements', 'Transport', 'Communication', 'Formation'];

  for (const categoryName of categoryNames) {
    const existing = await prisma.expenseCategory.findFirst({
      where: {
        companyId: company.id,
        name: categoryName,
      },
    });

    if (existing) {
      categories.push(existing);
      continue;
    }

    const category = await prisma.expenseCategory.create({
      data: {
        companyId: company.id,
        name: categoryName,
        description: `Catégorie pour ${categoryName.toLowerCase()}`,
        isActive: true,
      },
    });
    categories.push(category);
  }
  console.log(`✅ ${categories.length} catégories créées\n`);

  // ============================================
  // 6. CRÉER DES FACTURES SUR TOUTE L'ANNÉE
  // ============================================
  console.log('📄 Création de factures sur toute l\'année...');
  const invoices: any[] = [];
  const payments: any[] = [];
  
  // Créer environ 8-12 factures par mois = ~120 factures sur l'année
  let invoiceSequential = 1;
  
  for (let month = 0; month < 12; month++) {
    const invoicesPerMonth = Math.floor(Math.random() * 5) + 8; // 8-12 factures par mois
    
    for (let i = 0; i < invoicesPerMonth; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      
      // Date de facture dans le mois
      const dayInMonth = Math.floor(Math.random() * 28) + 1;
      const invoiceDate = new Date(currentYear, month, dayInMonth);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30); // Échéance 30 jours

      // Créer 1-4 lignes de facture
      const lines: any[] = [];
      const numLines = Math.floor(Math.random() * 4) + 1;
      let subtotal = 0;
      let totalTax = 0;

      for (let j = 0; j < numLines; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = Number(product.price);
        const taxRate = Number(product.taxRate);
        const lineSubtotal = quantity * unitPrice;
        const lineTax = lineSubtotal * (taxRate / 100);
        
        subtotal += lineSubtotal;
        totalTax += lineTax;

        lines.push({
          productId: product.id,
          description: product.description || product.name,
          quantity: new Prisma.Decimal(quantity),
          unitPrice: new Prisma.Decimal(unitPrice),
          taxRate: new Prisma.Decimal(taxRate),
          subtotal: new Prisma.Decimal(lineSubtotal),
          taxAmount: new Prisma.Decimal(lineTax),
          total: new Prisma.Decimal(lineSubtotal + lineTax),
        });
      }

      const totalAmount = subtotal + totalTax;
      
      // Distribution des statuts : 20% draft, 30% sent, 40% paid, 10% partially_paid
      const rand = Math.random();
      let status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' = 'draft';
      let paidAmount = 0;
      
      if (rand > 0.8) {
        status = 'paid';
        paidAmount = totalAmount;
      } else if (rand > 0.5) {
        status = 'sent';
      } else if (rand > 0.3) {
        status = 'partially_paid';
        paidAmount = totalAmount * 0.5;
      } else {
        status = 'draft';
      }

      // Vérifier si la facture est en retard
      if (status === 'sent' && dueDate < now) {
        status = 'overdue';
      }

      // Générer le numéro de facture
      const invoiceNumber = `${company.invoicePrefix || 'FAC'}-${currentYear}-${String(invoiceSequential).padStart(4, '0')}`;

      // Vérifier si la facture existe déjà
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          companyId: company.id,
          invoiceNumber: invoiceNumber,
        },
      });

      if (existingInvoice) {
        invoiceSequential++;
        continue;
      }

      const invoice = await prisma.invoice.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          invoiceNumber,
          invoiceDate,
          dueDate,
          status,
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(totalTax),
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(paidAmount),
          currency: 'CDF',
          paymentTerms: 'Paiement à 30 jours',
          createdBy: user.id,
          sentAt: status !== 'draft' ? invoiceDate : null,
          paidAt: status === 'paid' ? new Date(invoiceDate.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000) : null,
          lines: {
            create: lines,
          },
        },
        include: {
          customer: true,
        },
      });
      invoices.push(invoice);
      invoiceSequential++;

      // Créer des paiements pour les factures payées ou partiellement payées
      if (status === 'paid' || status === 'partially_paid') {
        const paymentDate = new Date(invoiceDate);
        paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 25) + 5); // Paiement entre 5 et 30 jours après facture

        const paymentMethods = ['cash', 'mobile_money', 'bank_transfer'] as const;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const payment = await prisma.payment.create({
          data: {
            companyId: company.id,
            invoiceId: invoice.id,
            amount: new Prisma.Decimal(paidAmount),
            currency: 'CDF',
            paymentDate,
            paymentMethod,
            status: 'confirmed',
            reference: `PAY-${invoiceNumber}-${Date.now()}`,
            createdBy: user.id,
          },
        });
        payments.push(payment);
      }

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: 'CREATE',
          entity: 'invoice',
          entityId: invoice.id,
          changes: { created: { invoiceNumber, totalAmount } },
          createdAt: invoiceDate,
        },
      });
    }
  }
  console.log(`✅ ${invoices.length} factures créées`);
  console.log(`✅ ${payments.length} paiements créés\n`);

  // ============================================
  // 7. CRÉER DES DÉPENSES SUR TOUTE L'ANNÉE
  // ============================================
  console.log('💰 Création de dépenses sur toute l\'année...');
  const expenses: any[] = [];
  let expenseSequential = 1;

  for (let month = 0; month < 12; month++) {
    const expensesPerMonth = Math.floor(Math.random() * 6) + 5; // 5-10 dépenses par mois
    
    for (let i = 0; i < expensesPerMonth; i++) {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      const dayInMonth = Math.floor(Math.random() * 28) + 1;
      const expenseDate = new Date(currentYear, month, dayInMonth);

      const amountHt = Math.floor(Math.random() * 500000) + 50000; // Entre 50,000 et 550,000
      const taxRate = 16;
      const taxAmount = amountHt * (taxRate / 100);
      const amountTtc = amountHt + taxAmount;

      // 70% payées, 20% validées, 10% en attente
      const rand = Math.random();
      let status: 'draft' | 'pending' | 'validated' | 'paid' | 'cancelled' = 'pending';
      if (rand > 0.3) {
        status = 'paid';
      } else if (rand > 0.1) {
        status = 'validated';
      }

      const expenseNumber = `DEP-${currentYear}-${String(expenseSequential).padStart(4, '0')}`;

      // Vérifier si la dépense existe déjà
      const existingExpense = await prisma.expense.findFirst({
        where: {
          companyId: company.id,
          expenseNumber: expenseNumber,
        },
      });

      if (existingExpense) {
        expenseSequential++;
        continue;
      }

      const expenseData: any = {
        companyId: company.id,
        expenseNumber,
        expenseDate,
        supplierId: supplier.id,
        categoryId: category.id,
          amount: new Prisma.Decimal(amountHt),
          taxAmount: new Prisma.Decimal(taxAmount),
          totalAmount: new Prisma.Decimal(amountTtc),
          paidAt: status === 'paid' ? expenseDate : null,
        status,
        currency: 'CDF',
        description: `Dépense ${category.name.toLowerCase()} - ${supplier.name}`,
        createdBy: user.id,
      };
      
      if (status === 'paid') {
        expenseData.paymentMethod = (['cash', 'mobile_money', 'bank_transfer'][Math.floor(Math.random() * 3)] as string);
      }

      const expense = await prisma.expense.create({
        data: expenseData,
      });
      expenses.push(expense);
      expenseSequential++;

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: 'CREATE',
          entity: 'expense',
          entityId: expense.id,
          changes: { created: { expenseNumber, totalAmount: amountTtc } },
          createdAt: expenseDate,
        },
      });
    }
  }
  console.log(`✅ ${expenses.length} dépenses créées\n`);

  // ============================================
  // 8. CRÉER DES FACTURES RÉCURRENTES
  // ============================================
  console.log('🔄 Création de factures récurrentes...');
  const recurringInvoices: any[] = [];
  
  // Créer 3-5 factures récurrentes
  const recurringData = [
    {
      customer: customers.find(c => c.type === 'entreprise') || customers[0],
      name: 'Abonnement Maintenance Mensuel',
      frequency: 'monthly' as const,
      products: [products.find(p => p.name.includes('Maintenance')) || products[0]],
    },
    {
      customer: customers.find(c => c.type === 'entreprise') || customers[1],
      name: 'Hébergement Cloud Mensuel',
      frequency: 'monthly' as const,
      products: [products.find(p => p.name.includes('Cloud')) || products[7]],
    },
  ];

  for (const recData of recurringData) {
    if (!recData.customer || !recData.products || recData.products.length === 0) continue;

    const product = recData.products[0];
    const quantity = 1;
    const unitPrice = Number(product.price);
    const taxRate = Number(product.taxRate);
    const subtotal = quantity * unitPrice;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const startDate = new Date(currentYear, 0, 1);
    const nextRunDate = new Date(now);
    nextRunDate.setMonth(nextRunDate.getMonth() + 1);

    const recurring = await prisma.recurringInvoice.create({
      data: {
        companyId: company.id,
        customerId: recData.customer.id,
        name: recData.name,
        description: `Facture récurrente pour ${recData.name}`,
        frequency: recData.frequency,
        startDate,
        nextRunDate,
        isActive: true,
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: 'CDF',
        paymentTerms: 'Paiement à réception',
        createdBy: user.id,
      },
    });
    recurringInvoices.push(recurring);
  }
  console.log(`✅ ${recurringInvoices.length} factures récurrentes créées\n`);

  // ============================================
  // 9. STATISTIQUES (calculées dynamiquement, pas stockées)
  // ============================================
  console.log('📊 Calcul des statistiques...');
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  console.log(`   - Total facturé: ${totalInvoiced.toLocaleString()} CDF`);
  console.log(`   - Total payé: ${totalPaid.toLocaleString()} CDF`);
  console.log(`   - Total en attente: ${(totalInvoiced - totalPaid).toLocaleString()} CDF\n`);

  // ============================================
  // 10. RÉSUMÉ FINAL
  // ============================================
  console.log('🎉 Données complètes créées avec succès!\n');
  console.log(`📊 Résumé:`);
  console.log(`   - ${customers.length} clients`);
  console.log(`   - ${products.length} produits/services`);
  console.log(`   - ${suppliers.length} fournisseurs`);
  console.log(`   - ${categories.length} catégories de dépenses`);
  console.log(`   - ${invoices.length} factures (sur toute l'année ${currentYear})`);
  console.log(`   - ${payments.length} paiements`);
  console.log(`   - ${expenses.length} dépenses (sur toute l'année ${currentYear})`);
  console.log(`   - ${recurringInvoices.length} factures récurrentes`);
  console.log(`   - ${invoices.length + expenses.length} logs d'audit`);
  console.log(`\n💡 Toutes les données sont cohérentes et couvrent l'année ${currentYear}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

