import { Page, test, expect } from '@playwright/test';
import { TestDataHelper } from './test-data.helper';

/**
 * Helper d'authentification pour les tests E2E.
 *
 * Objectif principal :
 * - Utiliser automatiquement un compte de test existant (TEST_EMAIL / TEST_PASSWORD)
 * - Sinon, guider la création d'un compte de test et expliquer clairement quoi faire
 */
export class AuthHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Assure qu'un utilisateur est connecté avant d'exécuter un scénario.
   *
   * Comportement :
   * - Si TEST_EMAIL / TEST_PASSWORD sont définis :
   *   - Tente une connexion via l'UI
   *   - Si succès → OK
   *   - Si échec (email inconnu / mauvais mot de passe / email non vérifié) → log + test.skip
   * - Si non définis :
   *   - Crée automatiquement un nouvel email de test
   *   - Tente une inscription via l'UI
   *   - S'arrête sur la page de vérification email, log l'URL et l'email → test.skip
   */
  async ensureLoggedInOrSkip() {
    const emailFromEnv = process.env.TEST_EMAIL;
    const passwordFromEnv = process.env.TEST_PASSWORD;

    if (emailFromEnv && passwordFromEnv) {
      await this.tryLoginWithExistingCredentials(emailFromEnv, passwordFromEnv);
      return;
    }

    console.warn(
      '⚠️ TEST_EMAIL / TEST_PASSWORD non définis. Création automatique d’un compte de test à vérifier manuellement.'
    );

    const generatedEmail = TestDataHelper.generateEmail('auto-user');
    const generatedPassword = 'Test1234!';
    const companyName = TestDataHelper.generateCompanyName('Auto Company');

    await this.registerNewAccountAndSkipForVerification(
      generatedEmail,
      generatedPassword,
      companyName
    );
  }

  /**
   * Tente de se connecter avec les identifiants fournis.
   * Si échec, log un message clair et skip le test.
   */
  private async tryLoginWithExistingCredentials(email: string, password: string) {
    const { page } = this;

    console.log('🔐 Tentative de connexion avec TEST_EMAIL / TEST_PASSWORD');
    await page.goto('/login');

    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"], button:has-text("Se connecter")');

    // Attendre soit le dashboard, soit un message d'erreur
    await page.waitForTimeout(2000);

    const dashboardLocator = page.locator(
      'text=/tableau de bord/i, text=/dashboard/i'
    );
    const errorLocator = page.locator(
      '.text-danger, [role="alert"], text=/incorrect/i, text=/n\'existe pas/i, text=/non vérifié/i'
    );

    if (await dashboardLocator.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Connexion réussie avec le compte de test existant.');
      return;
    }

    let errorText = '';
    if ((await errorLocator.count()) > 0) {
      errorText = (await errorLocator.first().textContent()) || '';
    }

    console.warn('❌ Connexion échouée avec le compte de test existant.');
    if (errorText) {
      console.warn('🧪 Message d’erreur affiché:', errorText.trim());
    }

    test.skip(
      'Les tests nécessitent un compte de test valide et vérifié. ' +
        'Vérifiez TEST_EMAIL / TEST_PASSWORD ou laissez le helper créer un compte automatiquement.'
    );
  }

  /**
   * Effectue une inscription UI avec un nouvel email généré,
   * puis s'arrête sur la page de vérification email.
   *
   * L'idée : automatiser au maximum, puis laisser l’humain valider l’email
   * une seule fois, ce qui rendra le compte utilisable ensuite.
   */
  private async registerNewAccountAndSkipForVerification(
    email: string,
    password: string,
    companyName: string
  ) {
    const { page } = this;

    console.log('🆕 Création automatique d’un compte de test :', {
      email,
      companyName,
    });

    await page.goto('/register');

    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.fill('input[name="firstName"], input[name="firstName"]', 'Auto');
    await page.fill('input[name="lastName"], input[name="lastName"]', 'User');
    await page.fill('input[name="companyName"], input[name="companyName"]', companyName);

    // Sélectionner un type de compte simple par défaut (startup)
    const accountTypeSelect = page.locator('select[name="accountType"]');
    if (await accountTypeSelect.count()) {
      await accountTypeSelect.selectOption('startup').catch(() => undefined);
    }

    await page.click(
      'button[type="submit"], button:has-text("Créer mon compte"), button:has-text("Commencer gratuitement")'
    );

    // On doit arriver sur /verify-email
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 15_000 });
    const verifyUrl = page.url();

    console.log('📍 Compte de test créé. Page de vérification email :', verifyUrl);
    console.log('📧 Email du compte de test :', email);
    console.log(
      '💡 Validez cet email une fois (via le mail reçu), puis définissez :\n' +
        `   TEST_EMAIL=${email}\n` +
        `   TEST_PASSWORD=${password}\n` +
        'Ensuite, relancez les tests pour utiliser ce compte automatiquement.'
    );

    test.skip(
      'Création automatique d’un compte de test terminée. ' +
        'Validez l’email reçu puis configurez TEST_EMAIL / TEST_PASSWORD avant de relancer la suite.'
    );
  }
}

