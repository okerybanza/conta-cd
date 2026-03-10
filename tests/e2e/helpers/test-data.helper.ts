/**
 * Utilitaires pour générer des données de test uniques et déterministes.
 */
export class TestDataHelper {
  /**
   * Génère une adresse email unique pour les tests.
   * Exemple : test-1700000000000-123@test.conta.cd
   */
  static generateEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const domain = process.env.E2E_EMAIL_DOMAIN || 'test.conta.cd';
    return `${prefix}-${timestamp}-${random}@${domain}`;
  }

  /**
   * Génère un nom d'entreprise lisible avec un suffixe unique.
   */
  static generateCompanyName(prefix: string = 'Test Company'): string {
    const timestamp = Date.now();
    return `${prefix} ${timestamp}`;
  }
}

