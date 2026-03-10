/**
 * Script de nettoyage et de remplissage avec des données de test cohérentes
 * 
 * Ce script :
 * 1. Vide toutes les données (sauf les utilisateurs Conta et le branding)
 * 2. Crée des données de test cohérentes et interconnectées
 * 3. Vérifie que toutes les relations fonctionnent correctement
 */

// Charger les variables d'environnement
import dotenv from 'dotenv';
import path from 'path';

// Charger le .env depuis le répertoire backend
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from '../src/config/database';
import logger from '../src/utils/logger';
import bcrypt from 'bcrypt';

interface SeedData {
  packages: any[];
  companies: any[];
  users: any[];
  subscriptions: any[];
  subscriptionPayments: any[];
  customers: any[];
  invoices: any[];
  products: any[];
  expenses: any[];
  accountants: any[];
}

async function resetDatabase() {
  logger.info('🧹 Nettoyage de la base de données...');

  // Ordre de suppression important (respecter les contraintes de clés étrangères)
  // Supprimer d'abord les entités dépendantes, puis les entités principales
  
  try {
    // Entités avec dépendances multiples (utiliser try/catch pour ignorer les erreurs si le modèle n'existe pas)
    await prisma.journalEntryLine.deleteMany({}).catch(() => {});
    await prisma.journalEntry.deleteMany({}).catch(() => {});
    await prisma.bankTransaction.deleteMany({}).catch(() => {});
    await prisma.bankStatement.deleteMany({}).catch(() => {});
    await prisma.payrollItem.deleteMany({}).catch(() => {});
    await prisma.payroll.deleteMany({}).catch(() => {});
    await prisma.attendance.deleteMany({}).catch(() => {});
    await prisma.leaveRequest.deleteMany({}).catch(() => {});
    await prisma.supportTicket.deleteMany({}).catch(() => {});
    await prisma.contract.deleteMany({}).catch(() => {});
    await prisma.recurringInvoice.deleteMany({}).catch(() => {});
    await prisma.invoiceLine.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.expenseCategory.deleteMany({}).catch(() => {});
    await prisma.expense.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.depreciation.deleteMany({}).catch(() => {});
    await prisma.asset.deleteMany({}).catch(() => {});
    await prisma.account.deleteMany({});
    await prisma.userAccountantProfile.deleteMany({});
    await prisma.companyAccountant.deleteMany({});
  } catch (err) {
    logger.warn('Certaines entités n\'ont pas pu être supprimées (peut être normal):', err);
  }
  
  // Supprimer les utilisateurs non-Conta
  await prisma.user.deleteMany({
    where: {
      isContaUser: false,
    },
  });

  // Supprimer les entreprises (sauf système)
  await prisma.company.deleteMany({
    where: {
      isSystemCompany: false,
    },
  });

  // Supprimer les packages (sauf FREE s'il existe)
  await prisma.package.deleteMany({
    where: {
      code: {
        not: 'FREE',
      },
    },
  });

  logger.info('✅ Base de données nettoyée');
}

async function createSeedData(): Promise<SeedData> {
  logger.info('🌱 Création des données de test...');

  const seedData: SeedData = {
    packages: [],
    companies: [],
    users: [],
    subscriptions: [],
    subscriptionPayments: [],
    customers: [],
    invoices: [],
    products: [],
    expenses: [],
    accountants: [],
  };

  // 1. Créer les packages
  logger.info('📦 Création des packages...');
  const packages = [
    {
      code: 'FREE',
      name: 'Gratuit',
      description: 'Plan gratuit avec fonctionnalités de base',
      price: 0,
      currency: 'CDF',
      billingCycle: 'monthly' as const,
      limits: {
        customers: 10,
        products: 20,
        users: 2,
        invoices: 20, // Limite de 20 factures pour les entrepreneurs
        expenses: 20,
      },
      features: {
        expenses: true,
        accounting: false,
        reports: false,
        custom_branding: true, // Branding avancé activé pour tous les plans
      },
      isActive: true,
      displayOrder: 1,
    },
    {
      code: 'STARTER',
      name: 'Starter',
      description: 'Parfait pour les petites entreprises',
      price: 50000,
      currency: 'CDF',
      billingCycle: 'monthly' as const,
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
        custom_branding: true, // Branding avancé activé pour tous les plans
      },
      isActive: true,
      displayOrder: 2,
    },
    {
      code: 'PRO',
      name: 'Pro',
      description: 'Pour les entreprises en croissance',
      price: 150000,
      currency: 'CDF',
      billingCycle: 'monthly' as const,
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
      isActive: true,
      displayOrder: 3,
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'Solution complète pour les grandes entreprises',
      price: 500000,
      currency: 'CDF',
      billingCycle: 'monthly' as const,
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
      isActive: true,
      displayOrder: 4,
    },
  ];

  for (const pkgData of packages) {
    const existing = await prisma.package.findUnique({
      where: { code: pkgData.code },
    });

    if (existing) {
      const updated = await prisma.package.update({
        where: { id: existing.id },
        data: pkgData,
      });
      seedData.packages.push(updated);
    } else {
      const created = await prisma.package.create({ data: pkgData });
      seedData.packages.push(created);
    }
  }

  // 2. Créer les entreprises avec subscriptions
  logger.info('🏢 Création des entreprises...');
  const companiesData = [
    {
      name: 'Tech Solutions RDC',
      businessName: 'Tech Solutions SARL',
      email: 'contact@techsolutions.cd',
      phone: '+243 900 000 001',
      city: 'Kinshasa',
      country: 'RDC',
      nif: 'NIF001',
      rccm: 'RCCM001',
    },
    {
      name: 'Commerce Moderne',
      email: 'info@commerce-moderne.cd',
      phone: '+243 900 000 002',
      city: 'Lubumbashi',
      country: 'RDC',
      nif: 'NIF002',
    },
    {
      name: 'Services Financiers Plus',
      email: 'contact@sfplus.cd',
      phone: '+243 900 000 003',
      city: 'Goma',
      country: 'RDC',
    },
    {
      name: 'Petite Entreprise Test',
      email: 'test@petite-entreprise.cd',
      phone: '+243 900 000 004',
      city: 'Kinshasa',
      country: 'RDC',
    },
  ];

  const now = new Date();
  for (let i = 0; i < companiesData.length; i++) {
    const companyData = companiesData[i];
    const packageIndex = i % seedData.packages.length;
    const selectedPackage = seedData.packages[packageIndex];

    // Créer l'entreprise
    const company = await prisma.company.create({
      data: {
        ...companyData,
        createdAt: new Date(now.getTime() - (i * 30 * 24 * 60 * 60 * 1000)), // Échelonner les dates
      },
    });
    seedData.companies.push(company);

    // Créer un utilisateur admin pour l'entreprise
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: companyData.email,
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: companyData.name.split(' ')[0],
        role: 'admin',
        companyId: company.id,
        emailVerified: true,
        isContaUser: false,
      },
    });
    seedData.users.push(user);

    // Créer la subscription
    const startDate = new Date(company.createdAt);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        packageId: selectedPackage.id,
        status: i === 0 ? 'trial' : 'active', // Première en trial
        billingCycle: selectedPackage.billingCycle,
        startDate,
        endDate,
        trialEndsAt: i === 0 ? new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
        nextPaymentDate: endDate,
      },
    });
    seedData.subscriptions.push(subscription);

    // Mettre à jour les dates de paiement dans la subscription
    // Note: Les paiements d'abonnements sont gérés via le service subscription-payment
    // Pour simplifier, on met juste à jour les dates dans la subscription
    if (i > 0 && selectedPackage.price > 0) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(paymentDate.getDate() + 1);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          lastPaymentDate: paymentDate,
          paymentMethod: 'bank_transfer',
        },
      });
      
      // Enregistrer dans seedData pour référence
      seedData.subscriptionPayments.push({
        subscriptionId: subscription.id,
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        paymentDate,
      });
    }

    // Créer des données pour certaines entreprises
    if (i < 2) {
      // Créer des clients
      for (let j = 0; j < 5; j++) {
        const customer = await prisma.customer.create({
          data: {
            companyId: company.id,
            type: j % 2 === 0 ? 'individual' : 'business',
            firstName: j % 2 === 0 ? `Client${j + 1}` : undefined,
            lastName: j % 2 === 0 ? company.name.split(' ')[0] : undefined,
            businessName: j % 2 === 1 ? `Client ${j + 1} - ${company.name}` : undefined,
            email: `client${j + 1}@${company.email.split('@')[1]}`,
            phone: `+243 900 ${100 + j} ${100 + j}`,
            city: company.city,
            country: company.country,
          },
        });
        seedData.customers.push(customer);
      }

      // Créer des produits
      for (let j = 0; j < 10; j++) {
        const product = await prisma.product.create({
          data: {
            companyId: company.id,
            name: `Produit ${j + 1}`,
            description: `Description du produit ${j + 1}`,
            price: (j + 1) * 10000,
            currency: 'CDF',
            sku: `SKU-${company.id.substring(0, 4)}-${j + 1}`,
          },
        });
        seedData.products.push(product);
      }
    }
  }

  // 3. Créer des experts comptables
  logger.info('👔 Création des experts comptables...');
  const accountantsData = [
    {
      email: 'expert1@accountant.cd',
      firstName: 'Jean',
      lastName: 'Expert',
      phone: '+243 900 100 001',
      city: 'Kinshasa',
      country: 'RDC',
    },
    {
      email: 'expert2@accountant.cd',
      firstName: 'Marie',
      lastName: 'Comptable',
      phone: '+243 900 100 002',
      city: 'Lubumbashi',
      country: 'RDC',
    },
  ];

  for (const accData of accountantsData) {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const accountant = await prisma.user.create({
      data: {
        email: accData.email,
        passwordHash: hashedPassword,
        firstName: accData.firstName,
        lastName: accData.lastName,
        phone: accData.phone,
        role: 'accountant',
        isAccountant: true,
        isContaUser: false,
        emailVerified: true,
      },
    });

    await prisma.userAccountantProfile.create({
      data: {
        userId: accountant.id,
        city: accData.city,
        country: accData.country,
        isAvailable: true,
      },
    });

    seedData.accountants.push(accountant);
  }

  logger.info('✅ Données de test créées avec succès');
  return seedData;
}

async function verifyDataIntegrity(seedData: SeedData) {
  logger.info('🔍 Vérification de l\'intégrité des données...');

  // Vérifier les packages
  const packages = await prisma.package.findMany();
  logger.info(`✅ ${packages.length} packages créés`);

  // Vérifier les entreprises
  const companies = await prisma.company.findMany({
    where: { isSystemCompany: false },
  });
  logger.info(`✅ ${companies.length} entreprises créées`);

  // Vérifier les subscriptions
  const subscriptions = await prisma.subscription.findMany();
  logger.info(`✅ ${subscriptions.length} subscriptions créées`);

  // Vérifier les subscriptions avec paiements
  const subscriptionsWithPayments = await prisma.subscription.findMany({
    where: {
      lastPaymentDate: { not: null },
    },
  });
  logger.info(`✅ ${subscriptionsWithPayments.length} subscriptions avec paiements enregistrés`);

  // Vérifier les relations
  for (const subscription of subscriptions) {
    const company = await prisma.company.findUnique({
      where: { id: subscription.companyId },
    });
    const pkg = await prisma.package.findUnique({
      where: { id: subscription.packageId },
    });

    if (!company) {
      throw new Error(`Subscription ${subscription.id} a une entreprise invalide`);
    }
    if (!pkg) {
      throw new Error(`Subscription ${subscription.id} a un package invalide`);
    }
  }

  logger.info('✅ Toutes les relations sont valides');
}

async function main() {
  try {
    logger.info('🚀 Démarrage du script de reset et seed...');

    await resetDatabase();
    const seedData = await createSeedData();
    await verifyDataIntegrity(seedData);

    logger.info('🎉 Script terminé avec succès !');
    logger.info('\n📊 Résumé :');
    logger.info(`   - ${seedData.packages.length} packages`);
    logger.info(`   - ${seedData.companies.length} entreprises`);
    logger.info(`   - ${seedData.subscriptions.length} subscriptions`);
    logger.info(`   - ${seedData.subscriptionPayments.length} paiements`);
    logger.info(`   - ${seedData.customers.length} clients`);
    logger.info(`   - ${seedData.products.length} produits`);
    logger.info(`   - ${seedData.accountants.length} experts comptables`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur lors du script:', error);
    process.exit(1);
  }
}

main();

