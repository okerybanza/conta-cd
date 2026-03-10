/**
 * Script complet pour créer des données de test exhaustives pour okerybanza@gmail.com
 * Remplit TOUS les modules avec des données cohérentes et interconnectées
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();

// ============================================
// DONNÉES DE TEST
// ============================================

const PRODUCTS = [
  // Services
  { name: 'Consultation IT', description: 'Consultation en informatique et conseil', type: 'service' as const, unitPrice: 50000, taxRate: 16, category: 'Services IT', isActive: true },
  { name: 'Développement Web', description: 'Développement de site web et applications', type: 'service' as const, unitPrice: 150000, taxRate: 16, category: 'Services IT', isActive: true },
  { name: 'Formation Excel', description: 'Formation Microsoft Excel avancé', type: 'service' as const, unitPrice: 100000, taxRate: 16, category: 'Formation', isActive: true },
  { name: 'Maintenance Informatique', description: 'Maintenance et support informatique', type: 'service' as const, unitPrice: 75000, taxRate: 16, category: 'Services IT', isActive: true },
  { name: 'Conseil en Gestion', description: 'Conseil en gestion d\'entreprise', type: 'service' as const, unitPrice: 120000, taxRate: 16, category: 'Conseil', isActive: true },
  // Produits
  { name: 'Ordinateur Portable', description: 'Laptop Dell Inspiron 15', type: 'product' as const, unitPrice: 800000, taxRate: 16, category: 'Équipement IT', trackStock: true, lowStockThreshold: 5, isActive: true },
  { name: 'Clavier USB', description: 'Clavier mécanique RGB', type: 'product' as const, unitPrice: 25000, taxRate: 16, category: 'Équipement IT', trackStock: true, lowStockThreshold: 10, isActive: true },
  { name: 'Souris Sans Fil', description: 'Souris Logitech MX Master', type: 'product' as const, unitPrice: 15000, taxRate: 16, category: 'Équipement IT', trackStock: true, lowStockThreshold: 15, isActive: true },
  { name: 'Écran 24 pouces', description: 'Écran LED Full HD', type: 'product' as const, unitPrice: 150000, taxRate: 16, category: 'Équipement IT', trackStock: true, lowStockThreshold: 3, isActive: true },
  { name: 'Imprimante Multifonction', description: 'Imprimante HP LaserJet', type: 'product' as const, unitPrice: 300000, taxRate: 16, category: 'Équipement Bureau', trackStock: true, lowStockThreshold: 2, isActive: true },
];

const CUSTOMERS = [
  { type: 'entreprise' as const, businessName: 'Tech Solutions SARL', email: 'contact@techsolutions.cd', phone: '+243 900 100 001', nif: 'NIF001', rccm: 'RCCM001', address: 'Avenue Kasa-Vubu, N°123', city: 'Kinshasa', country: 'RDC' },
  { type: 'particulier' as const, firstName: 'Jean', lastName: 'Kabila', email: 'jean.kabila@example.com', phone: '+243 900 100 002', address: 'Gombe, Avenue de la République', city: 'Kinshasa', country: 'RDC' },
  { type: 'entreprise' as const, businessName: 'Digital Agency RDC', email: 'info@digitalagency.cd', phone: '+243 900 100 003', nif: 'NIF002', rccm: 'RCCM002', address: 'Lubumbashi, Avenue Lumumba', city: 'Lubumbashi', country: 'RDC' },
  { type: 'particulier' as const, firstName: 'Marie', lastName: 'Tshisekedi', email: 'marie.tshisekedi@example.com', phone: '+243 900 100 004', address: 'Kinshasa, Commune de la Gombe', city: 'Kinshasa', country: 'RDC' },
  { type: 'entreprise' as const, businessName: 'Innovation Hub Congo', email: 'contact@innovationhub.cd', phone: '+243 900 100 005', nif: 'NIF003', rccm: 'RCCM003', address: 'Kinshasa, Quartier Matonge', city: 'Kinshasa', country: 'RDC' },
  { type: 'particulier' as const, firstName: 'Paul', lastName: 'Mukamba', email: 'paul.mukamba@example.com', phone: '+243 900 100 006', address: 'Kinshasa', city: 'Kinshasa', country: 'RDC' },
];

const SUPPLIERS = [
  { name: 'Fournisseur IT Solutions', email: 'contact@itsolutions.cd', phone: '+243 900 200 001', address: 'Kinshasa', city: 'Kinshasa' },
  { name: 'Bureau & Papeterie Pro', email: 'info@bureaupapeterie.cd', phone: '+243 900 200 002', address: 'Kinshasa', city: 'Kinshasa' },
  { name: 'Équipement Informatique RDC', email: 'contact@equipement.cd', phone: '+243 900 200 003', address: 'Kinshasa', city: 'Kinshasa' },
  { name: 'Services Généraux', email: 'info@servicesgeneraux.cd', phone: '+243 900 200 004', address: 'Kinshasa', city: 'Kinshasa' },
];

const EXPENSE_CATEGORIES = [
  'Informatique',
  'Fournitures de bureau',
  'Équipement',
  'Services',
  'Transport',
  'Communication',
  'Formation',
  'Location',
  'Entretien',
  'Autres',
];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

async function getOrCreateUser() {
  let user = await prisma.users.findFirst({
    where: { email: 'okerybanza@gmail.com' },
    include: { companies: true },
  });

  if (!user) {
    throw new Error('Utilisateur okerybanza@gmail.com non trouvé');
  }

  if (!user.company_id) {
    throw new Error('L\'utilisateur n\'a pas d\'entreprise associée');
  }

  return user;
}

async function getOrCreateFiscalPeriod(companyId: string) {
  let fiscalPeriod = await prisma.fiscal_periods.findFirst({
    where: {
      company_id: companyId,
      status: 'open',
    },
  });

  if (!fiscalPeriod) {
    const currentYear = new Date().getFullYear();
    fiscalPeriod = await prisma.fiscal_periods.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        name: `Exercice ${currentYear}`,
        start_date: new Date(currentYear, 0, 1),
        end_date: new Date(currentYear, 11, 31),
        status: 'open',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  return fiscalPeriod;
}

// ============================================
// CRÉATION DES DONNÉES
// ============================================

async function createProducts(companyId: string) {
  console.log('📦 Création des produits...');
  const productIds: string[] = [];

  for (const productData of PRODUCTS) {
    const existing = await prisma.products.findFirst({
      where: {
        company_id: companyId,
        name: productData.name,
        deleted_at: null,
      },
    });

    if (existing) {
      productIds.push(existing.id);
      console.log(`  ⏭️  ${productData.name} (existant)`);
      continue;
    }

    const product = await prisma.products.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        name: productData.name,
        description: productData.description,
        type: productData.type,
        price: new Decimal(productData.unitPrice),
        tax_rate: new Decimal(productData.taxRate),
        currency: 'CDF',
        category: productData.category,
        is_active: productData.isActive,
        track_stock: productData.trackStock || false,
        min_stock: productData.lowStockThreshold ? new Decimal(productData.lowStockThreshold) : null,
        stock: new Decimal(0),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    productIds.push(product.id);
    console.log(`  ✅ ${productData.name}`);
  }

  console.log(`✅ ${productIds.length} produits créés/vérifiés\n`);
  return productIds;
}

async function createCustomers(companyId: string) {
  console.log('👥 Création des clients...');
  const customerIds: string[] = [];

  for (const customerData of CUSTOMERS) {
    const existing = await prisma.customers.findFirst({
      where: {
        company_id: companyId,
        email: customerData.email,
        deleted_at: null,
      },
    });

    if (existing) {
      customerIds.push(existing.id);
      console.log(`  ⏭️  ${customerData.type === 'particulier' ? `${customerData.firstName} ${customerData.lastName}` : customerData.businessName} (existant)`);
      continue;
    }

    const customer = await prisma.customers.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        type: customerData.type,
        first_name: customerData.firstName || null,
        last_name: customerData.lastName || null,
        business_name: customerData.businessName || null,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        country: customerData.country || 'RDC',
        nif: customerData.nif || null,
        rccm: customerData.rccm || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    customerIds.push(customer.id);
    console.log(`  ✅ ${customerData.type === 'particulier' ? `${customerData.firstName} ${customerData.lastName}` : customerData.businessName}`);
  }

  console.log(`✅ ${customerIds.length} clients créés/vérifiés\n`);
  return customerIds;
}

async function createSuppliers(companyId: string) {
  console.log('🏢 Création des fournisseurs...');
  const supplierIds: string[] = [];

  for (const supplierData of SUPPLIERS) {
    const existing = await prisma.suppliers.findFirst({
      where: {
        company_id: companyId,
        email: supplierData.email,
        deleted_at: null,
      },
    });

    if (existing) {
      supplierIds.push(existing.id);
      console.log(`  ⏭️  ${supplierData.name} (existant)`);
      continue;
    }

    const supplier = await prisma.suppliers.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        name: supplierData.name,
        email: supplierData.email,
        phone: supplierData.phone,
        address: supplierData.address,
        city: supplierData.city,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    supplierIds.push(supplier.id);
    console.log(`  ✅ ${supplierData.name}`);
  }

  console.log(`✅ ${supplierIds.length} fournisseurs créés/vérifiés\n`);
  return supplierIds;
}

async function createExpenseCategories(companyId: string) {
  console.log('📁 Création des catégories de dépenses...');
  const categoryIds: string[] = [];

  for (const categoryName of EXPENSE_CATEGORIES) {
    const existing = await prisma.expense_categories.findFirst({
      where: {
        company_id: companyId,
        name: categoryName,
        deleted_at: null,
      },
    });

    if (existing) {
      categoryIds.push(existing.id);
      continue;
    }

    const category = await prisma.expense_categories.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        name: categoryName,
        description: `Catégorie ${categoryName}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    categoryIds.push(category.id);
    console.log(`  ✅ ${categoryName}`);
  }

  console.log(`✅ ${categoryIds.length} catégories créées/vérifiées\n`);
  return categoryIds;
}

async function createInvoices(companyId: string, userId: string, customerIds: string[], productIds: string[]) {
  console.log('📄 Création des factures...');
  const invoiceService = (await import('../src/services/invoice.service')).default;
  let created = 0;
  let validated = 0;
  let sent = 0;
  let paid = 0;

  // S'assurer qu'il y a un exercice comptable pour toutes les dates
  const currentYear = new Date().getFullYear();
  const fiscalPeriod = await prisma.fiscal_periods.findFirst({
    where: {
      company_id: companyId,
      start_date: { lte: new Date(currentYear, 11, 31) },
      end_date: { gte: new Date(currentYear, 0, 1) },
    },
  });

  if (!fiscalPeriod) {
    await prisma.fiscal_periods.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        name: `Exercice ${currentYear}`,
        start_date: new Date(currentYear, 0, 1),
        end_date: new Date(currentYear, 11, 31),
        status: 'open',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // Créer 10 factures avec différents statuts
  for (let i = 0; i < 10; i++) {
    const customerId = customerIds[i % customerIds.length];
    const invoiceDate = new Date();
    invoiceDate.setDate(invoiceDate.getDate() - (i * 7)); // Espacées de 7 jours
    
    // S'assurer que la date est dans l'exercice comptable
    if (invoiceDate.getFullYear() !== currentYear) {
      invoiceDate.setFullYear(currentYear);
    }

    try {
      const invoice = await invoiceService.create(companyId, userId, {
        customerId,
        invoiceDate,
        dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        currency: 'CDF',
        lines: [
          {
            productId: productIds[i % productIds.length],
            quantity: Math.floor(Math.random() * 5) + 1,
            unitPrice: PRODUCTS[i % PRODUCTS.length].unitPrice,
            taxRate: PRODUCTS[i % PRODUCTS.length].taxRate,
            description: PRODUCTS[i % PRODUCTS.length].description,
          },
          ...(i % 2 === 0 ? [{
            productId: productIds[(i + 1) % productIds.length],
            quantity: Math.floor(Math.random() * 3) + 1,
            unitPrice: PRODUCTS[(i + 1) % PRODUCTS.length].unitPrice,
            taxRate: PRODUCTS[(i + 1) % PRODUCTS.length].taxRate,
            description: PRODUCTS[(i + 1) % PRODUCTS.length].description,
          }] : []),
        ],
      });

      created++;

      // Changer le statut selon l'index - IMPORTANT: Valider les factures pour permettre les avoirs
      if (i < 5) {
        // 5 factures validées et envoyées (pour permettre la création d'avoirs)
        try {
          // Attendre un peu pour s'assurer que la facture est bien créée
          await new Promise(resolve => setTimeout(resolve, 100));
          await invoiceService.updateStatus(companyId, invoice.id, 'sent', userId);
          validated++;
          sent++;
          console.log(`    ✅ Facture ${invoice.invoiceNumber} validée (sent)`);
        } catch (e: any) {
          console.log(`    ⚠️  Erreur validation facture ${invoice.invoiceNumber}: ${e.message?.substring(0, 100)}`);
        }
      } else if (i < 8) {
        // 3 factures envoyées
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          await invoiceService.updateStatus(companyId, invoice.id, 'sent', userId);
          sent++;
        } catch (e: any) {
          console.log(`    ⚠️  Erreur validation facture: ${e.message?.substring(0, 100)}`);
        }
      } else if (i < 10) {
        // 2 factures payées
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          await invoiceService.updateStatus(companyId, invoice.id, 'sent', userId);
          sent++;
          // Créer un paiement
          const paymentService = (await import('../src/services/payment.service')).default;
          try {
            await paymentService.create(companyId, userId, {
              invoiceId: invoice.id,
              amount: Number(invoice.totalAmount),
              currency: 'CDF',
              paymentDate: new Date(),
              paymentMethod: i % 2 === 0 ? 'cash' : 'mobile_money',
              mobileMoneyProvider: i % 2 === 0 ? null : 'orange_money',
              mobileMoneyNumber: i % 2 === 0 ? null : '+243900000000',
            });
            paid++;
          } catch (e: any) {
            console.log(`    ⚠️  Erreur paiement: ${e.message?.substring(0, 100)}`);
          }
        } catch (e: any) {
          console.log(`    ⚠️  Erreur validation facture: ${e.message?.substring(0, 100)}`);
        }
      }

      console.log(`  ✅ Facture ${invoice.invoiceNumber} (${invoice.status})`);
    } catch (error: any) {
      console.log(`  ⚠️  Erreur: ${error.message}`);
    }
  }

  console.log(`✅ ${created} factures créées (${validated} validées, ${sent} envoyées, ${paid} payées)\n`);
}

async function createQuotations(companyId: string, userId: string, customerIds: string[], productIds: string[]) {
  console.log('📋 Création des devis...');
  const quotationService = (await import('../src/services/quotation.service')).default;
  let created = 0;
  let converted = 0;

  // Créer 8 devis
  for (let i = 0; i < 8; i++) {
    const customerId = customerIds[i % customerIds.length];
    const quotationDate = new Date();
    quotationDate.setDate(quotationDate.getDate() - (i * 5));

    try {
      const quotation = await quotationService.create(companyId, userId, {
        customerId,
        quotationDate,
        expirationDate: new Date(quotationDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        currency: 'CDF',
        lines: [
          {
            productId: productIds[i % productIds.length],
            quantity: Math.floor(Math.random() * 3) + 1,
            unitPrice: PRODUCTS[i % PRODUCTS.length].unitPrice,
            taxRate: PRODUCTS[i % PRODUCTS.length].taxRate,
            description: PRODUCTS[i % PRODUCTS.length].description,
          },
        ],
      });

      created++;

      // Convertir quelques devis en factures
      if (i < 2) {
        try {
          await quotationService.convertToInvoice(companyId, quotation.id, userId);
          converted++;
        } catch (e: any) {
          // Ignorer si déjà converti ou erreur
          if (!e.message?.includes('already converted') && !e.message?.includes('permission')) {
            console.log(`    ⚠️  Erreur conversion: ${e.message}`);
          }
        }
      }

      console.log(`  ✅ Devis ${quotation.quotationNumber}`);
    } catch (error: any) {
      // Ignorer les erreurs de permissions PostgreSQL
      if (error.message?.includes('permission denied')) {
        console.log(`  ⚠️  Devis non créé (permissions PostgreSQL - nécessite intervention DBA)`);
      } else {
        console.log(`  ⚠️  Erreur: ${error.message}`);
      }
    }
  }

  console.log(`✅ ${created} devis créés (${converted} convertis en factures)\n`);
}

async function createExpenses(companyId: string, userId: string, supplierIds: string[], categoryIds: string[]) {
  console.log('💰 Création des dépenses...');
  const expenseService = (await import('../src/services/expense.service')).default;
  let created = 0;

  // Créer 12 dépenses
  for (let i = 0; i < 12; i++) {
    const supplierId = supplierIds[i % supplierIds.length];
    const categoryId = categoryIds[i % categoryIds.length];
    const expenseDate = new Date();
    expenseDate.setDate(expenseDate.getDate() - (i * 3));

    try {
      const expense = await expenseService.create(companyId, userId, {
        supplierId,
        categoryId,
        expenseDate: expenseDate.toISOString().split('T')[0],
        amountHt: Math.floor(Math.random() * 500000) + 50000,
        taxAmount: 0,
        amountTtc: 0,
        currency: 'CDF',
        paymentMethod: ['cash', 'mobile_money', 'bank_transfer'][i % 3] as any,
        status: i < 8 ? 'validated' : 'draft',
        description: `Dépense ${i + 1} - ${EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length]}`,
      });

      created++;
      console.log(`  ✅ Dépense ${expense.expenseNumber}`);
    } catch (error: any) {
      console.log(`  ⚠️  Erreur: ${error.message}`);
    }
  }

  console.log(`✅ ${created} dépenses créées\n`);
}

async function createRecurringInvoices(companyId: string, userId: string, customerIds: string[], productIds: string[]) {
  console.log('🔄 Création des factures récurrentes...');
  const recurringInvoiceService = (await import('../src/services/recurringInvoice.service')).default;
  let created = 0;

  // Créer 3 factures récurrentes
  for (let i = 0; i < 3; i++) {
    const customerId = customerIds[i % customerIds.length];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - i);

    try {
      const recurring = await recurringInvoiceService.create(companyId, userId, {
        customerId,
        name: `Facture récurrente ${i + 1}`,
        description: `Facture automatique mensuelle`,
        frequency: 'monthly',
        startDate,
        currency: 'CDF',
        lines: [
          {
            productId: productIds[i % productIds.length],
            quantity: 1,
            unitPrice: PRODUCTS[i % PRODUCTS.length].unitPrice,
            taxRate: PRODUCTS[i % PRODUCTS.length].taxRate,
            description: PRODUCTS[i % PRODUCTS.length].description,
          },
        ],
      });

      created++;
      console.log(`  ✅ Facture récurrente: ${recurring.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Erreur: ${error.message}`);
    }
  }

  console.log(`✅ ${created} factures récurrentes créées\n`);
}

async function createCreditNotes(companyId: string, userId: string) {
  console.log('📝 Création des avoirs...');
  const creditNoteService = (await import('../src/services/creditNote.service')).default;
  const invoiceService = (await import('../src/services/invoice.service')).default;
  let created = 0;

  // Récupérer toutes les factures (même en draft) et les valider si nécessaire
  let validInvoices = await prisma.invoices.findMany({
    where: {
      company_id: companyId,
      status: { in: ['sent', 'paid'] },
      deleted_at: null,
    },
    orderBy: { created_at: 'desc' },
    take: 5,
  });

  // Si pas assez de factures validées, valider quelques factures en draft
  if (validInvoices.length < 3) {
    console.log(`  📊 ${validInvoices.length} factures validées trouvées, validation de factures supplémentaires...`);
    const draftInvoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        status: 'draft',
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    for (let i = 0; i < Math.min(3, draftInvoices.length); i++) {
      try {
        await invoiceService.updateStatus(companyId, draftInvoices[i].id, 'sent', userId);
        console.log(`    ✅ Facture ${draftInvoices[i].invoice_number} validée`);
      } catch (e: any) {
        console.log(`    ⚠️  Erreur validation ${draftInvoices[i].invoice_number}: ${e.message?.substring(0, 80)}`);
      }
    }

    // Réessayer de récupérer les factures validées
    await new Promise(resolve => setTimeout(resolve, 1000));
    validInvoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        status: { in: ['sent', 'paid'] },
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });
  }

  console.log(`  📊 ${validInvoices.length} factures validées disponibles`);

  if (validInvoices.length === 0) {
    console.log(`  ⚠️  Aucune facture validée trouvée pour créer des avoirs\n`);
    return;
  }

  // Créer 3 avoirs pour les factures validées
  for (let i = 0; i < Math.min(3, validInvoices.length); i++) {
    try {
      const invoice = validInvoices[i];
      
      // Calculer le montant de l'avoir (10% du montant total, mais pas plus que le montant restant)
      const invoiceTotal = Number(invoice.total_amount);
      const invoicePaid = Number(invoice.paid_amount || 0);
      const remainingAmount = invoiceTotal - invoicePaid;
      const creditNoteAmount = Math.min(invoiceTotal * 0.1, remainingAmount * 0.8); // 10% du total ou 80% du restant
      
      if (creditNoteAmount <= 0) {
        console.log(`  ⚠️  Facture ${invoice.invoice_number}: montant restant insuffisant`);
        continue;
      }

      const taxAmount = invoice.tax_amount ? Number(invoice.tax_amount) * (creditNoteAmount / invoiceTotal) : 0;

      const creditNote = await creditNoteService.create(companyId, userId, {
        invoiceId: invoice.id,
        creditNoteDate: new Date(),
        amount: creditNoteAmount,
        taxAmount: taxAmount,
        reason: `Ajustement facture ${invoice.invoice_number} - Erreur de facturation`,
        currency: invoice.currency || 'CDF',
      });

      created++;
      console.log(`  ✅ Avoir ${creditNote.creditNoteNumber} pour facture ${invoice.invoice_number} (${creditNoteAmount.toFixed(0)} CDF)`);
    } catch (error: any) {
      console.log(`  ⚠️  Erreur pour facture ${validInvoices[i]?.invoice_number || 'inconnue'}: ${error.message?.substring(0, 100)}`);
    }
  }

  console.log(`✅ ${created} avoirs créés\n`);
}

async function createStockMovements(companyId: string, userId: string, productIds: string[]) {
  console.log('📦 Création des mouvements de stock...');
  const stockMovementService = (await import('../src/services/stock-movement.service')).default;
  let created = 0;

  // Créer des mouvements pour les produits qui trackent le stock
  const productsWithStock = await prisma.products.findMany({
    where: {
      company_id: companyId,
      id: { in: productIds },
      track_stock: true,
      deleted_at: null,
    },
  });

  for (const product of productsWithStock) {
    try {
      // Mouvement d'entrée initial
      const movementId = await stockMovementService.create(companyId, userId, {
        movementType: 'IN',
        items: [{
          productId: product.id,
          quantity: Math.floor(Math.random() * 50) + 20,
        }],
        reason: 'Stock initial',
      });

      // Valider le mouvement
      await stockMovementService.validate(companyId, movementId, userId);
      created++;
      console.log(`  ✅ Mouvement IN pour ${product.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Erreur: ${error.message}`);
    }
  }

  console.log(`✅ ${created} mouvements de stock créés\n`);
}

async function createChartOfAccounts(companyId: string) {
  console.log('📚 Création du plan comptable...');
  const accountService = (await import('../src/services/account.service')).default;
  const accountMap = new Map<string, string>();

  // Plan comptable simplifié mais complet
  const accounts = [
    // Classe 1 - Financement Permanent
    { code: '101', name: 'Capital', type: 'equity' as const, category: '1' },
    { code: '101000', name: 'Capital social', type: 'equity' as const, category: '1', parentCode: '101' },
    { code: '120', name: 'Résultat', type: 'equity' as const, category: '1' },
    { code: '120000', name: 'Résultat de l\'exercice', type: 'equity' as const, category: '1', parentCode: '120' },
    
    // Classe 2 - Actif Immobilisé
    { code: '213', name: 'Immobilisations corporelles', type: 'asset' as const, category: '2' },
    { code: '213500', name: 'Matériel informatique', type: 'asset' as const, category: '2', parentCode: '213' },
    
    // Classe 4 - Tiers
    { code: '411', name: 'Clients', type: 'asset' as const, category: '4' },
    { code: '411000', name: 'Clients - RDC', type: 'asset' as const, category: '4', parentCode: '411' },
    { code: '401', name: 'Fournisseurs', type: 'liability' as const, category: '4' },
    { code: '401000', name: 'Fournisseurs - RDC', type: 'liability' as const, category: '4', parentCode: '401' },
    // Compte 411 doit être utilisable directement (pas seulement comme parent)
    { code: '411001', name: 'Clients divers', type: 'asset' as const, category: '4', parentCode: '411' },
    
    // Classe 5 - Trésorerie
    { code: '51', name: 'Banques', type: 'asset' as const, category: '5' },
    { code: '512000', name: 'Banque principale', type: 'asset' as const, category: '5', parentCode: '51' },
    { code: '53', name: 'Caisse', type: 'asset' as const, category: '5' },
    { code: '530000', name: 'Caisse principale', type: 'asset' as const, category: '5', parentCode: '53' },
    
    // Classe 6 - Charges
    { code: '60', name: 'Achats', type: 'expense' as const, category: '6' },
    { code: '601000', name: 'Achats de marchandises', type: 'expense' as const, category: '6', parentCode: '60' },
    { code: '62', name: 'Services extérieurs', type: 'expense' as const, category: '6' },
    { code: '622000', name: 'Services bancaires', type: 'expense' as const, category: '6', parentCode: '62' },
    { code: '63', name: 'Impôts et taxes', type: 'expense' as const, category: '6' },
    { code: '631000', name: 'Impôts sur les bénéfices', type: 'expense' as const, category: '6', parentCode: '63' },
    
    // Classe 7 - Produits
    { code: '70', name: 'Ventes', type: 'revenue' as const, category: '7' },
    { code: '701', name: 'Ventes de produits finis', type: 'revenue' as const, category: '7', parentCode: '70' },
    { code: '701000', name: 'Ventes de produits finis - Détail', type: 'revenue' as const, category: '7', parentCode: '701' },
    { code: '706000', name: 'Prestations de services', type: 'revenue' as const, category: '7', parentCode: '70' },
    
    // TVA
    { code: '445710', name: 'TVA à décaisser', type: 'liability' as const, category: '4' },
    { code: '445660', name: 'TVA déductible', type: 'asset' as const, category: '4' },
  ];

  // Créer les comptes parents d'abord
  for (const acc of accounts.filter(a => !a.parentCode)) {
    try {
      const account = await accountService.create(companyId, {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
      });
      accountMap.set(acc.code, account.id);
      console.log(`  ✅ ${acc.code} - ${acc.name}`);
    } catch (error: any) {
      if (error.code === 'ACCOUNT_CODE_EXISTS') {
        // Récupérer le compte existant
        const existing = await accountService.getByCode(companyId, acc.code);
        accountMap.set(acc.code, existing.id);
        console.log(`  ⏭️  ${acc.code} - ${acc.name} (existant)`);
      } else {
        console.log(`  ⚠️  Erreur ${acc.code}: ${error.message}`);
      }
    }
  }

  // Créer les comptes enfants
  for (const acc of accounts.filter(a => a.parentCode)) {
    const parentId = accountMap.get(acc.parentCode!);
    if (!parentId) continue;

    try {
      const account = await accountService.create(companyId, {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        parentId,
      });
      accountMap.set(acc.code, account.id);
      console.log(`  ✅ ${acc.code} - ${acc.name}`);
    } catch (error: any) {
      if (error.code === 'ACCOUNT_CODE_EXISTS') {
        const existing = await accountService.getByCode(companyId, acc.code);
        accountMap.set(acc.code, existing.id);
        console.log(`  ⏭️  ${acc.code} - ${acc.name} (existant)`);
      } else {
        console.log(`  ⚠️  Erreur ${acc.code}: ${error.message}`);
      }
    }
  }

  console.log(`✅ Plan comptable créé (${accountMap.size} comptes)\n`);
  return accountMap;
}

async function createJournalEntries(companyId: string, userId: string) {
  console.log('📚 Création des écritures comptables manuelles...');
  const journalEntryService = (await import('../src/services/journalEntry.service')).default;
  const accountService = (await import('../src/services/account.service')).default;
  let created = 0;

  // Récupérer quelques comptes directement depuis Prisma
  const accounts = await prisma.accounts.findMany({
    where: {
      company_id: companyId,
      is_active: true,
    },
    take: 10,
  });

  if (accounts.length < 2) {
    console.log(`  ⚠️  Pas assez de comptes pour créer des écritures (${accounts.length} trouvés)\n`);
    return;
  }

  console.log(`  📊 ${accounts.length} comptes disponibles pour les écritures`);

  // Créer 5 écritures manuelles
  for (let i = 0; i < 5; i++) {
    try {
      // Montant équilibré pour débit = crédit
      const amount = Math.floor(Math.random() * 100000) + 10000;
      
      const entry = await journalEntryService.create(companyId, {
        entryDate: new Date(),
        description: `Écriture manuelle ${i + 1}`,
        sourceType: 'manual',
        createdBy: userId,
        lines: [
          {
            accountId: accounts[i % accounts.length].id,
            debit: amount,
            credit: 0,
            description: `Débit ${i + 1}`,
          },
          {
            accountId: accounts[(i + 1) % accounts.length].id,
            debit: 0,
            credit: amount, // Même montant pour équilibrer
            description: `Crédit ${i + 1}`,
          },
        ],
      });

      // Poster certaines écritures
      if (i < 3) {
        await journalEntryService.post(companyId, entry.id);
      }

      created++;
      console.log(`  ✅ Écriture ${(entry as any).entry_number}`);
    } catch (error: any) {
      console.log(`  ⚠️  Erreur: ${error.message}`);
    }
  }

  console.log(`✅ ${created} écritures comptables créées\n`);
}

async function createEmployees(companyId: string, userId: string) {
  console.log('👔 Création des employés...');
  const employeeService = (await import('../src/services/employee.service')).default;
  let created = 0;

  const employees = [
    { employeeNumber: 'EMP001', firstName: 'Pierre', lastName: 'Kabila', position: 'Directeur Général', department: 'Direction', baseSalary: 5000000, email: 'pierre.kabila@example.com', phone: '+243 900 200 100' },
    { employeeNumber: 'EMP002', firstName: 'Sophie', lastName: 'Mukamba', position: 'Comptable', department: 'Comptabilité', baseSalary: 2000000, email: 'sophie.mukamba@example.com', phone: '+243 900 200 101' },
    { employeeNumber: 'EMP003', firstName: 'Marc', lastName: 'Tshisekedi', position: 'Développeur', department: 'IT', baseSalary: 2500000, email: 'marc.tshisekedi@example.com', phone: '+243 900 200 102' },
    { employeeNumber: 'EMP004', firstName: 'Julie', lastName: 'Lubamba', position: 'Commerciale', department: 'Ventes', baseSalary: 1800000, email: 'julie.lubamba@example.com', phone: '+243 900 200 103' },
    { employeeNumber: 'EMP005', firstName: 'David', lastName: 'Kasa', position: 'Assistant', department: 'Administration', baseSalary: 1200000, email: 'david.kasa@example.com', phone: '+243 900 200 104' },
  ];

  for (const empData of employees) {
    try {
      const hireDate = new Date();
      hireDate.setMonth(hireDate.getMonth() - Math.floor(Math.random() * 12) - 1);

      // Vérifier si l'employé existe déjà
      const existing = await prisma.employees.findFirst({
        where: {
          company_id: companyId,
          employee_number: empData.employeeNumber,
          deleted_at: null,
        },
      });

      if (existing) {
        console.log(`  ⏭️  ${empData.employeeNumber} - ${empData.firstName} ${empData.lastName} (existant)`);
        created++; // Compter comme créé
        continue;
      }

      const employee = await employeeService.create(companyId, {
        employeeNumber: empData.employeeNumber,
        firstName: empData.firstName,
        lastName: empData.lastName,
        email: empData.email,
        phone: empData.phone,
        position: empData.position,
        department: empData.department,
        hireDate: hireDate.toISOString().split('T')[0],
        baseSalary: empData.baseSalary,
        currency: 'CDF',
        salaryFrequency: 'monthly',
        employmentType: 'full_time',
        status: 'active',
        city: 'Kinshasa',
        country: 'RDC',
      }, userId);

      created++;
      console.log(`  ✅ ${empData.firstName} ${empData.lastName} - ${empData.position}`);
    } catch (error: any) {
      if (error.code === 'EMPLOYEE_NUMBER_EXISTS') {
        console.log(`  ⏭️  ${empData.employeeNumber} (existant)`);
        created++; // Compter comme créé
      } else {
        console.log(`  ⚠️  Erreur ${empData.employeeNumber}: ${error.message?.substring(0, 100)}`);
      }
    }
  }

  console.log(`✅ ${created} employés créés/vérifiés\n`);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

async function createCompleteTestData() {
  console.log('🚀 Création complète des données de test pour okerybanza@gmail.com...\n');

  try {
    // 1. Récupérer l'utilisateur et l'entreprise
    const user = await getOrCreateUser();
    const company = await prisma.companies.findUnique({
      where: { id: user.company_id! },
    });

    if (!company) {
      throw new Error('Entreprise non trouvée');
    }

    console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

    // 2. Créer le plan comptable (nécessaire pour les écritures)
    const accountMap = await createChartOfAccounts(company.id);

    // 3. Vérifier/créer l'exercice comptable
    await getOrCreateFiscalPeriod(company.id);
    console.log('✅ Exercice comptable vérifié\n');

    // 4. Activer les modules nécessaires
    await prisma.companies.update({
      where: { id: company.id },
      data: {
        module_stock_enabled: true,
        module_facturation_enabled: true,
        datarissage_completed: true,
      },
    });
    console.log('✅ Modules activés\n');

    // 5. Créer toutes les données
    const productIds = await createProducts(company.id);
    const customerIds = await createCustomers(company.id);
    const supplierIds = await createSuppliers(company.id);
    const categoryIds = await createExpenseCategories(company.id);

    await createInvoices(company.id, user.id, customerIds, productIds);
    
    // Attendre un peu pour s'assurer que toutes les factures sont bien validées
    console.log('⏳ Attente de la finalisation des factures...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createQuotations(company.id, user.id, customerIds, productIds);
    await createExpenses(company.id, user.id, supplierIds, categoryIds);
    await createRecurringInvoices(company.id, user.id, customerIds, productIds);

    // Créer les avoirs après les factures (récupère directement les factures validées)
    await createCreditNotes(company.id, user.id);

    await createStockMovements(company.id, user.id, productIds);
    await createJournalEntries(company.id, user.id);

    // 6. Créer des données supplémentaires (RH, etc.)
    await createEmployees(company.id, user.id);

    // 4. Résumé final
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 Résumé:');
    console.log(`   - Produits: ${productIds.length}`);
    console.log(`   - Clients: ${customerIds.length}`);
    console.log(`   - Fournisseurs: ${supplierIds.length}`);
    console.log(`   - Catégories de dépenses: ${categoryIds.length}`);
    const invoiceCount = await prisma.invoices.count({ where: { company_id: company.id, deleted_at: null } });
    const expenseCount = await prisma.expenses.count({ where: { company_id: company.id, deleted_at: null } });
    const employeeCount = await prisma.employees.count({ where: { company_id: company.id, deleted_at: null } });
    const creditNoteCount = await prisma.credit_notes.count({ where: { company_id: company.id, deleted_at: null } });
    const journalEntryCount = await prisma.journal_entries.count({ where: { company_id: company.id } });
    
    console.log(`   - Factures: ${invoiceCount}`);
    console.log(`   - Devis: créés (certains peuvent avoir échoué à cause de permissions)`);
    console.log(`   - Dépenses: ${expenseCount}`);
    console.log(`   - Factures récurrentes: 3`);
    console.log(`   - Avoirs: ${creditNoteCount}`);
    console.log(`   - Mouvements de stock: créés pour produits avec suivi`);
    console.log(`   - Écritures comptables: ${journalEntryCount}`);
    console.log(`   - Employés: ${employeeCount}\n`);
    console.log('🎉 Tous les modules sont maintenant remplis avec des données cohérentes !\n');

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createCompleteTestData();
