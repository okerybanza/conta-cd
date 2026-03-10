#!/usr/bin/env ts-node
/**
 * Script de diagnostic Redis
 * 
 * Usage:
 *   npm run diagnose:redis
 *   ou
 *   ts-node backend/scripts/diagnose-redis.ts
 */

import Redis from 'ioredis';
import { execSync } from 'child_process';

const diagnoseRedis = async () => {
  console.log('🔍 Diagnostic Redis - Conta\n');
  console.log('='.repeat(50));

  // 1. Vérifier l'installation
  console.log('\n1. Vérification de l\'installation Redis:');
  try {
    const version = execSync('redis-server --version', { encoding: 'utf-8' });
    console.log(`   ✅ Redis installé: ${version.trim()}`);
  } catch (error) {
    console.log('   ❌ Redis non installé');
  }

  try {
    const cliVersion = execSync('redis-cli --version', { encoding: 'utf-8' });
    console.log(`   ✅ redis-cli disponible: ${cliVersion.trim()}`);
  } catch (error) {
    console.log('   ❌ redis-cli non disponible');
  }

  // 2. Vérifier le service systemd
  console.log('\n2. État du service systemd:');
  try {
    const status = execSync('systemctl is-active redis.service', { encoding: 'utf-8' }).trim();
    if (status === 'active') {
      console.log('   ✅ Service Redis actif');
    } else {
      console.log(`   ⚠️  Service Redis: ${status}`);
    }
  } catch (error: any) {
    const output = error.stdout?.toString() || '';
    if (output.includes('inactive') || output.includes('failed')) {
      console.log('   ❌ Service Redis inactif ou en échec');
    }
  }

  // 3. Vérifier le port
  console.log('\n3. Vérification du port 6379:');
  try {
    execSync('netstat -tuln | grep 6379 || ss -tuln | grep 6379', { encoding: 'utf-8' });
    console.log('   ✅ Port 6379 en écoute');
  } catch (error) {
    console.log('   ❌ Port 6379 non utilisé (Redis n\'écoute pas)');
  }

  // 4. Tester la connexion
  console.log('\n4. Test de connexion Redis:');
  
  const testConnections = [
    { name: 'localhost:6379 (sans auth)', config: { host: 'localhost', port: 6379 } },
    { name: 'localhost:6379 (lazy connect)', config: { host: 'localhost', port: 6379, lazyConnect: true } },
  ];

  // Ajouter REDIS_URL si défini
  if (process.env.REDIS_URL) {
    testConnections.push({
      name: `REDIS_URL (${process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@')})`,
      config: { url: process.env.REDIS_URL },
    });
  }

  // Ajouter config personnalisée si définie
  if (process.env.REDIS_ENABLED === 'true') {
    testConnections.push({
      name: 'Configuration personnalisée',
      config: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true,
      },
    });
  }

  for (const test of testConnections) {
    try {
      const redis = new Redis(test.config);
      
      // Tester la connexion
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          redis.disconnect();
          reject(new Error('Timeout'));
        }, 3000);

        redis.on('ready', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        redis.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      // Tester PING
      const pong = await redis.ping();
      if (pong === 'PONG') {
        console.log(`   ✅ ${test.name}: Connexion réussie`);
      } else {
        console.log(`   ⚠️  ${test.name}: Connexion établie mais PING échoué`);
      }

      // Tester SET/GET
      await redis.set('test:diagnose', 'ok', 'EX', 10);
      const value = await redis.get('test:diagnose');
      if (value === 'ok') {
        console.log(`      ✅ SET/GET fonctionnel`);
      }

      await redis.del('test:diagnose');
      await redis.disconnect();
    } catch (error: any) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }

  // 5. Vérifier la configuration de l'application
  console.log('\n5. Configuration de l\'application:');
  console.log(`   REDIS_DISABLED: ${process.env.REDIS_DISABLED || 'non défini'}`);
  console.log(`   REDIS_ENABLED: ${process.env.REDIS_ENABLED || 'non défini'}`);
  console.log(`   REDIS_URL: ${process.env.REDIS_URL ? 'défini' : 'non défini'}`);
  console.log(`   REDIS_HOST: ${process.env.REDIS_HOST || 'non défini'}`);
  console.log(`   REDIS_PORT: ${process.env.REDIS_PORT || 'non défini'}`);

  // 6. Recommandations
  console.log('\n6. Recommandations:');
  
  const redisDisabled = process.env.REDIS_DISABLED === 'true';
  const redisEnabled = process.env.REDIS_ENABLED === 'true' || process.env.REDIS_URL;
  
  if (redisDisabled) {
    console.log('   ℹ️  Redis est explicitement désactivé (REDIS_DISABLED=true)');
    console.log('   ℹ️  Les emails seront envoyés directement, sans queue');
  } else if (!redisEnabled) {
    console.log('   ⚠️  Redis n\'est pas configuré dans .env');
    console.log('   💡 Pour activer Redis, définir REDIS_ENABLED=true ou REDIS_URL');
    console.log('   💡 Pour désactiver explicitement, définir REDIS_DISABLED=true');
  } else {
    console.log('   ✅ Redis est configuré dans .env');
    console.log('   ⚠️  Mais la connexion échoue - vérifiez que le service Redis est démarré');
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Commandes utiles:');
  console.log('   - sudo systemctl status redis    : Vérifier le statut du service');
  console.log('   - sudo systemctl start redis      : Démarrer Redis');
  console.log('   - sudo journalctl -u redis -f    : Voir les logs en temps réel');
  console.log('   - redis-cli ping                  : Tester la connexion');
};

// Exécuter le diagnostic
diagnoseRedis().catch((error) => {
  console.error('Erreur lors du diagnostic:', error);
  process.exit(1);
});

