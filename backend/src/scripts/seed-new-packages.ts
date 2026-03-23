/**
 * Script de migration pour créer les nouveaux plans d'abonnement
 * Plans : STARTER, PRO, PREMIUM
 * 
 * STARTER : Gratuit, limité à 10 factures, pas de HR, pas de comptabilité, Stock non visible
 * PRO : Tout de Starter + comptabilité
 * PREMIUM : Toutes les fonctionnalités
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

// Charger les variables d'environnement depuis le .env du backend
config({ path: resolve(__dirname, '../../.env') });

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migration des plans d\'abonnement...\n');

  // ============================================
  // ÉTAPE 1 : Sauvegarder les abonnements existants
  // ============================================
  console.log('📋 Récupération des abonnements existants...');
  const existingSubscriptions = await prisma.subscriptions.findMany({
    include: {
      packages: true,
    },
  });

  console.log(`   Trouvé ${existingSubscriptions.length} abonnement(s) existant(s)\n`);

  // Mapping des anciens plans vers les nouveaux
  const planMapping: Record<string, string> = {
    'FREE': 'STARTER',
    'GRATUIT': 'STARTER',
    'PRO': 'PRO',
    'EXPERT': 'PREMIUM',
    'PREMIUM': 'PREMIUM',
    'STARTER': 'STARTER', // Plans experts comptables -> Starter
    'PROFESSIONAL': 'PRO',
    'ENTERPRISE': 'PREMIUM',
  };

  // ============================================
  // ÉTAPE 2 : Désactiver tous les anciens plans
  // ============================================
  console.log('🚫 Désactivation des anciens plans...');
  await prisma.packages.updateMany({
    where: {
      is_active: true,
    },
    data: {
      is_active: false,
    },
  });
  console.log('   ✅ Anciens plans désactivés\n');

  // ============================================
  // ÉTAPE 3 : Créer les nouveaux plans
  // ============================================

  // Plan STARTER
  const starter = await prisma.packages.upsert({
    where: { code: 'STARTER' },
    update: {
      name: 'Starter',
      description: 'Plan gratuit pour démarrer votre activité',
      price: new Prisma.Decimal('0'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: 20,
        products: null, // Illimité
        users: 1,
        emails_per_month: 50,
        sms_per_month: 0,
        suppliers: 10,
        storage_mb: 500,
        invoices: 10, // 10 factures/mois (limite)
        expenses: 20,
        recurring_invoices: 0,
      },
      features: {
        expenses: true,
        accounting: false, // Pas de comptabilité
        recurring_invoices: false,
        api: false,
        custom_templates: false,
        multi_currency: false,
        advanced_reports: false,
        workflows: false,
        custom_branding: false,
        stock: false, // Stock non visible
        hr: false, // Pas de HR
      },
      is_active: true,
      display_order: 1,
      updated_at: new Date(),
    },
    create: {
      id: randomUUID(),
      code: 'STARTER',
      name: 'Starter',
      description: 'Plan gratuit pour démarrer votre activité',
      price: new Prisma.Decimal('0'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: 20,
        products: null,
        users: 1,
        emails_per_month: 50,
        sms_per_month: 0,
        suppliers: 10,
        storage_mb: 500,
        invoices: 10,
        expenses: 20,
        recurring_invoices: 0,
      },
      features: {
        expenses: true,
        accounting: false,
        recurring_invoices: false,
        api: false,
        custom_templates: false,
        multi_currency: false,
        advanced_reports: false,
        workflows: false,
        custom_branding: false,
        stock: false,
        hr: false,
      },
      is_active: true,
      display_order: 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log('✅ Plan STARTER créé');

  // Plan PRO
  const pro = await prisma.packages.upsert({
    where: { code: 'PRO' },
    update: {
      name: 'Pro',
      description: 'Pour les petites entreprises en croissance',
      price: new Prisma.Decimal('20000'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null,
        users: 5,
        emails_per_month: 500,
        sms_per_month: 200,
        suppliers: 50,
        storage_mb: 2048,
        invoices: null, // Illimité
        expenses: 200,
        recurring_invoices: 50,
      },
      features: {
        expenses: true,
        accounting: true, // Comptabilité activée
        recurring_invoices: true,
        api: false,
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: false,
        custom_branding: false,
        stock: false, // Stock non visible
        hr: false, // Pas de HR
      },
      is_active: true,
      display_order: 2,
      updated_at: new Date(),
    },
    create: {
      id: randomUUID(),
      code: 'PRO',
      name: 'Pro',
      description: 'Pour les petites entreprises en croissance',
      price: new Prisma.Decimal('20000'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: null,
        products: null,
        users: 5,
        emails_per_month: 500,
        sms_per_month: 200,
        suppliers: 50,
        storage_mb: 2048,
        invoices: null,
        expenses: 200,
        recurring_invoices: 50,
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: false,
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: false,
        custom_branding: false,
        stock: false,
        hr: false,
      },
      is_active: true,
      display_order: 2,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log('✅ Plan PRO créé');

  // Plan PREMIUM
  const premium = await prisma.packages.upsert({
    where: { code: 'PREMIUM' },
    update: {
      name: 'Premium',
      description: 'Toutes les fonctionnalités pour votre entreprise',
      price: new Prisma.Decimal('50000'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: null,
        products: null,
        users: 20,
        emails_per_month: 2000,
        sms_per_month: 1000,
        suppliers: null,
        storage_mb: 10240,
        invoices: null,
        expenses: null,
        recurring_invoices: null,
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: true,
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: true,
        custom_branding: true,
        stock: true, // Stock visible
        hr: true, // HR activé
      },
      is_active: true,
      display_order: 3,
      updated_at: new Date(),
    },
    create: {
      id: randomUUID(),
      code: 'PREMIUM',
      name: 'Premium',
      description: 'Toutes les fonctionnalités pour votre entreprise',
      price: new Prisma.Decimal('50000'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: null,
        products: null,
        users: 20,
        emails_per_month: 2000,
        sms_per_month: 1000,
        suppliers: null,
        storage_mb: 10240,
        invoices: null,
        expenses: null,
        recurring_invoices: null,
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: true,
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: true,
        custom_branding: true,
        stock: true,
        hr: true,
      },
      is_active: true,
      display_order: 3,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log('✅ Plan PREMIUM créé\n');

  // ============================================
  // ÉTAPE 4 : Réaffecter les abonnements existants
  // ============================================
  console.log('🔄 Réaffectation des abonnements existants...');
  
  const newPlans = {
    STARTER: starter.id,
    PRO: pro.id,
    PREMIUM: premium.id,
  };

  let reassigned = 0;
  for (const subscription of existingSubscriptions) {
    const oldCode = subscription.packages.code.toUpperCase();
    const newCode = planMapping[oldCode] || 'STARTER'; // Par défaut Starter si non trouvé
    
    const newPackageId = newPlans[newCode as keyof typeof newPlans];
    
    if (newPackageId) {
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          package_id: newPackageId,
          updated_at: new Date(),
        },
      });
      console.log(`   ✅ Abonnement ${subscription.company_id} : ${oldCode} → ${newCode}`);
      reassigned++;
    } else {
      console.log(`   ⚠️  Abonnement ${subscription.company_id} : ${oldCode} → STARTER (par défaut)`);
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          package_id: newPlans.STARTER,
          updated_at: new Date(),
        },
      });
      reassigned++;
    }
  }

  console.log(`\n✅ ${reassigned} abonnement(s) réaffecté(s)\n`);

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log('🎉 Migration terminée avec succès!\n');
  console.log('📦 Plans créés :');
  console.log('   1. STARTER - Gratuit (10 factures, pas de HR, pas de comptabilité, pas de stock)');
  console.log('   2. PRO - 20 000 CDF/mois (Starter + comptabilité)');
  console.log('   3. PREMIUM - 50 000 CDF/mois (Toutes les fonctionnalités)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
