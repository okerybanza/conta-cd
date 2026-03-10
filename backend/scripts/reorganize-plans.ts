import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Réorganisation des 3 plans...\n');

  // ============================================
  // PLAN 1: STARTER (Gratuit)
  // ============================================
  console.log('📦 Mise à jour du plan STARTER...');
  await prisma.packages.updateMany({
    where: { code: 'STARTER' },
    data: {
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
        stock: false,
        hr: false,
      },
      is_active: true,
      display_order: 1,
      updated_at: new Date(),
    },
  });
  console.log('✅ Plan STARTER mis à jour\n');

  // ============================================
  // PLAN 2: PRO (20 000 CDF/mois)
  // ============================================
  console.log('📦 Mise à jour du plan PRO...');
  await prisma.packages.updateMany({
    where: { code: 'PRO' },
    data: {
      name: 'Pro',
      description: 'Pour les petites entreprises en croissance',
      price: new Prisma.Decimal('20000'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null, // Illimité
        users: 5,
        emails_per_month: 500,
        suppliers: 50,
        storage_mb: 2048, // 2 GB
        invoices: null, // Illimité
        expenses: 200, // 200 dépenses/mois
        recurring_invoices: null, // Illimité
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
      updated_at: new Date(),
    },
  });
  console.log('✅ Plan PRO mis à jour\n');

  // ============================================
  // PLAN 3: PREMIUM (50 000 CDF/mois)
  // ============================================
  console.log('📦 Mise à jour du plan PREMIUM...');
  await prisma.packages.updateMany({
    where: { code: 'PREMIUM' },
    data: {
      name: 'Premium',
      description: 'Solution complète pour les grandes entreprises',
      price: new Prisma.Decimal('50000'),
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null, // Illimité
        users: 20,
        emails_per_month: 2000,
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
        stock: true,
        hr: true,
      },
      is_active: true,
      display_order: 3,
      updated_at: new Date(),
    },
  });
  console.log('✅ Plan PREMIUM mis à jour\n');

  // ============================================
  // AFFICHAGE RÉCAPITULATIF
  // ============================================
  console.log('📊 Récapitulatif des plans mis à jour:\n');
  const packages = await prisma.packages.findMany({
    where: { code: { in: ['STARTER', 'PRO', 'PREMIUM'] } },
    orderBy: { display_order: 'asc' },
  });

  packages.forEach((pkg) => {
    console.log(`\n${pkg.name} (${pkg.code}) - ${pkg.price} ${pkg.currency}/mois`);
    console.log(`  Description: ${pkg.description}`);
    console.log(`  Features activées:`);
    const features = pkg.features as any;
    Object.entries(features).forEach(([key, value]) => {
      if (value === true) {
        console.log(`    ✅ ${key}`);
      }
    });
    console.log(`  Limites principales:`);
    const limits = pkg.limits as any;
    console.log(`    - Clients: ${limits.customers === null ? 'Illimité' : limits.customers}`);
    console.log(`    - Factures: ${limits.invoices === null ? 'Illimité' : limits.invoices}`);
    console.log(`    - Utilisateurs: ${limits.users === null ? 'Illimité' : limits.users}`);
    console.log(`    - Dépenses: ${limits.expenses === null ? 'Illimité' : limits.expenses}`);
    console.log(`    - Stockage: ${limits.storage_mb === null ? 'Illimité' : `${limits.storage_mb} MB`}`);
  });

  console.log('\n✅ Réorganisation terminée avec succès!');
}

main()
  .catch((error) => {
    console.error('❌ Erreur lors de la réorganisation:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
