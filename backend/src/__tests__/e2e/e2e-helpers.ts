// Helpers pour les tests E2E
// Fournit des fonctions utilitaires pour créer des données de test complètes

import prisma from '../../config/database';
import {
  createTestCompany,
  createTestUser,
  createTestCustomer,
  createTestProduct,
  cleanupTestData,
} from '../helpers/test-db';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

export interface E2EContext {
  superadmin?: any;
  companies: any[];
  users: any[];
  customers: any[];
  products: any[];
  subscriptions: any[];
  plans?: any[];
}

/**
 * Créer un superadmin pour les tests
 */
export async function createSuperadmin() {
  const hashedPassword = await bcrypt.hash('superadmin123', 10);
  const superadmin = await prisma.users.create({
    data: {
      id: randomUUID(),
      email: `superadmin-${Date.now()}@test.com`,
      password_hash: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'superadmin',
      is_super_admin: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return superadmin;
}

/**
 * Créer un plan d'abonnement
 */
export async function createSubscriptionPlan(data: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly';
  limits: {
    customers?: number;
    products?: number;
    invoices?: number;
    users?: number;
    storage?: number; // en MB
  };
  features?: string[];
  isActive?: boolean;
}) {
  // Le schéma packages utilise JSON pour limits et features
  const plan = await prisma.packages.create({
    data: {
      id: randomUUID(),
      code: `PLAN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: data.name,
      description: data.description || '',
      price: data.price,
      currency: data.currency || 'USD',
      billing_cycle: data.billingPeriod || 'monthly',
      limits: {
        customers: data.limits.customers || -1, // -1 = illimité
        products: data.limits.products || -1,
        invoices: data.limits.invoices || -1,
        users: data.limits.users || -1,
        storage: data.limits.storage || -1,
      },
      features: data.features || [],
      is_active: data.isActive !== false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return plan;
}

/**
 * Créer un abonnement pour une entreprise
 */
export async function createSubscription(companyId: string, planId: string, status: 'active' | 'cancelled' | 'expired' = 'active') {
  const subscription = await prisma.subscriptions.create({
    data: {
      id: randomUUID(),
      company_id: companyId,
      package_id: planId,
      status,
      billing_cycle: 'monthly',
      start_date: new Date(),
      end_date: status === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return subscription;
}

/**
 * Créer un contexte E2E complet
 */
export async function createE2EContext(): Promise<E2EContext> {
  const context: E2EContext = {
    companies: [],
    users: [],
    customers: [],
    products: [],
    subscriptions: [],
    plans: [],
  };

  // Créer superadmin
  context.superadmin = await createSuperadmin();

  return context;
}

/**
 * Nettoyer le contexte E2E
 */
export async function cleanupE2EContext(context: E2EContext) {
  // Nettoyer toutes les entreprises
  if (context.companies && context.companies.length > 0) {
    for (const company of context.companies) {
      await cleanupTestData(company.id).catch(() => {});
    }
  }

  // Supprimer le superadmin
  if (context.superadmin) {
    await prisma.users.delete({ where: { id: context.superadmin.id } }).catch(() => {});
  }

  // Supprimer les abonnements liés aux entreprises de test (évite les contraintes FK lors de suppression des plans)
  if (context.companies && context.companies.length > 0) {
    const companyIds = context.companies.map(c => c.id);
    await prisma.subscriptions.deleteMany({ where: { company_id: { in: companyIds } } }).catch(() => {});
  }

  // Supprimer les plans créés (supprimer d'abord les abonnements liés aux plans de test pour éviter les FK)
  const testPlans = await prisma.packages.findMany({ where: { name: { contains: 'Test' } }, select: { id: true } });
  if (testPlans.length > 0) {
    const planIds = testPlans.map(p => p.id);
    await prisma.subscriptions.deleteMany({ where: { package_id: { in: planIds } } }).catch(() => {});
  }

  await prisma.packages.deleteMany({
    where: {
      name: { contains: 'Test' },
    },
  }).catch(() => {});
}

/**
 * Attendre un certain temps (pour tests asynchrones)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Générer un email unique pour les tests
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Créer des données de test complètes pour une entreprise
 */
export async function createCompleteTestData(companyId: string, userId: string) {
  // Créer plusieurs clients
  const customers = [];
  for (let i = 0; i < 5; i++) {
    const customer = await createTestCustomer(companyId);
    customers.push(customer);
  }

  // Créer plusieurs produits
  const products = [];
  for (let i = 0; i < 5; i++) {
    const product = await createTestProduct(companyId);
    products.push(product);
  }

  return {
    customers,
    products,
  };
}

