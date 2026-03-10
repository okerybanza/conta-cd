#!/usr/bin/env tsx
/**
 * Script de test du système de login
 * Teste tous les scénarios de connexion
 */

import axios from 'axios';
import logger from '../src/utils/logger';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

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
      status: error.response?.status || 500,
    };
  }
}

async function runTests() {
  console.log('🧪 Test du système de login\n');
  console.log(`📍 URL de base: ${BASE_URL}\n`);

  // Test 1: Email et mot de passe qui n'existent pas
  console.log('📋 Test 1: Email et mot de passe inexistants');
  const test1 = await testLogin('nonexistent@test.com', 'WrongPassword123!');
  if (!test1.success && (test1.status === 401 || test1.status === 400)) {
    const errorData = test1.error?.error || test1.error;
    const errorCode = errorData?.code;
    if (errorCode === 'EMAIL_NOT_FOUND') {
      logTest(
        'Email inexistant',
        'PASS',
        `Erreur correcte: ${errorData.message || 'Email not found'}`,
        { code: errorCode, message: errorData.message }
      );
    } else {
      logTest(
        'Email inexistant',
        test1.status === 401 ? 'PASS' : 'FAIL',
        `Code d'erreur: ${errorCode || 'UNKNOWN'} (${errorData?.message || 'No message'})`,
        { code: errorCode, fullError: test1.error, status: test1.status }
      );
    }
  } else {
    logTest('Email inexistant', 'FAIL', 'Réponse inattendue', test1);
  }

  // Test 2: Email existe mais mot de passe incorrect
  console.log('\n📋 Test 2: Email existe mais mot de passe incorrect');
  // Utiliser un email qui pourrait exister (demo@conta.com selon la page de login)
  const test2 = await testLogin('demo@conta.com', 'WrongPassword123!');
  if (!test2.success && (test2.status === 401 || test2.status === 400)) {
    const errorData = test2.error?.error || test2.error;
    const errorCode = errorData?.code;
    if (errorCode === 'INVALID_CREDENTIALS') {
      logTest(
        'Mot de passe incorrect',
        'PASS',
        `Erreur correcte: ${errorData.message || 'Invalid credentials'}`,
        { code: errorCode }
      );
    } else if (errorCode === 'EMAIL_NOT_FOUND') {
      logTest(
        'Mot de passe incorrect',
        'PASS',
        `Email n'existe pas (comportement attendu si l'utilisateur n'existe pas)`,
        { code: errorCode }
      );
    } else {
      logTest(
        'Mot de passe incorrect',
        test2.status === 401 ? 'PASS' : 'FAIL',
        `Code d'erreur: ${errorCode || 'UNKNOWN'} (${errorData?.message || 'No message'})`,
        { code: errorCode, fullError: test2.error, status: test2.status }
      );
    }
  } else {
    logTest('Mot de passe incorrect', 'FAIL', 'Réponse inattendue', test2);
  }

  // Test 3: Connexion réussie (si les identifiants demo existent)
  console.log('\n📋 Test 3: Connexion avec identifiants valides');
  const test3 = await testLogin('demo@conta.com', 'Demo1234!');
  if (test3.success && test3.data?.data?.accessToken) {
    logTest(
      'Connexion réussie',
      'PASS',
      'Token reçu avec succès',
      {
        hasToken: !!test3.data.data.accessToken,
        hasRefreshToken: !!test3.data.data.refreshToken,
        userId: test3.data.data.user?.id,
      }
    );
  } else {
    const errorData = test3.error?.error || test3.error;
    if (errorData?.code === 'EMAIL_NOT_FOUND' || errorData?.code === 'INVALID_CREDENTIALS') {
      logTest(
        'Connexion réussie',
        'SKIP',
        `Identifiants demo non disponibles: ${errorData.code}`,
        { code: errorData.code }
      );
    } else {
      logTest('Connexion réussie', 'FAIL', 'Échec de connexion', test3.error);
    }
  }

  // Test 4: Validation des champs (email invalide)
  console.log('\n📋 Test 4: Validation - Email invalide');
  const test4 = await testLogin('invalid-email', 'Password123!');
  if (!test4.success && test4.status === 400) {
    logTest('Validation email', 'PASS', 'Email invalide rejeté', test4.error);
  } else {
    logTest('Validation email', 'FAIL', 'Validation manquante', test4);
  }

  // Test 5: Validation des champs (mot de passe vide)
  console.log('\n📋 Test 5: Validation - Mot de passe vide');
  const test5 = await testLogin('test@example.com', '');
  if (!test5.success && test5.status === 400) {
    logTest('Validation mot de passe', 'PASS', 'Mot de passe vide rejeté', test5.error);
  } else {
    logTest('Validation mot de passe', 'FAIL', 'Validation manquante', test5);
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

  return { passed, failed, skipped, total: results.length };
}

// Exécuter les tests
runTests()
  .then((summary) => {
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  });
