// Scénario E2E 2: Inscription & Plan Gratuit
// Teste le workflow complet d'inscription d'un nouvel utilisateur et sélection du plan gratuit

import prisma from '../../config/database';
import {
  createTestCompany,
  createTestUser,
  cleanupTestData,
} from '../helpers/test-db';
import {
  createSubscriptionPlan,
  createSubscription,
  generateTestEmail,
} from './e2e-helpers';
import { PLAN_FIXTURES as FIXTURES } from './e2e-fixtures';
import { connectDatabase } from '../../config/database';
import { CustomerService } from '../../services/customer.service';
import { InvoiceService } from '../../services/invoice.service';
import quotaService from '../../services/quota.service';

describe('E2E Scénario 2: Inscription & Plan Gratuit', () => {
  let testCompany: any;
  let testUser: any;
  let freePlan: any;
  let subscription: any;
  let customerService: CustomerService;
  let invoiceService: InvoiceService;

  beforeAll(async () => {
    await connectDatabase();
    
    // Créer le plan gratuit s'il n'existe pas
    freePlan = await prisma.packages.findFirst({
      where: { name: 'Plan Gratuit' },
    });

    if (!freePlan) {
      freePlan = await createSubscriptionPlan(FIXTURES.FREE);
    }

    // Créer une entreprise de test (simule l'inscription)
    testCompany = await createTestCompany();
    
    // Créer un utilisateur pour cette entreprise
    testUser = await createTestUser(testCompany.id);

    // Créer l'abonnement au plan gratuit
    subscription = await createSubscription(testCompany.id, freePlan.id, 'active');

    // Initialiser les services
    customerService = new CustomerService();
    invoiceService = new InvoiceService();
  });

  afterAll(async () => {
    await cleanupTestData(testCompany.id);
    await prisma.$disconnect();
  });

  describe('2.1 - Inscription Utilisateur', () => {
    it('devrait créer une entreprise', async () => {
      expect(testCompany).toBeDefined();
      expect(testCompany.id).toBeDefined();
      expect(testCompany.name).toContain('Test Company');
    });

    it('devrait créer un utilisateur pour l\'entreprise', async () => {
      expect(testUser).toBeDefined();
      expect(testUser.company_id).toBe(testCompany.id);
      expect(testUser.email).toContain('test-user');
    });
  });

  describe('2.2 - Sélection Plan Gratuit', () => {
    it('devrait créer un abonnement au plan gratuit', async () => {
      expect(subscription).toBeDefined();
      expect(subscription.company_id).toBe(testCompany.id);
      expect(subscription.package_id).toBe(freePlan.id);
      expect(subscription.status).toBe('active');
    });

    it('devrait vérifier que l\'entreprise a le plan gratuit', async () => {
      const companySubscription = await prisma.subscriptions.findFirst({
        where: { company_id: testCompany.id },
        include: { packages: true },
      });

      expect(companySubscription).toBeDefined();
      expect(companySubscription?.packages.name).toBe('Plan Gratuit');
    });
  });

  describe('2.3 - Vérification des Limites du Plan Gratuit', () => {
    it('devrait vérifier les limites du plan gratuit', async () => {
      const plan = await prisma.packages.findFirst({
        where: { id: freePlan.id },
      });

      expect(plan).toBeDefined();
      const limits = plan?.limits as any;
      expect(limits.customers).toBe(10);
      expect(limits.products).toBe(20);
      expect(limits.invoices).toBe(50);
      expect(limits.users).toBe(1);
    });

    it('devrait créer des clients jusqu\'à la limite', async () => {
      // Créer 10 clients (limite du plan gratuit)
      const customers = [];
      for (let i = 0; i < 10; i++) {
        const customer = await customerService.create(testCompany.id, {
          type: 'particulier',
          firstName: `Client${i}`,
          lastName: `Test${i}`,
          email: generateTestEmail(`client${i}`),
        });
        customers.push(customer);
      }

      expect(customers.length).toBe(10);

      // Vérifier qu'on ne peut pas créer un 11ème client
      await expect(
        customerService.create(testCompany.id, {
          type: 'particulier',
          firstName: 'Client11',
          lastName: 'Test11',
          email: generateTestEmail('client11'),
        })
      ).rejects.toThrow();
    });

    it('devrait créer des factures jusqu\'à la limite', async () => {
      // Créer un client pour les factures
      const customer = await customerService.create(testCompany.id, {
        type: 'particulier',
        firstName: 'Facture',
        lastName: 'Client',
        email: generateTestEmail('facture'),
      });

      // Créer 50 factures (limite du plan gratuit)
      const invoices = [];
      for (let i = 0; i < 50; i++) {
        const invoice = await invoiceService.create(testCompany.id, testUser.id, {
          customerId: customer.id,
          invoiceDate: new Date(),
          lines: [{ name: `Service ${i}`, quantity: 1, unitPrice: 1000, taxRate: 16 }],
        });
        invoices.push(invoice);
      }

      expect(invoices.length).toBe(50);

      // Vérifier qu'on ne peut pas créer une 51ème facture
      await expect(
        invoiceService.create(testCompany.id, testUser.id, {
          customerId: customer.id,
          invoiceDate: new Date(),
          lines: [{ name: 'Service 51', quantity: 1, unitPrice: 1000, taxRate: 16 }],
        })
      ).rejects.toThrow();
    });
  });

  describe('2.4 - Tableau de Bord', () => {
    it('devrait afficher les statistiques de l\'entreprise', async () => {
      const customers = await customerService.list(testCompany.id, { page: 1, limit: 100 });
      const invoices = await invoiceService.list(testCompany.id, { page: 1, limit: 100 });

      expect(customers.data.length).toBeGreaterThan(0);
      expect(invoices.data.length).toBeGreaterThan(0);
    });
  });
});

