/**
 * Script de reset minimal pour tests
 * 
 * Ce script :
 * 1. Supprime TOUTES les données utilisateurs/entreprises (sauf système)
 * 2. Recrée uniquement les plans STARTER, PRO, PREMIUM (pas FREE)
 * 3. Garde les éléments système (branding, system company, users Conta)
 */

import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';

// Charger le .env depuis le répertoire backend
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from '../src/config/database';
import logger from '../src/utils/logger';

async function resetDatabase() {
  logger.info('🧹 Nettoyage complet de la base de données...');

  try {
    // Supprimer toutes les entités dépendantes (dans l'ordre des contraintes FK)
    await prisma.journal_entry_lines.deleteMany({}).catch(() => {});
    await prisma.journal_entries.deleteMany({}).catch(() => {});
    await prisma.bank_transactions.deleteMany({}).catch(() => {});
    await prisma.bank_statements.deleteMany({}).catch(() => {});
    await prisma.payroll_items.deleteMany({}).catch(() => {});
    await prisma.payrolls.deleteMany({}).catch(() => {});
    await prisma.attendances.deleteMany({}).catch(() => {});
    await prisma.leave_requests.deleteMany({}).catch(() => {});
    await prisma.support_tickets.deleteMany({}).catch(() => {});
    await prisma.contracts.deleteMany({}).catch(() => {});
    await prisma.recurring_invoices.deleteMany({}).catch(() => {});
    await prisma.invoice_lines.deleteMany({});
    await prisma.payments.deleteMany({});
    await prisma.invoices.deleteMany({});
    await prisma.subscriptions.deleteMany({});
    await prisma.subscription_payments.deleteMany({});
    await prisma.customers.deleteMany({});
    await prisma.products.deleteMany({});
    await prisma.expense_categories.deleteMany({}).catch(() => {});
    await prisma.expenses.deleteMany({});
    await prisma.suppliers.deleteMany({});
    await prisma.employees.deleteMany({});
    await prisma.depreciations.deleteMany({}).catch(() => {});
    await prisma.assets.deleteMany({}).catch(() => {});
    await prisma.accounts.deleteMany({});
    await prisma.user_accountant_profiles.deleteMany({});
    await prisma.company_accountants.deleteMany({});
    await prisma.audit_logs.deleteMany({});
    await prisma.usage_metrics.deleteMany({}).catch(() => {});
    await prisma.onboarding_progress.deleteMany({}).catch(() => {});
  } catch (err: any) {
    logger.warn('Certaines entités n\'ont pas pu être supprimées (peut être normal):', err.message);
  }
  
  // Supprimer TOUS les utilisateurs non-Conta
  const deletedUsers = await prisma.users.deleteMany({
    where: {
      is_conta_user: false,
    },
  });
  logger.info(`   ✅ ${deletedUsers.count} utilisateurs supprimés`);

  // Supprimer TOUTES les entreprises (sauf système)
  const deletedCompanies = await prisma.companies.deleteMany({
    where: {
      is_system_company: false,
    },
  });
  logger.info(`   ✅ ${deletedCompanies.count} entreprises supprimées`);

  // Supprimer TOUS les packages (on va les recréer)
  const deletedPackages = await prisma.packages.deleteMany({});
  logger.info(`   ✅ ${deletedPackages.count} packages supprimés`);

  logger.info('✅ Base de données nettoyée');
}

async function createEssentialPackages() {
  logger.info('📦 Création des plans essentiels (STARTER, PRO, PREMIUM)...');

  const now = new Date();
  const packages = [
    {
      id: randomUUID(),
      code: 'STARTER',
      name: 'Starter',
      description: 'Parfait pour les petites entreprises',
      price: 50000,
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: 100,
        products: 500,
        users: 5,
        invoices: 1000,
        expenses: 500,
      },
      features: {
        expenses: true,
        accounting: true,
        reports: true,
        custom_branding: true,
      },
      is_active: true,
      display_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      code: 'PRO',
      name: 'Pro',
      description: 'Pour les entreprises en croissance',
      price: 150000,
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: 500,
        products: 2000,
        users: 15,
        invoices: 5000,
        expenses: 2000,
      },
      features: {
        expenses: true,
        accounting: true,
        reports: true,
        custom_branding: true,
      },
      is_active: true,
      display_order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      code: 'PREMIUM',
      name: 'Premium',
      description: 'Solution complète pour les grandes entreprises',
      price: 500000,
      currency: 'CDF',
      billing_cycle: 'monthly',
      limits: {
        customers: null, // Illimité
        products: null,
        users: null,
        invoices: null,
        expenses: null,
      },
      features: {
        expenses: true,
        accounting: true,
        reports: true,
        custom_branding: true,
      },
      is_active: true,
      display_order: 3,
      created_at: now,
      updated_at: now,
    },
  ];

  for (const pkgData of packages) {
    await prisma.packages.create({ data: pkgData });
    logger.info(`   ✅ Plan ${pkgData.code} créé`);
  }

  logger.info('✅ Plans essentiels créés');
}

async function main() {
  try {
    logger.info('🚀 Démarrage du reset minimal...');
    logger.info('⚠️  ATTENTION: Toutes les données utilisateurs/entreprises seront supprimées !');

    await resetDatabase();
    await createEssentialPackages();

    // Vérification finale
    const packagesCount = await prisma.packages.count();
    const usersCount = await prisma.users.count({
      where: { is_conta_user: false },
    });
    const companiesCount = await prisma.companies.count({
      where: { is_system_company: false },
    });

    logger.info('\n🎉 Reset terminé avec succès !');
    logger.info('\n📊 État final :');
    logger.info(`   - ${packagesCount} plans (STARTER, PRO, PREMIUM)`);
    logger.info(`   - ${usersCount} utilisateurs non-Conta`);
    logger.info(`   - ${companiesCount} entreprises non-système`);
    logger.info('\n✅ Base de données prête pour les tests !');

    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Erreur lors du reset:', error);
    console.error('❌ Erreur lors du reset:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
