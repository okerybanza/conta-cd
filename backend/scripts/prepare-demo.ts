/**
 * Script de préparation pour la démo
 * 
 * Ce script :
 * 1. Nettoie toutes les données sauf les plans et le compte superadmin
 * 2. Crée 4 entreprises (une par plan: Gratuit, Starter, Pro, Premium)
 * 3. Crée un expert comptable et l'associe à l'entreprise Premium
 * 4. Génère des données réalistes sur 1 an pour chaque entreprise
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import prisma from '../src/config/database';
import logger from '../src/utils/logger';
import bcrypt from 'bcrypt';

interface DemoAccounts {
  superAdmin: any;
  companies: any[];
  companyAdmins: any[];
  accountant: any;
  packages: any[];
}

const DEMO_PASSWORD = 'Demo123!';

// Fonction pour générer une date aléatoire dans les 12 derniers mois
function randomDateInLastYear(): Date {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const diff = now.getTime() - oneYearAgo.getTime();
  return new Date(oneYearAgo.getTime() + Math.random() * diff);
}

async function cleanDatabase() {
  logger.info('🧹 Nettoyage de la base de données (conservation plans + superadmin)...');

  try {
    // Supprimer les entités dépendantes
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
    await prisma.account.deleteMany({});
    await prisma.userAccountantProfile.deleteMany({});
    await prisma.companyAccountant.deleteMany({});
    
    // Supprimer les utilisateurs non-Conta et non-superadmin
    await prisma.user.deleteMany({
      where: {
        AND: [
          { isContaUser: false },
          { isSuperAdmin: false },
        ],
      },
    });

    // Supprimer les entreprises (sauf système)
    await prisma.company.deleteMany({
      where: {
        isSystemCompany: false,
      },
    });

    logger.info('✅ Base de données nettoyée');
  } catch (err) {
    logger.error('❌ Erreur lors du nettoyage:', err);
    throw err;
  }
}

async function getOrCreateSuperAdmin(): Promise<any> {
  logger.info('👑 Vérification/création du Super Admin...');

  // Chercher le superadmin existant
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { isSuperAdmin: true },
  });

  if (existingSuperAdmin) {
    logger.info(`✅ Super Admin existant trouvé: ${existingSuperAdmin.email}`);
    return existingSuperAdmin;
  }

  // Créer l'entreprise système si elle n'existe pas
  let systemCompany = await prisma.company.findFirst({
    where: { isSystemCompany: true },
  });

  if (!systemCompany) {
    systemCompany = await prisma.company.create({
      data: {
        name: 'Conta Platform',
        email: 'system@conta.cd',
        isSystemCompany: true,
        systemType: 'system',
      },
    });
  }

  // Créer le superadmin
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@conta.cd',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      companyId: systemCompany.id,
      isSuperAdmin: true,
      isContaUser: true,
      contaRole: 'superadmin',
      role: 'admin',
      emailVerified: true,
    },
  });

  logger.info(`✅ Super Admin créé: ${superAdmin.email}`);
  return superAdmin;
}


async function getPackages(): Promise<any[]> {
  logger.info('📦 Récupération des packages...');
  const packages = await prisma.package.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  
  if (packages.length === 0) {
    throw new Error('Aucun package trouvé. Veuillez créer les packages d\'abord.');
  }
  
  logger.info(`✅ ${packages.length} packages trouvés`);
  return packages;
}

async function createDemoCompanies(packages: any[]): Promise<DemoAccounts> {
  logger.info('🏢 Création des entreprises de démo...');

  const result: DemoAccounts = {
    superAdmin: null as any,
    companies: [],
    companyAdmins: [],
    accountant: null as any,
    packages,
  };

  // Récupérer le superadmin
  result.superAdmin = await getOrCreateSuperAdmin();

  // Plans dans l'ordre: Gratuit, Starter, Pro, Premium
  const planNames = ['Gratuit', 'Starter', 'Pro', 'Premium'];
  const companyNames = [
    'Entreprise Gratuite Demo',
    'Entreprise Starter Demo',
    'Entreprise Pro Demo',
    'Entreprise Premium Demo',
  ];
  const companyEmails = [
    'demo.gratuit@conta.test',
    'demo.starter@conta.test',
    'demo.pro@conta.test',
    'demo.premium@conta.test',
  ];

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();

  for (let i = 0; i < packages.length && i < 4; i++) {
    const pkg = packages[i];
    const companyName = companyNames[i];
    const companyEmail = companyEmails[i];

    logger.info(`📝 Création de ${companyName} avec plan ${pkg.name}...`);

    // Créer l'entreprise
    const company = await prisma.company.create({
      data: {
        name: companyName,
        businessName: `${companyName} SARL`,
        email: companyEmail,
        phone: `+243 900 ${100 + i} ${100 + i} ${100 + i}`,
        city: 'Kinshasa',
        country: 'RDC',
        nif: `NIF-DEMO-${i + 1}`,
        rccm: `RCCM-DEMO-${i + 1}`,
        currency: 'CDF',
        invoicePrefix: 'FAC',
        invoiceNumberingType: 'sequential',
        nextInvoiceNumber: 1,
        createdAt: new Date(now.getTime() - (365 - i * 30) * 24 * 60 * 60 * 1000), // Échelonner sur 1 an
      },
    });
    result.companies.push(company);

    // Créer l'admin de l'entreprise
    const admin = await prisma.user.create({
      data: {
        email: companyEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: companyName.split(' ')[1] || 'Demo',
        role: 'admin',
        companyId: company.id,
        emailVerified: true,
        isContaUser: false,
      },
    });
    result.companyAdmins.push(admin);

    // Créer l'abonnement
    const startDate = new Date(company.createdAt);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Abonnement annuel

    await prisma.subscription.create({
      data: {
        companyId: company.id,
        packageId: pkg.id,
        status: 'active',
        billingCycle: pkg.billingCycle || 'monthly',
        startDate,
        endDate,
        nextPaymentDate: endDate,
        lastPaymentDate: startDate,
        paymentMethod: 'bank_transfer',
      },
    });

    logger.info(`✅ ${companyName} créée avec succès`);
  }

  return result;
}


async function createAccountantForPremium(demoAccounts: DemoAccounts): Promise<void> {
  logger.info('👔 Création de l\'expert comptable pour Premium...');

  // Trouver l'entreprise Premium (dernière entreprise créée ou celle avec "Premium" dans le nom)
  let premiumCompany = demoAccounts.companies.find(c => 
    c.name.includes('Premium') || c.name.includes('Premium')
  );
  
  // Si pas trouvée, prendre la dernière entreprise (index 3 = Premium Demo)
  if (!premiumCompany && demoAccounts.companies.length > 0) {
    premiumCompany = demoAccounts.companies[demoAccounts.companies.length - 1];
  }

  if (!premiumCompany) {
    throw new Error('Entreprise Premium non trouvée');
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Créer l'expert comptable
  const accountant = await prisma.user.create({
    data: {
      email: 'expert.comptable@conta.test',
      passwordHash,
      firstName: 'Jean',
      lastName: 'Expert',
      phone: '+243 900 200 001',
      role: 'accountant',
      isAccountant: true,
      isContaUser: false,
      emailVerified: true,
      companyId: null, // Les experts comptables n'ont pas de companyId
    },
  });

  // Créer le profil expert comptable
  await prisma.userAccountantProfile.create({
    data: {
      userId: accountant.id,
      companyName: 'Cabinet Expert Comptable Demo',
      city: 'Kinshasa',
      country: 'RDC',
      isAvailable: true,
    },
  });

  // Associer l'expert comptable à l'entreprise Premium
  await prisma.companyAccountant.create({
    data: {
      companyId: premiumCompany.id,
      accountantId: accountant.id,
      status: 'active',
      invitedAt: new Date(),
      acceptedAt: new Date(),
    },
  });

  demoAccounts.accountant = accountant;
  logger.info(`✅ Expert comptable créé et associé à ${premiumCompany.name}`);
}


async function generateYearDataForCompany(company: any, admin: any, index: number): Promise<void> {
  logger.info(`📊 Génération des données d'un an pour ${company.name}...`);

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Créer des clients (5-10 selon le plan)
  const numCustomers = 5 + index * 2; // Plus de clients pour les plans supérieurs
  const customers = [];

  for (let i = 0; i < numCustomers; i++) {
    const isBusiness = i % 2 === 0;
    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        type: isBusiness ? 'entreprise' : 'particulier',
        firstName: isBusiness ? undefined : `Client${i + 1}`,
        lastName: isBusiness ? undefined : `Nom${i + 1}`,
        businessName: isBusiness ? `Client Entreprise ${i + 1}` : undefined,
        email: `client${i + 1}@${company.email.split('@')[1]}`,
        phone: `+243 900 ${200 + i} ${200 + i} ${200 + i}`,
        city: company.city,
        country: company.country,
        createdAt: randomDateInLastYear(),
      },
    });
    customers.push(customer);
  }

  // Créer des catégories de dépenses
  const expenseCategories = [];
  const categoryNames = ['Fournitures', 'Transport', 'Marketing', 'Services', 'Équipement'];
  for (const catName of categoryNames) {
    const cat = await prisma.expenseCategory.create({
      data: {
        companyId: company.id,
        name: catName,
        description: `Catégorie ${catName}`,
      },
    });
    expenseCategories.push(cat);
  }

  // Créer des produits (10-20 selon le plan)
  const numProducts = 10 + index * 3;
  const products = [];
  for (let i = 0; i < numProducts; i++) {
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        name: `Produit ${i + 1}`,
        description: `Description du produit ${i + 1}`,
        price: (i + 1) * 10000 + Math.random() * 50000,
        currency: 'CDF',
        sku: `SKU-${company.id.substring(0, 4)}-${i + 1}`,
      },
    });
    products.push(product);
  }

  // Générer des factures sur 12 mois (réparties)
  const invoices = [];
  const months = 12;
  const invoicesPerMonth = 2 + index; // Plus de factures pour les plans supérieurs

  for (let month = 0; month < months; month++) {
    const monthDate = new Date(oneYearAgo);
    monthDate.setMonth(monthDate.getMonth() + month);

    for (let inv = 0; inv < invoicesPerMonth; inv++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const invoiceDate = new Date(monthDate);
      invoiceDate.setDate(invoiceDate.getDate() + Math.floor(Math.random() * 28));

      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Créer la facture
      const invoice = await prisma.invoice.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          invoiceNumber: `FAC-${company.invoicePrefix || 'FAC'}-${(month * invoicesPerMonth) + inv + 1}`,
          invoiceDate,
          dueDate,
          status: Math.random() > 0.3 ? 'paid' : Math.random() > 0.5 ? 'pending' : 'overdue',
          totalAmount: Math.floor(Math.random() * 500000) + 50000,
          taxAmount: 0,
          subtotal: 0,
          currency: 'CDF',
          notes: `Facture pour ${customer.businessName || customer.firstName}`,
          createdAt: invoiceDate,
        },
      });

      // Ajouter des lignes de facture
      const numLines = Math.floor(Math.random() * 5) + 1;
      for (let line = 0; line < numLines; line++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = product.price;
        const lineTotal = quantity * unitPrice;

        await prisma.invoiceLine.create({
          data: {
            invoiceId: invoice.id,
            productId: product.id,
            description: product.name,
            quantity,
            unitPrice,
            total: lineTotal,
          },
        });
      }

      // Recalculer le total
      const lines = await prisma.invoiceLine.findMany({
        where: { invoiceId: invoice.id },
      });
      const subtotal = lines.reduce((sum, line) => sum + Number(line.total), 0);
      const taxAmount = subtotal * 0.16; // TVA 16%
      const totalAmount = subtotal + taxAmount;

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal,
          taxAmount,
          totalAmount,
        },
      });

      invoices.push(invoice);

      // Créer des paiements pour les factures payées
      if (invoice.status === 'paid') {
        const paymentDate = new Date(invoiceDate);
        paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 30));

        await prisma.payment.create({
          data: {
            companyId: company.id,
            invoiceId: invoice.id,
            amount: totalAmount,
            currency: 'CDF',
            paymentMethod: ['cash', 'bank_transfer', 'mobile_money'][Math.floor(Math.random() * 3)],
            paymentDate,
            status: 'completed',
            createdAt: paymentDate,
          },
        });
      }
    }
  }

  // Générer des dépenses sur 12 mois
  const expensesPerMonth = 3 + index;
  for (let month = 0; month < months; month++) {
    const monthDate = new Date(oneYearAgo);
    monthDate.setMonth(monthDate.getMonth() + month);

    for (let exp = 0; exp < expensesPerMonth; exp++) {
      const expenseDate = new Date(monthDate);
      expenseDate.setDate(expenseDate.getDate() + Math.floor(Math.random() * 28));

      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];

      await prisma.expense.create({
        data: {
          companyId: company.id,
          categoryId: category.id,
          expenseNumber: `EXP-${company.id.substring(0, 4)}-${(month * expensesPerMonth) + exp + 1}`,
          description: `Dépense ${exp + 1} - ${category.name}`,
          totalAmount: Math.floor(Math.random() * 200000) + 10000,
          currency: 'CDF',
          expenseDate,
          status: 'approved',
          createdAt: expenseDate,
        },
      });
    }
  }

  logger.info(`✅ Données générées pour ${company.name}: ${customers.length} clients, ${products.length} produits, ${invoices.length} factures`);
}


async function main() {
  try {
    logger.info('🚀 Démarrage de la préparation de la démo...\n');

    // 1. Nettoyer la base de données
    await cleanDatabase();

    // 2. Récupérer/créer le superadmin
    const superAdmin = await getOrCreateSuperAdmin();

    // 3. Récupérer les packages
    const packages = await getPackages();

    // 4. Créer les entreprises avec abonnements
    const demoAccounts = await createDemoCompanies(packages);

    // 5. Créer l'expert comptable pour Premium
    await createAccountantForPremium(demoAccounts);

    // 6. Générer les données pour chaque entreprise
    for (let i = 0; i < demoAccounts.companies.length; i++) {
      await generateYearDataForCompany(
        demoAccounts.companies[i],
        demoAccounts.companyAdmins[i],
        i
      );
    }

    // 7. Afficher les identifiants
    logger.info('\n' + '='.repeat(60));
    logger.info('📋 IDENTIFIANTS POUR LA DÉMO');
    logger.info('='.repeat(60) + '\n');

    logger.info('👑 SUPER ADMIN:');
    logger.info(`   Email: ${superAdmin.email}`);
    logger.info(`   Mot de passe: ${DEMO_PASSWORD}`);
    logger.info(`   ID: ${superAdmin.id}\n`);

    logger.info('🏢 ENTREPRISES:');
    for (let i = 0; i < demoAccounts.companies.length; i++) {
      const company = demoAccounts.companies[i];
      const admin = demoAccounts.companyAdmins[i];
      const pkg = packages[i];
      logger.info(`\n   ${i + 1}. ${company.name} (Plan: ${pkg.name})`);
      logger.info(`      Email admin: ${admin.email}`);
      logger.info(`      Mot de passe: ${DEMO_PASSWORD}`);
      logger.info(`      ID entreprise: ${company.id}`);
      logger.info(`      ID admin: ${admin.id}`);
    }

    if (demoAccounts.accountant) {
      logger.info('\n👔 EXPERT COMPTABLE:');
      logger.info(`   Email: ${demoAccounts.accountant.email}`);
      logger.info(`   Mot de passe: ${DEMO_PASSWORD}`);
      logger.info(`   ID: ${demoAccounts.accountant.id}`);
      logger.info(`   Associé à: ${demoAccounts.companies[demoAccounts.companies.length - 1].name}`);
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('✅ Préparation de la démo terminée avec succès !');
    logger.info('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur lors de la préparation de la démo:', error);
    if (error instanceof Error) {
      logger.error('   Message:', error.message);
      logger.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();

