import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding packages...');

  // Package Essentiel
  const essential = await prisma.package.upsert({
    where: { code: 'essential' },
    update: {},
    create: {
      code: 'essential',
      name: 'Conta Essentiel',
      description: 'La facturation simple et professionnelle pour démarrer votre activité',
      price: new Prisma.Decimal('9900'),
      currency: 'CDF',
      limits: {
        customers: 50,
        products: 100,
        users: 1,
        emails_per_month: 50,
        sms_per_month: 0,
        suppliers: 0,
        storage_mb: 500,
        invoices: null, // illimité
        expenses: 0,
        recurring_invoices: 0,
      },
      features: {
        expenses: true, // Activé pour le développement/test
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

  console.log('✅ Package Essentiel créé');

  // Package Professionnel
  const professional = await prisma.package.upsert({
    where: { code: 'professional' },
    update: {},
    create: {
      code: 'professional',
      name: 'Conta Professionnel',
      description: 'Gérez votre comptabilité complète avec factures, dépenses et rapports',
      price: new Prisma.Decimal('19900'),
      currency: 'CDF',
      limits: {
        customers: null, // illimité
        products: null, // illimité
        users: 5,
        emails_per_month: null, // illimité
        sms_per_month: 100,
        suppliers: 50,
        storage_mb: 5120, // 5 GB
        invoices: null, // illimité
        expenses: null, // illimité
        recurring_invoices: null, // illimité
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: true, // limité
        custom_templates: false,
        multi_currency: false,
        advanced_reports: true,
        workflows: false,
        custom_branding: false,
      },
      isActive: true,
      displayOrder: 2,
    },
  });

  console.log('✅ Package Professionnel créé');

  // Package Entreprise
  const enterprise = await prisma.package.upsert({
    where: { code: 'enterprise' },
    update: {},
    create: {
      code: 'enterprise',
      name: 'Conta Entreprise',
      description: 'Solution ERP complète pour grandes entreprises avec support dédié',
      price: new Prisma.Decimal('49900'),
      currency: 'CDF',
      limits: {
        customers: null, // illimité
        products: null, // illimité
        users: null, // illimité
        emails_per_month: null, // illimité
        sms_per_month: null, // illimité
        suppliers: null, // illimité
        storage_mb: 51200, // 50 GB
        invoices: null, // illimité
        expenses: null, // illimité
        recurring_invoices: null, // illimité
      },
      features: {
        expenses: true,
        accounting: true,
        recurring_invoices: true,
        api: true, // complète
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

  console.log('✅ Package Entreprise créé');

  console.log('🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

