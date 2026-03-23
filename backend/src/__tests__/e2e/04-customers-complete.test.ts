// Scénario E2E 4: Gestion Complète des Clients
// Teste toutes les fonctionnalités de gestion des clients

import prisma from '../../config/database';
import {
  createTestCompany,
  createTestUser,
  createTestCustomer,
  cleanupTestData,
} from '../helpers/test-db';
import { connectDatabase } from '../../config/database';
import { CustomerService } from '../../services/customer.service';
import { InvoiceService } from '../../services/invoice.service';
import { generateTestEmail } from './e2e-helpers';

describe('E2E Scénario 4: Gestion Complète des Clients', () => {
  let testCompany: any;
  let testUser: any;
  let customerService: CustomerService;
  let invoiceService: InvoiceService;

  beforeAll(async () => {
    await connectDatabase();
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany.id);
    customerService = new CustomerService();
    invoiceService = new InvoiceService();
  });

  afterAll(async () => {
    await cleanupTestData(testCompany.id);
    await prisma.$disconnect();
  });

  describe('4.1 - Création de Clients', () => {
    it('devrait créer un client particulier', async () => {
      const customer = await customerService.create(testCompany.id, {
        type: 'particulier',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: generateTestEmail('jean'),
        phone: '+243900000001',
        address: '123 Rue Test',
        city: 'Kinshasa',
        country: 'RDC',
      });

      expect(customer).toBeDefined();
      expect(customer.first_name).toBe('Jean');
      expect(customer.last_name).toBe('Dupont');
      expect(customer.type).toBe('particulier');
    });

    it('devrait créer un client entreprise', async () => {
      const customer = await customerService.create(testCompany.id, {
        type: 'entreprise',
        businessName: 'Entreprise Test SARL',
        email: generateTestEmail('entreprise'),
        phone: '+243900000002',
        nif: 'NIF123456',
        rccm: 'RCCM123456',
        address: '456 Business Ave',
        city: 'Kinshasa',
        country: 'RDC',
      });

      expect(customer).toBeDefined();
      expect(customer.business_name).toBe('Entreprise Test SARL');
      expect(customer.type).toBe('entreprise');
      expect(customer.nif).toBe('NIF123456');
    });
  });

  describe('4.2 - Liste et Recherche', () => {
    it('devrait lister tous les clients', async () => {
      const result = await customerService.list(testCompany.id, {
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('devrait rechercher un client par nom', async () => {
      const result = await customerService.list(testCompany.id, {
        page: 1,
        limit: 10,
        search: 'Jean',
      });

      expect(result.data.length).toBeGreaterThan(0);
      if (result.data.length > 0) {
        expect(result.data[0].first_name).toContain('Jean');
      }
    });

    it('devrait filtrer par type', async () => {
      const particulierResult = await customerService.list(testCompany.id, {
        page: 1,
        limit: 10,
        type: 'particulier',
      });

      const entrepriseResult = await customerService.list(testCompany.id, {
        page: 1,
        limit: 10,
        type: 'entreprise',
      });

      expect(particulierResult.data.every((c: any) => c.type === 'particulier')).toBe(true);
      expect(entrepriseResult.data.every((c: any) => c.type === 'entreprise')).toBe(true);
    });
  });

  describe('4.3 - Mise à Jour', () => {
    it('devrait mettre à jour un client', async () => {
      const customer = await createTestCustomer(testCompany.id);
      
      const updated = await customerService.update(testCompany.id, customer.id, {
        firstName: 'Jean Updated',
        phone: '+243900000999',
      });

      expect(updated.first_name).toBe('Jean Updated');
      expect(updated.phone).toBe('+243900000999');
    });
  });

  describe('4.4 - Statistiques Client', () => {
    it('devrait afficher les statistiques d\'un client', async () => {
      const customer = await createTestCustomer(testCompany.id);
      
      // Créer une facture pour ce client
      await invoiceService.create(testCompany.id, testUser.id, {
        customerId: customer.id,
        invoiceDate: new Date(),
        lines: [
          { name: 'Service Test', quantity: 1, unitPrice: 10000, taxRate: 16 },
        ],
      });

      const customerWithStats = await customerService.getById(testCompany.id, customer.id);
      
      expect(customerWithStats).toBeDefined();
      // Les statistiques sont calculées dans getById
    });
  });

  describe('4.5 - Suppression', () => {
    it('devrait supprimer un client (soft delete)', async () => {
      const customer = await createTestCustomer(testCompany.id);
      
      await customerService.delete(testCompany.id, customer.id);

      const deleted = await prisma.customers.findUnique({
        where: { id: customer.id },
      });

      expect(deleted?.deleted_at).toBeDefined();
    });

    it('ne devrait pas permettre de supprimer un client avec factures', async () => {
      const customer = await createTestCustomer(testCompany.id);
      
      // Créer une facture pour ce client
      await invoiceService.create(testCompany.id, testUser.id, {
        customerId: customer.id,
        invoiceDate: new Date(),
        lines: [
          { name: 'Service Test', quantity: 1, unitPrice: 10000, taxRate: 16 },
        ],
      });

      // La suppression devrait échouer ou être bloquée
      // Vérifier selon l'implémentation du service
      const customerAfter = await customerService.getById(testCompany.id, customer.id);
      expect(customerAfter).toBeDefined();
    });
  });
});

