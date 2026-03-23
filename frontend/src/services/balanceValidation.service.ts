import api from './api';

export interface BalanceDiscrepancy {
  accountId: string;
  accountCode: string;
  accountName: string;
  storedBalance: number;
  calculatedBalance: number;
  difference: number;
  detectedAt: string;
}

export interface BalanceValidationResult {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  storedBalance: number;
  calculatedBalance: number;
  difference: number;
  isSynchronized: boolean;
  lastValidatedAt: string;
}

export interface BalanceValidationReport {
  companyId: string;
  validatedAt: string;
  totalAccounts: number;
  synchronized: number;
  desynchronized: number;
  totalDifference: number;
  discrepancies: BalanceDiscrepancy[];
  results: BalanceValidationResult[];
}

class BalanceValidationService {
  /**
   * Valider le solde d'un compte spécifique
   */
  async validateAccountBalance(
    accountId: string,
    autoCorrect: boolean = false
  ): Promise<{
    success: boolean;
    data: BalanceValidationResult;
  }> {
    const params = new URLSearchParams();
    if (autoCorrect) params.append('autoCorrect', 'true');

    const response = await api.get(
      `/balance-validation/account/${accountId}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Valider tous les soldes d'une entreprise
   */
  async validateAllBalances(autoCorrect: boolean = false): Promise<{
    success: boolean;
    data: BalanceValidationReport;
  }> {
    const params = new URLSearchParams();
    if (autoCorrect) params.append('autoCorrect', 'true');

    const response = await api.get(`/balance-validation/all?${params.toString()}`);
    return response.data;
  }

  /**
   * Recalculer le solde d'un compte spécifique
   */
  async recalculateAccountBalance(accountId: string): Promise<{
    success: boolean;
    data: {
      success: boolean;
      oldBalance: number;
      newBalance: number;
      difference: number;
    };
  }> {
    const response = await api.post(`/balance-validation/account/${accountId}/recalculate`);
    return response.data;
  }

  /**
   * Recalculer tous les soldes d'une entreprise
   */
  async recalculateAllBalances(): Promise<{
    success: boolean;
    data: {
      success: boolean;
      totalAccounts: number;
      recalculated: number;
      totalAdjustment: number;
    };
  }> {
    const response = await api.post('/balance-validation/recalculate-all');
    return response.data;
  }
}

export default new BalanceValidationService();

