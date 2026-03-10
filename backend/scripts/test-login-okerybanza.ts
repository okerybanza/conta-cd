#!/usr/bin/env tsx
/**
 * Script de test du système de login avec okerybanza@gmail.com
 * Teste tous les scénarios de connexion
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const TEST_EMAIL = 'okerybanza@gmail.com';

interface TestResult {
  scenario: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(scenario: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
  results.push({ scenario, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌';
  console.log(`${icon} ${scenario}: ${message}`);
  if (details) {
    console.log(`   Détails:`, JSON.stringify(details, null, 2));
  }
}

async function testLogin(email: string, password: string, twoFactorCode?: string): Promise<any> {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      { email, password, twoFactorCode },
      {
        timeout: 10000,
        validateStatus: (status) => status < 500,
      }
    );
    return { 
      success: response.status === 200 && response.data?.success === true, 
      data: response.data, 
      status: response.status 
    };
  } catch (error: any) {
    const errorResponse = error.response?.data || {};
    return {
      success: false,
      error: errorResponse,
      data: errorResponse, // Ajouter data pour cohérence
      status: error.response?.status || 500,
    };
  }
}

async function runTests() {
  console.log('🧪 Test du système de login avec okerybanza@gmail.com\n');
  console.log(`📍 URL de base: ${BASE_URL}\n`);
  console.log(`📧 Email de test: ${TEST_EMAIL}\n`);

  // Test 1: Mot de passe incorrect
  console.log('📋 Test 1: Mot de passe incorrect');
  const test1 = await testLogin(TEST_EMAIL, 'WrongPassword123!');
  
  if (!test1.success && (test1.status === 401 || test1.status === 400)) {
    // Extraire l'erreur de différentes structures possibles
    const responseData = test1.error || test1.data;
    const errorData = responseData?.error || responseData;
    const errorCode = errorData?.code;
    const errorMessage = errorData?.message || responseData?.message;
    
    if (errorCode === 'INVALID_CREDENTIALS') {
      logTest(
        'Mot de passe incorrect',
        'PASS',
        `✅ Erreur correcte: ${errorMessage || 'Invalid credentials'}`,
        { code: errorCode, message: errorMessage, solution: errorData?.solution }
      );
    } else if (errorCode === 'EMAIL_NOT_FOUND') {
      logTest(
        'Email inexistant',
        'PASS',
        `✅ Email n'existe pas dans le système`,
        { code: errorCode, message: errorMessage }
      );
    } else {
      logTest(
        'Mot de passe incorrect',
        test1.status === 401 ? 'PASS' : 'FAIL',
        `Code d'erreur: ${errorCode || 'UNKNOWN'} (${errorMessage || 'No message'})`,
        { code: errorCode, message: errorMessage, fullError: responseData, status: test1.status }
      );
    }
  } else {
    logTest('Mot de passe incorrect', 'FAIL', 'Réponse inattendue', test1);
  }

  // Test 2: Mot de passe vide
  console.log('\n📋 Test 2: Validation - Mot de passe vide');
  const test2 = await testLogin(TEST_EMAIL, '');
  if (!test2.success && test2.status === 400) {
    logTest('Validation mot de passe vide', 'PASS', 'Mot de passe vide rejeté', test2.error);
  } else {
    logTest('Validation mot de passe vide', 'FAIL', 'Validation manquante', test2);
  }

  // Test 3: Email invalide (avec le même format mais email invalide)
  console.log('\n📋 Test 3: Validation - Email invalide');
  const test3 = await testLogin('invalid-email-format', 'Password123!');
  if (!test3.success && test3.status === 400) {
    logTest('Validation email invalide', 'PASS', 'Email invalide rejeté', test3.error);
  } else {
    logTest('Validation email invalide', 'FAIL', 'Validation manquante', test3);
  }

  // Test 4: Connexion avec différents mots de passe possibles (pour tester)
  console.log('\n📋 Test 4: Tentative avec mot de passe commun');
  const commonPasswords = ['password', '123456', 'Password123', 'okerybanza123'];
  for (const pwd of commonPasswords) {
    const test = await testLogin(TEST_EMAIL, pwd);
    if (test.success) {
      logTest(
        'Connexion réussie',
        'PASS',
        `Connexion réussie avec le mot de passe testé`,
        { hasToken: !!test.data?.data?.accessToken }
      );
      break;
    } else {
      const errorData = test.error?.error || test.error;
      if (errorData?.code === 'INVALID_CREDENTIALS') {
        // Continue à tester d'autres mots de passe
        continue;
      } else if (errorData?.code === 'EMAIL_NOT_FOUND') {
        logTest(
          'Connexion réussie',
          'SKIP',
          `Email n'existe pas dans le système`,
          { code: errorData.code }
        );
        break;
      }
    }
  }

  // Test 5: Vérifier la structure de l'erreur
  console.log('\n📋 Test 5: Vérification de la structure de l\'erreur');
  const test5 = await testLogin(TEST_EMAIL, 'WrongPassword123!');
  if (!test5.success) {
    // Extraire l'erreur de différentes structures possibles
    const responseData = test5.error || test5.data;
    const errorData = responseData?.error || responseData;
    const hasCode = !!errorData?.code;
    const hasMessage = !!errorData?.message || !!responseData?.message;
    const hasSolution = !!errorData?.solution;
    
    const message = errorData?.message || responseData?.message || 'No message';
    const code = errorData?.code || 'UNKNOWN';
    
    logTest(
      'Structure de l\'erreur',
      hasCode && hasMessage ? 'PASS' : 'FAIL',
      `Code: ${code}, Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}, Solution: ${hasSolution ? 'Oui' : 'Non'}`,
      { 
        code: code,
        message: message,
        solution: errorData?.solution,
        hasCode,
        hasMessage,
        hasSolution,
        fullError: responseData
      }
    );
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  console.log(`✅ Réussis: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  console.log(`⏭️  Ignorés: ${skipped}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed > 0) {
    console.log('\n❌ ÉCHECS:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`   - ${r.scenario}: ${r.message}`);
      });
  }

  if (passed > 0) {
    console.log('\n✅ RÉUSSITES:');
    results
      .filter((r) => r.status === 'PASS')
      .forEach((r) => {
        console.log(`   - ${r.scenario}: ${r.message}`);
      });
  }

  return { passed, failed, skipped, total: results.length };
}

// Exécuter les tests
runTests()
  .then((summary) => {
    console.log('\n✅ Tests terminés\n');
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  });
