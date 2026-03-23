// Tests d'intégration pour le service Customer
// Utilise la vraie base de données

import {
  prisma,
  createTestCompany,
  createTestUser,
  cleanupTestData,
} from '../helpers/test-db';
import { CustomerService } from '../../services/customer.service';

describe('CustomerService - Tests d\'intégration', () => {
  let customerService: CustomerService;
  let testCompany: any;
  let testUser: any;

  beforeAll(async () => {
    customerService = new CustomerService();
    
    // Créer les données de test
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany.id);
  });

  afterAll(async () => {
    await cleanupTestData(testCompany.id);
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('devrait créer un client particulier', async () => {
      const timestamp = Date.now();
      const customerData = {
        type: 'particulier' as const,
        firstName: 'Jean',
        lastName: `Dupont ${timestamp}`,
        email: `jean-${timestamp}@example.com`,
        phone: '+243123456789',
      };

      const result = await customerService.create(testCompany.id, customerData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.first_name).toBe('Jean');
      expect(result.type).toBe('particulier');
    });

    it('devrait créer un client entreprise', async () => {
      const timestamp = Date.now();
      const customerData = {
        type: 'entreprise' as const,
        businessName: `Société ABC ${timestamp}`,
        email: `abc-${timestamp}@example.com`,
        nif: `NIF${timestamp}`,
      };

      const result = await customerService.create(testCompany.id, customerData);

      expect(result).toBeDefined();
      expect(result.business_name).toContain('Société ABC');
      expect(result.type).toBe('entreprise');
    });

    it('devrait échouer avec un email déjà utilisé', async () => {
      const timestamp = Date.now();
      const email = `duplicate-${timestamp}@example.com`;
      
      // Créer le premier client
      await customerService.create(testCompany.id, {
        type: 'particulier',
        firstName: 'First',
        lastName: 'Client',
        email,
      });

      // Tenter de créer un deuxième avec le même email
      await expect(
        customerService.create(testCompany.id, {
          type: 'particulier',
          firstName: 'Second',
          lastName: 'Client',
          email,
        })
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('devrait lister les clients avec pagination', async () => {
      const result = await customerService.list(testCompany.id, { page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
    });

    it('devrait filtrer par type', async () => {
      const result = await customerService.list(testCompany.id, { type: 'particulier' });

      expect(result.data).toBeDefined();
      result.data.forEach((customer: any) => {
        expect(customer.type).toBe('particulier');
      });
    });

    it('devrait rechercher par nom', async () => {
      // Créer un client avec un nom spécifique
      const timestamp = Date.now();
      await customerService.create(testCompany.id, {
        type: 'particulier',
        firstName: 'Recherche',
        lastName: `Unique${timestamp}`,
        email: `recherche-${timestamp}@example.com`,
      });

      const result = await customerService.list(testCompany.id, { search: `Unique${timestamp}` });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].last_name).toContain(`Unique${timestamp}`);
    });
  });

  describe('getById', () => {
    it('devrait récupérer un client par ID', async () => {
      const timestamp = Date.now();
      const created = await customerService.create(testCompany.id, {
        type: 'particulier',
        firstName: 'GetById',
        lastName: `Test${timestamp}`,
        email: `getbyid-${timestamp}@example.com`,
      });

      const result = await customerService.getById(testCompany.id, created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
    });

    it('devrait échouer avec un ID inexistant', async () => {
      await expect(
        customerService.getById(testCompany.id, 'non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un client', async () => {
      const timestamp = Date.now();
      const created = await customerService.create(testCompany.id, {
        type: 'particulier',
        firstName: 'Update',
        lastName: `Test${timestamp}`,
        email: `update-${timestamp}@example.com`,
      });

      const result = await customerService.update(testCompany.id, created.id, {
        firstName: 'Updated',
        phone: '+243999999999',
      });

      expect(result.first_name).toBe('Updated');
      expect(result.phone).toBe('+243999999999');
    });
  });

  describe('delete', () => {
    it('devrait supprimer un client sans factures', async () => {
      const timestamp = Date.now();
      const created = await customerService.create(testCompany.id, {
        type: 'particulier',
        firstName: 'Delete',
        lastName: `Test${timestamp}`,
        email: `delete-${timestamp}@example.com`,
      });

      const result = await customerService.delete(testCompany.id, created.id);

      expect(result.success).toBe(true);
    });
  });
});

