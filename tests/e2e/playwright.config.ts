import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour Conta.
 * - Les tests seront placés dans le dossier `specs/`
 * - baseURL pointe sur le frontend (Vite) de Conta.
 *   Vous pouvez la surcharger avec E2E_BASE_URL dans l'environnement si besoin.
 */
export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL:
      process.env.E2E_BASE_URL ||
      process.env.PLAYWRIGHT_BASE_URL ||
      'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
});

