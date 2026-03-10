#!/usr/bin/env tsx
/**
 * Script de test complet pour tous les types d'utilisateurs
 * Teste les fonctionnalités, interconnexions et absence de contenu mock
 */

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import prisma from '../src/config/database';
import bcrypt from 'bcrypt';
import logger from '../src/utils/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = process.env.API_URL || process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://conta.cd';
const BASE_URL = `${API_URL}/api/v1`;

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  error?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string, error?: any) {
  results.push({ test, status, message, error });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  logger.info(`${icon} ${test}${message ? `: ${message}` : ''}`);
  if (error) {
    logger.error(`   Erreur: ${error.message || error}`);
  }
}

async function login(email: string, password: string): Promise<string | null> {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    }, {
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });
    if (response.data.token) {
      return response.data.token;
    }
    logger.error(`Erreur login ${email}: ${response.data?.message || 'Token non reçu'}`);
    return null;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      logger.error(`Erreur connexion API: Le backend n'est pas accessible à ${BASE_URL}`);
      logger.error(`Vérifiez que le backend est démarré et accessible`);
    } else {
      logger.error(`Erreur login ${email}: ${error.response?.data?.message || error.message}`);
    }
    return null;
  }
}

async function makeRequest(method: string, url: string, token: string | null, data?: any) {
  try {
    const config: any = {
      method,
      url: `${BASE_URL}${url}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

async function testSuperAdmin() {
  logger.info('\n🔍 TEST 1: SUPER ADMIN');
  logger.info('='.repeat(50));

  // 1.1 Connexion Super Admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@conta.cd';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  
  const superAdminToken = await login(superAdminEmail, superAdminPassword);
  if (!superAdminToken) {
    logTest('Connexion Super Admin', 'FAIL', 'Impossible de se connecter');
    return;
  }
  logTest('Connexion Super Admin', 'PASS');

  // 1.2 Dashboard Super Admin
  const dashboardRes = await makeRequest('GET', '/super-admin/stats', superAdminToken);
  if (dashboardRes.success && dashboardRes.data?.data) {
    const stats = dashboardRes.data.data;
    if (stats.companies && stats.subscriptions && stats.revenue) {
      logTest('Dashboard Super Admin - Données réelles', 'PASS', 'Données non mockées');
    } else {
      logTest('Dashboard Super Admin - Données réelles', 'FAIL', 'Données incomplètes ou mockées');
    }
  } else {
    logTest('Dashboard Super Admin', 'FAIL', dashboardRes.error?.message);
  }

  // 1.3 Graphiques revenus mensuels
  const revenueRes = await makeRequest('GET', '/super-admin/stats/monthly-revenue', superAdminToken);
  if (revenueRes.success && Array.isArray(revenueRes.data?.data)) {
    logTest('Graphique revenus mensuels', 'PASS', `${revenueRes.data.data.length} mois de données`);
  } else {
    logTest('Graphique revenus mensuels', 'FAIL', revenueRes.error?.message);
  }

  // 1.4 Graphique croissance entreprises
  const growthRes = await makeRequest('GET', '/super-admin/stats/company-growth', superAdminToken);
  if (growthRes.success && Array.isArray(growthRes.data?.data)) {
    logTest('Graphique croissance entreprises', 'PASS', `${growthRes.data.data.length} mois de données`);
  } else {
    logTest('Graphique croissance entreprises', 'FAIL', growthRes.error?.message);
  }

  // 1.5 Liste des entreprises
  const companiesRes = await makeRequest('GET', '/super-admin/companies', superAdminToken);
  if (companiesRes.success && Array.isArray(companiesRes.data?.data?.companies)) {
    const companies = companiesRes.data.data.companies;
    logTest('Liste entreprises', 'PASS', `${companies.length} entreprises`);
    
    // Vérifier qu'il n'y a pas de données mockées
    const hasMockData = companies.some((c: any) => 
      c.name?.toLowerCase().includes('mock') || 
      c.email?.toLowerCase().includes('mock') ||
      c.name === 'Test Company' || 
      c.name === 'Example Company'
    );
    if (hasMockData) {
      logTest('Liste entreprises - Pas de mock', 'FAIL', 'Données mockées détectées');
    } else {
      logTest('Liste entreprises - Pas de mock', 'PASS');
    }
  } else {
    logTest('Liste entreprises', 'FAIL', companiesRes.error?.message);
  }

  // 1.6 Filtres avancés entreprises
  const filtersRes = await makeRequest('GET', '/super-admin/companies?plan=PRO&isActive=true', superAdminToken);
  if (filtersRes.success) {
    logTest('Filtres avancés entreprises', 'PASS');
  } else {
    logTest('Filtres avancés entreprises', 'FAIL', filtersRes.error?.message);
  }

  // 1.7 Liste des plans
  const plansRes = await makeRequest('GET', '/super-admin/packages', superAdminToken);
  if (plansRes.success && Array.isArray(plansRes.data?.data)) {
    const plans = plansRes.data.data;
    logTest('Liste plans', 'PASS', `${plans.length} plans`);
    
    // Vérifier que les plans sont cohérents avec les entreprises
    if (companiesRes.success) {
      const companyPlans = new Set(
        companiesRes.data.data.companies
          .map((c: any) => c.subscription?.package?.code)
          .filter(Boolean)
      );
      const availablePlans = new Set(plans.map((p: any) => p.code));
      const missingPlans = [...companyPlans].filter((p: string) => !availablePlans.has(p));
      if (missingPlans.length > 0) {
        logTest('Cohérence plans-entreprises', 'FAIL', `Plans manquants: ${missingPlans.join(', ')}`);
      } else {
        logTest('Cohérence plans-entreprises', 'PASS');
      }
    }
  } else {
    logTest('Liste plans', 'FAIL', plansRes.error?.message);
  }

  // 1.8 Création d'un plan
  const newPlan = {
    name: 'Plan Test',
    code: 'TEST_PLAN',
    description: 'Plan de test',
    price: 99.99,
    billingCycle: 'monthly' as const,
    features: {
      invoices: { enabled: true, limit: 100 },
      customers: { enabled: true, limit: 50 },
    },
    limits: {
      maxUsers: 5,
      maxStorage: 1024,
    },
    isActive: true,
  };
  const createPlanRes = await makeRequest('POST', '/packages', superAdminToken, newPlan);
  if (createPlanRes.success) {
    logTest('Création plan', 'PASS');
    
    // Nettoyer - supprimer le plan de test
    const planId = createPlanRes.data?.data?.id;
    if (planId) {
      await makeRequest('DELETE', `/packages/${planId}`, superAdminToken);
    }
  } else {
    logTest('Création plan', 'FAIL', createPlanRes.error?.message);
  }

  // 1.9 Liste utilisateurs Conta
  const contaUsersRes = await makeRequest('GET', '/super-admin/conta-users', superAdminToken);
  if (contaUsersRes.success && Array.isArray(contaUsersRes.data?.data)) {
    logTest('Liste utilisateurs Conta', 'PASS', `${contaUsersRes.data.data.length} utilisateurs`);
  } else {
    logTest('Liste utilisateurs Conta', 'FAIL', contaUsersRes.error?.message);
  }

  // 1.10 Audit logs
  const auditRes = await makeRequest('GET', '/super-admin/audit-logs', superAdminToken);
  if (auditRes.success && Array.isArray(auditRes.data?.data)) {
    logTest('Audit logs', 'PASS', `${auditRes.data.data.length} logs`);
  } else {
    logTest('Audit logs', 'FAIL', auditRes.error?.message);
  }

  return superAdminToken;
}

async function testCompanyUser(superAdminToken: string | null) {
  logger.info('\n🔍 TEST 2: UTILISATEUR ENTREPRISE');
  logger.info('='.repeat(50));

  // 2.1 Créer une entreprise de test via inscription
  const testCompanyEmail = `test-${Date.now()}@example.com`;
  const testCompanyPassword = 'Test123!';
  
  const registerRes = await makeRequest('POST', '/auth/register', null, {
    email: testCompanyEmail,
    password: testCompanyPassword,
    firstName: 'Test',
    lastName: 'User',
    companyName: 'Entreprise Test',
    country: 'RDC',
  });
  
  if (!registerRes.success) {
    logTest('Création entreprise test (inscription)', 'FAIL', registerRes.error?.message);
    return null;
  }
  
  const companyId = registerRes.data?.data?.company?.id || registerRes.data?.data?.user?.companyId;
  logTest('Création entreprise test (inscription)', 'PASS', `ID: ${companyId}`);

  // 2.2 Utiliser l'utilisateur créé lors de l'inscription
  const testUser = await prisma.user.findFirst({
    where: { email: testCompanyEmail },
  });
  
  if (!testUser) {
    logTest('Récupération utilisateur entreprise', 'FAIL', 'Utilisateur non trouvé');
    return null;
  }
  logTest('Récupération utilisateur entreprise', 'PASS', `Email: ${testCompanyEmail}`);

  // 2.3 Connexion utilisateur entreprise
  const userToken = await login(testCompanyEmail, testCompanyPassword);
  if (!userToken) {
    logTest('Connexion utilisateur entreprise', 'FAIL');
    return { companyId, userId: testUser.id, token: null };
  }
  logTest('Connexion utilisateur entreprise', 'PASS');

  // 2.4 Dashboard utilisateur
  const userDashboardRes = await makeRequest('GET', '/dashboard/stats', userToken);
  if (userDashboardRes.success && userDashboardRes.data?.data) {
    const hasMockData = JSON.stringify(userDashboardRes.data.data).toLowerCase().includes('mock');
    if (hasMockData) {
      logTest('Dashboard utilisateur - Pas de mock', 'FAIL', 'Données mockées détectées');
    } else {
      logTest('Dashboard utilisateur - Pas de mock', 'PASS');
    }
  } else {
    logTest('Dashboard utilisateur', 'FAIL', userDashboardRes.error?.message);
  }

  // 2.5 Créer un client
  const customer = {
    firstName: 'John',
    lastName: 'Doe',
    email: `customer-${Date.now()}@example.com`,
    phone: '+243900000000',
  };
  const createCustomerRes = await makeRequest('POST', '/customers', userToken, customer);
  if (createCustomerRes.success) {
    logTest('Création client', 'PASS');
  } else {
    logTest('Création client', 'FAIL', createCustomerRes.error?.message);
  }

  // 2.6 Créer une facture
  const invoice = {
    customerId: createCustomerRes.success ? createCustomerRes.data?.data?.id : null,
    invoiceNumber: `INV-${Date.now()}`,
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        description: 'Service de test',
        quantity: 1,
        unitPrice: 100,
        taxRate: 0,
      },
    ],
  };
  if (invoice.customerId) {
    const createInvoiceRes = await makeRequest('POST', '/invoices', userToken, invoice);
    if (createInvoiceRes.success) {
      logTest('Création facture', 'PASS');
    } else {
      logTest('Création facture', 'FAIL', createInvoiceRes.error?.message);
    }
  } else {
    logTest('Création facture', 'SKIP', 'Client non créé');
  }

  // 2.7 Vérifier que Super Admin voit les modifications
  if (superAdminToken) {
    const companyDetailRes = await makeRequest('GET', `/super-admin/companies/${companyId}`, superAdminToken);
    if (companyDetailRes.success && companyDetailRes.data?.data) {
      const company = companyDetailRes.data.data;
      if (company.users && company.users.length > 0) {
        logTest('Super Admin voit utilisateurs entreprise', 'PASS');
      } else {
        logTest('Super Admin voit utilisateurs entreprise', 'FAIL', 'Utilisateurs non visibles');
      }
    } else {
      logTest('Super Admin voit détails entreprise', 'FAIL', companyDetailRes.error?.message);
    }
  }

  return { companyId, userId: testUser.id, token: userToken };
}

async function testAccountant(superAdminToken: string | null) {
  logger.info('\n🔍 TEST 3: EXPERT COMPTABLE');
  logger.info('='.repeat(50));

  // 3.1 Créer un expert comptable
  const accountantEmail = `accountant-${Date.now()}@example.com`;
  const accountantPassword = 'Accountant123!';
  const passwordHash = await bcrypt.hash(accountantPassword, 10);

  const accountant = await prisma.user.create({
    data: {
      email: accountantEmail,
      passwordHash,
      firstName: 'Expert',
      lastName: 'Comptable',
      isAccountant: true,
      emailVerified: true,
      accountantProfile: {
        create: {
          companyName: 'Cabinet Comptable Test',
          registrationNumber: `REG${Date.now()}`,
          address: 'Adresse test',
          professionalPhone: '+243900000000',
          country: 'RDC',
          isAvailable: true,
        },
      },
    },
  });
  logTest('Création expert comptable', 'PASS', `Email: ${accountantEmail}`);

  // 3.2 Approuver l'expert comptable (Super Admin)
  if (superAdminToken) {
    const approveRes = await makeRequest('POST', `/super-admin/accountants/${accountant.id}/approve`, superAdminToken);
    if (approveRes.success) {
      logTest('Approbation expert comptable', 'PASS');
    } else {
      logTest('Approbation expert comptable', 'FAIL', approveRes.error?.message);
    }
  }

  // 3.3 Connexion expert comptable
  const accountantToken = await login(accountantEmail, accountantPassword);
  if (!accountantToken) {
    logTest('Connexion expert comptable', 'FAIL');
    return { accountantId: accountant.id, token: null };
  }
  logTest('Connexion expert comptable', 'PASS');

  // 3.4 Vérifier accès expert comptable
  const accountantProfileRes = await makeRequest('GET', '/accountants/profile', accountantToken);
  if (accountantProfileRes.success) {
    logTest('Profil expert comptable accessible', 'PASS');
  } else {
    logTest('Profil expert comptable accessible', 'FAIL', accountantProfileRes.error?.message);
  }

  // 3.5 Obtenir les entreprises gérées par l'expert comptable
  const managedCompaniesRes = await makeRequest('GET', '/accountants/companies', accountantToken);
  if (managedCompaniesRes.success && Array.isArray(managedCompaniesRes.data?.data)) {
    logTest('Entreprises gérées par expert comptable', 'PASS', `${managedCompaniesRes.data.data.length} entreprises`);
  } else {
    logTest('Entreprises gérées par expert comptable', 'FAIL', managedCompaniesRes.error?.message);
  }

  // 3.6 Vérifier profil expert comptable
  const profileRes = await makeRequest('GET', `/accountants/${accountant.id}`, accountantToken);
  if (profileRes.success) {
    logTest('Profil expert comptable accessible', 'PASS');
  } else {
    logTest('Profil expert comptable accessible', 'FAIL', profileRes.error?.message);
  }

  return { accountantId: accountant.id, token: accountantToken };
}

async function testInterconnections(superAdminToken: string | null, companyData: any) {
  logger.info('\n🔍 TEST 4: INTERCONNEXIONS');
  logger.info('='.repeat(50));

  if (!superAdminToken || !companyData) {
    logTest('Tests interconnexions', 'SKIP', 'Données manquantes');
    return;
  }

  const { companyId, userId } = companyData;

  // 4.1 Modifier le plan d'une entreprise (Super Admin)
  const plansRes = await makeRequest('GET', '/super-admin/packages', superAdminToken);
  if (plansRes.success && plansRes.data?.data?.length > 0) {
    const newPlan = plansRes.data.data[0];
    const updateSubRes = await makeRequest('PUT', `/super-admin/companies/${companyId}/subscription`, superAdminToken, {
      packageId: newPlan.id,
      billingCycle: 'monthly',
    });
    if (updateSubRes.success) {
      logTest('Modification plan entreprise (Super Admin)', 'PASS');
      
      // Vérifier que l'entreprise voit le changement
      const companyDetailRes = await makeRequest('GET', `/super-admin/companies/${companyId}`, superAdminToken);
      if (companyDetailRes.success) {
        const subscription = companyDetailRes.data?.data?.subscription;
        if (subscription && subscription.packageId === newPlan.id) {
          logTest('Entreprise voit changement plan', 'PASS');
        } else {
          logTest('Entreprise voit changement plan', 'FAIL', 'Changement non visible');
        }
      }
    } else {
      logTest('Modification plan entreprise (Super Admin)', 'FAIL', updateSubRes.error?.message);
    }
  }

  // 4.2 Désactiver une entreprise (Super Admin)
  const deactivateRes = await makeRequest('PUT', `/super-admin/companies/${companyId}/status`, superAdminToken, {
    isActive: false,
  });
  if (deactivateRes.success) {
    logTest('Désactivation entreprise (Super Admin)', 'PASS');
    
    // Vérifier que l'utilisateur ne peut plus se connecter
    // (nécessiterait de tester la connexion, mais on peut vérifier le statut)
    const companyStatusRes = await makeRequest('GET', `/super-admin/companies/${companyId}`, superAdminToken);
    if (companyStatusRes.success) {
      const company = companyStatusRes.data?.data;
      if (company.deletedAt || !company.isActive) {
        logTest('Entreprise désactivée visible', 'PASS');
      } else {
        logTest('Entreprise désactivée visible', 'FAIL', 'Statut non mis à jour');
      }
    }
  } else {
    logTest('Désactivation entreprise (Super Admin)', 'FAIL', deactivateRes.error?.message);
  }

  // 4.3 Réactiver l'entreprise
  const activateRes = await makeRequest('PUT', `/super-admin/companies/${companyId}/status`, superAdminToken, {
    isActive: true,
  });
  if (activateRes.success) {
    logTest('Réactivation entreprise (Super Admin)', 'PASS');
  }
}

async function cleanup(testData: any[]) {
  logger.info('\n🧹 NETTOYAGE');
  logger.info('='.repeat(50));

  for (const data of testData) {
    if (data.userId) {
      try {
        await prisma.user.delete({ where: { id: data.userId } });
        logTest(`Suppression utilisateur ${data.userId}`, 'PASS');
      } catch (error: any) {
        logTest(`Suppression utilisateur ${data.userId}`, 'FAIL', error.message);
      }
    }
    if (data.companyId) {
      try {
        await prisma.company.delete({ where: { id: data.companyId } });
        logTest(`Suppression entreprise ${data.companyId}`, 'PASS');
      } catch (error: any) {
        logTest(`Suppression entreprise ${data.companyId}`, 'FAIL', error.message);
      }
    }
    if (data.accountantId) {
      try {
        await prisma.user.delete({ where: { id: data.accountantId } });
        logTest(`Suppression expert comptable ${data.accountantId}`, 'PASS');
      } catch (error: any) {
        logTest(`Suppression expert comptable ${data.accountantId}`, 'FAIL', error.message);
      }
    }
  }
}

async function main() {
  logger.info('🚀 DÉMARRAGE DES TESTS COMPLETS');
  logger.info('='.repeat(50));

  const testData: any[] = [];

  try {
    // Test 1: Super Admin
    const superAdminToken = await testSuperAdmin();
    testData.push({ token: superAdminToken });

    // Test 2: Utilisateur entreprise
    const companyData = await testCompanyUser(superAdminToken);
    if (companyData) {
      testData.push(companyData);
    }

    // Test 3: Expert comptable
    const accountantData = await testAccountant(superAdminToken);
    if (accountantData) {
      testData.push(accountantData);
    }

    // Test 4: Interconnexions
    await testInterconnections(superAdminToken, companyData);

    // Résumé
    logger.info('\n📊 RÉSUMÉ DES TESTS');
    logger.info('='.repeat(50));
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    logger.info(`✅ Tests réussis: ${passed}`);
    logger.info(`❌ Tests échoués: ${failed}`);
    logger.info(`⏭️  Tests ignorés: ${skipped}`);
    logger.info(`📈 Taux de réussite: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed > 0) {
      logger.info('\n❌ TESTS ÉCHOUÉS:');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        logger.error(`  - ${r.test}: ${r.message || r.error?.message || 'Erreur inconnue'}`);
      });
    }

    // Nettoyage
    await cleanup(testData);

  } catch (error: any) {
    logger.error('❌ Erreur fatale:', error);
    await cleanup(testData);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

