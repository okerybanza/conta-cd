import usageService from '../../services/usage.service';
import prisma from '../../config/database';

describe('UsageService', () => {
  let testCompanyId: string;

  beforeAll(async () => {
    // Créer une entreprise de test
    const company = await prisma.companies.create({
      data: {
        id: require('crypto').randomUUID(),
        name: 'Usage Test Company',
        email: `usage-${Date.now()}@example.com`,
        phone: '+243900000002',
        city: 'Kinshasa',
        country: 'RDC',
        currency: 'CDF',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    testCompanyId = company.id;
  });

  afterAll(async () => {
    // Nettoyer
    await prisma.usages.deleteMany({
      where: { company_id: testCompanyId },
    });
    await prisma.companies.delete({
      where: { id: testCompanyId },
    });
  });

  describe('increment', () => {
    it('should increment usage counter', async () => {
      await usageService.increment(testCompanyId, 'customers', 1);
      const count = await usageService.get(testCompanyId, 'customers');
      expect(count).toBe(1);
    });

    it('should increment by custom amount', async () => {
      await usageService.increment(testCompanyId, 'products', 5);
      const count = await usageService.get(testCompanyId, 'products');
      expect(count).toBe(5);
    });
  });

  describe('decrement', () => {
    it('should decrement usage counter', async () => {
      await usageService.increment(testCompanyId, 'users', 10);
      await usageService.decrement(testCompanyId, 'users', 3);
      const count = await usageService.get(testCompanyId, 'users');
      expect(count).toBe(7);
    });

    it('should not go below 0', async () => {
      await usageService.decrement(testCompanyId, 'users', 100);
      const count = await usageService.get(testCompanyId, 'users');
      expect(count).toBe(0);
    });
  });

  describe('get', () => {
    it('should return current usage', async () => {
      await usageService.increment(testCompanyId, 'emails_sent', 10);
      const count = await usageService.get(testCompanyId, 'emails_sent');
      expect(count).toBe(10);
    });

    it('should return 0 if no usage recorded', async () => {
      // Utiliser une métrique qui n'a pas été utilisée dans les tests précédents
      const count = await usageService.get(testCompanyId, 'recurring_invoices');
      // Le service retourne 0 si aucun usage n'est trouvé
      expect(count).toBe(0);
    });
  });

  describe('checkLimit', () => {
    it('should return false if limit not reached', async () => {
      await usageService.increment(testCompanyId, 'suppliers', 5);
      const isReached = await usageService.checkLimit(testCompanyId, 'suppliers', 10);
      expect(isReached).toBe(false);
    });

    it('should return true if limit reached', async () => {
      await usageService.increment(testCompanyId, 'expenses', 10);
      const isReached = await usageService.checkLimit(testCompanyId, 'expenses', 10);
      expect(isReached).toBe(true);
    });

    it('should return false if limit is null (unlimited)', async () => {
      const isReached = await usageService.checkLimit(testCompanyId, 'customers', null);
      expect(isReached).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all usage for current period', async () => {
      await usageService.increment(testCompanyId, 'customers', 1);
      await usageService.increment(testCompanyId, 'products', 2);
      await usageService.increment(testCompanyId, 'users', 3);

      const allUsage = await usageService.getAll(testCompanyId);
      expect(allUsage.customers).toBeGreaterThanOrEqual(1);
      expect(allUsage.products).toBeGreaterThanOrEqual(2);
      expect(allUsage.users).toBeGreaterThanOrEqual(3);
    });
  });
});

