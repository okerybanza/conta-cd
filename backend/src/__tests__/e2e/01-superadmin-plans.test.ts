// Scénario E2E 1: Superadmin & Plans
// Teste le workflow complet de création et gestion des plans d'abonnement

import prisma from '../../config/database';
import {
  createSuperadmin,
  createSubscriptionPlan,
  createE2EContext,
  cleanupE2EContext,
} from './e2e-helpers';
import { PLAN_FIXTURES as FIXTURES } from './e2e-fixtures';
import { connectDatabase } from '../../config/database';

describe('E2E Scénario 1: Superadmin & Plans', () => {
  let context: any;

  beforeAll(async () => {
    // S'assurer que la connexion DB fonctionne
    await connectDatabase();
    context = await createE2EContext();
  });

  afterAll(async () => {
    await cleanupE2EContext(context);
    await prisma.$disconnect();
  });

  describe('1.1 - Connexion Superadmin', () => {
    it('devrait créer un superadmin', async () => {
      const superadmin = await createSuperadmin();
      expect(superadmin).toBeDefined();
      expect(superadmin.role).toBe('superadmin');
      expect(superadmin.email).toContain('superadmin');
      context.superadmin = superadmin;
    });
  });

  describe('1.2 - Création des Plans', () => {
    let freePlan: any;
    let starterPlan: any;
    let professionalPlan: any;
    let enterprisePlan: any;

    it('devrait créer le plan gratuit', async () => {
      freePlan = await createSubscriptionPlan(FIXTURES.FREE);
      expect(freePlan).toBeDefined();
      expect(freePlan.name).toBe('Plan Gratuit');
      expect(Number(freePlan.price)).toBe(0);
      expect(freePlan.limits).toBeDefined();
      expect(freePlan.limits.customers).toBe(10);
      expect(freePlan.limits.invoices).toBe(50);
      context.plans = [freePlan];
    });

    it('devrait créer le plan Starter', async () => {
      starterPlan = await createSubscriptionPlan(FIXTURES.STARTER);
      expect(starterPlan).toBeDefined();
      expect(starterPlan.name).toBe('Plan Starter');
      expect(Number(starterPlan.price)).toBe(29.99);
      expect(starterPlan.limits.customers).toBe(100);
      expect(starterPlan.limits.invoices).toBe(1000);
      context.plans.push(starterPlan);
    });

    it('devrait créer le plan Professional', async () => {
      professionalPlan = await createSubscriptionPlan(FIXTURES.PROFESSIONAL);
      expect(professionalPlan).toBeDefined();
      expect(professionalPlan.name).toBe('Plan Professional');
      expect(Number(professionalPlan.price)).toBe(99.99);
      expect(professionalPlan.limits.customers).toBe(1000);
      expect(professionalPlan.limits.invoices).toBe(10000);
      context.plans.push(professionalPlan);
    });

    it('devrait créer le plan Enterprise', async () => {
      enterprisePlan = await createSubscriptionPlan(FIXTURES.ENTERPRISE);
      expect(enterprisePlan).toBeDefined();
      expect(enterprisePlan.name).toBe('Plan Enterprise');
      expect(Number(enterprisePlan.price)).toBe(299.99);
      expect(enterprisePlan.limits.customers).toBe(-1); // Illimité
      expect(enterprisePlan.limits.invoices).toBe(-1);
      context.plans.push(enterprisePlan);
    });

    it('devrait lister tous les plans créés', async () => {
      const plans = await prisma.packages.findMany({
        where: {
          name: {
            in: ['Plan Gratuit', 'Plan Starter', 'Plan Professional', 'Plan Enterprise'],
          },
        },
        orderBy: { price: 'asc' },
      });

      expect(plans.length).toBeGreaterThanOrEqual(4);
      // Vérifier que les plans sont triés par prix
      const sortedPlans = plans.sort((a, b) => Number(a.price) - Number(b.price));
      expect(Number(sortedPlans[0].price)).toBe(0); // Plan gratuit
      expect(Number(sortedPlans[sortedPlans.length - 1].price)).toBeGreaterThan(100); // Plan enterprise
    });
  });

  describe('1.3 - Vérification des Limites', () => {
    it('devrait vérifier les limites du plan gratuit', async () => {
      const freePlan = await prisma.packages.findFirst({
        where: { name: 'Plan Gratuit' },
      });

      expect(freePlan).toBeDefined();
      expect(freePlan?.limits).toBeDefined();
      const limits = freePlan?.limits as any;
      expect(limits.customers).toBe(10);
      expect(limits.products).toBe(20);
      expect(limits.invoices).toBe(50);
      expect(limits.users).toBe(1);
      expect(limits.storage).toBe(100);
    });

    it('devrait vérifier les limites du plan Enterprise (illimité)', async () => {
      const enterprisePlan = await prisma.packages.findFirst({
        where: { name: 'Plan Enterprise' },
      });

      expect(enterprisePlan).toBeDefined();
      const limits = enterprisePlan?.limits as any;
      expect(limits.customers).toBe(-1); // Illimité
      expect(limits.invoices).toBe(-1);
      expect(limits.users).toBe(-1);
    });
  });

  describe('1.4 - Mise à Jour des Plans', () => {
    it('devrait mettre à jour un plan', async () => {
      const plan = await prisma.packages.findFirst({
        where: { name: 'Plan Starter' },
      });

      if (plan) {
        const updated = await prisma.packages.update({
          where: { id: plan.id },
          data: {
            description: 'Plan Starter mis à jour',
            updated_at: new Date(),
          },
        });

        expect(updated.description).toBe('Plan Starter mis à jour');
      }
    });
  });

  describe('1.5 - Désactivation de Plans', () => {
    it('devrait désactiver un plan', async () => {
      const plan = await prisma.packages.findFirst({
        where: { name: 'Plan Gratuit' },
      });

      if (plan) {
        const updated = await prisma.packages.update({
          where: { id: plan.id },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        });

        expect(updated.is_active).toBe(false);

        // Vérifier qu'il n'apparaît plus dans les plans actifs
        const activePlans = await prisma.packages.findMany({
          where: { is_active: true },
        });

        const freePlanInActive = activePlans.find(p => p.id === plan.id);
        expect(freePlanInActive).toBeUndefined();
      }
    });

    it('devrait réactiver un plan', async () => {
      const plan = await prisma.packages.findFirst({
        where: { name: 'Plan Gratuit' },
      });

      if (plan) {
        const updated = await prisma.packages.update({
          where: { id: plan.id },
          data: {
            is_active: true,
            updated_at: new Date(),
          },
        });

        expect(updated.is_active).toBe(true);
      }
    });
  });

  describe('1.6 - Vérification des Fonctionnalités', () => {
    it('devrait vérifier les fonctionnalités de chaque plan', async () => {
      const plans = await prisma.packages.findMany({
        where: {
          name: {
            in: ['Plan Gratuit', 'Plan Starter', 'Plan Professional', 'Plan Enterprise'],
          },
        },
      });

      for (const plan of plans) {
        expect(plan.features).toBeDefined();
        const features = plan.features as any;
        expect(Array.isArray(features) || typeof features === 'object').toBe(true);

        // Le plan Enterprise devrait avoir le plus de fonctionnalités
        if (plan.name === 'Plan Enterprise') {
          expect(features.length || Object.keys(features).length).toBeGreaterThan(3);
        }
      }
    });
  });
});

