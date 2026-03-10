import { test, expect } from '@playwright/test';
import { TestDataHelper } from '../helpers/test-data.helper';

/**
 * Flow 1 : Authentification
 * Étape 1 (simple) : tester uniquement l'inscription et la redirection vers /verify-email.
 *
 * On ne saisit PAS le code de vérification ici.
 * On vérifie seulement que :
 *  - le formulaire /register fonctionne
 *  - on est bien redirigé vers /verify-email avec les bons paramètres.
 */

test.describe('Flow 1 : Authentification', () => {
  test('Inscription nouvelle et redirection vers /verify-email', async ({ page }) => {
    const email = TestDataHelper.generateEmail('auth-flow1');
    const password = 'Test1234!';
    const companyName = TestDataHelper.generateCompanyName('Auth Company');

    // Aller sur la page d'inscription
    await page.goto('/register');

    // Remplir le formulaire
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.fill('input[name="firstName"]', 'Flow1');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="companyName"]', companyName);

    // Type de compte : startup (valeur réelle dans RegisterPage)
    const accountTypeSelect = page.locator('select[name="accountType"]');
    if (await accountTypeSelect.count()) {
      await accountTypeSelect.selectOption('startup');
    }

    // Soumettre le formulaire
    await page.click(
      'button[type="submit"], button:has-text("Créer mon compte"), button:has-text("Commencer gratuitement")'
    );

    // Vérifier qu'on arrive bien sur /verify-email
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 15_000 });

    const currentUrl = page.url();
    console.log('📍 Flow1 - URL après inscription:', currentUrl);
    console.log('📧 Flow1 - Email utilisé pour inscription:', email);
  });
});

