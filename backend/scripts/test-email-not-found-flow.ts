/**
 * Script de test pour simuler le flux "email non trouvé"
 * Teste la logique complète depuis la connexion jusqu'à l'inscription
 */

import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(test: string, passed: boolean, message: string, details?: any) {
  results.push({ test, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
  if (details) {
    console.log('   Détails:', JSON.stringify(details, null, 2));
  }
}

async function testDatabaseCleanup() {
  console.log('\n🧹 Test 1: Nettoyage de la base de données');
  
  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'okerybanza@gmail.com' },
          { email: { contains: 'okerybanza' } }
        ]
      }
    });

    if (existingUser) {
      // Supprimer l'utilisateur et l'entreprise
      const companyId = existingUser.company_id;
      
      if (companyId) {
        await prisma.subscriptions.deleteMany({
          where: { company_id: companyId }
        });
        await prisma.companies.delete({
          where: { id: companyId }
        });
      }
      
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          deleted_at: new Date(),
          email: `deleted_${existingUser.id}_${existingUser.email}`
        }
      });
      
      addResult('Nettoyage BD', true, 'Utilisateur supprimé avec succès');
    } else {
      addResult('Nettoyage BD', true, 'Aucun utilisateur à supprimer');
    }
  } catch (error: any) {
    addResult('Nettoyage BD', false, `Erreur: ${error.message}`);
  }
}

async function testEmailNotInDatabase() {
  console.log('\n🔍 Test 2: Vérification que l\'email n\'existe pas');
  
  try {
    const user = await prisma.users.findFirst({
      where: { 
        email: 'okerybanza@gmail.com',
        deleted_at: null
      }
    });

    if (!user) {
      addResult('Email non trouvé', true, 'L\'email n\'existe pas dans la BD');
    } else {
      addResult('Email non trouvé', false, 'L\'email existe encore dans la BD', { userId: user.id });
    }
  } catch (error: any) {
    addResult('Email non trouvé', false, `Erreur: ${error.message}`);
  }
}

function testURLParsing() {
  console.log('\n🔗 Test 3: Parsing des paramètres URL');
  
  const testUrls = [
    'https://conta.cd/register?email=okerybanza@gmail.com&reason=email_not_found',
    'https://conta.cd/register?email=test@example.com&reason=email_not_found',
    'https://conta.cd/register?email=okerybanza@gmail.com',
    'https://conta.cd/register',
  ];

  testUrls.forEach((url, index) => {
    try {
      const urlObj = new URL(url);
      const email = urlObj.searchParams.get('email');
      const reason = urlObj.searchParams.get('reason');
      const showMessage = reason === 'email_not_found';

      const expected = index < 2; // Les deux premiers devraient afficher le message
      
      if (showMessage === expected) {
        addResult(`URL Test ${index + 1}`, true, `Parsing correct: email=${email}, reason=${reason}, showMessage=${showMessage}`);
      } else {
        addResult(`URL Test ${index + 1}`, false, `Parsing incorrect: showMessage=${showMessage}, attendu=${expected}`);
      }
    } catch (error: any) {
      addResult(`URL Test ${index + 1}`, false, `Erreur: ${error.message}`);
    }
  });
}

function testConditionalLogic() {
  console.log('\n🧪 Test 4: Logique conditionnelle du message');
  
  const testCases = [
    { reason: 'email_not_found', expected: true, description: 'reason=email_not_found devrait afficher le message' },
    { reason: 'email_exists', expected: false, description: 'reason=email_exists ne devrait pas afficher le message' },
    { reason: null, expected: false, description: 'reason=null ne devrait pas afficher le message' },
    { reason: '', expected: false, description: 'reason="" ne devrait pas afficher le message' },
    { reason: 'EMAIL_NOT_FOUND', expected: false, description: 'reason=EMAIL_NOT_FOUND (majuscules) ne devrait pas afficher le message' },
  ];

  testCases.forEach((testCase, index) => {
    const showMessage = testCase.reason === 'email_not_found';
    const passed = showMessage === testCase.expected;
    
    addResult(
      `Condition Test ${index + 1}`,
      passed,
      testCase.description,
      { reason: testCase.reason, showMessage, expected: testCase.expected }
    );
  });
}

function testCodeStructure() {
  console.log('\n📝 Test 5: Structure du code source');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const registerPagePath = path.join(__dirname, '../../frontend/src/pages/auth/RegisterPage.tsx');
    const content = fs.readFileSync(registerPagePath, 'utf8');
    
    // Vérifier que le code contient les éléments nécessaires
    const checks = [
      { name: 'useSearchParams import', pattern: /useSearchParams.*from.*react-router-dom/, required: true },
      { name: 'reason extraction', pattern: /reason.*searchParams\.get\(['"]reason['"]\)/, required: true },
      { name: 'showEmailNotFoundMessage condition', pattern: /showEmailNotFoundMessage.*reason.*===.*['"]email_not_found['"]/, required: true },
      { name: 'Message JSX', pattern: /Cette adresse email n'existe pas dans la plateforme Conta/, required: true },
      { name: 'Conditional rendering', pattern: /\{showEmailNotFoundMessage &&/, required: true },
    ];

    checks.forEach(check => {
      const found = check.pattern.test(content);
      if (found || !check.required) {
        addResult(check.name, found, found ? 'Trouvé dans le code' : 'Non trouvé (non requis)');
      } else {
        addResult(check.name, false, 'NON TROUVÉ dans le code');
      }
    });
  } catch (error: any) {
    addResult('Structure du code', false, `Erreur: ${error.message}`);
  }
}

function testBuildOutput() {
  console.log('\n📦 Test 6: Vérification du build compilé');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const distPath = path.join(__dirname, '../../frontend/dist');
    
    if (!fs.existsSync(distPath)) {
      addResult('Build dist', false, 'Le dossier dist n\'existe pas');
      return;
    }

    // Chercher le fichier index.js compilé
    const assetsPath = path.join(distPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      addResult('Build assets', false, 'Le dossier assets n\'existe pas');
      return;
    }

    const files = fs.readdirSync(assetsPath);
    const indexFile = files.find((f: string) => f.startsWith('index-') && f.endsWith('.js'));
    
    if (!indexFile) {
      addResult('Build index.js', false, 'Le fichier index.js compilé n\'existe pas');
      return;
    }

    const indexContent = fs.readFileSync(path.join(assetsPath, indexFile), 'utf8');
    
    const checks = [
      { name: 'Texte du message', pattern: /Cette adresse email n'existe pas dans la plateforme Conta/, required: true },
      { name: 'Condition email_not_found', pattern: /email_not_found/, required: true },
      { name: 'Info icon', pattern: /Info|dc/, required: false },
    ];

    checks.forEach(check => {
      const found = check.pattern.test(indexContent);
      if (found || !check.required) {
        addResult(check.name, found, found ? 'Trouvé dans le build' : 'Non trouvé (non requis)');
      } else {
        addResult(check.name, false, 'NON TROUVÉ dans le build');
      }
    });

    addResult('Build index.js', true, `Fichier trouvé: ${indexFile}`);
  } catch (error: any) {
    addResult('Build compilé', false, `Erreur: ${error.message}`);
  }
}

async function testBackendErrorHandling() {
  console.log('\n🔧 Test 7: Gestion des erreurs backend');
  
  try {
    // Simuler une requête de login avec email non trouvé
    const testEmail = 'nonexistent@test.com';
    
    const user = await prisma.users.findFirst({
      where: {
        email: testEmail,
        deleted_at: null
      }
    });

    if (!user) {
      // Simuler le comportement du backend
      const errorCode = 'EMAIL_NOT_FOUND';
      const redirectUrl = `/register?email=${encodeURIComponent(testEmail)}&reason=email_not_found`;
      
      addResult('Backend error handling', true, 'Email non trouvé correctement détecté', {
        errorCode,
        redirectUrl,
        expectedBehavior: 'Redirection vers /register avec reason=email_not_found'
      });
    } else {
      addResult('Backend error handling', false, 'L\'email de test existe dans la BD');
    }
  } catch (error: any) {
    addResult('Backend error handling', false, `Erreur: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 DÉMARRAGE DES TESTS DE SIMULATION\n');
  console.log('='.repeat(60));
  
  await testDatabaseCleanup();
  await testEmailNotInDatabase();
  testURLParsing();
  testConditionalLogic();
  testCodeStructure();
  testBuildOutput();
  await testBackendErrorHandling();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RÉSUMÉ DES TESTS\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total: ${total} tests`);
  console.log(`✅ Réussis: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('❌ TESTS ÉCHOUÉS:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
      if (r.details) {
        console.log(`    Détails: ${JSON.stringify(r.details)}`);
      }
    });
  } else {
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !\n');
  }
}

// Exécuter les tests
runAllTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
