// Scénario E2E 3: Upgrade de Plan
// Teste le workflow complet de mise à niveau d'un plan d'abonnement

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
import subscriptionService from '../../services/subscription.service';
import quotaService from '../../services/quota.service';

describe('E2E Scénario 3: Upgrade de Plan', () => {
  let testCompany: any;
  let testUser: any;
  let freePlan: any;
  let starterPlan: any;
  let professionalPlan: any;
  let freeSubscription: any;

  beforeAll(async () => {
    await connectDatabase();
    
    // Créer les plans s'ils n'existent pas
    freePlan = await prisma.packages.findFirst({
      where: { name: 'Plan Gratuit' },
    });
    if (!freePlan) {
      freePlan = await createSubscriptionPlan(FIXTURES.FREE);
    }

    starterPlan = await prisma.packages.findFirst({
      where: { name: 'Plan Starter' },
    });
    if (!starterPlan) {
      starterPlan = await createSubscriptionPlan(FIXTURES.STARTER);
    }

    professionalPlan = await prisma.packages.findFirst({
      where: { name: 'Professional' },
    });
    if (!professionalPlan) {
      professionalPlan = await createSubscriptionPlan(FIXTURES.PROFESSIONAL);
    }

    // Créer une entreprise de test avec plan gratuit
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany.id);
    freeSubscription = await createSubscription(testCompany.id, freePlan.id, 'active');
  });

  afterAll(async () => {
    await cleanupTestData(testCompany.id);
    await prisma.$disconnect();
  });

  describe('3.1 - Vérification Plan Initial (Gratuit)', () => {
    it('devrait avoir le plan gratuit actif', async () => {
      const subscription = await prisma.subscriptions.findFirst({
        where: { company_id: testCompany.id, status: 'active' },
        include: { packages: true },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.packages.name).toBe('Plan Gratuit');
    });

    it('devrait avoir les limites du plan gratuit', async () => {
      const customersLimit = await quotaService.getLimit(testCompany.id, 'customers');
      const productsLimit = await quotaService.getLimit(testCompany.id, 'products');
      const invoicesLimit = await quotaService.getLimit(testCompany.id, 'invoices');
      const usersLimit = await quotaService.getLimit(testCompany.id, 'users');
      expect(customersLimit).toBe(10);
      expect(productsLimit).toBe(20);
      expect(invoicesLimit).toBe(50);
      expect(usersLimit).toBe(1);
    });
  });

  describe('3.2 - Upgrade vers Plan Starter', () => {
    it('devrait mettre à jour l\'abonnement vers Starter', async () => {
      const updated = await subscriptionService.upgrade(
        testCompany.id,
        starterPlan.id,
        testUser.id
      );

      expect(updated).toBeDefined();
      expect(updated.package_id).toBe(starterPlan.id);
    });

    it('devrait avoir les nouvelles limites du plan Starter', async () => {
      const customersLimit = await quotaService.getLimit(testCompany.id, 'customers');
      const productsLimit = await quotaService.getLimit(testCompany.id, 'products');
      const invoicesLimit = await quotaService.getLimit(testCompany.id, 'invoices');
      const usersLimit = await quotaService.getLimit(testCompany.id, 'users');
      expect(customersLimit).toBe(100);
      expect(productsLimit).toBe(500);
      expect(invoicesLimit).toBe(1000);
      expect(usersLimit).toBe(3);
    });

    it('devrait vérifier que l\'abonnement est actif', async () => {
      const subscription = await prisma.subscriptions.findFirst({
        where: { company_id: testCompany.id, status: 'active' },
        include: { packages: true },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.status).toBe('active');
      expect(subscription?.packages.name).toBe('Plan Starter');
    });
  });

  describe('3.3 - Upgrade vers Plan Professional', () => {
    it('devrait mettre à jour l\'abonnement vers Professional', async () => {
      const currentSubscription = await prisma.subscriptions.findFirst({
        where: { company_id: testCompany.id, status: 'active' },
      });

      const updated = await subscriptionService.upgrade(
        testCompany.id,
        professionalPlan.id,
        testUser.id
      );

      expect(updated).toBeDefined();
      expect(updated.package_id).toBe(professionalPlan.id);
    });

    it('devrait avoir les nouvelles limites du plan Professional', async () => {
      const customersLimit = await quotaService.getLimit(testCompany.id, 'customers');
      const productsLimit = await quotaService.getLimit(testCompany.id, 'products');
      const invoicesLimit = await quotaService.getLimit(testCompany.id, 'invoices');
      const usersLimit = await quotaService.getLimit(testCompany.id, 'users');
      expect(customersLimit).toBe(1000);
      expect(productsLimit).toBe(5000);
      expect(invoicesLimit).toBe(10000);
      expect(usersLimit).toBe(10);
    });

    it('devrait vérifier les fonctionnalités avancées', async () => {
      const subscription = await prisma.subscriptions.findFirst({
        where: { company_id: testCompany.id, status: 'active' },
        include: { packages: true },
      });

      const features = subscription?.packages.features as any;
      expect(features).toBeDefined();
      // Les features sont stockées comme un tableau dans les fixtures
      if (Array.isArray(features)) {
        expect(features).toContain('recurring_invoices');
        expect(features).toContain('advanced_reports');
      } else {
        // Si c'est un objet, vérifier les propriétés
        expect(features.recurring_invoices || features.includes?.('recurring_invoices')).toBeTruthy();
        expect(features.advanced_reports || features.includes?.('advanced_reports')).toBeTruthy();
      }
    });
  });

  describe('3.4 - Downgrade vers Plan Starter', () => {
    it('devrait permettre le downgrade vers Starter', async () => {
      const currentSubscription = await prisma.subscriptions.findFirst({
        where: { company_id: testCompany.id, status: 'active' },
      });

      const updated = await subscriptionService.upgrade(
        testCompany.id,
        starterPlan.id,
        testUser.id
      );

      expect(updated).toBeDefined();
      expect(updated.package_id).toBe(starterPlan.id);
    });

    it('devrait avoir les limites réduites du plan Starter', async () => {
      const customersLimit = await quotaService.getLimit(testCompany.id, 'customers');
      const productsLimit = await quotaService.getLimit(testCompany.id, 'products');
      const invoicesLimit = await quotaService.getLimit(testCompany.id, 'invoices');
      const usersLimit = await quotaService.getLimit(testCompany.id, 'users');
      expect(customersLimit).toBe(100);
      expect(productsLimit).toBe(500);
      expect(invoicesLimit).toBe(1000);
      expect(usersLimit).toBe(3);
    });
  });
});

