/**
 * Script de seed pour créer les packages d'abonnement (version SQL directe)
 * Plans Entreprises : GRATUIT, PRO, EXPERT
 * Plans Experts Comptables : STARTER, PROFESSIONAL, ENTERPRISE
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding packages (SQL direct)...\n');

  // Plan GRATUIT
  const freeId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO packages (id, code, name, description, price, currency, billing_cycle, limits, features, is_active, display_order, created_at, updated_at)
    VALUES (
      ${freeId}::uuid,
      'FREE',
      'Gratuit',
      'Plan gratuit pour démarrer votre activité',
      0,
      'CDF',
      'monthly',
      '{"customers": 20, "products": null, "users": 1, "emails_per_month": 50, "sms_per_month": 0, "suppliers": 10, "storage_mb": 500, "invoices": 20, "expenses": 20, "recurring_invoices": 0}'::jsonb,
      '{"expenses": true, "accounting": false, "recurring_invoices": false, "api": false, "custom_templates": false, "multi_currency": false, "advanced_reports": false, "workflows": false, "custom_branding": false}'::jsonb,
      true,
      1,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      limits = EXCLUDED.limits,
      features = EXCLUDED.features,
      updated_at = NOW();
  `;
  console.log('✅ Package GRATUIT créé');

  // Plan PRO
  const proId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO packages (id, code, name, description, price, currency, billing_cycle, limits, features, is_active, display_order, created_at, updated_at)
    VALUES (
      ${proId}::uuid,
      'PRO',
      'Pro',
      'Pour les petites entreprises en croissance',
      20000,
      'CDF',
      'monthly',
      '{"customers": null, "products": null, "users": 5, "emails_per_month": 500, "sms_per_month": 200, "suppliers": 50, "storage_mb": 2048, "invoices": null, "expenses": 200, "recurring_invoices": 50}'::jsonb,
      '{"expenses": true, "accounting": true, "recurring_invoices": true, "api": false, "custom_templates": true, "multi_currency": true, "advanced_reports": true, "workflows": false, "custom_branding": false}'::jsonb,
      true,
      2,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      limits = EXCLUDED.limits,
      features = EXCLUDED.features,
      updated_at = NOW();
  `;
  console.log('✅ Package PRO créé');

  // Plan EXPERT
  const expertId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO packages (id, code, name, description, price, currency, billing_cycle, limits, features, is_active, display_order, created_at, updated_at)
    VALUES (
      ${expertId}::uuid,
      'EXPERT',
      'Expert',
      'Pour les moyennes et grandes entreprises',
      50000,
      'CDF',
      'monthly',
      '{"customers": null, "products": null, "users": 20, "emails_per_month": 2000, "sms_per_month": 1000, "suppliers": null, "storage_mb": 10240, "invoices": null, "expenses": null, "recurring_invoices": null}'::jsonb,
      '{"expenses": true, "accounting": true, "recurring_invoices": true, "api": true, "custom_templates": true, "multi_currency": true, "advanced_reports": true, "workflows": true, "custom_branding": true}'::jsonb,
      true,
      3,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      limits = EXCLUDED.limits,
      features = EXCLUDED.features,
      updated_at = NOW();
  `;
  console.log('✅ Package EXPERT créé');

  // Plan Expert Comptable - Starter
  const accountantStarterId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO packages (id, code, name, description, price, currency, billing_cycle, limits, features, is_active, display_order, created_at, updated_at)
    VALUES (
      ${accountantStarterId}::uuid,
      'ACCOUNTANT_STARTER',
      'Expert Comptable - Starter',
      'Pour les experts comptables gérant jusqu''à 5 entreprises',
      30000,
      'CDF',
      'monthly',
      '{"customers": null, "products": null, "users": null, "emails_per_month": 1000, "sms_per_month": 500, "suppliers": null, "storage_mb": 5120, "invoices": null, "expenses": null, "recurring_invoices": null, "managed_companies": 5}'::jsonb,
      '{"expenses": true, "accounting": true, "recurring_invoices": true, "api": false, "custom_templates": true, "multi_currency": true, "advanced_reports": true, "workflows": false, "custom_branding": false, "multi_companies": true, "consolidated_reports": false}'::jsonb,
      true,
      4,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      limits = EXCLUDED.limits,
      features = EXCLUDED.features,
      updated_at = NOW();
  `;
  console.log('✅ Package Expert Comptable - Starter créé');

  // Plan Expert Comptable - Professional
  const accountantProfessionalId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO packages (id, code, name, description, price, currency, billing_cycle, limits, features, is_active, display_order, created_at, updated_at)
    VALUES (
      ${accountantProfessionalId}::uuid,
      'ACCOUNTANT_PROFESSIONAL',
      'Expert Comptable - Professional',
      'Pour les experts comptables gérant jusqu''à 15 entreprises',
      60000,
      'CDF',
      'monthly',
      '{"customers": null, "products": null, "users": null, "emails_per_month": 2000, "sms_per_month": 1000, "suppliers": null, "storage_mb": 10240, "invoices": null, "expenses": null, "recurring_invoices": null, "managed_companies": 15}'::jsonb,
      '{"expenses": true, "accounting": true, "recurring_invoices": true, "api": false, "custom_templates": true, "multi_currency": true, "advanced_reports": true, "workflows": true, "custom_branding": true, "multi_companies": true, "consolidated_reports": true}'::jsonb,
      true,
      5,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      limits = EXCLUDED.limits,
      features = EXCLUDED.features,
      updated_at = NOW();
  `;
  console.log('✅ Package Expert Comptable - Professional créé');

  // Plan Expert Comptable - Enterprise
  const accountantEnterpriseId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO packages (id, code, name, description, price, currency, billing_cycle, limits, features, is_active, display_order, created_at, updated_at)
    VALUES (
      ${accountantEnterpriseId}::uuid,
      'ACCOUNTANT_ENTERPRISE',
      'Expert Comptable - Enterprise',
      'Pour les experts comptables gérant un nombre illimité d''entreprises',
      100000,
      'CDF',
      'monthly',
      '{"customers": null, "products": null, "users": null, "emails_per_month": null, "sms_per_month": null, "suppliers": null, "storage_mb": 20480, "invoices": null, "expenses": null, "recurring_invoices": null, "managed_companies": null}'::jsonb,
      '{"expenses": true, "accounting": true, "recurring_invoices": true, "api": true, "custom_templates": true, "multi_currency": true, "advanced_reports": true, "workflows": true, "custom_branding": true, "multi_companies": true, "consolidated_reports": true}'::jsonb,
      true,
      6,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      limits = EXCLUDED.limits,
      features = EXCLUDED.features,
      updated_at = NOW();
  `;
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

