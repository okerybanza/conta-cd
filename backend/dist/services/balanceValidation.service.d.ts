export interface BalanceDiscrepancy {
    accountId: string;
    accountCode: string;
    accountName: string;
    storedBalance: number;
    calculatedBalance: number;
    difference: number;
    detectedAt: Date;
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
    lastValidatedAt: Date;
}
export interface BalanceValidationReport {
    companyId: string;
    validatedAt: Date;
    totalAccounts: number;
    synchronized: number;
    desynchronized: number;
    totalDifference: number;
    discrepancies: BalanceDiscrepancy[];
    results: BalanceValidationResult[];
}
export declare class BalanceValidationService {
    /**
     * CHECKLIST ÉTAPE 3 : POINT UNIQUE DE CALCUL DES SOLDES
     * Cette méthode est le point unique de calcul des soldes depuis les écritures comptables.
     * Tous les autres services doivent utiliser cette méthode pour calculer les soldes.
     * Source de vérité : journal_entry_lines (écritures postées uniquement)
     */
    calculateBalanceFromEntries(companyId: string, accountId: string, asOfDate?: Date): Promise<number>;
    /**
     * Calculer les soldes pour plusieurs comptes en une seule requête
     * OPTIMISATION SPRINT 5 - Final Mile
     */
    calculateBalancesMany(companyId: string, accountIds: string[], asOfDate?: Date, status?: string[]): Promise<Map<string, number>>;
    /**
     * Valider le solde d'un compte spécifique
     */
    validateAccountBalance(companyId: string, accountId: string, autoCorrect?: boolean): Promise<BalanceValidationResult>;
    /**
     * Valider tous les soldes d'une entreprise
     */
    validateAllBalances(companyId: string, autoCorrect?: boolean): Promise<BalanceValidationReport>;
    /**
     * Recalculer le solde d'un compte spécifique
     */
    recalculateAccountBalance(companyId: string, accountId: string): Promise<{
        success: boolean;
        oldBalance: number;
        newBalance: number;
        difference: number;
    }>;
    /**
     * Recalculer tous les soldes d'une entreprise
     */
    recalculateAllBalances(companyId: string): Promise<{
        success: boolean;
        totalAccounts: number;
        recalculated: number;
        totalAdjustment: number;
    }>;
}
declare const _default: BalanceValidationService;
export default _default;
//# sourceMappingURL=balanceValidation.service.d.ts.map