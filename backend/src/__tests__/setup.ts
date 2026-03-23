// Setup file for Jest tests
// This file runs before all test suites

// Charger les variables d'environnement
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env si disponible, sinon utiliser les variables du système
config({ path: resolve(__dirname, '../../.env') });

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to silence console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Increase timeout for async operations
jest.setTimeout(10000);


// Fermer les connexions après tous les tests
afterAll(async () => {
  const { disconnectDatabase } = await import('../config/database');
  await disconnectDatabase();
});
