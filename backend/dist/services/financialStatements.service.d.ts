export interface FinancialStatementFilters {
    startDate?: Date | string;
    endDate?: Date | string;
    period?: 'month' | 'quarter' | 'year';
    compareWithPrevious?: boolean;
}
export interface IncomeStatementItem {
    accountCode: string;
    accountName: string;
    amount: number;
    category: string;
}
export interface IncomeStatement {
    period: {
        startDate: Date;
        endDate: Date;
    };
    revenues: {
        sales: IncomeStatementItem[];
        otherRevenues: IncomeStatementItem[];
        total: number;
    };
    expenses: {
        costOfSales: IncomeStatementItem[];
        operatingExpenses: IncomeStatementItem[];
        financialExpenses: IncomeStatementItem[];
        exceptionalExpenses: IncomeStatementItem[];
        total: number;
    };
    results: {
        grossProfit: number;
        operatingResult: number;
        financialResult: number;
        exceptionalResult: number;
        netResult: number;
    };
    comparison?: {
        previousPeriod: {
            startDate: Date;
            endDate: Date;
            netResult: number;
        };
        variation: number;
        variationPercent: number;
    };
}
export interface BalanceSheetItem {
    accountCode: string;
    accountName: string;
    amount: number;
    category: string;
}
export interface BalanceSheet {
    period: {
        asOfDate: Date;
    };
    assets: {
        fixedAssets: BalanceSheetItem[];
        currentAssets: {
            inventory: BalanceSheetItem[];
            receivables: BalanceSheetItem[];
            cash: BalanceSheetItem[];
        };
        total: number;
    };
    liabilities: {
        equity: BalanceSheetItem[];
        debts: {
            loans: BalanceSheetItem[];
            payables: BalanceSheetItem[];
            otherLiabilities: BalanceSheetItem[];
        };
        total: number;
    };
    equation: {
        assets: number;
        liabilities: number;
        difference: number;
        isBalanced: boolean;
    };
}
export interface CashFlowItem {
    description: string;
    amount: number;
    type: 'inflow' | 'outflow';
}
export interface CashFlowStatement {
    period: {
        startDate: Date;
        endDate: Date;
    };
    operating: {
        items: CashFlowItem[];
        total: number;
    };
    investing: {
        items: CashFlowItem[];
        total: number;
    };
    financing: {
        items: CashFlowItem[];
        total: number;
    };
    netChange: number;
    openingBalance: number;
    closingBalance: number;
}
export declare class FinancialStatementsService {
    /**
     * Calculer le solde d'un compte à une date donnée
     * CHECKLIST ÉTAPE 3 : Utilise le point unique de calcul des soldes (balanceValidation.service)
     */
    private calculateAccountBalance;
    /**
     * Obtenir les dates de période
     */
    private getPeriodDates;
    /**
     * Générer le Compte de Résultat
     */
    generateIncomeStatement(companyId: string, filters?: FinancialStatementFilters): Promise<IncomeStatement>;
    /**
     * Catégoriser une charge selon son code
     */
    private categorizeExpense;
    /**
     * Générer le Bilan
     */
    generateBalanceSheet(companyId: string, filters?: FinancialStatementFilters): Promise<BalanceSheet>;
    /**
     * Générer le Tableau de Flux de Trésorerie
     */
    generateCashFlowStatement(companyId: string, filters?: FinancialStatementFilters): Promise<CashFlowStatement>;
    /**
     * Valider l'équation comptable (Actif = Passif + Capitaux Propres)
     */
    validateAccountingEquation(companyId: string, asOfDate?: Date): Promise<{
        isValid: boolean;
        assets: number;
        liabilities: number;
        equity: number;
        totalLiabilitiesAndEquity: number;
        difference: number;
        message: string;
        details?: {
            assetBreakdown: {
                fixedAssets: number;
                currentAssets: number;
                total: number;
            };
            liabilityBreakdown: {
                equity: number;
                debts: number;
                total: number;
            };
        };
    }>;
}
declare const _default: FinancialStatementsService;
export default _default;
//# sourceMappingURL=financialStatements.service.d.ts.map