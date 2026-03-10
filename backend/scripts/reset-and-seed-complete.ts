/**
 * Script complet pour réinitialiser et remplir la base de données
 * avec des données de test cohérentes pour toutes les fonctionnalités
 * 
 * Ce script :
 * 1. Efface toutes les données (sauf Company et User)
 * 2. Crée un plan comptable complet
 * 3. Génère des données pour toutes les pages et fonctionnalités
 * 4. S'assure que tous les rapports sont remplis
 * 5. Remplit toutes les options de comptabilité et RH
 */

import { PrismaClient, Prisma } from '../../backend/node_modules/.prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Importer les services applicatifs (chemins relatifs au dossier backend/)
let journalEntryService: any;
let invoiceService: any;
let expenseService: any;

async function initServices() {
  try {
    // Depuis ce script situé dans backend/scripts, les services sont dans ../src/services
    const journalEntryModule = await import('../src/services/journalEntry.service');
    journalEntryService = journalEntryModule.default;

    const invoiceModule = await import('../src/services/invoice.service');
    invoiceService = invoiceModule.default;

    const expenseModule = await import('../src/services/expense.service');
    expenseService = expenseModule.default;
  } catch (error) {
    console.warn('⚠️  Services non disponibles, certaines fonctionnalités seront limitées');
  }
}

/**
 * Efface toutes les données sauf Company et User
 */
async function resetDatabase(companyId: string) {
  console.log('🗑️  Effacement des données existantes...\n');

  // Ordre de suppression important pour respecter les contraintes de clés étrangères
  await prisma.bankTransaction.deleteMany({ where: { statement: { companyId } } });
  await prisma.bankStatement.deleteMany({ where: { companyId } });
  await prisma.payrollItem.deleteMany({ where: { payroll: { companyId } } });
  await prisma.payroll.deleteMany({ where: { companyId } });
  await prisma.attendance.deleteMany({ where: { companyId } });
  await prisma.leaveRequest.deleteMany({ where: { companyId } });
  await prisma.leaveBalance.deleteMany({ where: { companyId } });
  await prisma.leavePolicy.deleteMany({ where: { companyId } });
  await prisma.employeeDocument.deleteMany({ where: { companyId } });
  await prisma.employee.deleteMany({ where: { companyId } });
  await prisma.depreciation.deleteMany({ where: { companyId } });
  await prisma.journalEntryLine.deleteMany({ where: { journalEntry: { companyId } } });
  await prisma.journalEntry.deleteMany({ where: { companyId } });
  await prisma.fiscalPeriod.deleteMany({ where: { companyId } });
  await prisma.account.deleteMany({ where: { companyId } });
  await prisma.payment.deleteMany({ where: { companyId } });
  await prisma.invoiceLine.deleteMany({ where: { invoice: { companyId } } });
  await prisma.invoice.deleteMany({ where: { companyId } });
  await prisma.expense.deleteMany({ where: { companyId } });
  await prisma.expenseCategory.deleteMany({ where: { companyId } });
  await prisma.supplier.deleteMany({ where: { companyId } });
  await prisma.recurringInvoice.deleteMany({ where: { companyId } });
  await prisma.product.deleteMany({ where: { companyId } });
  await prisma.customer.deleteMany({ where: { companyId } });
  await prisma.notification.deleteMany({ where: { companyId } });
  await prisma.notificationTemplate.deleteMany({ where: { companyId } });
  await prisma.auditLog.deleteMany({ where: { companyId } });
  await prisma.fileUpload.deleteMany({ where: { companyId } });
  await prisma.setting.deleteMany({ where: { companyId } });
  await prisma.supportTicket.deleteMany({ where: { companyId } });
  await prisma.usage.deleteMany({ where: { companyId } });

  console.log('✅ Données effacées\n');
}

/**
 * Crée le plan comptable complet (RDC)
 */
async function createChartOfAccounts(companyId: string) {
  console.log('📚 Création du plan comptable RDC...');

  const accounts = [
    // Classe 1 - Financement Permanent
    { code: '101', name: 'Capital', type: 'equity', category: '1' },
    { code: '101000', name: 'Capital social', type: 'equity', category: '1', parentCode: '101' },
    { code: '106', name: 'Réserves', type: 'equity', category: '1' },
    { code: '106000', name: 'Réserves légales', type: 'equity', category: '1', parentCode: '106' },
    { code: '120', name: 'Résultat', type: 'equity', category: '1' },
    { code: '120000', name: 'Résultat de l\'exercice', type: 'equity', category: '1', parentCode: '120' },
    
    // Classe 2 - Actif Immobilisé
    { code: '211', name: 'Immobilisations incorporelles', type: 'asset', category: '2' },
    { code: '211000', name: 'Fonds commercial', type: 'asset', category: '2', parentCode: '211' },
    { code: '213', name: 'Immobilisations corporelles', type: 'asset', category: '2' },
    { code: '213000', name: 'Terrains', type: 'asset', category: '2', parentCode: '213' },
    { code: '213100', name: 'Constructions', type: 'asset', category: '2', parentCode: '213' },
    { code: '213200', name: 'Installations techniques', type: 'asset', category: '2', parentCode: '213' },
    { code: '213300', name: 'Matériel de transport', type: 'asset', category: '2', parentCode: '213' },
    { code: '213400', name: 'Matériel de bureau', type: 'asset', category: '2', parentCode: '213' },
    { code: '213500', name: 'Matériel informatique', type: 'asset', category: '2', parentCode: '213' },
    { code: '281', name: 'Amortissements', type: 'asset', category: '2' },
    { code: '281100', name: 'Amortissements constructions', type: 'asset', category: '2', parentCode: '281' },
    { code: '281200', name: 'Amortissements installations', type: 'asset', category: '2', parentCode: '281' },
    { code: '281300', name: 'Amortissements matériel transport', type: 'asset', category: '2', parentCode: '281' },
    { code: '281400', name: 'Amortissements matériel bureau', type: 'asset', category: '2', parentCode: '281' },
    { code: '281500', name: 'Amortissements matériel informatique', type: 'asset', category: '2', parentCode: '281' },
    
    // Classe 3 - Stocks
    { code: '31', name: 'Matières premières', type: 'asset', category: '3' },
    { code: '310000', name: 'Stock matières premières', type: 'asset', category: '3', parentCode: '31' },
    { code: '35', name: 'Produits finis', type: 'asset', category: '3' },
    { code: '350000', name: 'Stock produits finis', type: 'asset', category: '3', parentCode: '35' },
    
    // Classe 4 - Tiers
    { code: '411', name: 'Clients', type: 'asset', category: '4' },
    { code: '411000', name: 'Clients - RDC', type: 'asset', category: '4', parentCode: '411' },
    { code: '401', name: 'Fournisseurs', type: 'liability', category: '4' },
    { code: '401000', name: 'Fournisseurs - RDC', type: 'liability', category: '4', parentCode: '401' },
    { code: '421', name: 'Personnel', type: 'liability', category: '4' },
    { code: '421000', name: 'Rémunérations dues', type: 'liability', category: '4', parentCode: '421' },
    { code: '425', name: 'Associés', type: 'liability', category: '4' },
    { code: '425000', name: 'Comptes courants associés', type: 'liability', category: '4', parentCode: '425' },
    
    // Classe 5 - Trésorerie
    { code: '51', name: 'Banques', type: 'asset', category: '5' },
    { code: '512000', name: 'Banque principale', type: 'asset', category: '5', parentCode: '51' },
    { code: '512100', name: 'Banque secondaire', type: 'asset', category: '5', parentCode: '51' },
    { code: '53', name: 'Caisse', type: 'asset', category: '5' },
    { code: '530000', name: 'Caisse principale', type: 'asset', category: '5', parentCode: '53' },
    { code: '57', name: 'Valeurs mobilières', type: 'asset', category: '5' },
    { code: '570000', name: 'Placements à court terme', type: 'asset', category: '5', parentCode: '57' },
    
    // Classe 6 - Charges
    { code: '60', name: 'Achats', type: 'expense', category: '6' },
    { code: '601', name: 'Achats de marchandises', type: 'expense', category: '6' },
    { code: '601000', name: 'Achats de matières premières', type: 'expense', category: '6', parentCode: '601' },
    { code: '602000', name: 'Achats de fournitures', type: 'expense', category: '6', parentCode: '60' },
    { code: '606000', name: 'Achats de services', type: 'expense', category: '6', parentCode: '60' },
    { code: '61', name: 'Services extérieurs', type: 'expense', category: '6' },
    { code: '611000', name: 'Loyers et charges locatives', type: 'expense', category: '6', parentCode: '61' },
    { code: '612000', name: 'Assurances', type: 'expense', category: '6', parentCode: '61' },
    { code: '613000', name: 'Électricité, eau, gaz', type: 'expense', category: '6', parentCode: '61' },
    { code: '614000', name: 'Télécommunications', type: 'expense', category: '6', parentCode: '61' },
    { code: '615000', name: 'Entretien et réparations', type: 'expense', category: '6', parentCode: '61' },
    { code: '62', name: 'Autres services extérieurs', type: 'expense', category: '6' },
    { code: '621000', name: 'Honoraires', type: 'expense', category: '6', parentCode: '62' },
    { code: '622000', name: 'Publicité et communication', type: 'expense', category: '6', parentCode: '62' },
    { code: '623000', name: 'Frais de transport', type: 'expense', category: '6', parentCode: '62' },
    { code: '63', name: 'Impôts et taxes', type: 'expense', category: '6' },
    { code: '631000', name: 'Impôts sur les bénéfices', type: 'expense', category: '6', parentCode: '63' },
    { code: '635000', name: 'Autres impôts et taxes', type: 'expense', category: '6', parentCode: '63' },
    { code: '64', name: 'Charges de personnel', type: 'expense', category: '6' },
    { code: '641000', name: 'Salaires bruts', type: 'expense', category: '6', parentCode: '64' },
    { code: '645000', name: 'Charges sociales', type: 'expense', category: '6', parentCode: '64' },
    { code: '66', name: 'Charges financières', type: 'expense', category: '6' },
    { code: '661000', name: 'Intérêts bancaires', type: 'expense', category: '6', parentCode: '66' },
    { code: '67', name: 'Charges exceptionnelles', type: 'expense', category: '6' },
    { code: '671000', name: 'Pertes exceptionnelles', type: 'expense', category: '6', parentCode: '67' },
    { code: '68', name: 'Dotations aux amortissements', type: 'expense', category: '6' },
    { code: '681100', name: 'Dotations amortissements constructions', type: 'expense', category: '6', parentCode: '68' },
    { code: '681200', name: 'Dotations amortissements installations', type: 'expense', category: '6', parentCode: '68' },
    { code: '681300', name: 'Dotations amortissements matériel transport', type: 'expense', category: '6', parentCode: '68' },
    { code: '681400', name: 'Dotations amortissements matériel bureau', type: 'expense', category: '6', parentCode: '68' },
    { code: '681500', name: 'Dotations amortissements matériel informatique', type: 'expense', category: '6', parentCode: '68' },
    
    // Classe 7 - Produits
    { code: '70', name: 'Ventes', type: 'revenue', category: '7' },
    { code: '701', name: 'Ventes de marchandises', type: 'revenue', category: '7' },
    { code: '701000', name: 'Ventes de produits finis', type: 'revenue', category: '7', parentCode: '701' },
    { code: '706000', name: 'Ventes de services', type: 'revenue', category: '7', parentCode: '70' },
    { code: '74', name: 'Subventions', type: 'revenue', category: '7' },
    { code: '740000', name: 'Subventions d\'exploitation', type: 'revenue', category: '7', parentCode: '74' },
    { code: '75', name: 'Autres produits', type: 'revenue', category: '7' },
    { code: '750000', name: 'Produits divers', type: 'revenue', category: '7', parentCode: '75' },
    { code: '76', name: 'Produits financiers', type: 'revenue', category: '7' },
    { code: '760000', name: 'Revenus de placements', type: 'revenue', category: '7', parentCode: '76' },
    { code: '77', name: 'Produits exceptionnels', type: 'revenue', category: '7' },
    { code: '770000', name: 'Produits exceptionnels', type: 'revenue', category: '7', parentCode: '77' },
    
    // Classe 8 - Comptes de résultat
    { code: '80', name: 'Résultat', type: 'equity', category: '8' },
    { code: '801000', name: 'Résultat de l\'exercice', type: 'equity', category: '8', parentCode: '80' },
    
    // TVA
    { code: '445710', name: 'TVA à décaisser', type: 'liability', category: '4' },
    { code: '445660', name: 'TVA déductible', type: 'asset', category: '4' },
  ];

  const accountMap = new Map<string, string>();

  // Créer les comptes parents d'abord
  const parentAccounts = accounts.filter(a => !a.parentCode);
  for (const acc of parentAccounts) {
    const account = await prisma.account.create({
      data: {
        companyId,
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        category: acc.category,
        balance: new Decimal(0),
        isActive: true,
      },
    });
    accountMap.set(acc.code, account.id);
  }

  // Créer les comptes enfants
  const childAccounts = accounts.filter(a => a.parentCode);
  for (const acc of childAccounts) {
    const parentId = accountMap.get(acc.parentCode!);
    if (!parentId) continue;

    const account = await prisma.account.create({
      data: {
        companyId,
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        category: acc.category,
        parentId,
        balance: new Decimal(0),
        isActive: true,
      },
    });
    accountMap.set(acc.code, account.id);
  }

  console.log(`✅ Plan comptable créé (${accounts.length} comptes)\n`);
  return accountMap;
}

/**
 * Crée des clients
 */
async function createCustomers(companyId: string) {
  console.log('👥 Création de clients...');

  const customers = [
    { type: 'particulier' as const, firstName: 'Jean', lastName: 'Mukamba', email: 'jean.mukamba@example.com', phone: '+243900000001', city: 'Kinshasa', country: 'RDC' },
    { type: 'particulier' as const, firstName: 'Marie', lastName: 'Kabila', email: 'marie.kabila@example.com', phone: '+243900000002', city: 'Kinshasa', country: 'RDC' },
    { type: 'particulier' as const, firstName: 'Paul', lastName: 'Tshisekedi', email: 'paul.tshisekedi@example.com', phone: '+243900000003', city: 'Lubumbashi', country: 'RDC' },
    { type: 'entreprise' as const, businessName: 'Tech Solutions RDC', email: 'contact@techsolutions.cd', phone: '+243900000010', city: 'Kinshasa', country: 'RDC', nif: 'NIF001', rccm: 'RCCM001' },
    { type: 'entreprise' as const, businessName: 'Commerce Général Kinshasa', email: 'info@commercekg.cd', phone: '+243900000011', city: 'Kinshasa', country: 'RDC', nif: 'NIF002', rccm: 'RCCM002' },
    { type: 'entreprise' as const, businessName: 'Services Pro SARL', email: 'contact@servicespro.cd', phone: '+243900000012', city: 'Goma', country: 'RDC', nif: 'NIF003', rccm: 'RCCM003' },
    { type: 'entreprise' as const, businessName: 'Import Export Congo', email: 'info@importexport.cd', phone: '+243900000013', city: 'Kinshasa', country: 'RDC', nif: 'NIF004', rccm: 'RCCM004' },
    { type: 'entreprise' as const, businessName: 'Digital Agency RDC', email: 'hello@digitalagency.cd', phone: '+243900000014', city: 'Kinshasa', country: 'RDC', nif: 'NIF005', rccm: 'RCCM005' },
  ];

  const customerIds: string[] = [];
  for (const data of customers) {
    const customer = await prisma.customer.create({
      data: {
        companyId,
        type: data.type,
        firstName: data.type === 'particulier' ? data.firstName : undefined,
        lastName: data.type === 'particulier' ? data.lastName : undefined,
        businessName: data.type === 'entreprise' ? data.businessName : undefined,
        email: data.email,
        phone: data.phone,
        city: data.city,
        country: data.country,
        nif: data.nif,
        rccm: data.rccm,
      },
    });
    customerIds.push(customer.id);
  }

  console.log(`✅ ${customers.length} clients créés\n`);
  return customerIds;
}

/**
 * Crée des fournisseurs
 */
async function createSuppliers(companyId: string, accountMap: Map<string, string>) {
  console.log('🏢 Création de fournisseurs...');

  const suppliers = [
    { name: 'Fournisseur Général SARL', email: 'contact@fournisseur.cd', phone: '+243900000020', city: 'Kinshasa', country: 'RDC', accountCode: '401000' },
    { name: 'Services Techniques RDC', email: 'info@servicestech.cd', phone: '+243900000021', city: 'Kinshasa', country: 'RDC', accountCode: '401000' },
    { name: 'Matériel Bureau Pro', email: 'ventes@materielbureau.cd', phone: '+243900000022', city: 'Kinshasa', country: 'RDC', accountCode: '401000' },
    { name: 'Équipements Industriels', email: 'contact@equipements.cd', phone: '+243900000023', city: 'Lubumbashi', country: 'RDC', accountCode: '401000' },
    { name: 'Informatique Congo', email: 'sales@informatique.cd', phone: '+243900000024', city: 'Kinshasa', country: 'RDC', accountCode: '401000' },
  ];

  const supplierIds: string[] = [];
  for (const data of suppliers) {
    const accountId = accountMap.get(data.accountCode);
    const supplier = await prisma.supplier.create({
      data: {
        companyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        country: data.country,
        accountId: accountId || undefined,
        isActive: true,
      },
    });
    supplierIds.push(supplier.id);
  }

  console.log(`✅ ${suppliers.length} fournisseurs créés\n`);
  return supplierIds;
}

/**
 * Crée des produits
 */
async function createProducts(companyId: string) {
  console.log('📦 Création de produits...');

  const products = [
    { name: 'Consultation IT', description: 'Service de consultation en informatique', type: 'service', price: 50000, taxRate: 16, skuBase: 'SERV-001' },
    { name: 'Développement Web', description: 'Développement de site web', type: 'service', price: 150000, taxRate: 16, skuBase: 'SERV-002' },
    { name: 'Formation Excel', description: 'Formation Microsoft Excel', type: 'service', price: 75000, taxRate: 16, skuBase: 'SERV-003' },
    { name: 'Ordinateur Portable', description: 'Laptop Dell Inspiron 15', type: 'product', price: 800000, cost: 600000, taxRate: 16, stock: 10, skuBase: 'PROD-001' },
    { name: 'Imprimante HP', description: 'Imprimante HP LaserJet Pro', type: 'product', price: 350000, cost: 250000, taxRate: 16, stock: 5, skuBase: 'PROD-002' },
    { name: 'Clavier Souris', description: 'Kit clavier et souris sans fil', type: 'product', price: 25000, cost: 15000, taxRate: 16, stock: 20, skuBase: 'PROD-003' },
    { name: 'Écran 24 pouces', description: 'Moniteur LED 24 pouces', type: 'product', price: 200000, cost: 150000, taxRate: 16, stock: 8, skuBase: 'PROD-004' },
    { name: 'Maintenance Mensuelle', description: 'Contrat de maintenance mensuelle', type: 'service', price: 100000, taxRate: 16, skuBase: 'SERV-004' },
  ];

  const productIds: string[] = [];
  for (const data of products) {
    // Rendre le SKU globalement unique (la contrainte Prisma est globale, pas par société)
    const uniqueSku = `${data.skuBase}-${companyId.slice(0, 8)}`;

    const product = await prisma.product.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        type: data.type as any,
        price: new Decimal(data.price),
        cost: data.cost ? new Decimal(data.cost) : undefined,
        taxRate: new Decimal(data.taxRate),
        stock: data.stock ? new Decimal(data.stock) : undefined,
        sku: uniqueSku,
        currency: 'CDF',
        isActive: true,
      },
    });
    productIds.push(product.id);
  }

  console.log(`✅ ${products.length} produits créés\n`);
  return productIds;
}

/**
 * Crée des catégories de dépenses
 */
async function createExpenseCategories(companyId: string, accountMap: Map<string, string>) {
  console.log('📁 Création de catégories de dépenses...');

  const categories = [
    { name: 'Fournitures de bureau', accountCode: '602000' },
    { name: 'Services professionnels', accountCode: '621000' },
    { name: 'Loyers', accountCode: '611000' },
    { name: 'Assurances', accountCode: '612000' },
    { name: 'Électricité et eau', accountCode: '613000' },
    { name: 'Télécommunications', accountCode: '614000' },
    { name: 'Transport', accountCode: '623000' },
    { name: 'Publicité', accountCode: '622000' },
  ];

  const categoryIds: string[] = [];
  for (const data of categories) {
    const accountId = accountMap.get(data.accountCode);
    const category = await prisma.expenseCategory.create({
      data: {
        companyId,
        name: data.name,
        accountId: accountId || undefined,
        isActive: true,
        displayOrder: categoryIds.length,
      },
    });
    categoryIds.push(category.id);
  }

  console.log(`✅ ${categories.length} catégories créées\n`);
  return categoryIds;
}

/**
 * Crée des factures avec différents statuts
 */
async function createInvoices(
  companyId: string,
  userId: string,
  customerIds: string[],
  productIds: string[],
  accountMap: Map<string, string>
) {
  console.log('📄 Création de factures...');

  const now = new Date();
  const invoices: any[] = [];
  let invoiceNumber = 1;

  // Factures payées (réparties sur toute l'année en cours)
  for (let i = 0; i < 15; i++) {
    // Répartir sur les 12 derniers mois (de janvier à aujourd'hui)
    const monthsAgo = Math.floor(i / 2); // 0 à 7 mois en arrière
    const dayOfMonth = (i % 28) + 1; // Jour du mois (1-28)
    const invoiceDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const paidDate = new Date(invoiceDate);
    paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 20) + 5);

    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;

    const unitPrice = Number(product.price);
    const taxRate = Number(product.taxRate);
    const subtotal = unitPrice * quantity;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId,
        invoiceNumber: `FAC-${String(invoiceNumber).padStart(4, '0')}`,
        invoiceDate,
        dueDate,
        status: 'paid',
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        paidAmount: new Decimal(totalAmount),
        currency: 'CDF',
        paidAt: paidDate,
        createdBy: userId,
        lines: {
          create: {
            productId,
            description: product.name,
            quantity: new Decimal(quantity),
            unitPrice: new Decimal(unitPrice),
            taxRate: new Decimal(taxRate),
            subtotal: new Decimal(subtotal),
            taxAmount: new Decimal(taxAmount),
            total: new Decimal(totalAmount),
          },
        },
      },
    });

    // Créer le paiement
    await prisma.payment.create({
      data: {
        companyId,
        invoiceId: invoice.id,
        amount: new Decimal(totalAmount),
        currency: 'CDF',
        paymentDate: paidDate,
        paymentMethod: ['cash', 'bank_transfer', 'mobile_money'][Math.floor(Math.random() * 3)],
        status: 'confirmed',
        createdBy: userId,
      },
    });

    // Créer l'écriture comptable de la facture (débit 411 / crédit 701 + 445710)
    const clientAccountId = accountMap.get('411');
    const revenueAccountId = accountMap.get('701');
    const vatAccountId = accountMap.get('445710');

    if (clientAccountId && revenueAccountId && vatAccountId) {
      await prisma.journalEntry.create({
        data: {
          companyId,
          entryDate: invoiceDate,
          entryNumber: `EC-INV-${String(invoiceNumber).padStart(4, '0')}`,
          description: `Facture ${invoice.invoiceNumber}`,
          sourceType: 'invoice',
          sourceId: invoice.id,
          status: 'posted',
          postedAt: paidDate,
          postedBy: userId,
          createdBy: userId,
          lines: {
            create: [
              {
                accountId: clientAccountId,
                description: `Client - Facture ${invoice.invoiceNumber}`,
                debit: new Decimal(totalAmount),
                credit: new Decimal(0),
              },
              {
                accountId: revenueAccountId,
                description: `Vente HT - Facture ${invoice.invoiceNumber}`,
                debit: new Decimal(0),
                credit: new Decimal(subtotal),
              },
              {
                accountId: vatAccountId,
                description: `TVA collectée - Facture ${invoice.invoiceNumber}`,
                debit: new Decimal(0),
                credit: new Decimal(taxAmount),
              },
            ],
          },
        },
      });
    }

    invoices.push(invoice);
    invoiceNumber++;
  }

  // Factures partiellement payées (réparties sur les 6 derniers mois)
  for (let i = 0; i < 8; i++) {
    const monthsAgo = Math.floor(i / 2); // 0 à 3 mois en arrière
    const dayOfMonth = (i % 28) + 1;
    const invoiceDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;

    const unitPrice = Number(product.price);
    const taxRate = Number(product.taxRate);
    const subtotal = unitPrice * quantity;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    const paidAmount = totalAmount * 0.5; // 50% payé

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId,
        invoiceNumber: `FAC-${String(invoiceNumber).padStart(4, '0')}`,
        invoiceDate,
        dueDate,
        status: 'partially_paid',
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        paidAmount: new Decimal(paidAmount),
        currency: 'CDF',
        createdBy: userId,
        lines: {
          create: {
            productId,
            description: product.name,
            quantity: new Decimal(quantity),
            unitPrice: new Decimal(unitPrice),
            taxRate: new Decimal(taxRate),
            subtotal: new Decimal(subtotal),
            taxAmount: new Decimal(taxAmount),
            total: new Decimal(totalAmount),
          },
        },
      },
    });

    // Créer le paiement partiel
    const partialPaymentDate = new Date(invoiceDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    await prisma.payment.create({
      data: {
        companyId,
        invoiceId: invoice.id,
        amount: new Decimal(paidAmount),
        currency: 'CDF',
        paymentDate: partialPaymentDate,
        paymentMethod: 'bank_transfer',
        status: 'confirmed',
        createdBy: userId,
      },
    });

    // Créer l'écriture comptable de la facture (débit 411 / crédit 701 + 445710)
    const clientAccountId = accountMap.get('411');
    const revenueAccountId = accountMap.get('701');
    const vatAccountId = accountMap.get('445710');

    if (clientAccountId && revenueAccountId && vatAccountId) {
      await prisma.journalEntry.create({
        data: {
          companyId,
          entryDate: invoiceDate,
          entryNumber: `EC-INV-${String(invoiceNumber).padStart(4, '0')}`,
          description: `Facture ${invoice.invoiceNumber}`,
          sourceType: 'invoice',
          sourceId: invoice.id,
          status: 'posted',
          postedAt: invoiceDate,
          postedBy: userId,
          createdBy: userId,
          lines: {
            create: [
              {
                accountId: clientAccountId,
                description: `Client - Facture ${invoice.invoiceNumber}`,
                debit: new Decimal(totalAmount),
                credit: new Decimal(0),
              },
              {
                accountId: revenueAccountId,
                description: `Vente HT - Facture ${invoice.invoiceNumber}`,
                debit: new Decimal(0),
                credit: new Decimal(subtotal),
              },
              {
                accountId: vatAccountId,
                description: `TVA collectée - Facture ${invoice.invoiceNumber}`,
                debit: new Decimal(0),
                credit: new Decimal(taxAmount),
              },
            ],
          },
        },
      });
    }

    invoices.push(invoice);
    invoiceNumber++;
  }

  // Factures envoyées mais non payées (réparties sur les 4 derniers mois)
  for (let i = 0; i < 10; i++) {
    const monthsAgo = Math.floor(i / 3); // 0 à 3 mois en arrière
    const dayOfMonth = (i % 28) + 1;
    const invoiceDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const sentDate = new Date(invoiceDate);
    sentDate.setDate(sentDate.getDate() + 1);

    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;

    const unitPrice = Number(product.price);
    const taxRate = Number(product.taxRate);
    const subtotal = unitPrice * quantity;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId,
        invoiceNumber: `FAC-${String(invoiceNumber).padStart(4, '0')}`,
        invoiceDate,
        dueDate,
        status: 'sent',
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        currency: 'CDF',
        sentAt: sentDate,
        createdBy: userId,
        lines: {
          create: {
            productId,
            description: product.name,
            quantity: new Decimal(quantity),
            unitPrice: new Decimal(unitPrice),
            taxRate: new Decimal(taxRate),
            subtotal: new Decimal(subtotal),
            taxAmount: new Decimal(taxAmount),
            total: new Decimal(totalAmount),
          },
        },
      },
    });

    if (journalEntryService) {
      try {
        await journalEntryService.ensureForInvoice(invoice.id);
      } catch (error) {
        console.warn(`⚠️  Erreur création écriture pour facture ${invoice.invoiceNumber}`);
      }
    }

    invoices.push(invoice);
    invoiceNumber++;
  }

  // Factures en brouillon
  for (let i = 0; i < 5; i++) {
    const invoiceDate = new Date(now.getFullYear(), now.getMonth(), 1 + i);

    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;

    const unitPrice = Number(product.price);
    const taxRate = Number(product.taxRate);
    const subtotal = unitPrice * quantity;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    await prisma.invoice.create({
      data: {
        companyId,
        customerId,
        invoiceNumber: `FAC-${String(invoiceNumber).padStart(4, '0')}`,
        invoiceDate,
        dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        currency: 'CDF',
        createdBy: userId,
        lines: {
          create: {
            productId,
            description: product.name,
            quantity: new Decimal(quantity),
            unitPrice: new Decimal(unitPrice),
            taxRate: new Decimal(taxRate),
            subtotal: new Decimal(subtotal),
            taxAmount: new Decimal(taxAmount),
            total: new Decimal(totalAmount),
          },
        },
      },
    });

    invoiceNumber++;
  }

  console.log(`✅ ${invoices.length + 5} factures créées\n`);
  return invoices;
}

/**
 * Crée des dépenses
 */
async function createExpenses(
  companyId: string,
  userId: string,
  supplierIds: string[],
  categoryIds: string[],
  accountMap: Map<string, string>
) {
  console.log('💰 Création de dépenses...');

  const now = new Date();
  const expenses: any[] = [];
  let expenseNumber = 1;

  // Dépenses payées (réparties sur toute l'année en cours)
  for (let i = 0; i < 20; i++) {
    // Répartir sur les 12 derniers mois
    const monthsAgo = Math.floor(i / 2); // 0 à 9 mois en arrière
    const dayOfMonth = (i % 28) + 1;
    const expenseDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth);
    const paymentDate = new Date(expenseDate);
    paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 15) + 5);

    const supplierId = supplierIds[Math.floor(Math.random() * supplierIds.length)];
    const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    const amount = (Math.floor(Math.random() * 500000) + 50000) * (Math.random() > 0.5 ? 1 : 0.5);
    const taxRate = 16;
    const taxAmount = amount * (taxRate / 100);
    const totalAmount = amount + taxAmount;

    const expense = await prisma.expense.create({
      data: {
        companyId,
        expenseNumber: `DEP-${String(expenseNumber).padStart(4, '0')}`,
        expenseDate,
        supplierId,
        categoryId,
        description: `Dépense ${expenseNumber} - ${['Fournitures', 'Services', 'Loyers', 'Transport'][Math.floor(Math.random() * 4)]}`,
        amount: new Decimal(amount),
        amountHt: new Decimal(amount),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        amountTtc: new Decimal(totalAmount),
        currency: 'CDF',
        paymentMethod: ['cash', 'bank_transfer', 'mobile_money'][Math.floor(Math.random() * 3)],
        paymentDate,
        status: 'paid',
        paidAt: paymentDate,
        createdBy: userId,
      },
    });

    // Créer l'écriture comptable de la dépense (débit 601 + 445660 / crédit 401)
    const supplierAccountId = accountMap.get('401');
    const chargeAccountId = accountMap.get('601');
    const vatDeductibleAccountId = accountMap.get('445660');

    if (supplierAccountId && chargeAccountId && vatDeductibleAccountId) {
      const lines: any[] = [
        {
          accountId: chargeAccountId,
          description: `Charge - Dépense ${expense.expenseNumber}`,
          debit: new Decimal(amount),
          credit: new Decimal(0),
        },
      ];

      if (taxAmount > 0) {
        lines.push({
          accountId: vatDeductibleAccountId,
          description: `TVA déductible - Dépense ${expense.expenseNumber}`,
          debit: new Decimal(taxAmount),
          credit: new Decimal(0),
        });
      }

      lines.push({
        accountId: supplierAccountId,
        description: `Fournisseur - Dépense ${expense.expenseNumber}`,
        debit: new Decimal(0),
        credit: new Decimal(totalAmount),
      });

      await prisma.journalEntry.create({
        data: {
          companyId,
          entryDate: expenseDate,
          entryNumber: `EC-EXP-${String(expenseNumber).padStart(4, '0')}`,
          description: `Dépense ${expense.expenseNumber}`,
          sourceType: 'expense',
          sourceId: expense.id,
          status: 'posted',
          postedAt: paymentDate,
          postedBy: userId,
          createdBy: userId,
          lines: {
            create: lines,
          },
        },
      });
    }

    expenses.push(expense);
    expenseNumber++;
  }

  // Dépenses validées mais non payées (réparties sur les 3 derniers mois)
  for (let i = 0; i < 10; i++) {
    const monthsAgo = Math.floor(i / 4); // 0 à 2 mois en arrière
    const dayOfMonth = (i % 28) + 1;
    const expenseDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth);
    const validatedDate = new Date(expenseDate);
    validatedDate.setDate(validatedDate.getDate() + 2);

    const supplierId = supplierIds[Math.floor(Math.random() * supplierIds.length)];
    const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    const amount = (Math.floor(Math.random() * 500000) + 50000) * (Math.random() > 0.5 ? 1 : 0.5);
    const taxRate = 16;
    const taxAmount = amount * (taxRate / 100);
    const totalAmount = amount + taxAmount;

    await prisma.expense.create({
      data: {
        companyId,
        expenseNumber: `DEP-${String(expenseNumber).padStart(4, '0')}`,
        expenseDate,
        supplierId,
        categoryId,
        description: `Dépense ${expenseNumber} - ${['Fournitures', 'Services', 'Loyers'][Math.floor(Math.random() * 3)]}`,
        amount: new Decimal(amount),
        amountHt: new Decimal(amount),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        amountTtc: new Decimal(totalAmount),
        currency: 'CDF',
        status: 'validated',
        validatedAt: validatedDate,
        validatedBy: userId,
        createdBy: userId,
      },
    });

    expenseNumber++;
  }

  // Dépenses en brouillon
  for (let i = 0; i < 5; i++) {
    const expenseDate = new Date(now.getFullYear(), now.getMonth(), 1 + i);

    const supplierId = supplierIds[Math.floor(Math.random() * supplierIds.length)];
    const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    const amount = (Math.floor(Math.random() * 500000) + 50000) * (Math.random() > 0.5 ? 1 : 0.5);
    const taxRate = 16;
    const taxAmount = amount * (taxRate / 100);
    const totalAmount = amount + taxAmount;

    await prisma.expense.create({
      data: {
        companyId,
        expenseNumber: `DEP-${String(expenseNumber).padStart(4, '0')}`,
        expenseDate,
        supplierId,
        categoryId,
        description: `Dépense ${expenseNumber} - Brouillon`,
        amount: new Decimal(amount),
        amountHt: new Decimal(amount),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        amountTtc: new Decimal(totalAmount),
        currency: 'CDF',
        status: 'draft',
        createdBy: userId,
      },
    });

    expenseNumber++;
  }

  console.log(`✅ ${expenses.length + 15} dépenses créées\n`);
  return expenses;
}

/**
 * Crée des exercices comptables
 */
async function createFiscalPeriods(companyId: string) {
  console.log('📅 Création d\'exercices comptables...');

  const now = new Date();
  const currentYear = now.getFullYear();

  // Exercice en cours
  const currentPeriod = await prisma.fiscalPeriod.create({
    data: {
      companyId,
      name: `Exercice ${currentYear}`,
      startDate: new Date(currentYear, 0, 1),
      endDate: new Date(currentYear, 11, 31),
      status: 'open',
    },
  });

  // Exercice précédent (fermé)
  const previousPeriod = await prisma.fiscalPeriod.create({
    data: {
      companyId,
      name: `Exercice ${currentYear - 1}`,
      startDate: new Date(currentYear - 1, 0, 1),
      endDate: new Date(currentYear - 1, 11, 31),
      status: 'closed',
      closedAt: new Date(currentYear, 0, 15),
    },
  });

  console.log(`✅ 2 exercices comptables créés\n`);
  return { currentPeriod, previousPeriod };
}

/**
 * Créer le solde d'ouverture (capital initial)
 */
async function createOpeningBalance(
  companyId: string,
  userId: string,
  accountMap: Map<string, string>
) {
  console.log('💰 Création du solde d\'ouverture (capital)...');

  const capitalParentId = accountMap.get('101'); // Compte parent
  const capitalAccountId = accountMap.get('101000'); // Compte enfant
  const bankAccountId = accountMap.get('512000');

  if (!capitalAccountId || !bankAccountId) {
    console.log('⚠️  Comptes capital ou banque non trouvés, création ignorée\n');
    return;
  }

  const now = new Date();
  const openingDate = new Date(now.getFullYear(), 0, 1); // 1er janvier de l'année

  // Créer l'écriture d'ouverture : Capital social versé à la banque (sur compte enfant)
  await prisma.journalEntry.create({
    data: {
      companyId,
      entryDate: openingDate,
      entryNumber: 'ECR-OUVERTURE-001',
      description: 'Solde d\'ouverture - Capital social versé',
      sourceType: 'manual',
      status: 'posted',
      postedAt: openingDate,
      postedBy: userId,
      createdBy: userId,
      lines: {
        create: [
          {
            accountId: bankAccountId,
            description: 'Capital social versé à la banque',
            debit: new Decimal(10000000), // 10 millions CDF
            credit: new Decimal(0),
          },
          {
            accountId: capitalAccountId,
            description: 'Capital social',
            debit: new Decimal(0),
            credit: new Decimal(10000000),
          },
        ],
      },
    },
  });

  // Créer aussi une écriture sur le compte parent 101 pour qu'il ait des mouvements
  if (capitalParentId) {
    await prisma.journalEntry.create({
      data: {
        companyId,
        entryDate: openingDate,
        entryNumber: 'ECR-OUVERTURE-002',
        description: 'Solde d\'ouverture - Capital (compte parent)',
        sourceType: 'manual',
        status: 'posted',
        postedAt: openingDate,
        postedBy: userId,
        createdBy: userId,
        lines: {
          create: [
            {
              accountId: bankAccountId,
              description: 'Capital social versé',
              debit: new Decimal(5000000), // 5 millions supplémentaires
              credit: new Decimal(0),
            },
            {
              accountId: capitalParentId,
              description: 'Capital social',
              debit: new Decimal(0),
              credit: new Decimal(5000000),
            },
          ],
        },
      },
    });
  }

  console.log('✅ Solde d\'ouverture créé\n');
}

/**
 * Crée des écritures comptables manuelles
 */
async function createManualJournalEntries(
  companyId: string,
  userId: string,
  accountMap: Map<string, string>
) {
  console.log('📝 Création d\'écritures comptables manuelles...');

  const now = new Date();
  let entryNumber = 1;

  // Écritures pour les 3 derniers mois
  for (let month = 0; month < 3; month++) {
    const entryDate = new Date(now.getFullYear(), now.getMonth() - month, 15);

    // Écriture de régularisation salaires
    await prisma.journalEntry.create({
      data: {
        companyId,
        entryDate,
        entryNumber: `ECR-${String(entryNumber).padStart(4, '0')}`,
        description: `Écriture de régularisation - ${entryDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        sourceType: 'manual',
        status: 'posted',
        postedAt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000),
        postedBy: userId,
        createdBy: userId,
        lines: {
          create: [
            {
              accountId: accountMap.get('641000')!,
              description: 'Salaires bruts',
              debit: new Decimal(500000),
              credit: new Decimal(0),
            },
            {
              accountId: accountMap.get('421000')!,
              description: 'Rémunérations dues',
              debit: new Decimal(0),
              credit: new Decimal(500000),
            },
          ],
        },
      },
    });

    entryNumber++;

    // Écriture d'amortissement (tous les mois) - sur compte enfant
    const assetAccountId = accountMap.get('213500'); // Matériel informatique
    const depreciationAccountId = accountMap.get('281500'); // Amortissements matériel informatique
    const depreciationParentId = accountMap.get('281'); // Compte parent
    const expenseAccountId = accountMap.get('681500'); // Dotations amortissements

    if (assetAccountId && depreciationAccountId && expenseAccountId) {
      const depreciationAmount = 83333; // 1/12 de 1 000 000 (amortissement annuel de 20%)

      // Écriture sur compte enfant
      await prisma.journalEntry.create({
        data: {
          companyId,
          entryDate,
          entryNumber: `ECR-${String(entryNumber).padStart(4, '0')}`,
          description: `Dotation aux amortissements - ${entryDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
          sourceType: 'manual',
          status: 'posted',
          postedAt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000),
          postedBy: userId,
          createdBy: userId,
          lines: {
            create: [
              {
                accountId: expenseAccountId,
                description: 'Dotation aux amortissements matériel informatique',
                debit: new Decimal(depreciationAmount),
                credit: new Decimal(0),
              },
              {
                accountId: depreciationAccountId,
                description: 'Amortissements matériel informatique',
                debit: new Decimal(0),
                credit: new Decimal(depreciationAmount),
              },
            ],
          },
        },
      });

      entryNumber++;

      // Écriture sur compte parent 281 pour qu'il ait aussi des mouvements
      if (depreciationParentId) {
        await prisma.journalEntry.create({
          data: {
            companyId,
            entryDate,
            entryNumber: `ECR-${String(entryNumber).padStart(4, '0')}`,
            description: `Dotation aux amortissements (compte parent) - ${entryDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
            sourceType: 'manual',
            status: 'posted',
            postedAt: new Date(entryDate.getTime() + 24 * 60 * 60 * 1000),
            postedBy: userId,
            createdBy: userId,
            lines: {
              create: [
                {
                  accountId: expenseAccountId,
                  description: 'Dotation aux amortissements',
                  debit: new Decimal(depreciationAmount * 0.5), // Moitié du montant
                  credit: new Decimal(0),
                },
                {
                  accountId: depreciationParentId,
                  description: 'Amortissements (compte parent)',
                  debit: new Decimal(0),
                  credit: new Decimal(depreciationAmount * 0.5),
                },
              ],
            },
          },
        });

        entryNumber++;
      }
    }
  }

  console.log(`✅ ${entryNumber - 1} écritures manuelles créées\n`);
}

/**
 * Crée des employés
 */
async function createEmployees(companyId: string, accountMap: Map<string, string>) {
  console.log('👔 Création d\'employés...');

  const employees = [
    { employeeNumber: 'EMP001', firstName: 'Pierre', lastName: 'Kabila', position: 'Directeur Général', department: 'Direction', baseSalary: 5000000, hireDate: new Date(2023, 0, 1) },
    { employeeNumber: 'EMP002', firstName: 'Sophie', lastName: 'Mukamba', position: 'Comptable', department: 'Comptabilité', baseSalary: 2000000, hireDate: new Date(2023, 2, 15) },
    { employeeNumber: 'EMP003', firstName: 'Marc', lastName: 'Tshisekedi', position: 'Développeur', department: 'IT', baseSalary: 2500000, hireDate: new Date(2023, 5, 1) },
    { employeeNumber: 'EMP004', firstName: 'Julie', lastName: 'Lubamba', position: 'Commerciale', department: 'Ventes', baseSalary: 1800000, hireDate: new Date(2023, 8, 10) },
    { employeeNumber: 'EMP005', firstName: 'David', lastName: 'Kasa', position: 'Assistant', department: 'Administration', baseSalary: 1200000, hireDate: new Date(2024, 0, 5) },
  ];

  const employeeIds: string[] = [];
  for (const data of employees) {
    const employee = await prisma.employee.create({
      data: {
        companyId,
        employeeNumber: data.employeeNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position,
        department: data.department,
        baseSalary: new Decimal(data.baseSalary),
        currency: 'CDF',
        salaryFrequency: 'monthly',
        hireDate: data.hireDate,
        status: 'active',
        employmentType: 'full_time',
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`,
        phone: `+2439000${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        city: 'Kinshasa',
        country: 'RDC',
      },
    });
    employeeIds.push(employee.id);
  }

  console.log(`✅ ${employees.length} employés créés\n`);
  return employeeIds;
}

/**
 * Crée des pointages
 */
async function createAttendances(companyId: string, employeeIds: string[]) {
  console.log('⏰ Création de pointages...');

  const now = new Date();
  const attendancesToCreate: any[] = [];

  // Pointages pour les 2 derniers mois
  for (let month = 0; month < 2; month++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

    for (const employeeId of employeeIds) {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        
        // Ignorer les weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // 80% de présence
        if (Math.random() > 0.8) continue;

        const checkIn = new Date(date);
        checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

        const checkOut = new Date(date);
        checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

        const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

        attendancesToCreate.push({
          companyId,
          employeeId,
          date,
          checkIn,
          checkOut,
          hoursWorked: new Decimal(hoursWorked.toFixed(2)),
          status: 'present',
        });
      }
    }
  }

  // Créer par batch de 100 pour éviter les timeouts
  const batchSize = 100;
  for (let i = 0; i < attendancesToCreate.length; i += batchSize) {
    const batch = attendancesToCreate.slice(i, i + batchSize);
    await prisma.attendance.createMany({
      data: batch,
      skipDuplicates: true,
    });
    if (i % 500 === 0) {
      console.log(`   📝 ${Math.min(i + batchSize, attendancesToCreate.length)}/${attendancesToCreate.length} pointages...`);
    }
  }

  console.log(`✅ ${attendancesToCreate.length} pointages créés\n`);
}

/**
 * Crée des fiches de paie
 */
async function createPayrolls(
  companyId: string,
  userId: string,
  employeeIds: string[],
  accountMap: Map<string, string>
) {
  console.log('💵 Création de fiches de paie...');

  const now = new Date();
  let payrollCount = 0;

  // Fiches de paie pour les 3 derniers mois
  for (let month = 0; month < 3; month++) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - month, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - month + 1, 0);
    const payDate = new Date(periodEnd);
    payDate.setDate(payDate.getDate() + 5);

    for (const employeeId of employeeIds) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (!employee) continue;

      const grossSalary = Number(employee.baseSalary);
      const socialCharges = grossSalary * 0.20; // 20% de charges sociales
      const totalDeductions = socialCharges;
      const netSalary = grossSalary - totalDeductions;

      const payroll = await prisma.payroll.create({
        data: {
          companyId,
          employeeId,
          periodStart,
          periodEnd,
          payDate,
          status: 'paid',
          grossSalary: new Decimal(grossSalary),
          totalDeductions: new Decimal(totalDeductions),
          netSalary: new Decimal(netSalary),
          currency: 'CDF',
          paymentMethod: 'bank_transfer',
          paidAt: payDate,
          items: {
            create: [
              {
                type: 'salary',
                description: 'Salaire de base',
                amount: new Decimal(grossSalary),
                isDeduction: false,
              },
              {
                type: 'social_charges',
                description: 'Charges sociales',
                amount: new Decimal(socialCharges),
                isDeduction: true,
              },
            ],
          },
        },
      });

      // Créer l'écriture comptable pour la paie
      if (journalEntryService) {
        try {
          const salaryAccountId = accountMap.get('641000');
          const socialChargesAccountId = accountMap.get('645000');
          const payableAccountId = accountMap.get('421000');

          if (salaryAccountId && socialChargesAccountId && payableAccountId) {
            await prisma.journalEntry.create({
              data: {
                companyId,
                entryDate: payDate,
                entryNumber: `PAY-${payroll.id.substring(0, 8).toUpperCase()}`,
                description: `Paie ${employee.firstName} ${employee.lastName} - ${periodStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
                sourceType: 'payroll',
                sourceId: payroll.id,
                status: 'posted',
                postedAt: payDate,
                postedBy: userId,
                createdBy: userId,
                lines: {
                  create: [
                    {
                      accountId: salaryAccountId,
                      description: 'Salaires bruts',
                      debit: new Decimal(grossSalary),
                      credit: new Decimal(0),
                    },
                    {
                      accountId: socialChargesAccountId,
                      description: 'Charges sociales',
                      debit: new Decimal(socialCharges),
                      credit: new Decimal(0),
                    },
                    {
                      accountId: payableAccountId,
                      description: 'Rémunérations dues',
                      debit: new Decimal(0),
                      credit: new Decimal(grossSalary + socialCharges),
                    },
                  ],
                },
              },
            });
          }
        } catch (error) {
          console.warn(`⚠️  Erreur création écriture pour paie ${payroll.id}`);
        }
      }

      payrollCount++;
    }
  }

  console.log(`✅ ${payrollCount} fiches de paie créées\n`);
}

/**
 * Crée des politiques de congés par défaut et quelques soldes/demandes
 */
async function createHrLeaveData(companyId: string, employeeIds: string[]) {
  console.log('🌴 Création des politiques et congés (HR)...');

  try {
    // Nettoyer d'abord les données HR existantes pour éviter les conflits
    await prisma.leaveRequest.deleteMany({ where: { companyId } });
    await prisma.leaveBalance.deleteMany({ where: { companyId } });
    await prisma.employeeDocument.deleteMany({ where: { companyId } });
    await prisma.leavePolicy.deleteMany({ where: { companyId } });

    // Politiques par défaut inspirées de la législation RDC
    console.log('   📋 Création des politiques de congés...');
    const annualPolicy = await prisma.leavePolicy.create({
      data: {
        companyId,
        name: 'Congés annuels payés',
        leaveType: 'annual_paid',
        daysPerYear: new Decimal(12),
        daysPerMonth: new Decimal(1),
        maxAccumulation: new Decimal(24),
        carryForward: true,
        requiresApproval: true,
        minNoticeDays: 7,
        description: 'Congés payés annuels (minimum légal RDC : 12 jours/an)',
        isActive: true,
      },
    });

    await prisma.leavePolicy.create({
      data: {
        companyId,
        name: 'Congés maladie',
        leaveType: 'sick',
        daysPerYear: new Decimal(30),
        carryForward: false,
        requiresApproval: true,
        description: 'Congés maladie avec certificat médical',
        isActive: true,
      },
    });

    await prisma.leavePolicy.create({
      data: {
        companyId,
        name: 'Congé maternité',
        leaveType: 'maternity',
        daysPerYear: new Decimal(98), // 14 semaines
        carryForward: false,
        requiresApproval: true,
        minNoticeDays: 30,
        description: 'Congé maternité (14 semaines) selon la législation RDC',
        isActive: true,
      },
    });

    // Soldes de congés pour l'année en cours
    console.log('   💼 Création des soldes de congés...');
    const year = new Date().getFullYear();
    const totalAnnualDays = Number(annualPolicy.daysPerYear || 12);
    const balancesToCreate = employeeIds.map(employeeId => {
      const usedDays = Math.floor(Math.random() * 5); // 0 à 4 jours déjà pris
      const pendingDays = Math.floor(Math.random() * 3); // 0 à 2 jours en attente
      const remaining = Math.max(totalAnnualDays - usedDays - pendingDays, 0);
      return {
        companyId,
        employeeId,
        leaveType: 'annual',
        year,
        totalDays: new Decimal(totalAnnualDays),
        usedDays: new Decimal(usedDays),
        pendingDays: new Decimal(pendingDays),
        remainingDays: new Decimal(remaining),
        carriedForward: new Decimal(0),
      };
    });
    await prisma.leaveBalance.createMany({
      data: balancesToCreate,
      skipDuplicates: true,
    });

    // Quelques demandes de congés annuels cohérentes avec les soldes
    console.log('   📅 Création des demandes de congés...');
    const now = new Date();
    const leaveRequestsData: { employeeId: string; offset: number; duration: number }[] = [];
    employeeIds.forEach((employeeId, index) => {
      leaveRequestsData.push(
        { employeeId, offset: -20 - index * 5, duration: 3 },
        { employeeId, offset: -50 - index * 7, duration: 2 }
      );
    });

    const leaveRequestsToCreate = leaveRequestsData.map(lr => {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + lr.offset);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + lr.duration - 1);
      return {
        companyId,
        employeeId: lr.employeeId,
        leaveType: 'annual',
        startDate,
        endDate,
        daysRequested: new Decimal(lr.duration),
        status: 'approved',
        reason: 'Congés annuels',
        requestedAt: startDate,
        approvedAt: startDate,
      };
    });
    await prisma.leaveRequest.createMany({
      data: leaveRequestsToCreate,
      skipDuplicates: true,
    });

    // Documents employés (contrat et pièce d'identité) avec fichiers associés
    console.log('   📄 Création des documents employés...');

    for (const employeeId of employeeIds) {
      // Créer le fichier contrat
      const contractFile = await prisma.fileUpload.create({
        data: {
          companyId,
          fileName: `contract-${employeeId}.pdf`,
          originalName: 'Contrat de travail CDI.pdf',
          mimeType: 'application/pdf',
          size: 12345,
          path: `/uploads/contracts/contract-${employeeId}.pdf`,
          relatedType: 'employee',
          relatedId: employeeId,
        },
      });

      // Créer le document contrat
      await prisma.employeeDocument.create({
        data: {
          companyId,
          employeeId,
          documentType: 'contract',
          name: 'Contrat de travail CDI',
          description: 'Contrat de travail à durée indéterminée',
          fileId: contractFile.id,
          expiryDate: null,
          isExpired: false,
        },
      });

      // Créer le fichier carte d'identité
      const idCardFile = await prisma.fileUpload.create({
        data: {
          companyId,
          fileName: `id-card-${employeeId}.pdf`,
          originalName: 'Carte identite.pdf',
          mimeType: 'application/pdf',
          size: 12345,
          path: `/uploads/ids/id-card-${employeeId}.pdf`,
          relatedType: 'employee',
          relatedId: employeeId,
        },
      });

      // Créer le document carte d'identité
      await prisma.employeeDocument.create({
        data: {
          companyId,
          employeeId,
          documentType: 'id_card',
          name: 'Carte d\'identité',
          description: 'Pièce d\'identité officielle',
          fileId: idCardFile.id,
          expiryDate: new Date(year + 4, 6, 1),
          isExpired: false,
        },
      });
    }

    console.log('✅ Politiques, soldes et congés HR créés\n');
  } catch (error: any) {
    console.error('❌ Erreur lors de la création des données HR:', error.message);
    throw error;
  }
}
/**
 * Crée des amortissements
 */
async function createDepreciations(companyId: string, accountMap: Map<string, string>) {
  console.log('📉 Création d\'amortissements...');

  const now = new Date();
  const assetAccountId = accountMap.get('213500'); // Matériel informatique
  const depreciationAccountId = accountMap.get('281500'); // Amortissements matériel informatique
  const expenseAccountId = accountMap.get('681500'); // Dotations amortissements matériel informatique

  if (!assetAccountId || !depreciationAccountId || !expenseAccountId) {
    console.log('⚠️  Comptes d\'amortissement non trouvés, création ignorée\n');
    return;
  }

  const depreciations = [
    {
      description: 'Serveur informatique',
      purchaseDate: new Date(2023, 0, 15),
      purchaseAmount: 5000000,
      depreciationRate: 20, // 20% par an
      depreciationMethod: 'linear',
    },
    {
      description: 'Équipement réseau',
      purchaseDate: new Date(2023, 3, 10),
      purchaseAmount: 2000000,
      depreciationRate: 25, // 25% par an
      depreciationMethod: 'linear',
    },
    {
      description: 'Matériel de bureau',
      purchaseDate: new Date(2023, 6, 1),
      purchaseAmount: 1500000,
      depreciationRate: 15, // 15% par an
      depreciationMethod: 'declining_balance',
    },
  ];

  for (const data of depreciations) {
    await prisma.depreciation.create({
      data: {
        companyId,
        assetAccountId,
        depreciationAccountId,
        description: data.description,
        purchaseDate: data.purchaseDate,
        purchaseAmount: new Decimal(data.purchaseAmount),
        depreciationRate: new Decimal(data.depreciationRate),
        depreciationMethod: data.depreciationMethod as any,
        startDate: data.purchaseDate,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${depreciations.length} amortissements créés\n`);
}

/**
 * Crée des relevés bancaires
 */
async function createBankStatements(companyId: string, accountMap: Map<string, string>) {
  console.log('🏦 Création de relevés bancaires...');

  const bankAccountId = accountMap.get('512000'); // Banque principale
  if (!bankAccountId) {
    console.log('⚠️  Compte bancaire non trouvé, création ignorée\n');
    return;
  }

  const now = new Date();
  let statementNumber = 1;

  // Relevés pour les 3 derniers mois
  for (let month = 0; month < 3; month++) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - month + 1, 0);
    const openingBalance = 10000000 - (month * 500000);
    const closingBalance = openingBalance + (Math.random() * 2000000 - 1000000);

    const statement = await prisma.bankStatement.create({
      data: {
        companyId,
        accountId: bankAccountId,
        statementNumber: `RELEVE-${String(statementNumber).padStart(4, '0')}`,
        startDate,
        endDate,
        openingBalance: new Decimal(openingBalance),
        closingBalance: new Decimal(closingBalance),
        status: 'imported',
        importedAt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
        transactions: {
          create: [
            {
              transactionDate: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
              description: 'Virement reçu - Client',
              amount: new Decimal(500000),
              type: 'credit',
              balance: new Decimal(openingBalance + 500000),
            },
            {
              transactionDate: new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
              description: 'Paiement fournisseur',
              amount: new Decimal(-200000),
              type: 'debit',
              balance: new Decimal(openingBalance + 500000 - 200000),
            },
            {
              transactionDate: new Date(startDate.getTime() + 20 * 24 * 60 * 60 * 1000),
              description: 'Frais bancaires',
              amount: new Decimal(-5000),
              type: 'debit',
              balance: new Decimal(closingBalance),
            },
          ],
        },
      },
    });

    statementNumber++;
  }

  console.log(`✅ ${statementNumber - 1} relevés bancaires créés\n`);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Démarrage du script de réinitialisation et seed complet...\n');

    await initServices();

    // Récupérer l'entreprise cible :
    // - priorité à celle utilisée pour les tests ("Entreprise Test")
    // - sinon, première entreprise existante
    let company = await prisma.company.findFirst({
      where: {
        name: { contains: 'Entreprise Test', mode: 'insensitive' },
      },
      include: {
        users: {
          where: { deletedAt: null },
          take: 1,
        },
      },
    });

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

    // 1. Effacer les données
    await resetDatabase(company.id);

    // 2. Créer le plan comptable
    const accountMap = await createChartOfAccounts(company.id);

    // 3. Créer les données de base
    const customerIds = await createCustomers(company.id);
    const supplierIds = await createSuppliers(company.id, accountMap);
    const productIds = await createProducts(company.id);
    const categoryIds = await createExpenseCategories(company.id, accountMap);

    // 4. Créer les factures et dépenses
    await createInvoices(company.id, user.id, customerIds, productIds, accountMap);
    await createExpenses(company.id, user.id, supplierIds, categoryIds, accountMap);

    // 5. Créer les exercices comptables et écritures manuelles
    await createFiscalPeriods(company.id);
    await createOpeningBalance(company.id, user.id, accountMap);
    await createManualJournalEntries(company.id, user.id, accountMap);

    // 6. Créer les données RH
    const employeeIds = await createEmployees(company.id, accountMap);
    await createAttendances(company.id, employeeIds);
    await createPayrolls(company.id, user.id, employeeIds, accountMap);
    await createHrLeaveData(company.id, employeeIds);

    // 7. Créer les amortissements et relevés bancaires
    await createDepreciations(company.id, accountMap);
    await createBankStatements(company.id, accountMap);

    console.log('✅ Script terminé avec succès !\n');
    console.log('📊 Résumé des données créées :');
    console.log('   - Plan comptable complet');
    console.log('   - Clients et fournisseurs');
    console.log('   - Produits et services');
    console.log('   - Factures (payées, partiellement payées, envoyées, brouillons)');
    console.log('   - Dépenses (payées, validées, brouillons)');
    console.log('   - Exercices comptables');
    console.log('   - Écritures comptables (automatiques et manuelles)');
    console.log('   - Employés, pointages et fiches de paie');
    console.log('   - Amortissements');
    console.log('   - Relevés bancaires');
    console.log('\n🎉 Toutes les données sont prêtes pour les tests !\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


