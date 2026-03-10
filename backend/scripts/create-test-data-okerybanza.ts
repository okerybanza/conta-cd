/**
 * Script pour créer des données de test complètes pour okerybanza@gmail.com
 * Crée : clients, produits, factures, devis, paiements, dépenses, etc.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();

// Données de test
const TEST_PRODUCTS = [
  { name: 'Consultation IT', description: 'Consultation en informatique', type: 'service' as const, unitPrice: 50000, taxRate: 16, category: 'Services' },
  { name: 'Développement Web', description: 'Développement de site web', type: 'service' as const, unitPrice: 150000, taxRate: 16, category: 'Services' },
  { name: 'Ordinateur Portable', description: 'Laptop Dell Inspiron', type: 'product' as const, unitPrice: 800000, taxRate: 16, category: 'Équipement', trackStock: true, lowStockThreshold: 5 },
  { name: 'Clavier USB', description: 'Clavier mécanique', type: 'product' as const, unitPrice: 25000, taxRate: 16, category: 'Équipement', trackStock: true, lowStockThreshold: 10 },
  { name: 'Souris Sans Fil', description: 'Souris Logitech', type: 'product' as const, unitPrice: 15000, taxRate: 16, category: 'Équipement', trackStock: true, lowStockThreshold: 15 },
  { name: 'Formation Excel', description: 'Formation Microsoft Excel', type: 'service' as const, unitPrice: 100000, taxRate: 16, category: 'Formation' },
];

const TEST_CUSTOMERS = [
  { type: 'entreprise' as const, businessName: 'Tech Solutions SARL', email: 'contact@techsolutions.cd', phone: '+243 900 100 001', nif: 'NIF001', rccm: 'RCCM001', address: 'Avenue Kasa-Vubu, Kinshasa', city: 'Kinshasa' },
  { type: 'particulier' as const, firstName: 'Jean', lastName: 'Kabila', email: 'jean.kabila@example.com', phone: '+243 900 100 002', address: 'Gombe, Kinshasa', city: 'Kinshasa' },
  { type: 'entreprise' as const, businessName: 'Digital Agency RDC', email: 'info@digitalagency.cd', phone: '+243 900 100 003', nif: 'NIF002', rccm: 'RCCM002', address: 'Lubumbashi', city: 'Lubumbashi' },
  { type: 'particulier' as const, firstName: 'Marie', lastName: 'Tshisekedi', email: 'marie.tshisekedi@example.com', phone: '+243 900 100 004', address: 'Kinshasa', city: 'Kinshasa' },
];

const TEST_SUPPLIERS = [
  { name: 'Fournisseur IT Solutions', email: 'contact@itsolutions.cd', phone: '+243 900 200 001' },
  { name: 'Bureau & Papeterie', email: 'info@bureaupapeterie.cd', phone: '+243 900 200 002' },
  { name: 'Équipement Informatique', email: 'contact@equipement.cd', phone: '+243 900 200 003' },
];

async function createTestDataForOkerybanza() {
  console.log('🚀 Création des données de test pour okerybanza@gmail.com...\n');

  try {
    // 1. Trouver l'utilisateur et l'entreprise
    const user = await prisma.users.findFirst({
      where: { email: 'okerybanza@gmail.com' },
      include: { companies: true },
    });

    if (!user) {
      console.error('❌ Utilisateur okerybanza@gmail.com non trouvé');
      return;
    }

    if (!user.company_id) {
      console.error('❌ L\'utilisateur n\'a pas d\'entreprise associée');
      return;
    }

    const company = await prisma.companies.findUnique({
      where: { id: user.company_id },
    });

    if (!company) {
      console.error('❌ Entreprise non trouvée');
      return;
    }

    console.log(`📦 Entreprise: ${company.name} (${company.id})\n`);

    // 2. Vérifier/créer un exercice comptable ouvert
    let fiscalPeriod = await prisma.fiscal_periods.findFirst({
      where: {
        company_id: company.id,
        status: 'open',
      },
    });

    if (!fiscalPeriod) {
      const currentYear = new Date().getFullYear();
      fiscalPeriod = await prisma.fiscal_periods.create({
        data: {
          id: randomUUID(),
          company_id: company.id,
          name: `Exercice ${currentYear}`,
          start_date: new Date(currentYear, 0, 1),
          end_date: new Date(currentYear, 11, 31),
          status: 'open',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      console.log(`✅ Exercice comptable créé: ${fiscalPeriod.name}\n`);
    } else {
      console.log(`ℹ️  Exercice comptable existant: ${fiscalPeriod.name}\n`);
    }

    // 3. Créer les produits
    console.log('📦 Création des produits...');
    const productIds: string[] = [];
    for (const productData of TEST_PRODUCTS) {
      const existingProduct = await prisma.products.findFirst({
        where: {
          company_id: company.id,
          name: productData.name,
          deleted_at: null,
        },
      });

      if (existingProduct) {
        console.log(`  ⏭️  Produit existant: ${productData.name}`);
        productIds.push(existingProduct.id);
        continue;
      }

      const product = await prisma.products.create({
        data: {
          id: randomUUID(),
          company_id: company.id,
          name: productData.name,
          description: productData.description,
          type: productData.type,
          price: new Decimal(productData.unitPrice),
          tax_rate: new Decimal(productData.taxRate),
          currency: 'CDF',
          category: productData.category,
          is_active: true,
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

    // 4. Créer les clients
    console.log('👥 Création des clients...');
    const customerIds: string[] = [];
    for (const customerData of TEST_CUSTOMERS) {
      const existingCustomer = await prisma.customers.findFirst({
        where: {
          company_id: company.id,
          email: customerData.email,
          deleted_at: null,
        },
      });

      if (existingCustomer) {
        console.log(`  ⏭️  Client existant: ${customerData.type === 'particulier' ? `${customerData.firstName} ${customerData.lastName}` : customerData.businessName}`);
        customerIds.push(existingCustomer.id);
        continue;
      }

      const customer = await prisma.customers.create({
        data: {
          id: randomUUID(),
          company_id: company.id,
          type: customerData.type,
          first_name: customerData.firstName || null,
          last_name: customerData.lastName || null,
          business_name: customerData.businessName || null,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          country: 'RDC',
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

    // 5. Créer les fournisseurs
    console.log('🏢 Création des fournisseurs...');
    const supplierIds: string[] = [];
    for (const supplierData of TEST_SUPPLIERS) {
      const existingSupplier = await prisma.suppliers.findFirst({
        where: {
          company_id: company.id,
          email: supplierData.email,
          deleted_at: null,
        },
      });

      if (existingSupplier) {
        console.log(`  ⏭️  Fournisseur existant: ${supplierData.name}`);
        supplierIds.push(existingSupplier.id);
        continue;
      }

      const supplier = await prisma.suppliers.create({
        data: {
          id: randomUUID(),
          company_id: company.id,
          name: supplierData.name,
          email: supplierData.email,
          phone: supplierData.phone,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      supplierIds.push(supplier.id);
      console.log(`  ✅ ${supplierData.name}`);
    }
    console.log(`✅ ${supplierIds.length} fournisseurs créés/vérifiés\n`);

    // 6. Créer quelques factures
    console.log('📄 Création des factures...');
    const invoiceService = (await import('../src/services/invoice.service')).default;
    let invoiceCount = 0;

    for (let i = 0; i < Math.min(3, customerIds.length); i++) {
      const customerId = customerIds[i];
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - (i * 10)); // Factures espacées de 10 jours

      try {
        const invoice = await invoiceService.create(company.id, user.id, {
          customerId,
          invoiceDate,
          dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          currency: 'CDF',
          lines: [
            {
              productId: productIds[0],
              quantity: 1,
              unitPrice: TEST_PRODUCTS[0].unitPrice,
              taxRate: TEST_PRODUCTS[0].taxRate,
              description: TEST_PRODUCTS[0].description,
            },
            {
              productId: productIds[1],
              quantity: 2,
              unitPrice: TEST_PRODUCTS[1].unitPrice,
              taxRate: TEST_PRODUCTS[1].taxRate,
              description: TEST_PRODUCTS[1].description,
            },
          ],
        });

        // Valider la facture
        if (invoice.status === 'draft') {
          await invoiceService.updateStatus(company.id, invoice.id, 'sent', user.id);
        }

        invoiceCount++;
        console.log(`  ✅ Facture ${invoice.invoiceNumber} créée`);
      } catch (error: any) {
        console.log(`  ⚠️  Erreur création facture: ${error.message}`);
      }
    }
    console.log(`✅ ${invoiceCount} factures créées\n`);

    // 7. Créer quelques devis
    console.log('📋 Création des devis...');
    const quotationService = (await import('../src/services/quotation.service')).default;
    let quotationCount = 0;

    for (let i = 0; i < Math.min(2, customerIds.length); i++) {
      const customerId = customerIds[i];
      const quotationDate = new Date();
      quotationDate.setDate(quotationDate.getDate() - (i * 5));

      try {
        const quotation = await quotationService.create(company.id, user.id, {
          customerId,
          quotationDate,
          expirationDate: new Date(quotationDate.getTime() + 15 * 24 * 60 * 60 * 1000), // +15 jours
          currency: 'CDF',
          lines: [
            {
              productId: productIds[2],
              quantity: 1,
              unitPrice: TEST_PRODUCTS[2].unitPrice,
              taxRate: TEST_PRODUCTS[2].taxRate,
              description: TEST_PRODUCTS[2].description,
            },
          ],
        });

        quotationCount++;
        console.log(`  ✅ Devis ${quotation.quotationNumber} créé`);
      } catch (error: any) {
        console.log(`  ⚠️  Erreur création devis: ${error.message}`);
      }
    }
    console.log(`✅ ${quotationCount} devis créés\n`);

    console.log('✅ Données de test créées avec succès !\n');
    console.log(`📊 Résumé:`);
    console.log(`   - Produits: ${productIds.length}`);
    console.log(`   - Clients: ${customerIds.length}`);
    console.log(`   - Fournisseurs: ${supplierIds.length}`);
    console.log(`   - Factures: ${invoiceCount}`);
    console.log(`   - Devis: ${quotationCount}\n`);

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createTestDataForOkerybanza();
