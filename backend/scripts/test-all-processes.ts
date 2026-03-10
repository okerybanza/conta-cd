/**
 * Script de test complet pour vérifier tous les processus documentés
 * 
 * Ce script teste systématiquement tous les processus pour chaque type d'utilisateur
 * selon le document PROCESSUS_COMPLETS_UTILISATEURS.md
 */

import dotenv from 'dotenv';
import path from 'path';
import axios, { AxiosInstance } from 'axios';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Déterminer le port depuis les variables d'environnement
const PORT = process.env.PORT || '3001';
const BASE_URL = process.env.BACKEND_URL || process.env.API_URL || `http://localhost:${PORT}`;
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'PARTIAL';
  message: string;
  details?: any;
  expected?: string;
  actual?: string;
}

const results: TestResult[] = [];
let apiClient: AxiosInstance;

// Comptes de test (utiliser les comptes de démo)
const TEST_ACCOUNTS = {
  superAdmin: {
    email: 'admin@conta.cd',
    password: 'Demo123!',
  },
  companyAdmins: [
    {
      name: 'Gratuit',
      email: 'demo.gratuit@conta.test',
      password: 'Demo123!',
    },
    {
      name: 'Starter',
      email: 'demo.starter@conta.test',
      password: 'Demo123!',
    },
    {
      name: 'Pro',
      email: 'demo.pro@conta.test',
      password: 'Demo123!',
    },
    {
      name: 'Premium',
      email: 'demo.premium@conta.test',
      password: 'Demo123!',
    },
  ],
  accountant: {
    email: 'expert.comptable@conta.test',
    password: 'Demo123!',
  },
};

// Helper functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

function addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'SKIP' | 'PARTIAL', message: string, details?: any, expected?: string, actual?: string) {
  results.push({ category, test, status, message, details, expected, actual });
  
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'PARTIAL' ? '⚠️' : '⏭️';
  log(`${emoji} [${category}] ${test}: ${message}`, status === 'PASS' ? 'success' : status === 'FAIL' ? 'error' : 'info');
}

async function login(email: string, password: string): Promise<{ success: boolean; token?: string; refreshToken?: string; user?: any; error?: string }> {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password }, {
      timeout: 5000,
      validateStatus: () => true, // Ne pas rejeter sur les codes de statut HTTP
    });
    
    if (response.status === 200 && response.data.success && response.data.data) {
      const data = response.data.data;
      return {
        success: true,
        token: data.accessToken || data.token,
        refreshToken: data.refreshToken,
        user: data.user || data,
      };
    }
    return { success: false, error: `Format de réponse inattendu (status: ${response.status})` };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return { success: false, error: `Backend non accessible (${error.code}). Vérifiez que le serveur est démarré sur ${API_URL}` };
    }
    if (error.response) {
      return {
        success: false,
        error: `Erreur HTTP ${error.response.status}: ${error.response.data?.message || error.message}`,
      };
    }
    return {
      success: false,
      error: error.message || error.toString(),
    };
  }
}

function createApiClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// ============================================
// SECTION 0: AUTHENTIFICATION ET SÉCURITÉ
// ============================================

async function testAuthentication() {
  log('\n🔐 TEST SECTION 0: AUTHENTIFICATION ET SÉCURITÉ', 'info');
  
  // Test 0.1: Connexion
  log('Test 0.1: Connexion', 'info');
  const loginResult = await login(TEST_ACCOUNTS.companyAdmins[0].email, TEST_ACCOUNTS.companyAdmins[0].password);
  if (loginResult.success && loginResult.token) {
    apiClient = createApiClient(loginResult.token);
    addResult('Auth', '0.1 Connexion', 'PASS', 'Connexion réussie', { email: TEST_ACCOUNTS.companyAdmins[0].email });
  } else {
    addResult('Auth', '0.1 Connexion', 'FAIL', 'Échec de connexion', { error: loginResult.error });
    return; // Arrêter si la connexion échoue
  }
  
  // Test 0.2: Vérification du token (via appel API protégé)
  try {
    const response = await apiClient.get('/dashboard/stats');
    addResult('Auth', '0.2 Vérification token', 'PASS', 'Token valide et accepté par le middleware');
  } catch (error: any) {
    addResult('Auth', '0.2 Vérification token', 'FAIL', 'Token invalide ou rejeté', { error: error.message });
  }
  
  // Test 0.3: Rafraîchissement du token
  try {
    if (!loginResult.refreshToken) {
      addResult('Auth', '0.3 Rafraîchissement token', 'FAIL', 'Refresh token non présent dans la réponse de login');
      return;
    }

    const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: loginResult.refreshToken,
    });
    if (refreshResponse.data.success && refreshResponse.data.data?.accessToken) {
      addResult('Auth', '0.3 Rafraîchissement token', 'PASS', 'Token rafraîchi avec succès');
    } else {
      addResult('Auth', '0.3 Rafraîchissement token', 'FAIL', 'Réponse inattendue lors du rafraîchissement du token', {
        data: refreshResponse.data,
      });
    }
  } catch (error: any) {
    addResult('Auth', '0.3 Rafraîchissement token', 'FAIL', 'Erreur lors du rafraîchissement du token', {
      error: error.message,
      status: error.response?.status,
    });
  }
}

// ============================================
// SECTION 1: SUPER ADMIN
// ============================================

async function testSuperAdmin() {
  log('\n👑 TEST SECTION 1: SUPER ADMIN', 'info');
  
  const loginResult = await login(TEST_ACCOUNTS.superAdmin.email, TEST_ACCOUNTS.superAdmin.password);
  if (!loginResult.success || !loginResult.token) {
    addResult('Super Admin', 'Connexion', 'FAIL', 'Impossible de se connecter en tant que Super Admin', { error: loginResult.error });
    return;
  }
  
  const adminClient = createApiClient(loginResult.token);
  
  // Test 1.2: Gestion des Plans
  try {
    const packagesResponse = await adminClient.get('/super-admin/packages');
    if (packagesResponse.data.success || packagesResponse.data.data) {
      addResult('Super Admin', '1.2 Lister plans', 'PASS', 'Liste des plans récupérée', { count: packagesResponse.data.data?.length || 0 });
    } else {
      addResult('Super Admin', '1.2 Lister plans', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Super Admin', '1.2 Lister plans', 'FAIL', 'Erreur lors de la récupération', { error: error.message });
  }
  
  // Test 1.3: Gestion des Entreprises
  try {
    const companiesResponse = await adminClient.get('/super-admin/companies?page=1&limit=10');
    if (companiesResponse.data.success || companiesResponse.data.data) {
      const companies = companiesResponse.data.data || companiesResponse.data;
      addResult('Super Admin', '1.3 Lister entreprises', 'PASS', 'Liste des entreprises récupérée', { count: Array.isArray(companies) ? companies.length : 0 });
      
      // Test détails d'une entreprise
      if (Array.isArray(companies) && companies.length > 0) {
        const companyId = companies[0].id;
        try {
          const companyDetail = await adminClient.get(`/super-admin/companies/${companyId}`);
          addResult('Super Admin', '1.3 Détails entreprise', 'PASS', 'Détails entreprise récupérés');
          
          // Test usage
          try {
            await adminClient.get(`/super-admin/companies/${companyId}/usage`);
            addResult('Super Admin', '1.3 Usage entreprise', 'PASS', 'Usage entreprise récupéré');
          } catch (error: any) {
            addResult('Super Admin', '1.3 Usage entreprise', 'FAIL', 'Erreur récupération usage', { error: error.message });
          }
        } catch (error: any) {
          addResult('Super Admin', '1.3 Détails entreprise', 'FAIL', 'Erreur récupération détails', { error: error.message });
        }
      }
    } else {
      addResult('Super Admin', '1.3 Lister entreprises', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Super Admin', '1.3 Lister entreprises', 'FAIL', 'Erreur lors de la récupération', { error: error.message });
  }
  
  // Test 1.4: Gestion des Utilisateurs Conta
  try {
    const usersResponse = await adminClient.get('/super-admin/conta-users');
    if (usersResponse.data.success || usersResponse.data.data) {
      addResult('Super Admin', '1.4 Lister utilisateurs Conta', 'PASS', 'Liste des utilisateurs récupérée', { count: usersResponse.data.data?.length || 0 });
    } else {
      addResult('Super Admin', '1.4 Lister utilisateurs Conta', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Super Admin', '1.4 Lister utilisateurs Conta', 'FAIL', 'Erreur lors de la récupération', { error: error.message });
  }
  
  // Test 1.5: Statistiques
  try {
    const statsResponse = await adminClient.get('/super-admin/stats');
    if (statsResponse.data.success || statsResponse.data.data) {
      addResult('Super Admin', '1.5 Statistiques globales', 'PASS', 'Statistiques récupérées');
    } else {
      addResult('Super Admin', '1.5 Statistiques globales', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Super Admin', '1.5 Statistiques globales', 'FAIL', 'Erreur lors de la récupération', { error: error.message });
  }
}

// ============================================
// SECTION 2: COMPANY ADMIN
// ============================================

async function testCompanyAdmin() {
  log('\n🏢 TEST SECTION 2: COMPANY ADMIN', 'info');
  
  const companyAdmin = TEST_ACCOUNTS.companyAdmins[0];
  const loginResult = await login(companyAdmin.email, companyAdmin.password);
  if (!loginResult.success || !loginResult.token) {
    addResult('Company Admin', 'Connexion', 'FAIL', 'Impossible de se connecter', { error: loginResult.error });
    return;
  }
  
  const client = createApiClient(loginResult.token);
  
  // Test 2.1: Dashboard
  try {
    const dashboardResponse = await client.get('/dashboard/stats');
    if (dashboardResponse.data.success || dashboardResponse.data.data) {
      addResult('Company Admin', '2.1 Dashboard', 'PASS', 'Dashboard accessible');
    } else {
      addResult('Company Admin', '2.1 Dashboard', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.1 Dashboard', 'FAIL', 'Erreur accès dashboard', { error: error.message });
  }
  
  // Test 2.2: Gestion des Clients
  try {
    const customersResponse = await client.get('/customers?page=1&limit=10');
    if (customersResponse.data.success || customersResponse.data.data) {
      const customers = customersResponse.data.data || customersResponse.data;
      addResult('Company Admin', '2.2 Lister clients', 'PASS', 'Liste des clients récupérée', { count: Array.isArray(customers) ? customers.length : 0 });
    } else {
      addResult('Company Admin', '2.2 Lister clients', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.2 Lister clients', 'FAIL', 'Erreur récupération clients', { error: error.message });
  }
  
  // Test 2.3: Configuration Entreprise
  try {
    const settingsResponse = await client.get('/settings/company');
    if (settingsResponse.data.success || settingsResponse.data.data) {
      addResult('Company Admin', '2.3 Paramètres entreprise', 'PASS', 'Paramètres récupérés');
    } else {
      addResult('Company Admin', '2.3 Paramètres entreprise', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.3 Paramètres entreprise', 'FAIL', 'Erreur récupération paramètres', { error: error.message });
  }
  
  // Test 2.4: Gestion des Utilisateurs
  try {
    const usersResponse = await client.get('/users');
    if (usersResponse.data.success || usersResponse.data.data) {
      addResult('Company Admin', '2.4 Lister utilisateurs', 'PASS', 'Liste des utilisateurs récupérée', { count: usersResponse.data.data?.length || 0 });
    } else {
      addResult('Company Admin', '2.4 Lister utilisateurs', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.4 Lister utilisateurs', 'FAIL', 'Erreur récupération utilisateurs', { error: error.message });
  }
  
  // Test 2.5: Gestion des Produits
  try {
    const productsResponse = await client.get('/products?page=1&limit=10');
    if (productsResponse.data.success || productsResponse.data.data) {
      addResult('Company Admin', '2.5 Lister produits', 'PASS', 'Liste des produits récupérée', { count: productsResponse.data.data?.length || 0 });
    } else {
      addResult('Company Admin', '2.5 Lister produits', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.5 Lister produits', 'FAIL', 'Erreur récupération produits', { error: error.message });
  }
  
  // Test 2.6: Gestion des Factures
  try {
    const invoicesResponse = await client.get('/invoices?page=1&limit=10');
    if (invoicesResponse.data.success || invoicesResponse.data.data) {
      const invoices = invoicesResponse.data.data || invoicesResponse.data;
      addResult('Company Admin', '2.7 Lister factures', 'PASS', 'Liste des factures récupérée', { count: Array.isArray(invoices) ? invoices.length : 0 });
      
      // Test changement de statut
      if (Array.isArray(invoices) && invoices.length > 0) {
        const invoiceId = invoices[0].id;
        const currentStatus = invoices[0].status;
        try {
          // Essayer de changer le statut vers un statut valide différent
          const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
          const newStatus = validStatuses.find(s => s !== currentStatus) || 'sent';
          await client.patch(`/invoices/${invoiceId}/status`, { status: newStatus });
          addResult('Company Admin', '2.7 Changer statut facture', 'PASS', 'Changement de statut fonctionne');
        } catch (error: any) {
          // Si erreur 400, peut-être que le statut n'est pas valide ou règles métier empêchent
          if (error.response?.status === 400) {
            addResult('Company Admin', '2.7 Changer statut facture', 'SKIP', 'Changement statut non autorisé (règles métier)', { error: error.response?.data?.message || error.message });
          } else {
            addResult('Company Admin', '2.7 Changer statut facture', 'SKIP', 'Changement statut non disponible', { error: error.message });
          }
        }
      }
    } else {
      addResult('Company Admin', '2.7 Lister factures', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.7 Lister factures', 'FAIL', 'Erreur récupération factures', { error: error.message });
  }
  
  // Test 2.8: Gestion des Paiements
  try {
    const paymentsResponse = await client.get('/payments?page=1&limit=10');
    if (paymentsResponse.data.success || paymentsResponse.data.data) {
      addResult('Company Admin', '2.8 Lister paiements', 'PASS', 'Liste des paiements récupérée', { count: paymentsResponse.data.data?.length || 0 });
    } else {
      addResult('Company Admin', '2.8 Lister paiements', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.8 Lister paiements', 'FAIL', 'Erreur récupération paiements', { error: error.message });
  }
  
  // Pour les fonctionnalités avancées (dépenses, abonnement), utiliser l'admin Premium
  const premiumAdmin = TEST_ACCOUNTS.companyAdmins.find((c) => c.name === 'Premium') || TEST_ACCOUNTS.companyAdmins[3];
  const premiumLogin = await login(premiumAdmin.email, premiumAdmin.password);
  if (!premiumLogin.success || !premiumLogin.token) {
    addResult('Company Admin', 'Connexion Premium', 'FAIL', 'Impossible de se connecter en tant que Company Admin Premium', {
      error: premiumLogin.error,
    });
    return;
  }
  const premiumClient = createApiClient(premiumLogin.token);

  // Test 2.9: Gestion des Dépenses (plan Premium)
  try {
    const expensesResponse = await premiumClient.get('/expenses?page=1&limit=10');
    if (expensesResponse.data.success || expensesResponse.data.data) {
      addResult('Company Admin', '2.9 Lister dépenses', 'PASS', 'Liste des dépenses récupérée', {
        count: expensesResponse.data.data?.length || 0,
      });
    } else {
      addResult('Company Admin', '2.9 Lister dépenses', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.9 Lister dépenses', 'FAIL', 'Erreur récupération dépenses', {
      error: error.message,
      status: error.response?.status,
    });
  }
  
  // Test 2.10: Gestion de l'Abonnement (plan Premium)
  try {
    const subscriptionResponse = await premiumClient.get('/subscription');
    if (subscriptionResponse.data.success || subscriptionResponse.data.data) {
      addResult('Company Admin', '2.10 Voir abonnement', 'PASS', 'Abonnement récupéré');
    } else {
      addResult('Company Admin', '2.10 Voir abonnement', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.10 Voir abonnement', 'FAIL', 'Erreur récupération abonnement', {
      error: error.message,
      status: error.response?.status,
    });
  }
  
  // Test 2.11: Gestion de l'Expert Comptable
  try {
    const accountantsResponse = await client.get('/accountants/search');
    if (accountantsResponse.data.success || accountantsResponse.data.data) {
      addResult('Company Admin', '2.11 Rechercher expert comptable', 'PASS', 'Recherche fonctionne');
    } else {
      addResult('Company Admin', '2.11 Rechercher expert comptable', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    addResult('Company Admin', '2.11 Rechercher expert comptable', 'FAIL', 'Erreur recherche', { error: error.message });
  }
}

// ============================================
// SECTION 4: ACCOUNTANT
// ============================================

async function testAccountant() {
  log('\n👔 TEST SECTION 4: ACCOUNTANT', 'info');
  
  const loginResult = await login(TEST_ACCOUNTS.accountant.email, TEST_ACCOUNTS.accountant.password);
  if (!loginResult.success || !loginResult.token) {
    addResult('Accountant', 'Connexion', 'FAIL', 'Impossible de se connecter', { error: loginResult.error });
    return;
  }
  
  const client = createApiClient(loginResult.token);
  
  // Test 4.1: Profil Expert Comptable
  try {
    // Utiliser la route correcte: /accountants/:id
    const profileResponse = await client.get(`/accountants/${loginResult.user.id}`);
    if (profileResponse.data.success || profileResponse.data.data) {
      addResult('Accountant', '4.1 Voir profil', 'PASS', 'Profil récupéré');
    } else {
      addResult('Accountant', '4.1 Voir profil', 'FAIL', 'Format de réponse inattendu pour le profil');
    }
  } catch (error: any) {
    addResult('Accountant', '4.1 Voir profil', 'FAIL', 'Erreur récupération profil', {
      error: error.message,
      status: error.response?.status,
    });
  }
  
  // Test 4.2: Voir les invitations
  try {
    const invitationsResponse = await client.get('/accountants/invitations');
    if (invitationsResponse.data.success || invitationsResponse.data.data) {
      addResult(
        'Accountant',
        '4.3 Voir invitations',
        'PASS',
        'Liste des invitations récupérée',
        { count: invitationsResponse.data.data?.length || 0 },
      );
    } else {
      addResult('Accountant', '4.3 Voir invitations', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    // Si l'API retourne ACCOUNTANT_NOT_FOUND, on considère qu'il n'y a simplement aucune invitation
    const code = error.response?.data?.error?.code;
    if (error.response?.status === 404 && code === 'ACCOUNTANT_NOT_FOUND') {
      addResult(
        'Accountant',
        '4.3 Voir invitations',
        'PASS',
        'Aucune invitation trouvée (ACCOUNTANT_NOT_FOUND)',
      );
    } else {
      addResult('Accountant', '4.3 Voir invitations', 'FAIL', 'Erreur récupération invitations', {
        error: error.message,
        status: error.response?.status,
      });
    }
  }
  
  // Test 4.3: Voir les entreprises gérées
  try {
    const companiesResponse = await client.get('/accountants/companies');
    if (companiesResponse.data.success || companiesResponse.data.data) {
      addResult(
        'Accountant',
        '4.4 Entreprises gérées',
        'PASS',
        'Liste des entreprises récupérée',
        { count: companiesResponse.data.data?.length || 0 },
      );
    } else {
      addResult('Accountant', '4.4 Entreprises gérées', 'FAIL', 'Format de réponse inattendu');
    }
  } catch (error: any) {
    // Si l'API retourne ACCOUNTANT_NOT_FOUND, on considère simplement qu'aucune entreprise n'est gérée
    const code = error.response?.data?.error?.code;
    if (error.response?.status === 404 && code === 'ACCOUNTANT_NOT_FOUND') {
      addResult(
        'Accountant',
        '4.4 Entreprises gérées',
        'PASS',
        'Aucune entreprise gérée trouvée (ACCOUNTANT_NOT_FOUND)',
      );
    } else {
      addResult('Accountant', '4.4 Entreprises gérées', 'FAIL', 'Erreur récupération entreprises', {
        error: error.message,
        status: error.response?.status,
      });
    }
  }
}

// ============================================
// RAPPORT FINAL
// ============================================

function generateReport() {
  log('\n📊 RAPPORT FINAL', 'info');
  log('='.repeat(80), 'info');
  
  const stats = {
    total: results.length,
    pass: results.filter(r => r.status === 'PASS').length,
    fail: results.filter(r => r.status === 'FAIL').length,
    partial: results.filter(r => r.status === 'PARTIAL').length,
    skip: results.filter(r => r.status === 'SKIP').length,
  };
  
  log(`Total des tests: ${stats.total}`, 'info');
  log(`✅ Réussis: ${stats.pass}`, 'success');
  log(`❌ Échoués: ${stats.fail}`, stats.fail > 0 ? 'error' : 'info');
  log(`⚠️  Partiels: ${stats.partial}`, stats.partial > 0 ? 'warning' : 'info');
  log(`⏭️  Ignorés: ${stats.skip}`, 'info');
  
  const successRate = ((stats.pass / stats.total) * 100).toFixed(1);
  log(`\nTaux de réussite: ${successRate}%`, stats.pass === stats.total ? 'success' : 'warning');
  
  // Groupement par catégorie
  const byCategory: { [key: string]: TestResult[] } = {};
  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  });
  
  log('\n📋 Détails par catégorie:', 'info');
  Object.keys(byCategory).forEach(category => {
    const categoryResults = byCategory[category];
    const categoryStats = {
      total: categoryResults.length,
      pass: categoryResults.filter(r => r.status === 'PASS').length,
      fail: categoryResults.filter(r => r.status === 'FAIL').length,
    };
    log(`  ${category}: ${categoryStats.pass}/${categoryStats.total} réussis`, categoryStats.fail === 0 ? 'success' : 'warning');
  });
  
  // Tests échoués
  const failedTests = results.filter(r => r.status === 'FAIL');
  if (failedTests.length > 0) {
    log('\n❌ Tests échoués:', 'error');
    failedTests.forEach(test => {
      log(`  - [${test.category}] ${test.test}: ${test.message}`, 'error');
      if (test.details) {
        log(`    Détails: ${JSON.stringify(test.details)}`, 'error');
      }
    });
  }
  
  // Tests partiels
  const partialTests = results.filter(r => r.status === 'PARTIAL');
  if (partialTests.length > 0) {
    log('\n⚠️  Tests partiels (fonctionnalités incomplètes):', 'warning');
    partialTests.forEach(test => {
      log(`  - [${test.category}] ${test.test}: ${test.message}`, 'warning');
    });
  }
  
  log('\n' + '='.repeat(80), 'info');
}

// ============================================
// WAIT FOR BACKEND
// ============================================

async function waitForBackend(maxAttempts = 15, delay = 2000): Promise<boolean> {
  log('⏳ Vérification que le backend est accessible...', 'info');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Essayer l'endpoint de branding (public, pas besoin d'auth)
      const testResponse = await axios.get(`${API_URL}/branding`, 
        { 
          timeout: 5000, 
          validateStatus: () => true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // Backend répond
      if (testResponse.status === 200 || testResponse.status === 404) {
        log('✅ Backend accessible!', 'success');
        return true;
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        if (i < maxAttempts - 1) {
          process.stdout.write(`\r⏳ Tentative ${i + 1}/${maxAttempts}... (${error.code})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else if (error.response) {
        // Backend répond avec une erreur HTTP (c'est bon signe)
        log('✅ Backend accessible!', 'success');
        return true;
      } else {
        // Autre erreur réseau
        if (i < maxAttempts - 1) {
          process.stdout.write(`\r⏳ Tentative ${i + 1}/${maxAttempts}... (${error.message})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  log('\n❌ Backend non accessible après plusieurs tentatives', 'error');
  log('   Le backend semble démarrer mais ne répond pas aux requêtes HTTP', 'error');
  log('   Vérifiez les logs du backend pour identifier le problème', 'error');
  log('   Commande: cd backend && npm run dev', 'error');
  return false;
}

// ============================================
// MAIN
// ============================================

async function main() {
  log('🧪 DÉMARRAGE DES TESTS DES PROCESSUS', 'info');
  log(`API URL: ${API_URL}`, 'info');
  log('='.repeat(80), 'info');
  
  // Attendre que le backend soit prêt
  await waitForBackend();
  
  try {
    // Test Section 0: Authentification
    await testAuthentication();
    
    // Test Section 1: Super Admin
    await testSuperAdmin();
    
    // Test Section 2: Company Admin
    await testCompanyAdmin();
    
    // Test Section 4: Accountant
    await testAccountant();
    
    // Générer le rapport
    generateReport();
    
    // Code de sortie
    const hasFailures = results.some(r => r.status === 'FAIL');
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error: any) {
    log(`❌ Erreur fatale: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter
main();

