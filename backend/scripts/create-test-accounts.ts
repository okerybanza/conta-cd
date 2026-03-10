/**
 * Script de création de comptes de test pour tester les interconnexions
 * 
 * Ce script crée :
 * 1. Des entreprises avec différents plans
 * 2. Des utilisateurs admin pour chaque entreprise
 * 3. Un expert comptable
 * 4. Des données liées (clients, factures, etc.)
 * 5. Des invitations entre expert comptable et entreprises
 */

import dotenv from 'dotenv';
import path from 'path';

// Charger le .env depuis le répertoire backend
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from '../src/config/database';
import logger from '../src/utils/logger';
import bcrypt from 'bcrypt';

const TEST_PASSWORD = 'Test123!@#';

interface TestAccounts {
  companies: any[];
  companyAdmins: any[];
  accountant: any;
  accountantInvitations: any[];
}

async function createTestAccounts(): Promise<TestAccounts> {
  logger.info('🔧 Création des comptes de test...');

  const result: TestAccounts = {
    companies: [],
    companyAdmins: [],
    accountant: null as any,
    accountantInvitations: [],
  };

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // 0. Créer ou vérifier le Super Admin de test
  logger.info('👑 Création/vérification du Super Admin de test...');
  const superAdminEmail = 'admin@conta.test';
  let superAdmin = await prisma.user.findFirst({
    where: { email: superAdminEmail },
  });

  if (!superAdmin) {
    // Trouver ou créer l'entreprise système
    let systemCompany = await prisma.company.findFirst({
      where: {
        isSystemCompany: true,
        systemType: 'system',
      },
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
      logger.info('✅ Entreprise système Conta créée');
    }

    superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
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
    logger.info(`✅ Super Admin de test créé: ${superAdminEmail}`);
  } else {
    logger.info(`ℹ️  Super Admin de test existant: ${superAdminEmail}`);
  }

  // 1. Récupérer ou créer les packages
  logger.info('📦 Récupération des packages...');
  const freePackage = await prisma.package.findFirst({
    where: { code: 'FREE' },
  });
  const starterPackage = await prisma.package.findFirst({
    where: { code: 'STARTER' },
  });
  const proPackage = await prisma.package.findFirst({
    where: { code: 'PRO' },
  });
  const enterprisePackage = await prisma.package.findFirst({
    where: { code: 'ENTERPRISE' },
  });

  if (!freePackage || !starterPackage || !proPackage || !enterprisePackage) {
    throw new Error('Les packages de base doivent exister. Exécutez d\'abord reset-and-seed.');
  }

  // 2. Créer les entreprises de test
  logger.info('🏢 Création des entreprises de test...');
  
  const companiesData = [
    {
      name: 'Entreprise Test Gratuit',
      email: 'contact@entreprise-gratuit.test',
      phone: '+243900000001',
      address: '123 Rue Test, Kinshasa',
      country: 'RDC',
      city: 'Kinshasa',
      nif: 'NIF-GRATUIT-001',
      package: freePackage,
    },
    {
      name: 'Entreprise Test Starter',
      email: 'contact@entreprise-starter.test',
      phone: '+243900000002',
      address: '456 Avenue Test, Lubumbashi',
      country: 'RDC',
      city: 'Lubumbashi',
      nif: 'NIF-STARTER-001',
      package: starterPackage,
    },
    {
      name: 'Entreprise Test Pro',
      email: 'contact@entreprise-pro.test',
      phone: '+243900000003',
      address: '789 Boulevard Test, Goma',
      country: 'RDC',
      city: 'Goma',
      nif: 'NIF-PRO-001',
      package: proPackage,
    },
    {
      name: 'Entreprise Test Enterprise',
      email: 'contact@entreprise-enterprise.test',
      phone: '+243900000004',
      address: '321 Rue Enterprise, Bukavu',
      country: 'RDC',
      city: 'Bukavu',
      nif: 'NIF-ENTERPRISE-001',
      package: enterprisePackage,
    },
  ];

  for (const companyData of companiesData) {
    // Vérifier si l'entreprise existe déjà
    let company = await prisma.company.findFirst({
      where: { email: companyData.email },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyData.name,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          country: companyData.country,
          city: companyData.city,
          nif: companyData.nif,
        },
      });
      logger.info(`✅ Entreprise créée: ${company.name}`);
    } else {
      logger.info(`ℹ️  Entreprise existante: ${company.name}`);
    }

    result.companies.push(company);

    // Créer l'abonnement si nécessaire
    const existingSubscription = await prisma.subscription.findFirst({
      where: { companyId: company.id },
    });

    if (!existingSubscription) {
      await prisma.subscription.create({
        data: {
          companyId: company.id,
          packageId: companyData.package.id,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          billingCycle: 'monthly',
        },
      });
      logger.info(`✅ Abonnement créé pour ${company.name}`);
    }

    // Créer l'utilisateur admin pour cette entreprise
    const adminEmail = `admin@${companyData.email.split('@')[1]}`;
    let adminUser = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          firstName: 'Admin',
          lastName: companyData.name.split(' ')[2] || 'Test',
          phone: companyData.phone,
          companyId: company.id,
          role: 'admin',
          emailVerified: true,
        },
      });
      logger.info(`✅ Admin créé: ${adminUser.email}`);
    } else {
      logger.info(`ℹ️  Admin existant: ${adminUser.email}`);
    }

    result.companyAdmins.push(adminUser);

    // Créer quelques données de test pour cette entreprise
    await createTestDataForCompany(company.id, adminUser.id);
  }

  // 3. Créer un expert comptable
  logger.info('👔 Création de l\'expert comptable de test...');
  
  const accountantEmail = 'expert@comptable.test';
  let accountantUser = await prisma.user.findFirst({
    where: { email: accountantEmail },
  });

  if (!accountantUser) {
    accountantUser = await prisma.user.create({
      data: {
        email: accountantEmail,
        passwordHash,
        firstName: 'Expert',
        lastName: 'Comptable',
        phone: '+243900000100',
        role: 'accountant',
        isAccountant: true,
        emailVerified: true,
      },
    });

    // Créer le profil d'expert comptable
    await prisma.userAccountantProfile.create({
      data: {
        userId: accountantUser.id,
        companyName: 'Cabinet Comptable Test',
        registrationNumber: 'REG-ACCOUNTANT-001',
        country: 'RDC',
        city: 'Kinshasa',
        address: '100 Rue Expert, Kinshasa',
        professionalPhone: '+243900000100',
        isAvailable: true,
      },
    });

    logger.info(`✅ Expert comptable créé: ${accountantUser.email}`);
  } else {
    logger.info(`ℹ️  Expert comptable existant: ${accountantUser.email}`);
  }

  result.accountant = accountantUser;

  // 4. Créer des invitations entre l'expert comptable et les entreprises
  logger.info('📧 Création des invitations expert comptable...');
  
  for (const company of result.companies) {
    // Vérifier si l'invitation existe déjà
    const existingInvitation = await prisma.companyAccountant.findFirst({
      where: {
        companyId: company.id,
        accountantId: accountantUser.id,
      },
    });

    if (!existingInvitation) {
      const invitation = await prisma.companyAccountant.create({
        data: {
          companyId: company.id,
          accountantId: accountantUser.id,
          status: 'pending',
          invitedBy: result.companyAdmins.find(a => a.companyId === company.id)?.id || null,
        },
      });
      result.accountantInvitations.push(invitation);
      logger.info(`✅ Invitation créée pour ${company.name}`);
    } else {
      logger.info(`ℹ️  Invitation existante pour ${company.name}`);
    }
  }

  return result;
}

async function createTestDataForCompany(companyId: string, userId: string) {
  // Créer quelques clients
  const customers = await Promise.all([
    prisma.customer.findFirst({
      where: { companyId, email: 'client1@test.com' },
    }).then(existing => existing || prisma.customer.create({
      data: {
        companyId,
        firstName: 'Client',
        lastName: 'Test 1',
        email: 'client1@test.com',
        phone: '+243900001001',
        address: 'Adresse Client 1',
        country: 'RDC',
        city: 'Kinshasa',
        type: 'individual',
      },
    })),
    prisma.customer.findFirst({
      where: { companyId, email: 'client2@test.com' },
    }).then(existing => existing || prisma.customer.create({
      data: {
        companyId,
        businessName: 'Entreprise Client Test',
        email: 'client2@test.com',
        phone: '+243900001002',
        address: 'Adresse Client 2',
        country: 'RDC',
        city: 'Lubumbashi',
        type: 'business',
      },
    })),
  ]);

  // Créer quelques produits
  const products = await Promise.all([
    prisma.product.findFirst({
      where: { companyId, name: 'Produit Test 1' },
    }).then(existing => existing || prisma.product.create({
      data: {
        companyId,
        name: 'Produit Test 1',
        description: 'Description produit test 1',
        price: 10000,
        currency: 'CDF',
        unit: 'unité',
      },
    })),
    prisma.product.findFirst({
      where: { companyId, name: 'Produit Test 2' },
    }).then(existing => existing || prisma.product.create({
      data: {
        companyId,
        name: 'Produit Test 2',
        description: 'Description produit test 2',
        price: 20000,
        currency: 'CDF',
        unit: 'unité',
      },
    })),
  ]);

  // Créer une facture de test
  const existingInvoice = await prisma.invoice.findFirst({
    where: { companyId, invoiceNumber: 'INV-TEST-001' },
  });

  if (!existingInvoice && customers[0]) {
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId: customers[0].id,
        invoiceNumber: 'INV-TEST-001',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        subtotal: 10000,
        taxAmount: 0,
        totalAmount: 10000,
        currency: 'CDF',
        createdBy: userId,
        lines: {
          create: [
            {
              productId: products[0]?.id,
              description: 'Ligne facture test',
              quantity: 1,
              unitPrice: 10000,
              total: 10000,
            },
          ],
        },
      },
    });
    logger.info(`✅ Facture créée: ${invoice.invoiceNumber}`);
  }

  // Créer une dépense de test
  const existingExpense = await prisma.expense.findFirst({
    where: { companyId, description: 'Dépense Test' },
  });

  if (!existingExpense) {
    await prisma.expense.create({
      data: {
        companyId,
        expenseNumber: 'EXP-TEST-001',
        description: 'Dépense Test',
        totalAmount: 5000,
        currency: 'CDF',
        expenseDate: new Date(),
        status: 'draft',
        createdBy: userId,
      },
    });
    logger.info(`✅ Dépense créée pour l'entreprise`);
  }
}

async function printTestAccountsSummary(accounts: TestAccounts) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 RÉSUMÉ DES COMPTES DE TEST CRÉÉS');
  console.log('='.repeat(80));
  console.log(`\n🔑 Mot de passe pour tous les comptes: ${TEST_PASSWORD}\n`);

  console.log('🏢 ENTREPRISES:');
  accounts.companies.forEach((company, index) => {
    const admin = accounts.companyAdmins[index];
    console.log(`  ${index + 1}. ${company.name}`);
    console.log(`     Email: ${company.email}`);
    console.log(`     Admin: ${admin.email}`);
    console.log(`     NIF: ${company.nif}`);
    console.log('');
  });

  console.log('👔 EXPERT COMPTABLE:');
  console.log(`  Email: ${accounts.accountant.email}`);
  console.log(`  Nom: ${accounts.accountant.firstName} ${accounts.accountant.lastName}`);
  console.log('');

  console.log('📧 INVITATIONS:');
  accounts.accountantInvitations.forEach((invitation, index) => {
    const company = accounts.companies.find(c => c.id === invitation.companyId);
    console.log(`  ${index + 1}. ${company?.name} - Status: ${invitation.status}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Comptes de test créés avec succès!');
  console.log('='.repeat(80) + '\n');
}

async function main() {
  try {
    logger.info('🚀 Démarrage de la création des comptes de test...');

    const accounts = await createTestAccounts();
    await printTestAccountsSummary(accounts);

    logger.info('✅ Script terminé avec succès');
  } catch (error) {
    logger.error('❌ Erreur lors de la création des comptes de test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

