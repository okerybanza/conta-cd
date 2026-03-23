// Setup pour les tests E2E
// S'assure que la base de données est accessible avant de lancer les tests

import prisma from '../../config/database';
import { connectDatabase } from '../../config/database';

// Vérifier la connexion à la base de données avant les tests
beforeAll(async () => {
  try {
    await connectDatabase();
    // Test simple pour vérifier que la connexion fonctionne
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ E2E Database connection verified');
  } catch (error) {
    console.error('❌ E2E Database connection failed:', error);
    throw error;
  }
});

// Nettoyer après tous les tests
afterAll(async () => {
  await prisma.$disconnect();
});

