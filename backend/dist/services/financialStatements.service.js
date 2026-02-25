"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialStatementsService = void 0;
const database_1 = __importDefault(require("../config/database"));
class FinancialStatementsService {
    /**
     * Calculer le solde d'un compte à une date donnée
     * CHECKLIST ÉTAPE 3 : Utilise le point unique de calcul des soldes (balanceValidation.service)
     */
    async calculateAccountBalance(companyId, accountId, asOfDate, includeDraft = true) {
        // CHECKLIST ÉTAPE 3 : Utiliser le point unique de calcul des soldes
        // Pour les écritures postées, utiliser le service centralisé
        const balanceValidationService = (await Promise.resolve().then(() => __importStar(require('./balanceValidation.service')))).default;
        if (!includeDraft) {
            // Utiliser directement le service centralisé pour les écritures postées uniquement
            return await balanceValidationService.calculateBalanceFromEntries(companyId, accountId, asOfDate);
        }
        // Pour inclure les drafts, on doit calculer manuellement (cas spécial pour les états financiers)
        // Mais on utilise la même logique que le service centralisé
        const statusFilter = { in: ['draft', 'posted'] };
        const lines = await database_1.default.journal_entry_lines.findMany({
            where: {
                account_id: accountId,
                journal_entries: {
                    company_id: companyId,
                    entry_date: {
                        lte: asOfDate,
                    },
                    status: statusFilter,
                    reversed_at: null,
                },
            },
            include: {
                accounts: true,
            },
        });
        const account = await database_1.default.accounts.findUnique({
            where: { id: accountId },
        });
        if (!account)
            return 0;
        // CHECKLIST ÉTAPE 3 : Utiliser la même logique que le point unique de calcul
        let balance = 0;
        for (const line of lines) {
            const debit = Number(line.debit);
            const credit = Number(line.credit);
            // Pour les comptes d'actif et de charges : débit augmente, crédit diminue
            // Pour les comptes de passif, capitaux et produits : crédit augmente, débit diminue
            if (['asset', 'expense'].includes(account.type)) {
                balance += debit - credit;
            }
            else {
                balance += credit - debit;
            }
        }
        return balance;
    }
    /**
     * Obtenir les dates de période
     */
    getPeriodDates(filters) {
        let startDate;
        let endDate = new Date();
        if (filters.startDate && filters.endDate) {
            startDate = typeof filters.startDate === 'string'
                ? new Date(filters.startDate)
                : filters.startDate;
            endDate = typeof filters.endDate === 'string'
                ? new Date(filters.endDate)
                : filters.endDate;
        }
        else if (filters.period) {
            const now = new Date();
            switch (filters.period) {
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
            }
        }
        else {
            // Par défaut : année en cours
            const now = new Date();
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
        }
        return { startDate, endDate };
    }
    /**
     * Générer le Compte de Résultat
     */
    async generateIncomeStatement(companyId, filters = {}) {
        const { startDate, endDate } = this.getPeriodDates(filters);
        // Obtenir tous les comptes de revenus (Classe 7)
        const revenueAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '7',
                is_active: true,
            },
            orderBy: {
                code: 'asc',
            },
        });
        // Obtenir tous les comptes de charges (Classe 6)
        const expenseAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '6',
                is_active: true,
            },
            orderBy: {
                code: 'asc',
            },
        });
        // Calculer les revenus et charges en lot
        const balanceValidationService = (await Promise.resolve().then(() => __importStar(require('./balanceValidation.service')))).default;
        const allAccountIds = [...revenueAccounts.map(a => a.id), ...expenseAccounts.map(a => a.id)];
        // On calcule les soldes pour hier (pour le solde d'ouverture) et pour aujourd'hui
        const [openingBalances, closingBalances] = await Promise.all([
            balanceValidationService.calculateBalancesMany(companyId, allAccountIds, new Date(startDate.getTime() - 1)),
            balanceValidationService.calculateBalancesMany(companyId, allAccountIds, endDate)
        ]);
        // Mapper les revenus
        const sales = [];
        const otherRevenues = [];
        let totalRevenues = 0;
        for (const account of revenueAccounts) {
            const opening = openingBalances.get(account.id) || 0;
            const closing = closingBalances.get(account.id) || 0;
            const periodAmount = closing - opening;
            if (Math.abs(periodAmount) > 0.01) {
                const item = {
                    accountCode: account.code,
                    accountName: account.name,
                    amount: periodAmount,
                    category: account.code.startsWith('70') ? 'revenue' : 'other_revenue',
                };
                if (account.code.startsWith('70')) {
                    sales.push(item);
                }
                else {
                    otherRevenues.push(item);
                }
                totalRevenues += periodAmount;
            }
        }
        // Mapper les charges
        const costOfSales = [];
        const operatingExpenses = [];
        const financialExpenses = [];
        const exceptionalExpenses = [];
        let totalExpenses = 0;
        for (const account of expenseAccounts) {
            const opening = openingBalances.get(account.id) || 0;
            const closing = closingBalances.get(account.id) || 0;
            const periodAmount = closing - opening;
            if (Math.abs(periodAmount) > 0.01) {
                const item = {
                    accountCode: account.code,
                    accountName: account.name,
                    amount: Math.abs(periodAmount),
                    category: this.categorizeExpense(account.code),
                };
                switch (item.category) {
                    case 'cost_of_sales':
                        costOfSales.push(item);
                        break;
                    case 'operating_expenses':
                        operatingExpenses.push(item);
                        break;
                    case 'financial_expenses':
                        financialExpenses.push(item);
                        break;
                    case 'exceptional_expenses':
                        exceptionalExpenses.push(item);
                        break;
                }
                totalExpenses += Math.abs(periodAmount);
            }
        }
        // Calculer les résultats
        const grossProfit = totalRevenues - costOfSales.reduce((sum, item) => sum + item.amount, 0);
        const operatingResult = grossProfit - operatingExpenses.reduce((sum, item) => sum + item.amount, 0);
        const financialResult = operatingResult - financialExpenses.reduce((sum, item) => sum + item.amount, 0);
        const exceptionalResult = financialResult - exceptionalExpenses.reduce((sum, item) => sum + item.amount, 0);
        const netResult = exceptionalResult;
        const incomeStatement = {
            period: { startDate, endDate },
            revenues: {
                sales,
                otherRevenues,
                total: totalRevenues,
            },
            expenses: {
                costOfSales,
                operatingExpenses,
                financialExpenses,
                exceptionalExpenses,
                total: totalExpenses,
            },
            results: {
                grossProfit,
                operatingResult,
                financialResult,
                exceptionalResult,
                netResult,
            },
        };
        // Comparaison avec période précédente si demandée
        if (filters.compareWithPrevious) {
            const periodLength = endDate.getTime() - startDate.getTime();
            const previousStartDate = new Date(startDate.getTime() - periodLength - 1);
            const previousEndDate = new Date(startDate.getTime() - 1);
            const previousStatement = await this.generateIncomeStatement(companyId, {
                startDate: previousStartDate,
                endDate: previousEndDate,
            });
            const variation = netResult - previousStatement.results.netResult;
            const variationPercent = previousStatement.results.netResult !== 0
                ? (variation / Math.abs(previousStatement.results.netResult)) * 100
                : 0;
            incomeStatement.comparison = {
                previousPeriod: {
                    startDate: previousStartDate,
                    endDate: previousEndDate,
                    netResult: previousStatement.results.netResult,
                },
                variation,
                variationPercent,
            };
        }
        return incomeStatement;
    }
    /**
     * Catégoriser une charge selon son code
     */
    categorizeExpense(accountCode) {
        if (accountCode.startsWith('60')) {
            return 'cost_of_sales'; // Coût des ventes
        }
        else if (accountCode.startsWith('61') || accountCode.startsWith('62') || accountCode.startsWith('63')) {
            return 'operating_expenses'; // Charges d'exploitation
        }
        else if (accountCode.startsWith('66')) {
            return 'financial_expenses'; // Charges financières
        }
        else if (accountCode.startsWith('67')) {
            return 'exceptional_expenses'; // Charges exceptionnelles
        }
        return 'operating_expenses'; // Par défaut
    }
    /**
     * Générer le Bilan
     */
    async generateBalanceSheet(companyId, filters = {}) {
        const { endDate } = this.getPeriodDates(filters);
        const asOfDate = endDate;
        // ACTIF
        // Actif immobilisé (Classe 2)
        const fixedAssetAccounts = await database_1.default.accounts.findMany({
            where: { company_id: companyId, category: '2', is_active: true },
            orderBy: { code: 'asc' },
        });
        // Stocks (Classe 3)
        const inventoryAccounts = await database_1.default.accounts.findMany({
            where: { company_id: companyId, category: '3', is_active: true },
            orderBy: { code: 'asc' },
        });
        // Créances (Classe 4 - comptes d'actif : 40x clients, 41x, 42x avances, etc.)
        const receivableAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '4',
                is_active: true,
                code: { startsWith: '4', not: { startsWith: '40' } }, // Exclure fournisseurs (40x)
                type: 'asset',
            },
            orderBy: { code: 'asc' },
        });
        // Trésorerie (Classe 5)
        const cashAccounts = await database_1.default.accounts.findMany({
            where: { company_id: companyId, category: '5', is_active: true },
            orderBy: { code: 'asc' },
        });
        // PASSIF
        // Capitaux propres (Classe 1 - comptes 10 à 15)
        const equityAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '1',
                is_active: true,
                code: { lt: '16' },
            },
            orderBy: { code: 'asc' },
        });
        // Emprunts et dettes financières (Comptes 16x, 17x)
        const loanAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '1',
                is_active: true,
                OR: [
                    { code: { startsWith: '16' } },
                    { code: { startsWith: '17' } },
                ],
            },
            orderBy: { code: 'asc' },
        });
        // Dettes fournisseurs (Classe 4 - comptes 40x)
        const payableAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '4',
                is_active: true,
                code: { startsWith: '40' },
            },
            orderBy: { code: 'asc' },
        });
        // Autres dettes (Classe 4 - type liability, hors fournisseurs)
        const otherLiabilityAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '4',
                is_active: true,
                type: 'liability',
                code: { not: { startsWith: '40' } },
            },
            orderBy: { code: 'asc' },
        });
        // OPTIMISATION BATCH - Bilan
        const balanceValidationService = (await Promise.resolve().then(() => __importStar(require('./balanceValidation.service')))).default;
        const allAccounts = [
            ...fixedAssetAccounts,
            ...inventoryAccounts,
            ...receivableAccounts,
            ...cashAccounts,
            ...equityAccounts,
            ...loanAccounts,
            ...payableAccounts,
            ...otherLiabilityAccounts,
        ];
        // Une seule requête pour TOUS les soldes du bilan
        const balances = await balanceValidationService.calculateBalancesMany(companyId, allAccounts.map(a => a.id), asOfDate);
        const fixedAssets = [];
        let totalFixedAssets = 0;
        for (const account of fixedAssetAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                fixedAssets.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'fixed_asset' });
                totalFixedAssets += balance;
            }
        }
        const inventory = [];
        let totalInventory = 0;
        for (const account of inventoryAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                inventory.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'inventory' });
                totalInventory += balance;
            }
        }
        const receivables = [];
        let totalReceivables = 0;
        for (const account of receivableAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                receivables.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'receivable' });
                totalReceivables += balance;
            }
        }
        const cash = [];
        let totalCash = 0;
        for (const account of cashAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                cash.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'cash' });
                totalCash += balance;
            }
        }
        const equity = [];
        let totalEquity = 0;
        for (const account of equityAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                equity.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'equity' });
                totalEquity += balance;
            }
        }
        const loans = [];
        let totalLoans = 0;
        for (const account of loanAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                loans.push({ accountCode: account.code, accountName: account.name, amount: Math.abs(balance), category: 'loan' });
                totalLoans += Math.abs(balance);
            }
        }
        const payables = [];
        let totalPayables = 0;
        for (const account of payableAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                payables.push({ accountCode: account.code, accountName: account.name, amount: Math.abs(balance), category: 'payable' });
                totalPayables += Math.abs(balance);
            }
        }
        const otherLiabilities = [];
        let totalOtherLiabilities = 0;
        for (const account of otherLiabilityAccounts) {
            const balance = balances.get(account.id) || 0;
            if (Math.abs(balance) > 0.01) {
                otherLiabilities.push({ accountCode: account.code, accountName: account.name, amount: Math.abs(balance), category: 'other_liability' });
                totalOtherLiabilities += Math.abs(balance);
            }
        }
        // Total Actif
        const totalAssets = totalFixedAssets + totalInventory + totalReceivables + totalCash;
        const totalLiabilities = totalEquity + totalLoans + totalPayables + totalOtherLiabilities;
        // Vérifier l'équation comptable : Actif = Passif + Capitaux Propres
        const difference = totalAssets - totalLiabilities;
        const isBalanced = Math.abs(difference) < 0.01;
        return {
            period: {
                asOfDate,
            },
            assets: {
                fixedAssets,
                currentAssets: {
                    inventory,
                    receivables,
                    cash,
                },
                total: totalAssets,
            },
            liabilities: {
                equity,
                debts: {
                    loans,
                    payables,
                    otherLiabilities,
                },
                total: totalLiabilities,
            },
            equation: {
                assets: totalAssets,
                liabilities: totalLiabilities,
                difference,
                isBalanced,
            },
        };
    }
    /**
     * Générer le Tableau de Flux de Trésorerie
     */
    async generateCashFlowStatement(companyId, filters = {}) {
        const { startDate, endDate } = this.getPeriodDates(filters);
        // OPTIMISATION BATCH - Flux de trésorerie
        const balanceValidationService = (await Promise.resolve().then(() => __importStar(require('./balanceValidation.service')))).default;
        const cashAccounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                category: '5',
                is_active: true,
            },
        });
        const cashAccountIds = cashAccounts.map(a => a.id);
        // Calculer les soldes d'ouverture et de clôture en lot
        const [openingBalances, closingBalances] = await Promise.all([
            balanceValidationService.calculateBalancesMany(companyId, cashAccountIds, new Date(startDate.getTime() - 1)),
            balanceValidationService.calculateBalancesMany(companyId, cashAccountIds, endDate)
        ]);
        let openingBalance = 0;
        for (const id of cashAccountIds) {
            openingBalance += openingBalances.get(id) || 0;
        }
        // FLUX D'EXPLOITATION
        const operatingItems = [];
        // Encaissements clients (débit compte trésorerie, crédit compte clients)
        const customerPayments = await database_1.default.journal_entry_lines.findMany({
            where: {
                journalEntry: {
                    company_id: companyId,
                    entryDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'posted',
                    sourceType: 'payment',
                },
                account: {
                    category: '5', // Trésorerie
                },
                debit: {
                    gt: 0,
                },
            },
            include: {
                account: true,
                journalEntry: true,
            },
        });
        let totalOperatingInflow = 0;
        for (const line of customerPayments) {
            const amount = Number(line.debit);
            operatingItems.push({
                description: `Encaissement client - ${line.journalEntry.entryNumber}`,
                amount,
                type: 'inflow',
            });
            totalOperatingInflow += amount;
        }
        // Décaissements fournisseurs (débit compte fournisseurs, crédit compte trésorerie)
        const supplierPayments = await database_1.default.journal_entry_lines.findMany({
            where: {
                journalEntry: {
                    company_id: companyId,
                    entryDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'posted',
                    sourceType: 'expense',
                },
                account: {
                    category: '5', // Trésorerie
                },
                credit: {
                    gt: 0,
                },
            },
            include: {
                account: true,
                journalEntry: true,
            },
        });
        let totalOperatingOutflow = 0;
        for (const line of supplierPayments) {
            const amount = Number(line.credit);
            operatingItems.push({
                description: `Paiement fournisseur - ${line.journalEntry.entryNumber}`,
                amount,
                type: 'outflow',
            });
            totalOperatingOutflow += amount;
        }
        const operatingTotal = totalOperatingInflow - totalOperatingOutflow;
        // FLUX D'INVESTISSEMENT
        const investingItems = [];
        // Acquisitions d'immobilisations (débit compte immobilisations, crédit compte trésorerie)
        const assetAcquisitions = await database_1.default.journal_entry_lines.findMany({
            where: {
                journalEntry: {
                    company_id: companyId,
                    entryDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'posted',
                },
                account: {
                    category: '2', // Immobilisations
                },
                debit: {
                    gt: 0,
                },
            },
            include: {
                account: true,
                journalEntry: true,
            },
        });
        let totalInvestingOutflow = 0;
        for (const line of assetAcquisitions) {
            const amount = Number(line.debit);
            investingItems.push({
                description: `Acquisition immobilisation - ${line.account.name}`,
                amount,
                type: 'outflow',
            });
            totalInvestingOutflow += amount;
        }
        const investingTotal = -totalInvestingOutflow;
        // FLUX DE FINANCEMENT
        const financingItems = [];
        // Emprunts (débit compte trésorerie, crédit compte emprunts)
        const loans = await database_1.default.journal_entry_lines.findMany({
            where: {
                journalEntry: {
                    company_id: companyId,
                    entryDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'posted',
                },
                account: {
                    category: '1',
                    code: {
                        startsWith: '16', // Emprunts
                    },
                },
                credit: {
                    gt: 0,
                },
            },
            include: {
                account: true,
                journalEntry: true,
            },
        });
        let totalFinancingInflow = 0;
        for (const line of loans) {
            const amount = Number(line.credit);
            financingItems.push({
                description: `Emprunt - ${line.account.name}`,
                amount,
                type: 'inflow',
            });
            totalFinancingInflow += amount;
        }
        // Remboursements (débit compte emprunts, crédit compte trésorerie)
        const loanRepayments = await database_1.default.journal_entry_lines.findMany({
            where: {
                journalEntry: {
                    company_id: companyId,
                    entryDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'posted',
                },
                account: {
                    category: '1',
                    code: {
                        startsWith: '16', // Emprunts
                    },
                },
                debit: {
                    gt: 0,
                },
            },
            include: {
                account: true,
                journalEntry: true,
            },
        });
        let totalFinancingOutflow = 0;
        for (const line of loanRepayments) {
            const amount = Number(line.debit);
            financingItems.push({
                description: `Remboursement emprunt - ${line.account.name}`,
                amount,
                type: 'outflow',
            });
            totalFinancingOutflow += amount;
        }
        const financingTotal = totalFinancingInflow - totalFinancingOutflow;
        // Variation de trésorerie
        const netChange = operatingTotal + investingTotal + financingTotal;
        // Solde de clôture
        let closingBalance = 0;
        for (const id of cashAccountIds) {
            closingBalance += closingBalances.get(id) || 0;
        }
        return {
            period: { startDate, endDate },
            operating: {
                items: operatingItems,
                total: operatingTotal,
            },
            investing: {
                items: investingItems,
                total: investingTotal,
            },
            financing: {
                items: financingItems,
                total: financingTotal,
            },
            netChange,
            openingBalance,
            closingBalance,
        };
    }
    /**
     * Valider l'équation comptable (Actif = Passif + Capitaux Propres)
     */
    async validateAccountingEquation(companyId, asOfDate) {
        const date = asOfDate || new Date();
        const balanceSheet = await this.generateBalanceSheet(companyId, {
            endDate: date,
        });
        const totalAssets = balanceSheet.equation.assets;
        const totalLiabilities = balanceSheet.equation.liabilities;
        const equity = balanceSheet.liabilities.equity.reduce((sum, item) => sum + item.amount, 0);
        const debts = balanceSheet.liabilities.debts.loans.reduce((sum, item) => sum + item.amount, 0) + balanceSheet.liabilities.debts.payables.reduce((sum, item) => sum + item.amount, 0) + balanceSheet.liabilities.debts.otherLiabilities.reduce((sum, item) => sum + item.amount, 0);
        const totalLiabilitiesAndEquity = totalLiabilities;
        const difference = Math.abs(totalAssets - totalLiabilitiesAndEquity);
        const isValid = difference < 0.01; // Tolérance de 0.01
        const message = isValid
            ? '✅ Équation comptable équilibrée : Actif = Passif + Capitaux Propres'
            : `⚠️ Déséquilibre détecté : Différence de ${difference.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} CDF`;
        return {
            isValid,
            assets: totalAssets,
            liabilities: debts,
            equity,
            totalLiabilitiesAndEquity,
            difference,
            message,
            details: {
                assetBreakdown: {
                    fixedAssets: balanceSheet.assets.fixedAssets.reduce((sum, item) => sum + item.amount, 0),
                    currentAssets: balanceSheet.assets.currentAssets.inventory.reduce((sum, item) => sum + item.amount, 0) +
                        balanceSheet.assets.currentAssets.receivables.reduce((sum, item) => sum + item.amount, 0) +
                        balanceSheet.assets.currentAssets.cash.reduce((sum, item) => sum + item.amount, 0),
                    total: totalAssets,
                },
                liabilityBreakdown: {
                    equity,
                    debts,
                    total: totalLiabilitiesAndEquity,
                },
            },
        };
    }
}
exports.FinancialStatementsService = FinancialStatementsService;
exports.default = new FinancialStatementsService();
//# sourceMappingURL=financialStatements.service.js.map