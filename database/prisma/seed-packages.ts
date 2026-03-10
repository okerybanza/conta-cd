/**
 * Script de seed pour créer les packages d'abonnement
 * Plans Entreprises : GRATUIT, PRO, EXPERT
 * Plans Experts Comptables : STARTER, PROFESSIONAL, ENTERPRISE
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding packages...\n');

  // ============================================
  // PLANS ENTREPRISES
  // ============================================

  // Plan GRATUIT
  const free = await prisma.package.upsert({
    where: { code: 'FREE' },
    update: {
      name: 'Gratuit',
      description: 'Plan gratuit pour démarrer votre activité',
      price: new Prisma.Decimal('0'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: 20,
        products: null, // Illimité
        users: 1,
        emails_per_month: 50,
        sms_per_month: 0,
        suppliers: 10,
        storage_mb: 500,
        invoices: 20, // 20 factures/mois
        expenses: 20, // 20 dépenses/mois
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
      },
      isActive: true,
      displayOrder: 1,
    },
    create: {
      code: 'FREE',
      name: 'Gratuit',
      description: 'Plan gratuit pour démarrer votre activité',
      price: new Prisma.Decimal('0'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: 20,
        products: null, // Illimité
        users: 1,
        emails_per_month: 50,
        sms_per_month: 0,
        suppliers: 10,
        storage_mb: 500,
        invoices: 20, // 20 factures/mois
        expenses: 20, // 20 dépenses/mois
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
      },
      isActive: true,
      displayOrder: 1,
    },
  });
  console.log('✅ Package GRATUIT créé');

  // Plan PRO
  const pro = await prisma.package.upsert({
    where: { code: 'PRO' },
    update: {
      name: 'Pro',
      description: 'Pour les petites entreprises en croissance',
      price: new Prisma.Decimal('20000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null, // Illimité
        users: 5,
        emails_per_month: 500,
        sms_per_month: 200,
        suppliers: 50,
        storage_mb: 2048, // 2 GB
        invoices: null, // Illimité
        expenses: 200, // 200 dépenses/mois
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
      },
      isActive: true,
      displayOrder: 2,
    },
    create: {
      code: 'PRO',
      name: 'Pro',
      description: 'Pour les petites entreprises en croissance',
      price: new Prisma.Decimal('20000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null, // Illimité
        users: 5,
        emails_per_month: 500,
        sms_per_month: 200,
        suppliers: 50,
        storage_mb: 2048, // 2 GB
        invoices: null, // Illimité
        expenses: 200, // 200 dépenses/mois
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
      },
      isActive: true,
      displayOrder: 2,
    },
  });
  console.log('✅ Package PRO créé');

  // Plan EXPERT
  const expert = await prisma.package.upsert({
    where: { code: 'EXPERT' },
    update: {
      name: 'Expert',
      description: 'Pour les moyennes et grandes entreprises',
      price: new Prisma.Decimal('50000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null, // Illimité
        users: 20,
        emails_per_month: 2000,
        sms_per_month: 1000,
        suppliers: null, // Illimité
        storage_mb: 10240, // 10 GB
        invoices: null, // Illimité
        expenses: null, // Illimité
        recurring_invoices: null, // Illimité
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
      },
      isActive: true,
      displayOrder: 3,
    },
    create: {
      code: 'EXPERT',
      name: 'Expert',
      description: 'Pour les moyennes et grandes entreprises',
      price: new Prisma.Decimal('50000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null, // Illimité
        users: 20,
        emails_per_month: 2000,
        sms_per_month: 1000,
        suppliers: null, // Illimité
        storage_mb: 10240, // 10 GB
        invoices: null, // Illimité
        expenses: null, // Illimité
        recurring_invoices: null, // Illimité
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
      },
      isActive: true,
      displayOrder: 3,
    },
  });
  console.log('✅ Package EXPERT créé');

  // ============================================
  // PLANS EXPERTS COMPTABLES
  // ============================================

  // Plan Expert Comptable - Starter
  const accountantStarter = await prisma.package.upsert({
    where: { code: 'ACCOUNTANT_STARTER' },
    update: {
      name: 'Expert Comptable - Starter',
      description: 'Pour les experts comptables gérant jusqu\'à 5 entreprises',
      price: new Prisma.Decimal('30000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité par entreprise
        products: null, // Illimité par entreprise
        users: null, // Illimité par entreprise
        emails_per_month: 1000,
        sms_per_month: 500,
        suppliers: null, // Illimité par entreprise
        storage_mb: 5120, // 5 GB
        invoices: null, // Illimité par entreprise
        expenses: null, // Illimité par entreprise
        recurring_invoices: null, // Illimité par entreprise
        managed_companies: 5, // Limite spécifique aux experts comptables
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
        multi_companies: true, // Fonctionnalité multi-entreprises
        consolidated_reports: false,
      },
      isActive: true,
      displayOrder: 4,
    },
    create: {
      code: 'ACCOUNTANT_STARTER',
      name: 'Expert Comptable - Starter',
      description: 'Pour les experts comptables gérant jusqu\'à 5 entreprises',
      price: new Prisma.Decimal('30000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité par entreprise
        products: null, // Illimité par entreprise
        users: null, // Illimité par entreprise
        emails_per_month: 1000,
        sms_per_month: 500,
        suppliers: null, // Illimité par entreprise
        storage_mb: 5120, // 5 GB
        invoices: null, // Illimité par entreprise
        expenses: null, // Illimité par entreprise
        recurring_invoices: null, // Illimité par entreprise
        managed_companies: 5, // Limite spécifique aux experts comptables
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
        multi_companies: true, // Fonctionnalité multi-entreprises
        consolidated_reports: false,
      },
      isActive: true,
      displayOrder: 4,
    },
  });
  console.log('✅ Package Expert Comptable - Starter créé');

  // Plan Expert Comptable - Professional
  const accountantProfessional = await prisma.package.upsert({
    where: { code: 'ACCOUNTANT_PROFESSIONAL' },
    update: {
      name: 'Expert Comptable - Professional',
      description: 'Pour les experts comptables gérant jusqu\'à 15 entreprises',
      price: new Prisma.Decimal('60000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité par entreprise
        products: null, // Illimité par entreprise
        users: null, // Illimité par entreprise
        emails_per_month: 2000,
        sms_per_month: 1000,
        suppliers: null, // Illimité par entreprise
        storage_mb: 10240, // 10 GB
        invoices: null, // Illimité par entreprise
        expenses: null, // Illimité par entreprise
        recurring_invoices: null, // Illimité par entreprise
        managed_companies: 15, // Limite spécifique aux experts comptables
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: false,
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: true,
        custom_branding: true,
        multi_companies: true,
        consolidated_reports: true, // Rapports consolidés
      },
      isActive: true,
      displayOrder: 5,
    },
    create: {
      code: 'ACCOUNTANT_PROFESSIONAL',
      name: 'Expert Comptable - Professional',
      description: 'Pour les experts comptables gérant jusqu\'à 15 entreprises',
      price: new Prisma.Decimal('60000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité par entreprise
        products: null, // Illimité par entreprise
        users: null, // Illimité par entreprise
        emails_per_month: 2000,
        sms_per_month: 1000,
        suppliers: null, // Illimité par entreprise
        storage_mb: 10240, // 10 GB
        invoices: null, // Illimité par entreprise
        expenses: null, // Illimité par entreprise
        recurring_invoices: null, // Illimité par entreprise
        managed_companies: 15, // Limite spécifique aux experts comptables
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: false,
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: true,
        custom_branding: true,
        multi_companies: true,
        consolidated_reports: true, // Rapports consolidés
      },
      isActive: true,
      displayOrder: 5,
    },
  });
  console.log('✅ Package Expert Comptable - Professional créé');

  // Plan Expert Comptable - Enterprise
  const accountantEnterprise = await prisma.package.upsert({
    where: { code: 'ACCOUNTANT_ENTERPRISE' },
    update: {
      name: 'Expert Comptable - Enterprise',
      description: 'Pour les experts comptables gérant un nombre illimité d\'entreprises',
      price: new Prisma.Decimal('100000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité par entreprise
        products: null, // Illimité par entreprise
        users: null, // Illimité par entreprise
        emails_per_month: null, // Illimité
        sms_per_month: null, // Illimité
        suppliers: null, // Illimité par entreprise
        storage_mb: 20480, // 20 GB
        invoices: null, // Illimité par entreprise
        expenses: null, // Illimité par entreprise
        recurring_invoices: null, // Illimité par entreprise
        managed_companies: null, // Illimité
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: true, // API complète
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: true,
        custom_branding: true,
        multi_companies: true,
        consolidated_reports: true,
      },
      isActive: true,
      displayOrder: 6,
    },
    create: {
      code: 'ACCOUNTANT_ENTERPRISE',
      name: 'Expert Comptable - Enterprise',
      description: 'Pour les experts comptables gérant un nombre illimité d\'entreprises',
      price: new Prisma.Decimal('100000'),
      currency: 'CDF',
      billingCycle: 'monthly',
      limits: {
        customers: null, // Illimité par entreprise
        products: null, // Illimité par entreprise
        users: null, // Illimité par entreprise
        emails_per_month: null, // Illimité
        sms_per_month: null, // Illimité
        suppliers: null, // Illimité par entreprise
        storage_mb: 20480, // 20 GB
        invoices: null, // Illimité par entreprise
        expenses: null, // Illimité par entreprise
        recurring_invoices: null, // Illimité par entreprise
        managed_companies: null, // Illimité
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: true, // API complète
        custom_templates: true,
        multi_currency: true,
        advanced_reports: true,
        workflows: true,
        custom_branding: true,
        multi_companies: true,
        consolidated_reports: true,
      },
      isActive: true,
      displayOrder: 6,
    },
  });
  console.log('✅ Package Expert Comptable - Enterprise créé');

  console.log('\n🎉 Seeding des packages terminé avec succès!');
  console.log('\n📦 Packages créés :');
  console.log('  • GRATUIT (0 CDF/mois)');
  console.log('  • PRO (20 000 CDF/mois)');
  console.log('  • EXPERT (50 000 CDF/mois)');
  console.log('  • ACCOUNTANT_STARTER (30 000 CDF/mois)');
  console.log('  • ACCOUNTANT_PROFESSIONAL (60 000 CDF/mois)');
  console.log('  • ACCOUNTANT_ENTERPRISE (100 000 CDF/mois)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

