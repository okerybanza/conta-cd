// Tests d'intégration pour le service Invoice
// Utilise la vraie base de données

import {
  prisma,
  createTestCompany,
  createTestUser,
  createTestCustomer,
  createTestFiscalPeriod,
  cleanupTestData,
} from '../helpers/test-db';
import { InvoiceService } from '../../services/invoice.service';
import fiscalPeriodService from '../../services/fiscalPeriod.service';

describe('InvoiceService - Tests d\'intégration', () => {
  let invoiceService: InvoiceService;
  let testCompany: any;
  let testUser: any;
  let testCustomer: any;

  beforeAll(async () => {
    console.log('TEST DATABASE_URL:', process.env.DATABASE_URL);
    invoiceService = new InvoiceService();

    // Créer les données de test
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany.id);
    testCustomer = await createTestCustomer(testCompany.id);

    // DOC-09: Créer un exercice comptable ouvert pour les tests
    await createTestFiscalPeriod(testCompany.id);

    // Activer les modules nécessaires
    await prisma.companies.update({
      where: { id: testCompany.id },
      data: {
        module_facturation_enabled: true,
        datarissage_completed: true
      }
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await cleanupTestData(testCompany.id);
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('devrait créer une facture avec des lignes dans une période ouverte', async () => {
      const invoiceData = {
        customerId: testCustomer.id,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lines: [
          {
            name: 'Service de conseil',
            quantity: 10,
            unitPrice: 100,
            taxRate: 16,
          }
        ],
      };

      const result = await invoiceService.create(testCompany.id, testUser.id, invoiceData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('draft');
    });

    it('devrait échouer à créer une facture dans une période close', async () => {
      // Créer une période close
      const closedYear = 2020;
      await prisma.fiscal_periods.create({
        data: {
          id: `fp-closed-${Date.now()}`,
          company_id: testCompany.id,
          name: 'Closed 2020',
          start_date: new Date(closedYear, 0, 1),
          end_date: new Date(closedYear, 11, 31),
          status: 'closed',
          updated_at: new Date(),
        },
      });

      const invoiceData = {
        customerId: testCustomer.id,
        invoiceDate: new Date(closedYear, 5, 1), // Date dans la période close
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      };

      await expect(
        invoiceService.create(testCompany.id, testUser.id, invoiceData)
      ).rejects.toThrow(/est clos/);
    });
  });

  describe('updateStatus avec Justification (DOC-08)', () => {
    it('devrait changer le statut avec justification pour annulation', async () => {
      const created = await invoiceService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        invoiceDate: new Date(),
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      });

      const justification = "Erreur de saisie client";
      const result = await invoiceService.updateStatus(
        testCompany.id,
        created.id,
        'cancelled',
        testUser.id,
        justification
      );

      expect(result.status).toBe('cancelled');

      // Vérifier le log d'audit (DOC-08)
      const auditLog = await prisma.audit_logs.findFirst({
        where: {
          entity_id: created.id,
          action: 'UPDATE_STATUS',
          justification: justification
        }
      });
      expect(auditLog).toBeDefined();
    });

    it('devrait échouer si la justification manque pour une annulation', async () => {
      const created = await invoiceService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        invoiceDate: new Date(),
        lines: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      });

      await expect(
        invoiceService.updateStatus(testCompany.id, created.id, 'cancelled', testUser.id)
      ).rejects.toThrow(/requires a justification/);
    });
  });

  describe('delete', () => {
    it('devrait supprimer une facture en brouillon et logger l\'action', async () => {
      const created = await invoiceService.create(testCompany.id, testUser.id, {
        customerId: testCustomer.id,
        invoiceDate: new Date(),
        lines: [{ name: 'Test suppression', quantity: 1, unitPrice: 100 }],
      });

      const deleteJustification = "Nettoyage test";
      await invoiceService.delete(testCompany.id, created.id, testUser.id, deleteJustification);

      const deleted = await prisma.invoices.findFirst({ where: { id: created.id } });
      expect(deleted?.deleted_at).toBeDefined();

      // Vérifier audit log
      const auditLog = await prisma.audit_logs.findFirst({
        where: {
          entity_id: created.id,
          action: 'DELETE',
        }
      });
      expect(auditLog).toBeDefined();
    });
  });
});
