/**
 * Script de test rapide pour vérifier que tous les comptes de la démo fonctionnent
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import axios from 'axios';

const API_URL = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3001/api/v1';

const DEMO_ACCOUNTS = [
  {
    name: 'Super Admin',
    email: 'admin@conta.cd',
    password: 'Demo123!',
  },
  {
    name: 'Entreprise Gratuite - Admin',
    email: 'demo.gratuit@conta.test',
    password: 'Demo123!',
  },
  {
    name: 'Entreprise Starter - Admin',
    email: 'demo.starter@conta.test',
    password: 'Demo123!',
  },
  {
    name: 'Entreprise Pro - Admin',
    email: 'demo.pro@conta.test',
    password: 'Demo123!',
  },
  {
    name: 'Entreprise Premium - Admin',
    email: 'demo.premium@conta.test',
    password: 'Demo123!',
  },
  {
    name: 'Expert Comptable',
    email: 'expert.comptable@conta.test',
    password: 'Demo123!',
  },
];

async function testLogin(email: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      const data = response.data.data;
      return {
        success: true,
        token: data.accessToken || data.token,
        user: data.user || data,
      };
    }
    return { success: false, error: 'Format de réponse inattendu' };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Backend non accessible. Vérifiez que le serveur est démarré.',
      };
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || error.toString(),
    };
  }
}

async function main() {
  console.log('🧪 Test des comptes de la démo\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const account of DEMO_ACCOUNTS) {
    console.log(`\n🔐 Test: ${account.name}`);
    console.log(`   Email: ${account.email}`);

    const result = await testLogin(account.email, account.password);

    if (result.success) {
      console.log(`   ✅ Connexion réussie`);
      console.log(`   Token: ${result.token?.substring(0, 20)}...`);
      if (result.user) {
        console.log(`   Role: ${result.user.role || 'N/A'}`);
        console.log(`   Company ID: ${result.user.companyId || 'N/A'}`);
      }
      passed++;
    } else {
      console.log(`   ❌ Échec: ${result.error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Résultats:`);
  console.log(`   ✅ Réussis: ${passed}/${DEMO_ACCOUNTS.length}`);
  console.log(`   ❌ Échoués: ${failed}/${DEMO_ACCOUNTS.length}`);

  if (failed === 0) {
    console.log('\n🎉 Tous les comptes fonctionnent correctement !');
    process.exit(0);
  } else {
    console.log('\n⚠️  Certains comptes ont des problèmes.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

