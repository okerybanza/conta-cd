// Helpers pour les tests d'intégration
// Utilise la vraie base de données

import prisma from '../../config/database';
import { randomUUID } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

export { prisma };

/**
 * Créer une entreprise de test
 */
export async function createTestCompany() {
  const companyId = randomUUID();
  const company = await prisma.companies.create({
    data: {
      id: companyId,
      name: `Test Company ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      phone: '+243123456789',
      address: 'Test Address',
      city: 'Kinshasa',
      country: 'RDC',
      currency: 'CDF',
      invoice_prefix: 'TEST',
      next_invoice_number: 1,
      quotation_prefix: 'DEV',
      next_quotation_number: 1,
      credit_note_prefix: 'AV',
      next_credit_note_number: 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  // Créer un exercice comptable par défaut pour les tests (exercice OUVERT)
  await createTestFiscalPeriod(companyId);

  return company;
}

/**
 * Créer un utilisateur de test
 */
export async function createTestUser(companyId: string) {
  const userId = randomUUID();
  const user = await prisma.users.create({
    data: {
      id: userId,
      company_id: companyId,
      email: `test-user-${Date.now()}@example.com`,
      password_hash: 'hashed_password_for_test',
      first_name: 'Test',
      last_name: 'User',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return user;
}

/**
 * Créer un client de test
 */
export async function createTestCustomer(companyId: string, type: 'particulier' | 'entreprise' = 'particulier') {
  const customerId = randomUUID();
  const timestamp = Date.now();

  const customerData: any = {
    id: customerId,
    company_id: companyId,
    type,
    email: `test-customer-${timestamp}@example.com`,
    phone: '+243123456789',
    created_at: new Date(),
    updated_at: new Date(),
  };

  if (type === 'particulier') {
    customerData.first_name = 'Jean';
    customerData.last_name = `Dupont ${timestamp}`;
  } else {
    customerData.business_name = `Test Company ${timestamp}`;
    customerData.nif = `NIF${timestamp}`;
  }

  const customer = await prisma.customers.create({
    data: customerData,
  });
  return customer;
}

/**
 * Créer un produit de test
 */
export async function createTestProduct(companyId: string) {
  const productId = randomUUID();
  const product = await prisma.products.create({
    data: {
      id: productId,
      company_id: companyId,
      name: `Test Product ${Date.now()}`,
      description: 'Test product description',
      price: new Decimal(1000),
      tax_rate: new Decimal(16),
      is_active: true,
      stock: new Decimal(0),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return product;
}

/**
 * Créer un exercice comptable de test (OUVERT)
 */
export async function createTestFiscalPeriod(companyId: string, year: number = new Date().getFullYear()) {
  const periodId = randomUUID();
  const period = await prisma.fiscal_periods.create({
    data: {
      id: periodId,
      company_id: companyId,
      name: `FY ${year}`,
      start_date: new Date(year, 0, 1),
      end_date: new Date(year, 11, 31),
      status: 'open',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return period;
}

/**
 * Nettoyer les données de test
 */
export async function cleanupTestData(companyId: string) {
  // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
  try {
    // Supprimer les factures récurrentes et leurs lignes
    await prisma.recurring_invoice_lines.deleteMany({
      where: {
        recurring_invoices: {
          company_id: companyId,
        },
      },
    });
    await prisma.recurring_invoices.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer les avoirs
    await prisma.credit_notes.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer les devis et leurs lignes
    await prisma.quotation_lines.deleteMany({
      where: {
        quotations: {
          company_id: companyId,
        },
      },
    });
    await prisma.quotations.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer les lignes de facture
    await prisma.invoice_lines.deleteMany({
      where: {
        invoices: {
          company_id: companyId,
        },
      },
    });

    // Supprimer les factures
    await prisma.invoices.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer les produits
    await prisma.products.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer les clients
    await prisma.customers.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer les utilisateurs
    await prisma.users.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer les exercices comptables
    await prisma.fiscal_periods.deleteMany({
      where: { company_id: companyId },
    });

    // Supprimer l'entreprise
    await prisma.companies.delete({
      where: { id: companyId },
    });
  } catch (error: any) {
    console.error('Error cleaning up test data:', error.message);
    // Continue même en cas d'erreur pour ne pas bloquer les tests
  }
}

