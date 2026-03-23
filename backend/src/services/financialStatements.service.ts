import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import CustomError from '../utils/CustomError';

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
  category: string; // "revenue", "cost_of_sales", "operating_expenses", "financial_expenses", "exceptional_expenses"
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
    grossProfit: number; // Revenus - Coût des ventes
    operatingResult: number; // Résultat brut - Charges d'exploitation
    financialResult: number; // Résultat d'exploitation - Charges financières
    exceptionalResult: number; // Résultat financier - Charges exceptionnelles
    netResult: number; // Résultat net
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
    fixedAssets: BalanceSheetItem[]; // Classe 2
    currentAssets: {
      inventory: BalanceSheetItem[]; // Classe 3
      receivables: BalanceSheetItem[]; // Classe 4 (créances)
      cash: BalanceSheetItem[]; // Classe 5
    };
    total: number;
  };
  liabilities: {
    equity: BalanceSheetItem[]; // Classe 1 - 10XXXX (Capitaux propres)
    debts: {
      loans: BalanceSheetItem[]; // Classe 1 - 16XXXX (Emprunts)
      payables: BalanceSheetItem[]; // Classe 4 - 40XXXX (Fournisseurs)
      otherLiabilities: BalanceSheetItem[]; // Autres dettes
    };
    total: number;
  };
  equation: {
    assets: number;
    liabilities: number;
    difference: number; // Doit être 0 (Actif = Passif + Capitaux Propres)
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
  netChange: number; // Total des flux
  openingBalance: number; // Solde d'ouverture
  closingBalance: number; // Solde de clôture
}

export class FinancialStatementsService {
  /**
   * Calculer le solde d'un compte à une date donnée
   * CHECKLIST ÉTAPE 3 : Utilise le point unique de calcul des soldes (balanceValidation.service)
   */
  private async calculateAccountBalance(
    companyId: string,
    accountId: string,
    asOfDate: Date,
    includeDraft: boolean = true
  ): Promise<number> {
    // CHECKLIST ÉTAPE 3 : Utiliser le point unique de calcul des soldes
    // Pour les écritures postées, utiliser le service centralisé
    const balanceValidationService = (await import('./balanceValidation.service')).default;

    if (!includeDraft) {
      // Utiliser directement le service centralisé pour les écritures postées uniquement
      return await balanceValidationService.calculateBalanceFromEntries(companyId, accountId, asOfDate);
    }

    // Pour inclure les drafts, on doit calculer manuellement (cas spécial pour les états financiers)
    // Mais on utilise la même logique que le service centralisé
    const statusFilter = { in: ['draft', 'posted'] as string[] };

    const lines = await prisma.journal_entry_lines.findMany({
      where: {
        account_id: accountId,
        journal_entries: {
          company_id: companyId,
          entry_date: {
            lte: asOfDate,
          },
          status: statusFilter as any,
          reversed_at: null,
        },
      },
      include: {
        accounts: true,
      },
    });

    const account = await prisma.accounts.findUnique({
      where: { id: accountId },
    });

    if (!account) return 0;

    // CHECKLIST ÉTAPE 3 : Utiliser la même logique que le point unique de calcul
    let balance = 0;
    for (const line of lines) {
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      // Pour les comptes d'actif et de charges : débit augmente, crédit diminue
      // Pour les comptes de passif, capitaux et produits : crédit augmente, débit diminue
      if (['asset', 'expense'].includes(account.type)) {
        balance += debit - credit;
      } else {
        balance += credit - debit;
      }
    }

    return balance;
  }

  /**
   * Obtenir les dates de période
   */
  private getPeriodDates(
    filters: FinancialStatementFilters
  ): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date = new Date();

    if (filters.startDate && filters.endDate) {
      startDate = typeof filters.startDate === 'string'
        ? new Date(filters.startDate)
        : filters.startDate;
      endDate = typeof filters.endDate === 'string'
        ? new Date(filters.endDate)
        : filters.endDate;
    } else if (filters.period) {
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
    } else {
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
  async generateIncomeStatement(
    companyId: string,
    filters: FinancialStatementFilters = {}
  ): Promise<IncomeStatement> {
    const { startDate, endDate } = this.getPeriodDates(filters);

    // Obtenir tous les comptes de revenus (Classe 7)
    const revenueAccounts = await prisma.accounts.findMany({
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
    const expenseAccounts = await prisma.accounts.findMany({
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
    const balanceValidationService = (await import('./balanceValidation.service')).default;
    const allAccountIds = [...revenueAccounts.map(a => a.id), ...expenseAccounts.map(a => a.id)];

    // On calcule les soldes pour hier (pour le solde d'ouverture) et pour aujourd'hui
    const [openingBalances, closingBalances] = await Promise.all([
      balanceValidationService.calculateBalancesMany(companyId, allAccountIds, new Date(startDate.getTime() - 1)),
      balanceValidationService.calculateBalancesMany(companyId, allAccountIds, endDate)
    ]);

    // Mapper les revenus
    const sales: IncomeStatementItem[] = [];
    const otherRevenues: IncomeStatementItem[] = [];
    let totalRevenues = 0;

    for (const account of revenueAccounts) {
      const opening = openingBalances.get(account.id) || 0;
      const closing = closingBalances.get(account.id) || 0;
      const periodAmount = closing - opening;

      if (Math.abs(periodAmount) > 0.01) {
        const item: IncomeStatementItem = {
          accountCode: account.code,
          accountName: account.name,
          amount: periodAmount,
          category: account.code.startsWith('70') ? 'revenue' : 'other_revenue',
        };

        if (account.code.startsWith('70')) {
          sales.push(item);
        } else {
          otherRevenues.push(item);
        }

        totalRevenues += periodAmount;
      }
    }

    // Mapper les charges
    const costOfSales: IncomeStatementItem[] = [];
    const operatingExpenses: IncomeStatementItem[] = [];
    const financialExpenses: IncomeStatementItem[] = [];
    const exceptionalExpenses: IncomeStatementItem[] = [];
    let totalExpenses = 0;

    for (const account of expenseAccounts) {
      const opening = openingBalances.get(account.id) || 0;
      const closing = closingBalances.get(account.id) || 0;
      const periodAmount = closing - opening;

      if (Math.abs(periodAmount) > 0.01) {
        const item: IncomeStatementItem = {
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

    const incomeStatement: IncomeStatement = {
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
      const variationPercent =
        previousStatement.results.netResult !== 0
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
  private categorizeExpense(accountCode: string): string {
    if (accountCode.startsWith('60')) {
      return 'cost_of_sales'; // Coût des ventes
    } else if (accountCode.startsWith('61') || accountCode.startsWith('62') || accountCode.startsWith('63')) {
      return 'operating_expenses'; // Charges d'exploitation
    } else if (accountCode.startsWith('66')) {
      return 'financial_expenses'; // Charges financières
    } else if (accountCode.startsWith('67')) {
      return 'exceptional_expenses'; // Charges exceptionnelles
    }
    return 'operating_expenses'; // Par défaut
  }

  /**
   * Générer le Bilan
   */
  async generateBalanceSheet(
    companyId: string,
    filters: FinancialStatementFilters = {}
  ): Promise<BalanceSheet> {
    const { endDate } = this.getPeriodDates(filters);
    const asOfDate = endDate;

    const inventoryAccounts: any[] = [];
    const receivableAccounts: any[] = [];
    const cashAccounts: any[] = [];
    const equityAccounts: any[] = [];
    const loanAccounts: any[] = [];
    const payableAccounts: any[] = [];
    const otherLiabilityAccounts: any[] = [];
    let totalAssets = 0;
        // ACTIF
    // Actif immobilisé (Classe 2)
    const fixedAssetAccounts = await prisma.accounts.findMany({
      where: {
        company_id: companyId,
        category: '2',
        is_active: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    // OPTIMISATION BATCH - Bilan
    const balanceValidationService = (await import('./balanceValidation.service')).default;
    const allAccounts = [
      ...fixedAssetAccounts,
      ...inventoryAccounts,
      ...receivableAccounts,
      ...cashAccounts,
      ...equityAccounts,
      ...loanAccounts,
      ...payableAccounts,
      ...otherLiabilityAccounts
    ];

    // Une seule requête pour TOUS les soldes du bilan
    const balances = await balanceValidationService.calculateBalancesMany(
      companyId,
      allAccounts.map(a => a.id),
      asOfDate
    );

    const fixedAssets: BalanceSheetItem[] = [];
    let totalFixedAssets = 0;
    for (const account of fixedAssetAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        fixedAssets.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'fixed_asset' });
        totalFixedAssets += balance;
      }
    }

    const inventory: BalanceSheetItem[] = [];
    let totalInventory = 0;
    for (const account of inventoryAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        inventory.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'inventory' });
        totalInventory += balance;
      }
    }

    const receivables: BalanceSheetItem[] = [];
    let totalReceivables = 0;
    for (const account of receivableAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        receivables.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'receivable' });
        totalReceivables += balance;
      }
    }

    const cash: BalanceSheetItem[] = [];
    let totalCash = 0;
    for (const account of cashAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        cash.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'cash' });
        totalCash += balance;
      }
    }

    const equity: BalanceSheetItem[] = [];
    let totalEquity = 0;
    for (const account of equityAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        equity.push({ accountCode: account.code, accountName: account.name, amount: balance, category: 'equity' });
        totalEquity += balance;
      }
    }

    const loans: BalanceSheetItem[] = [];
    let totalLoans = 0;
    for (const account of loanAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        loans.push({ accountCode: account.code, accountName: account.name, amount: Math.abs(balance), category: 'loan' });
        totalLoans += Math.abs(balance);
      }
    }

    const payables: BalanceSheetItem[] = [];
    let totalPayables = 0;
    for (const account of payableAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        payables.push({ accountCode: account.code, accountName: account.name, amount: Math.abs(balance), category: 'payable' });
        totalPayables += Math.abs(balance);
      }
    }

    const otherLiabilities: BalanceSheetItem[] = [];
    let totalOtherLiabilities = 0;
    for (const account of otherLiabilityAccounts) {
      const balance = balances.get(account.id) || 0;
      if (Math.abs(balance) > 0.01) {
        otherLiabilities.push({ accountCode: account.code, accountName: account.name, amount: Math.abs(balance), category: 'other_liability' });
        totalOtherLiabilities += Math.abs(balance);
      }
    }

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
  async generateCashFlowStatement(
    companyId: string,
    filters: FinancialStatementFilters = {}
  ): Promise<CashFlowStatement> {
    const { startDate, endDate } = this.getPeriodDates(filters);

    // OPTIMISATION BATCH - Flux de trésorerie
    const balanceValidationService = (await import('./balanceValidation.service')).default;
    const cashAccounts = await prisma.accounts.findMany({
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
    const operatingItems: CashFlowItem[] = [];

    // Encaissements clients (débit compte trésorerie, crédit compte clients)
    const customerPayments = await prisma.journal_entry_lines.findMany({
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
    const supplierPayments = await prisma.journal_entry_lines.findMany({
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
    const investingItems: CashFlowItem[] = [];

    // Acquisitions d'immobilisations (débit compte immobilisations, crédit compte trésorerie)
    const assetAcquisitions = await prisma.journal_entry_lines.findMany({
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
    const financingItems: CashFlowItem[] = [];

    // Emprunts (débit compte trésorerie, crédit compte emprunts)
    const loans = await prisma.journal_entry_lines.findMany({
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
    const loanRepayments = await prisma.journal_entry_lines.findMany({
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
  async validateAccountingEquation(
    companyId: string,
    asOfDate?: Date
  ): Promise<{
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
  }> {
    const date = asOfDate || new Date();
    const balanceSheet = await this.generateBalanceSheet(companyId, {
      endDate: date,
    });

    const totalAssets = balanceSheet.equation.assets;
    const totalLiabilities = balanceSheet.equation.liabilities;
    const equity = balanceSheet.liabilities.equity.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const debts = balanceSheet.liabilities.debts.loans.reduce(
      (sum, item) => sum + item.amount,
      0
    ) + balanceSheet.liabilities.debts.payables.reduce(
      (sum, item) => sum + item.amount,
      0
    ) + balanceSheet.liabilities.debts.otherLiabilities.reduce(
      (sum, item) => sum + item.amount,
      0
    );
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
          fixedAssets: balanceSheet.assets.fixedAssets.reduce(
            (sum, item) => sum + item.amount,
            0
          ),
          currentAssets:
            balanceSheet.assets.currentAssets.inventory.reduce(
              (sum, item) => sum + item.amount,
              0
            ) +
            balanceSheet.assets.currentAssets.receivables.reduce(
              (sum, item) => sum + item.amount,
              0
            ) +
            balanceSheet.assets.currentAssets.cash.reduce(
              (sum, item) => sum + item.amount,
              0
            ),
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

export default new FinancialStatementsService();

