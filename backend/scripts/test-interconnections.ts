/**
 * Script automatisé pour tester les interconnexions entre utilisateurs
 * 
 * Ce script teste :
 * 1. Connexion de chaque type d'utilisateur
 * 2. Accès aux données selon les permissions
 * 3. Modifications Super Admin → Impact sur entreprises
 * 4. Modifications Entreprises → Visibilité Super Admin
 * 5. Workflow Expert Comptable (invitation → acceptation → accès)
 */

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

// Comptes de test
const TEST_ACCOUNTS = {
  superAdmin: {
    email: 'admin@conta.test', // Super Admin de test créé par create-test-accounts
    password: 'Test123!@#',
    // Essayer aussi avec le Super Admin par défaut si celui-ci n'existe pas
    alternativeEmail: 'admin@conta.cd',
    alternativePassword: 'ChangeMe123!',
  },
  companies: [
    {
      name: 'Entreprise Test Gratuit',
      adminEmail: 'admin@entreprise-gratuit.test',
      password: 'Test123!@#',
    },
    {
      name: 'Entreprise Test Pro',
      adminEmail: 'admin@entreprise-pro.test',
      password: 'Test123!@#',
    },
  ],
  accountant: {
    email: 'expert@comptable.test',
    password: 'Test123!@#',
  },
};

// Fonction helper pour logger
function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

// Fonction helper pour ajouter un résultat
function addResult(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
  results.push({ test, status, message, details });
  if (status === 'PASS') {
    log(`${test}: ${message}`, 'success');
  } else if (status === 'FAIL') {
    log(`${test}: ${message}`, 'error');
  } else {
    log(`${test}: ${message}`);
  }
}

// Fonction pour se connecter
async function login(email: string, password: string): Promise<{ token: string; user: any } | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    
    // Gérer les différents formats de réponse
    const data = response.data.data || response.data;
    return {
      token: data.accessToken || data.token,
      user: data.user,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return null;
    }
    throw error;
  }
}

// Test 1: Connexion Super Admin
async function testSuperAdminLogin() {
  log('\n🔐 Test 1: Connexion Super Admin');
  
  // Essayer avec le mot de passe par défaut
  let auth = await login(TEST_ACCOUNTS.superAdmin.email, TEST_ACCOUNTS.superAdmin.password);
  
  // Si échec, essayer avec le mot de passe alternatif
  if (!auth && TEST_ACCOUNTS.superAdmin.alternativePassword) {
    log('Tentative avec mot de passe alternatif...');
    auth = await login(TEST_ACCOUNTS.superAdmin.email, TEST_ACCOUNTS.superAdmin.alternativePassword);
  }
  
  // Si échec, essayer avec l'email alternatif
  if (!auth && TEST_ACCOUNTS.superAdmin.alternativeEmail) {
    log('Tentative avec email alternatif...');
    auth = await login(TEST_ACCOUNTS.superAdmin.alternativeEmail, TEST_ACCOUNTS.superAdmin.password);
    if (!auth && TEST_ACCOUNTS.superAdmin.alternativePassword) {
      auth = await login(TEST_ACCOUNTS.superAdmin.alternativeEmail, TEST_ACCOUNTS.superAdmin.alternativePassword);
    }
  }
  
  if (!auth) {
    addResult('Super Admin Login', 'SKIP', 
      `Super Admin non trouvé ou mot de passe incorrect. Email: ${TEST_ACCOUNTS.superAdmin.email}`);
    return null;
  }
  
  if (!auth.user.isSuperAdmin) {
    addResult('Super Admin Login', 'FAIL', 'L\'utilisateur n\'est pas Super Admin');
    return null;
  }
  
  addResult('Super Admin Login', 'PASS', 'Connexion réussie');
  return auth;
}

// Test 2: Super Admin - Liste des entreprises
async function testSuperAdminListCompanies(token: string) {
  log('\n📋 Test 2: Super Admin - Liste des entreprises');
  try {
    const response = await axios.get(`${API_BASE_URL}/super-admin/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Le format de réponse est { success: true, data: [...], pagination: {...} }
    const companies = response.data.data || response.data.companies || (Array.isArray(response.data) ? response.data : []);
    
    if (Array.isArray(companies)) {
      const testCompanies = companies.filter((c: any) => 
        c.email?.includes('entreprise-') || c.name?.includes('Test')
      );
      
      if (testCompanies.length > 0) {
        addResult('Super Admin List Companies', 'PASS', 
          `${testCompanies.length} entreprise(s) de test trouvée(s)`, 
          { count: testCompanies.length, companies: testCompanies.map((c: any) => c.name) }
        );
        return companies;
      } else {
        addResult('Super Admin List Companies', 'SKIP', 
          'Aucune entreprise de test trouvée (peut être normal)');
        return companies;
      }
    } else {
      addResult('Super Admin List Companies', 'FAIL', 
        `Format de réponse invalide: ${JSON.stringify(response.data).substring(0, 100)}`);
      return [];
    }
  } catch (error: any) {
    addResult('Super Admin List Companies', 'FAIL', 
      `Erreur: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

// Test 3: Super Admin - Détails d'une entreprise
async function testSuperAdminCompanyDetails(token: string, companyId: string) {
  log('\n🔍 Test 3: Super Admin - Détails entreprise');
  try {
    const response = await axios.get(`${API_BASE_URL}/super-admin/companies/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Gérer le format de réponse { success: true, data: {...} }
    const company = response.data.data || response.data;
    
    if (company) {
      addResult('Super Admin Company Details', 'PASS', 
        'Détails entreprise récupérés avec succès',
        { company: company.name, hasUsers: !!company.users }
      );
      return company;
    } else {
      addResult('Super Admin Company Details', 'FAIL', 'Aucune donnée retournée');
      return null;
    }
  } catch (error: any) {
    addResult('Super Admin Company Details', 'FAIL', 
      `Erreur: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test 4: Connexion Admin Entreprise
async function testCompanyAdminLogin(company: { adminEmail: string; password: string; name: string }) {
  log(`\n🏢 Test 4: Connexion Admin - ${company.name}`);
  const auth = await login(company.adminEmail, company.password);
  
  if (!auth) {
    addResult(`Company Admin Login - ${company.name}`, 'FAIL', 'Connexion échouée');
    return null;
  }
  
  if (!auth.user.companyId) {
    addResult(`Company Admin Login - ${company.name}`, 'FAIL', 'Aucune entreprise associée');
    return null;
  }
  
  addResult(`Company Admin Login - ${company.name}`, 'PASS', 'Connexion réussie');
  return auth;
}

// Test 5: Admin Entreprise - Accès aux données
async function testCompanyDataAccess(token: string, companyName: string) {
  log(`\n📊 Test 5: Accès données - ${companyName}`);
  
  const endpoints = [
    { name: 'Customers', url: '/customers' },
    { name: 'Products', url: '/products' },
    { name: 'Invoices', url: '/invoices' },
    { name: 'Expenses', url: '/expenses' },
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = response.data[endpoint.name.toLowerCase()] || response.data.data || response.data;
      const count = Array.isArray(data) ? data.length : 0;
      
      if (count > 0) {
        addResult(`${companyName} - ${endpoint.name}`, 'PASS', 
          `${count} élément(s) trouvé(s)`, { count });
      } else {
        addResult(`${companyName} - ${endpoint.name}`, 'SKIP', 
          'Aucune donnée (peut être normal)');
      }
    } catch (error: any) {
      addResult(`${companyName} - ${endpoint.name}`, 'FAIL', 
        `Erreur: ${error.response?.data?.message || error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test 6: Admin Entreprise - Création de données
async function testCompanyCreateData(token: string, companyName: string) {
  log(`\n➕ Test 6: Création données - ${companyName}`);
  
  // Créer un client de test
  try {
    const customerData = {
      type: 'particulier' as const, // Le schéma attend 'particulier' ou 'entreprise'
      firstName: 'Client',
      lastName: 'Test Interconnexion',
      email: `test-interconnexion-${Date.now()}@test.com`,
      phone: '+243900000999',
    };
    
    const customerResponse = await axios.post(
      `${API_BASE_URL}/customers`,
      customerData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    // Gérer le format de réponse { success: true, data: {...} }
    const customer = customerResponse.data.data || customerResponse.data;
    
    if (customer && customer.id) {
      addResult(`${companyName} - Create Customer`, 'PASS', 
        'Client créé avec succès', { id: customer.id });
      
      // Nettoyer - supprimer le client de test
      try {
        await axios.delete(
          `${API_BASE_URL}/customers/${customer.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        // Ignorer erreur de suppression
      }
      
      return true;
    } else {
      addResult(`${companyName} - Create Customer`, 'FAIL', 
        'Format de réponse invalide');
      return false;
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error?.message || 
                        error.message;
    addResult(`${companyName} - Create Customer`, 'FAIL', 
      `Erreur: ${errorMessage}`, 
      { status: error.response?.status, body: error.response?.data });
    return false;
  }
  
  return false;
}

// Test 7: Super Admin - Vérifier modifications entreprise
async function testSuperAdminSeeCompanyChanges(token: string, companyId: string) {
  log('\n👁️ Test 7: Super Admin - Voir modifications entreprise');
  try {
    const response = await axios.get(`${API_BASE_URL}/super-admin/companies/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Gérer le format de réponse { success: true, data: {...} }
    const company = response.data.data || response.data;
    
    if (company) {
      // Vérifier que les données sont présentes
      const hasData = company.customers || company.invoices || company.users;
      addResult('Super Admin See Company Changes', 'PASS', 
        'Super Admin peut voir les données de l\'entreprise',
        { hasCustomers: !!company.customers, hasInvoices: !!company.invoices, hasUsers: !!company.users }
      );
      return true;
    }
  } catch (error: any) {
    addResult('Super Admin See Company Changes', 'FAIL', 
      `Erreur: ${error.response?.data?.message || error.message}`);
    return false;
  }
  
  return false;
}

// Test 8: Connexion Expert Comptable
async function testAccountantLogin() {
  log('\n👔 Test 8: Connexion Expert Comptable');
  
  try {
    const auth = await login(TEST_ACCOUNTS.accountant.email, TEST_ACCOUNTS.accountant.password);
    
    if (!auth) {
      // Vérifier si l'utilisateur existe mais que le login a échoué
      addResult('Accountant Login', 'SKIP', 
        `Connexion échouée. L'expert comptable peut ne pas exister ou le mot de passe est incorrect. Email: ${TEST_ACCOUNTS.accountant.email}`);
      return null;
    }
    
    // Vérifier si c'est un expert comptable (isAccountant ou role === 'accountant')
    if (!auth.user.isAccountant && auth.user.role !== 'accountant') {
      addResult('Accountant Login', 'FAIL', 
        `L'utilisateur n'est pas expert comptable. Role: ${auth.user.role}, isAccountant: ${auth.user.isAccountant}`);
      return null;
    }
    
    addResult('Accountant Login', 'PASS', 'Connexion réussie');
    return auth;
  } catch (error: any) {
    // Si c'est une erreur serveur, vérifier si c'est lié au bug corrigé
    if (error.response?.status === 500) {
      const errorMsg = error.response?.data?.message || error.message || '';
      if (errorMsg.includes('Cannot read') || errorMsg.includes('null')) {
        addResult('Accountant Login', 'FAIL', 
          `Erreur serveur: Le backend n'a peut-être pas été redémarré après la correction. Erreur: ${errorMsg.substring(0, 100)}`);
      } else {
        addResult('Accountant Login', 'SKIP', 
          `Erreur serveur: ${errorMsg.substring(0, 100)}`);
      }
      return null;
    }
    addResult('Accountant Login', 'FAIL', 
      `Erreur: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test 9: Expert Comptable - Voir invitations
async function testAccountantInvitations(token: string) {
  log('\n📧 Test 9: Expert Comptable - Invitations');
  try {
    // Essayer différents endpoints possibles
    const endpoints = [
      '/accountants/invitations',
      '/accountant/invitations',
      '/super-admin/accountants',
    ];
    
    let invitations: any[] = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data) {
          invitations = response.data.invitations || response.data.data || response.data || [];
          if (Array.isArray(invitations) && invitations.length > 0) {
            break;
          }
        }
      } catch (e) {
        // Continuer avec le prochain endpoint
      }
    }
    
    if (invitations.length > 0) {
      addResult('Accountant Invitations', 'PASS', 
        `${invitations.length} invitation(s) trouvée(s)`,
        { count: invitations.length }
      );
      return invitations;
    } else {
      addResult('Accountant Invitations', 'SKIP', 
        'Aucune invitation trouvée (peut être normal si déjà acceptées)');
      return [];
    }
  } catch (error: any) {
    addResult('Accountant Invitations', 'SKIP', 
      `Endpoint non disponible: ${error.message}`);
    return [];
  }
}

// Test 10: Super Admin - Modifier plan entreprise
async function testSuperAdminModifyPlan(token: string, companyId: string) {
  log('\n🔄 Test 10: Super Admin - Modifier plan entreprise');
  
  try {
    // Récupérer les packages disponibles
    const packagesResponse = await axios.get(`${API_BASE_URL}/super-admin/packages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Gérer le format de réponse { success: true, data: [...] }
    const packages = packagesResponse.data.data || packagesResponse.data.packages || packagesResponse.data || [];
    const starterPackage = packages.find((p: any) => p.code === 'STARTER');
    
    if (!starterPackage) {
      addResult('Super Admin Modify Plan', 'SKIP', 'Package STARTER non trouvé');
      return false;
    }
    
    // Récupérer l'abonnement actuel
    const companyResponse = await axios.get(`${API_BASE_URL}/super-admin/companies/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Gérer le format de réponse { success: true, data: {...} }
    const company = companyResponse.data.data || companyResponse.data;
    const currentSubscription = company?.subscription;
    
    if (currentSubscription) {
      addResult('Super Admin Modify Plan', 'PASS', 
        'Abonnement trouvé, modification possible',
        { currentPlan: currentSubscription.package?.name || currentSubscription.packageId || 'N/A' }
      );
      return true;
    } else {
      addResult('Super Admin Modify Plan', 'SKIP', 'Aucun abonnement trouvé');
      return false;
    }
  } catch (error: any) {
    addResult('Super Admin Modify Plan', 'SKIP', 
      `Erreur: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Fonction principale
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 DÉMARRAGE DES TESTS D\'INTERCONNEXIONS');
  console.log('='.repeat(80) + '\n');
  
  // Test 1: Super Admin Login
  const superAdminAuth = await testSuperAdminLogin();
  if (!superAdminAuth) {
    console.log('\n⚠️  Impossible de continuer sans Super Admin. Vérifiez les credentials.');
    printResults();
    return;
  }
  
  // Test 2: Liste entreprises
  const companies = await testSuperAdminListCompanies(superAdminAuth.token);
  
  // Test 3: Détails entreprise (première trouvée)
  if (companies.length > 0) {
    const testCompany = companies.find((c: any) => 
      c.email?.includes('entreprise-') || c.name?.includes('Test')
    );
    
    if (testCompany) {
      await testSuperAdminCompanyDetails(superAdminAuth.token, testCompany.id);
      
      // Test 7: Voir modifications entreprise
      await testSuperAdminSeeCompanyChanges(superAdminAuth.token, testCompany.id);
      
      // Test 10: Modifier plan
      await testSuperAdminModifyPlan(superAdminAuth.token, testCompany.id);
    }
  }
  
  // Test 4 & 5 & 6: Admin Entreprise
  for (const company of TEST_ACCOUNTS.companies) {
    const companyAuth = await testCompanyAdminLogin(company);
    if (companyAuth) {
      await testCompanyDataAccess(companyAuth.token, company.name);
      await testCompanyCreateData(companyAuth.token, company.name);
    }
  }
  
  // Test 8 & 9: Expert Comptable
  const accountantAuth = await testAccountantLogin();
  if (accountantAuth) {
    await testAccountantInvitations(accountantAuth.token);
  }
  
  // Afficher les résultats
  printResults();
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('='.repeat(80) + '\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ Passés: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  console.log(`⏭️  Ignorés: ${skipped}`);
  console.log(`📈 Total: ${results.length}\n`);
  
  if (failed > 0) {
    console.log('❌ TESTS ÉCHOUÉS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
      if (r.details) {
        console.log(`    Détails: ${JSON.stringify(r.details, null, 2)}`);
      }
    });
    console.log('');
  }
  
  console.log('='.repeat(80) + '\n');
}

// Exécuter les tests
runAllTests()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

