// Tests d'intégration pour le service RecurringInvoice
// Utilise la vraie base de données

import {
  prisma,
  createTestCompany,
  createTestUser,
  createTestCustomer,
  createTestFiscalPeriod,
  cleanupTestData,
} from '../helpers/test-db';
import recurringInvoiceService from '../../services/recurringInvoice.service';

describe('RecurringInvoiceService - Tests d\'intégration', () => {
  let testCompany: any;
  let testUser: any;
  let testCustomer: any;

  beforeAll(async () => {
    // Créer les données de test
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany.id);
    testCustomer = await createTestCustomer(testCompany.id);

    // DOC-09: Créer un exercice comptable ouvert pour les tests
    await createTestFiscalPeriod(testCompany.id);
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await cleanupTestData(testCompany.id);
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('devrait créer une facture récurrente avec des lignes', async () => {
      const recurringInvoiceData = {
        customerId: testCustomer.id,
        name: 'Facture récurrente test',
        description: 'Description de test',
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date(),
        dueDateDays: 30,
        currency: 'CDF',
        lines: [
          {
            name: 'Service mensuel',
            quantity: 1,
            unitPrice: 10000,
            taxRate: 16,
          },
        ],
      };

      const result = await recurringInvoiceService.create(
        testCompany.id,
        testUser.id,
        recurringInvoiceData
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Facture récurrente test');
      expect(result.frequency).toBe('monthly');
      expect(result.customer_id).toBe(testCustomer.id);
      expect(result.next_run_date).toBeDefined();
      expect(result.is_active).toBe(true);
    });

    it('devrait échouer avec un client inexistant', async () => {
      const recurringInvoiceData = {
        customerId: 'non-existent-id',
        name: 'Test',
        frequency: 'monthly' as const,
        startDate: new Date(),
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      };

      await expect(
        recurringInvoiceService.create(testCompany.id, testUser.id, recurringInvoiceData)
      ).rejects.toThrow('Customer not found');
    });

    it('devrait échouer sans lignes', async () => {
      const recurringInvoiceData = {
        customerId: testCustomer.id,
        name: 'Test',
        frequency: 'monthly' as const,
        startDate: new Date(),
        lines: [],
      };

      await expect(
        recurringInvoiceService.create(testCompany.id, testUser.id, recurringInvoiceData)
      ).rejects.toThrow('Recurring invoice must have at least one line');
    });
  });

  describe('list', () => {
    it('devrait lister les factures récurrentes avec pagination', async () => {
      const result = await recurringInvoiceService.list(testCompany.id, { page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
    });

    it('devrait filtrer par statut actif', async () => {
      const result = await recurringInvoiceService.list(testCompany.id, { isActive: true });

      expect(result.data).toBeDefined();
      result.data.forEach((recurring: any) => {
        expect(recurring.is_active).toBe(true);
      });
    });
  });

  describe('getById', () => {
    it('devrait récupérer une facture récurrente par son ID', async () => {
      // Créer une facture récurrente d'abord
      const created = await recurringInvoiceService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        name: 'Test getById',
        frequency: 'monthly' as const,
        startDate: new Date(),
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      });

      const result = await recurringInvoiceService.getById(testCompany.id, created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.name).toBe('Test getById');
    });

    it('devrait échouer avec un ID inexistant', async () => {
      await expect(
        recurringInvoiceService.getById(testCompany.id, 'non-existent-id')
      ).rejects.toThrow('Recurring invoice not found');
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une facture récurrente', async () => {
      // Créer une facture récurrente
      const created = await recurringInvoiceService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        name: 'Test update',
        frequency: 'monthly' as const,
        startDate: new Date(),
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      });

      // Mettre à jour
      const result = await recurringInvoiceService.update(testCompany.id, created.id, {
        name: 'Test update modifié',
        isActive: false,
      });

      expect(result.name).toBe('Test update modifié');
      expect(result.is_active).toBe(false);
    });
  });

  describe('generateNextInvoice', () => {
    it('devrait générer une facture depuis une facture récurrente', async () => {
      // Créer une facture récurrente avec une date de début dans le passé
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(0, 0, 0, 0);

      const created = await recurringInvoiceService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        name: 'Test génération',
        frequency: 'monthly' as const,
        startDate: pastDate,
        lines: [{ name: 'Service', quantity: 1, unitPrice: 1000, taxRate: 0 }],
      });

      // Mettre à jour next_run_date pour qu'elle soit dans le passé
      await prisma.recurring_invoices.update({
        where: { id: created.id },
        data: { next_run_date: pastDate },
      });

      // Générer la facture
      const invoiceId = await recurringInvoiceService.generateNextInvoice(created.id);

      expect(invoiceId).toBeDefined();

      // Vérifier que la facture a été créée
      const invoice = await prisma.invoices.findFirst({
        where: { id: invoiceId || '' },
      });

      expect(invoice).toBeDefined();
      expect(invoice?.recurring_invoice_id).toBe(created.id);
      expect(invoice?.customer_id).toBe(testCustomer.id);

      // Vérifier que la facture récurrente a été mise à jour
      const updated = await prisma.recurring_invoices.findFirst({
        where: { id: created.id },
      });

      expect(updated?.last_invoice_id).toBe(invoiceId);
      expect(updated?.total_generated).toBeGreaterThan(0);
      expect(updated?.last_run_date).toBeDefined();
    });
  });

  describe('delete', () => {
    it('devrait supprimer une facture récurrente (soft delete)', async () => {
      // Créer une facture récurrente
      const created = await recurringInvoiceService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        name: 'Test suppression',
        frequency: 'monthly' as const,
        startDate: new Date(),
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      });

      // Supprimer
      await recurringInvoiceService.delete(testCompany.id, created.id);

      // Vérifier que la facture récurrente est supprimée (soft delete)
      const deleted = await prisma.recurring_invoices.findFirst({
        where: { id: created.id },
      });
      expect(deleted?.deleted_at).toBeDefined();
    });
  });
});

