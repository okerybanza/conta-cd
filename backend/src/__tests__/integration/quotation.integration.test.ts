// Tests d'intégration pour le service Quotation
// Utilise la vraie base de données

import {
  prisma,
  createTestCompany,
  createTestUser,
  createTestCustomer,
  createTestFiscalPeriod,
  cleanupTestData,
} from '../helpers/test-db';
import quotationService from '../../services/quotation.service';

describe('QuotationService - Tests d\'intégration', () => {
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
    it('devrait créer un devis avec des lignes', async () => {
      const quotationData = {
        customerId: testCustomer.id,
        quotationDate: new Date(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currency: 'CDF',
        lines: [
          {
            name: 'Service de conseil',
            quantity: 10,
            unitPrice: 1000,
            taxRate: 16,
          },
          {
            name: 'Formation',
            quantity: 2,
            unitPrice: 5000,
            taxRate: 16,
          },
        ],
      };

      const result = await quotationService.create(
        testCompany.id,
        testUser.id,
        quotationData
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.quotation_number).toBeDefined();
      expect(result.status).toBe('draft');
      expect(result.customer_id).toBe(testCustomer.id);
      expect(Number(result.total_amount)).toBeGreaterThan(0);
    });

    it('devrait échouer avec un client inexistant', async () => {
      const quotationData = {
        customerId: 'non-existent-id',
        quotationDate: new Date(),
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100, taxRate: 0 }],
      };

      await expect(
        quotationService.create(testCompany.id, testUser.id, quotationData)
      ).rejects.toThrow('Customer not found');
    });

    it('devrait échouer sans lignes', async () => {
      const quotationData = {
        customerId: testCustomer.id,
        quotationDate: new Date(),
        lines: [],
      };

      await expect(
        quotationService.create(testCompany.id, testUser.id, quotationData)
      ).rejects.toThrow('Quotation must have at least one line');
    });
  });

  describe('list', () => {
    it('devrait lister les devis avec pagination', async () => {
      const result = await quotationService.list(testCompany.id, { page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
    });

    it('devrait filtrer par statut', async () => {
      const result = await quotationService.list(testCompany.id, { status: 'draft' });

      expect(result.data).toBeDefined();
      result.data.forEach((quotation: any) => {
        expect(quotation.status).toBe('draft');
      });
    });
  });

  describe('getById', () => {
    it('devrait récupérer un devis par son ID', async () => {
      // Créer un devis d'abord
      const created = await quotationService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        quotationDate: new Date(),
        lines: [{ name: 'Test getById', quantity: 1, unitPrice: 100, taxRate: 0 }],
      });

      const result = await quotationService.getById(testCompany.id, created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.quotation_number).toBeDefined();
    });

    it('devrait échouer avec un ID inexistant', async () => {
      await expect(
        quotationService.getById(testCompany.id, 'non-existent-id')
      ).rejects.toThrow('Quotation not found');
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un devis', async () => {
      // Créer un devis
      const created = await quotationService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        quotationDate: new Date(),
        lines: [{ name: 'Test update', quantity: 1, unitPrice: 100, taxRate: 0 }],
      });

      // Mettre à jour
      const result = await quotationService.update(testCompany.id, created.id, testUser.id, {
        notes: 'Notes mises à jour',
        lines: [
          { name: 'Service modifié', quantity: 2, unitPrice: 200, taxRate: 16 },
        ],
      });

      expect(result.notes).toBe('Notes mises à jour');
      expect(result.quotation_lines).toBeDefined();
    });
  });

  describe('delete', () => {
    it('devrait supprimer un devis (soft delete)', async () => {
      // Créer un devis
      const created = await quotationService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        quotationDate: new Date(),
        lines: [{ name: 'Test suppression', quantity: 1, unitPrice: 100, taxRate: 0 }],
      });

      // Supprimer
      await quotationService.delete(testCompany.id, created.id);

      // Vérifier que le devis est supprimé (soft delete)
      const deleted = await prisma.quotations.findFirst({
        where: { id: created.id },
      });
      expect(deleted?.deleted_at).toBeDefined();
    });
  });

  describe('convertToInvoice', () => {
    it('devrait convertir un devis en facture', async () => {
      // Créer un devis
      const created = await quotationService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        quotationDate: new Date(),
        lines: [{ name: 'Service à facturer', quantity: 1, unitPrice: 1000, taxRate: 16 }],
      });

      // Accepter le devis d'abord
      await quotationService.update(testCompany.id, created.id, testUser.id, {
        status: 'accepted',
      });

      // Convertir en facture
      const result = await quotationService.convertToInvoice(
        testCompany.id,
        created.id,
        testUser.id
      );

      expect(result).toBeDefined();
      expect(result.invoice).toBeDefined();
      expect(result.invoice.id).toBeDefined();
      expect(result.invoice.invoice_number).toBeDefined();

      // Vérifier que le devis a été marqué comme converti
      const updatedQuotation = await prisma.quotations.findFirst({
        where: { id: created.id },
      });
      expect(updatedQuotation?.invoice_id).toBe(result.invoice.id);
      expect(updatedQuotation?.status).toBe('accepted');
    });
  });
});

