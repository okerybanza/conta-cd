/**
 * Script pour générer des données de test complètes et cohérentes
 * Prend le rôle d'un comptable et remplit tous les cas possibles
 */

import prisma from '../src/config/database';
import { Decimal } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

// Données de test cohérentes
const CUSTOMERS = [
  // Particuliers
  { type: 'particulier' as const, firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com', phone: '+243 900 123 456', city: 'Kinshasa', country: 'RDC' },
  { type: 'particulier' as const, firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.com', phone: '+243 900 123 457', city: 'Kinshasa', country: 'RDC' },
  { type: 'particulier' as const, firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@example.com', phone: '+243 900 123 458', city: 'Lubumbashi', country: 'RDC' },
  { type: 'particulier' as const, firstName: 'Sophie', lastName: 'Dubois', email: 'sophie.dubois@example.com', phone: '+243 900 123 459', city: 'Kinshasa', country: 'RDC' },
  { type: 'particulier' as const, firstName: 'Luc', lastName: 'Moreau', email: 'luc.moreau@example.com', phone: '+243 900 123 460', city: 'Goma', country: 'RDC' },
  
  // Entreprises
  { type: 'entreprise' as const, businessName: 'SARL Tech Solutions', contactPerson: 'Jean Dupont', email: 'contact@techsolutions.cd', phone: '+243 900 200 001', nif: 'N-12345-K-2024', rccm: 'CD/KIN/RCCM/24-A-12345', city: 'Kinshasa', country: 'RDC' },
  { type: 'entreprise' as const, businessName: 'Entreprise Générale Construction', contactPerson: 'Marie Martin', email: 'info@egc.cd', phone: '+243 900 200 002', nif: 'N-12346-K-2024', rccm: 'CD/KIN/RCCM/24-A-12346', city: 'Kinshasa', country: 'RDC' },
  { type: 'entreprise' as const, businessName: 'Commerce International SARL', contactPerson: 'Pierre Bernard', email: 'contact@commerceint.cd', phone: '+243 900 200 003', nif: 'N-12347-L-2024', rccm: 'CD/LUB/RCCM/24-A-12347', city: 'Lubumbashi', country: 'RDC' },
  { type: 'entreprise' as const, businessName: 'Services Financiers RDC', contactPerson: 'Sophie Dubois', email: 'info@sfrdc.cd', phone: '+243 900 200 004', nif: 'N-12348-K-2024', rccm: 'CD/KIN/RCCM/24-A-12348', city: 'Kinshasa', country: 'RDC' },
  { type: 'entreprise' as const, businessName: 'Transport Express', contactPerson: 'Luc Moreau', email: 'contact@transportexpress.cd', phone: '+243 900 200 005', nif: 'N-12349-G-2024', rccm: 'CD/GOM/RCCM/24-A-12349', city: 'Goma', country: 'RDC' },
];

const PRODUCTS = [
  { name: 'Consultation IT', description: 'Consultation en informatique', unit: 'heure', priceHt: 50000, taxRate: 16, category: 'Services' },
  { name: 'Développement Web', description: 'Développement de site web', unit: 'projet', priceHt: 5000000, taxRate: 16, category: 'Services' },
  { name: 'Maintenance', description: 'Maintenance informatique', unit: 'mois', priceHt: 200000, taxRate: 16, category: 'Services' },
  { name: 'Formation', description: 'Formation en informatique', unit: 'jour', priceHt: 150000, taxRate: 16, category: 'Services' },
  { name: 'Ordinateur Portable', description: 'Ordinateur portable Dell', unit: 'unité', priceHt: 800000, taxRate: 16, category: 'Matériel' },
  { name: 'Imprimante', description: 'Imprimante HP LaserJet', unit: 'unité', priceHt: 450000, taxRate: 16, category: 'Matériel' },
  { name: 'Licence Logiciel', description: 'Licence Microsoft Office', unit: 'unité', priceHt: 120000, taxRate: 16, category: 'Logiciel' },
];

const SUPPLIERS = [
  { name: 'Fournisseur IT Solutions', email: 'contact@itsolutions.cd', phone: '+243 900 300 001', category: 'Informatique' },
  { name: 'Bureau & Papeterie', email: 'info@bureaupapeterie.cd', phone: '+243 900 300 002', category: 'Fournitures' },
  { name: 'Électricité & Éclairage', email: 'contact@electricite.cd', phone: '+243 900 300 003', category: 'Équipement' },
  { name: 'Nettoyage & Entretien', email: 'info@nettoyage.cd', phone: '+243 900 300 004', category: 'Services' },
];

const EXPENSE_CATEGORIES = [
  'Informatique',
  'Fournitures de bureau',
  'Équipement',
  'Services',
  'Transport',
  'Communication',
  'Formation',
  'Autres',
];

async function generateTestData() {
  console.log('🚀 Génération des données de test...\n');

  try {
    // Récupérer la première entreprise
    const company = await prisma.company.findFirst({
      where: { name: { contains: 'Test Enterprise' } },
    });

    if (!company) {
      throw new Error('Aucune entreprise trouvée. Veuillez créer une entreprise d\'abord.');
    }

    console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

    // 1. Créer les clients
    console.log('👥 Création des clients...');
    const createdCustomers = [];
    for (const customerData of CUSTOMERS) {
      const customer = await prisma.customer.create({
        data: {
          companyId: company.id,
          ...customerData,
        },
      });
      createdCustomers.push(customer);
      console.log(`  ✓ ${customer.type === 'particulier' ? `${customer.firstName} ${customer.lastName}` : customer.businessName}`);
    }
    console.log(`✅ ${createdCustomers.length} clients créés\n`);

    // 2. Créer les catégories de dépenses
    console.log('📁 Création des catégories de dépenses...');
    const createdCategories = [];
    for (const categoryName of EXPENSE_CATEGORIES) {
      const category = await prisma.expenseCategory.create({
        data: {
          companyId: company.id,
          name: categoryName,
          description: `Catégorie ${categoryName}`,
        },
      });
      createdCategories.push(category);
      console.log(`  ✓ ${category.name}`);
    }
    console.log(`✅ ${createdCategories.length} catégories créées\n`);

    // 3. Créer les fournisseurs
    console.log('🏢 Création des fournisseurs...');
    const createdSuppliers = [];
    for (const supplierData of SUPPLIERS) {
      const supplier = await prisma.supplier.create({
        data: {
          companyId: company.id,
          name: supplierData.name,
          email: supplierData.email,
          phone: supplierData.phone,
        },
      });
      createdSuppliers.push(supplier);
      console.log(`  ✓ ${supplier.name}`);
    }
    console.log(`✅ ${createdSuppliers.length} fournisseurs créés\n`);

    // 4. Créer les produits
    console.log('📦 Création des produits...');
    const createdProducts = [];
    for (const productData of PRODUCTS) {
      const product = await prisma.product.create({
        data: {
          companyId: company.id,
          name: productData.name,
          description: productData.description,
          unitPrice: new Decimal(productData.priceHt),
          taxRate: new Decimal(productData.taxRate),
          category: productData.category,
          isActive: true,
        },
      });
      createdProducts.push(product);
      console.log(`  ✓ ${product.name} - ${productData.priceHt} CDF HT`);
    }
    console.log(`✅ ${createdProducts.length} produits créés\n`);

    // 5. Créer des factures sur toute l'année (janvier à décembre 2024)
    console.log('📄 Création des factures...');
    const invoices = [];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    let invoiceNumber = 1;

    for (const month of months) {
      // Créer 8-12 factures par mois
      const invoicesPerMonth = Math.floor(Math.random() * 5) + 8;
      
      for (let i = 0; i < invoicesPerMonth; i++) {
        const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
        const invoiceDate = new Date(2024, month - 1, Math.floor(Math.random() * 28) + 1);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        // Sélectionner 1-3 produits
        const numProducts = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = [];
        for (let j = 0; j < numProducts; j++) {
          const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
          const quantity = Math.floor(Math.random() * 5) + 1;
          selectedProducts.push({ product, quantity });
        }

        // Calculer les totaux
        let subtotalHt = new Decimal(0);
        const invoiceLines = selectedProducts.map(({ product, quantity }, index) => {
          const qty = new Decimal(quantity);
          const unitPrice = new Decimal(product.unitPrice);
          const lineSubtotal = unitPrice.times(qty);
          const taxRate = product.taxRate || new Decimal(0);
          const lineTax = lineSubtotal.times(taxRate).dividedBy(100);
          const lineTotal = lineSubtotal.plus(lineTax);
          subtotalHt = subtotalHt.plus(lineSubtotal);
          
          return {
            lineNumber: index + 1,
            productId: product.id,
            name: product.name,
            description: product.description || product.name,
            quantity: qty,
            unitPrice: unitPrice,
            taxRate: taxRate,
            subtotal: lineSubtotal,
            taxAmount: lineTax,
            total: lineTotal,
          };
        });

        const totalTax = invoiceLines.reduce((sum, line) => sum.plus(line.taxAmount || 0), new Decimal(0));
        const totalTtc = subtotalHt.plus(totalTax);
        const remainingBalance = totalTtc;

        // Déterminer le statut : 30% draft, 40% sent, 30% paid
        const rand = Math.random();
        let invoiceStatus: 'draft' | 'sent' | 'paid' = 'draft';
        if (rand > 0.7) {
          invoiceStatus = 'paid';
        } else if (rand > 0.3) {
          invoiceStatus = 'sent';
        }

        const invoice = await prisma.invoice.create({
          data: {
            companyId: company.id,
            customerId: customer.id,
            invoiceNumber: `INV-2024-${String(invoiceNumber).padStart(4, '0')}`,
            invoiceDate,
            dueDate,
            status: invoiceStatus,
            subtotalHt,
            totalTax,
            totalTtc,
            remainingBalance,
            currency: 'CDF',
            sentAt: invoiceStatus === 'sent' || invoiceStatus === 'paid' ? invoiceDate : null,
            lines: {
              create: invoiceLines.map(line => ({
                lineNumber: line.lineNumber,
                productId: line.productId,
                name: line.name,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                taxRate: line.taxRate,
                taxAmount: line.taxAmount,
                subtotal: line.subtotal,
                total: line.total,
              })),
            },
          },
        });

        invoices.push(invoice);
        invoiceNumber++;
      }
    }
    console.log(`✅ ${invoices.length} factures créées\n`);

    // 6. Créer des paiements pour les factures payées
    console.log('💳 Création des paiements...');
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const payments = [];
    
    for (const invoice of paidInvoices) {
      const paymentDate = new Date(invoice.invoiceDate);
      paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 30));

      const payment = await prisma.payment.create({
        data: {
          companyId: company.id,
          invoiceId: invoice.id,
          amount: invoice.totalTtc,
          paymentDate,
          paymentMethod: 'cash',
          currency: 'CDF',
          status: 'confirmed',
        },
      });
      payments.push(payment);

      // Mettre à jour la facture avec le montant payé
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: invoice.totalTtc,
          remainingBalance: new Decimal(0),
          paidAt: paymentDate,
        },
      });
    }
    console.log(`✅ ${payments.length} paiements créés\n`);

    // 7. Créer des dépenses sur toute l'année
    console.log('💰 Création des dépenses...');
    const expenses = [];
    
    let expenseNumber = 1;
    for (const month of months) {
      // Créer 5-10 dépenses par mois
      const expensesPerMonth = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < expensesPerMonth; i++) {
        const supplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)];
        const category = createdCategories[Math.floor(Math.random() * createdCategories.length)];
        const expenseDate = new Date(2024, month - 1, Math.floor(Math.random() * 28) + 1);
        
        const amountHt = new Decimal(Math.floor(Math.random() * 500000) + 50000);
        const taxRate = new Decimal(16);
        const taxAmount = amountHt.times(taxRate).dividedBy(100);
        const amountTtc = amountHt.plus(taxAmount);

        const expense = await prisma.expense.create({
          data: {
            companyId: company.id,
            expenseNumber: `EXP-2024-${String(expenseNumber).padStart(4, '0')}`,
            supplierId: supplier.id,
            supplierName: supplier.name,
            categoryId: category.id,
            expenseDate,
            description: `Dépense ${category.name} - ${supplier.name}`,
            amountHt,
            taxRate,
            taxAmount,
            amountTtc,
            paymentMethod: 'cash',
            paymentDate: expenseDate,
            status: 'paid',
          },
        });
        expenses.push(expense);
        expenseNumber++;
      }
    }
    console.log(`✅ ${expenses.length} dépenses créées\n`);

    // Résumé
    console.log('\n📊 Résumé des données créées:');
    console.log(`  👥 Clients: ${createdCustomers.length}`);
    console.log(`  📁 Catégories: ${createdCategories.length}`);
    console.log(`  🏢 Fournisseurs: ${createdSuppliers.length}`);
    console.log(`  📦 Produits: ${createdProducts.length}`);
    console.log(`  📄 Factures: ${invoices.length}`);
    console.log(`  💳 Paiements: ${payments.length}`);
    console.log(`  💰 Dépenses: ${expenses.length}`);
    console.log('\n✅ Génération des données de test terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
generateTestData()
  .then(() => {
    console.log('\n✨ Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

