import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import CustomError from '../utils/CustomError';

export interface AccountingReportFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  accountId?: string;
  accountCode?: string;
  customerId?: string;
  supplierId?: string;
}

export interface SalesJournalEntry {
  date: Date;
  invoiceNumber: string;
  customerName: string;
  customerId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  currency: string;
}

export interface SalesJournalReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  entries: SalesJournalEntry[];
  totals: {
    totalDebit: number;
    totalCredit: number;
  };
}

export interface PurchaseJournalEntry {
  date: Date;
  expenseNumber: string;
  supplierName: string;
  supplierId?: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  currency: string;
}

export interface PurchaseJournalReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  entries: PurchaseJournalEntry[];
  totals: {
    totalDebit: number;
    totalCredit: number;
  };
}

export interface GeneralLedgerEntry {
  date: Date;
  entryNumber: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number; // Solde cumulé
  currency: string;
}

export interface GeneralLedgerReport {
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  openingBalance: number; // Solde d'ouverture
  entries: GeneralLedgerEntry[];
  closingBalance: number; // Solde de clôture
  totals: {
    totalDebit: number;
    totalCredit: number;
  };
}

export interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  balance: number; // Débit - Crédit
}

export interface TrialBalanceReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  accounts: TrialBalanceAccount[];
  totals: {
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
    balance: number;
  };
}

export interface AgedBalanceEntry {
  id: string;
  name: string;
  current: number; // 0-30 jours
  days30: number; // 31-60 jours
  days60: number; // 61-90 jours
  days90: number; // Plus de 90 jours
  total: number;
  currency: string;
}

export interface AgedBalanceReport {
  type: 'receivables' | 'payables';
  period: {
    asOfDate: Date;
  };
  entries: AgedBalanceEntry[];
  totals: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    total: number;
  };
}

export class AccountingReportsService {
  /**
   * Helper pour obtenir le nom d'un client
   */
  private getCustomerName(customer: any): string {
    if (customer.businessName) return customer.businessName;
    if (customer.firstName || customer.lastName) {
      return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    return 'Client inconnu';
  }

  /**
   * Journal des Ventes - Liste des écritures comptables liées aux factures
   */
  async generateSalesJournal(
    companyId: string,
    filters: AccountingReportFilters
  ): Promise<SalesJournalReport> {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Récupérer les écritures comptables liées aux factures
    // Inclure les écritures postées ET en brouillon pour avoir toutes les données
    const whereClause: any = {
      company_id: companyId,
      source_type: 'invoice',
      entry_date: {
        gte: startDate,
        lte: endDate,
      },
      // Inclure toutes les écritures (draft et posted) pour avoir les données complètes
      // Le filtrage par status de facture se fait plus bas
    };

    // Si filtre par client, récupérer d'abord les factures
    let invoiceIds: string[] | undefined;
    if (filters.customerId) {
      const invoices = await prisma.invoices.findMany({
        where: {
          company_id: companyId,
          customer_id: filters.customerId,
          status: {
            notIn: ['draft', 'cancelled'], // Exclure les factures en brouillon et annulées
          },
        },
        select: { id: true },
      });
      invoiceIds = invoices.map((inv) => inv.id);
      if (invoiceIds.length === 0) {
        return {
          period: { startDate, endDate },
          entries: [],
          totals: { totalDebit: 0, totalCredit: 0 },
        };
      }
      whereClause.source_id = { in: invoiceIds };
    }

    const journalEntries = await prisma.journal_entries.findMany({
      where: whereClause,
      include: {
        journal_entry_lines: {
          include: {
            accounts: true,
          },
        },
      },
      orderBy: {
        entry_date: 'asc',
      },
    });

    // Récupérer toutes les factures en une seule requête
    const sourceIds = journalEntries.map((e) => e.source_id).filter((id): id is string => !!id);
    const invoicesList = await prisma.invoices.findMany({
      where: {
        id: { in: sourceIds },
        company_id: companyId,
        status: {
          not: 'draft', // Exclure les factures en brouillon
        },
      },
      include: {
        customers: true,
      },
    });
    const invoiceMap = new Map(invoicesList.map((inv) => [inv.id, inv]));

    const entries: SalesJournalEntry[] = [];

    for (const entry of journalEntries) {
      if (!entry.source_id) continue;
      const invoice = invoiceMap.get(entry.source_id);
      if (!invoice) continue;

      // Filtrer les lignes liées aux comptes de ventes (code commençant par 70)
      // Si aucun compte ne commence par 70, inclure toutes les lignes avec crédit > 0 (ventes)
      const salesLines = entry.journal_entry_lines.filter((line: any) => {
        const code = line.accounts?.code || '';
        // Comptes de produits (classe 7) ou lignes avec crédit (ventes)
        return code.startsWith('7') || (line.credit.toNumber() > 0 && line.debit.toNumber() === 0);
      });

      for (const line of salesLines) {
        entries.push({
          date: entry.entry_date,
          invoiceNumber: (invoice as any).invoice_number,
          customerName: (invoice as any).customers ? this.getCustomerName((invoice as any).customers) : 'Client inconnu',
          customerId: (invoice as any).customer_id,
          accountCode: line.accounts.code,
          accountName: line.accounts.name,
          description: line.description || entry.description || '',
          debit: line.debit.toNumber(),
          credit: line.credit.toNumber(),
          currency: (invoice as any).currency || 'CDF',
        });
      }
    }

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return {
      period: { startDate, endDate },
      entries,
      totals: {
        totalDebit,
        totalCredit,
      },
    };
  }

  /**
   * Journal des Achats - Liste des écritures comptables liées aux dépenses
   */
  async generatePurchaseJournal(
    companyId: string,
    filters: AccountingReportFilters
  ): Promise<PurchaseJournalReport> {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Récupérer les écritures comptables liées aux dépenses
    // Inclure les écritures postées ET en brouillon pour avoir toutes les données
    const whereClause: any = {
      company_id: companyId,
      source_type: 'expense',
      entry_date: {
        gte: startDate,
        lte: endDate,
      },
      // Inclure toutes les écritures (draft et posted) pour avoir les données complètes
    };

    // Si filtre par fournisseur, récupérer d'abord les dépenses
    let expenseIds: string[] | undefined;
    if (filters.supplierId) {
      const expenses = await prisma.expenses.findMany({
        where: {
          company_id: companyId,
          supplier_id: filters.supplierId,
        },
        select: { id: true },
      });
      expenseIds = expenses.map((exp) => exp.id);
      if (expenseIds.length === 0) {
        return {
          period: { startDate, endDate },
          entries: [],
          totals: { totalDebit: 0, totalCredit: 0 },
        };
      }
      whereClause.source_id = { in: expenseIds };
    }

    const journalEntries = await prisma.journal_entries.findMany({
      where: whereClause,
      include: {
        journal_entry_lines: {
          include: {
            accounts: true,
          },
        },
      },
      orderBy: {
        entry_date: 'asc',
      },
    });

    // Récupérer toutes les dépenses en une seule requête
    const sourceIds = journalEntries.map((e) => e.source_id).filter((id): id is string => !!id);
    const expensesList = await prisma.expenses.findMany({
      where: {
        id: { in: sourceIds },
        company_id: companyId,
      },
      include: {
        suppliers: true,
      },
    });
    const expenseMap = new Map(expensesList.map((exp) => [exp.id, exp]));

    const entries: PurchaseJournalEntry[] = [];

    for (const entry of journalEntries) {
      if (!entry.source_id) continue;
      const expense = expenseMap.get(entry.source_id);
      if (!expense) continue;

      // Filtrer les lignes liées aux comptes de charges (code commençant par 6)
      // Si aucun compte ne commence par 6, inclure toutes les lignes avec débit > 0 (charges)
      const expenseLines = entry.journal_entry_lines.filter((line: any) => {
        const code = line.accounts?.code || '';
        // Comptes de charges (classe 6) ou lignes avec débit (charges)
        return code.startsWith('6') || (line.debit.toNumber() > 0 && line.credit.toNumber() === 0);
      });

      for (const line of expenseLines) {
        entries.push({
          date: entry.entry_date,
          expenseNumber: (expense as any).expense_number,
          supplierName: (expense as any).suppliers?.name || (expense as any).supplier_name || 'Fournisseur inconnu',
          supplierId: (expense as any).supplier_id || undefined,
          accountCode: line.accounts.code,
          accountName: line.accounts.name,
          description: line.description || entry.description || '',
          debit: line.debit.toNumber(),
          credit: line.credit.toNumber(),
          currency: (expense as any).currency || 'CDF',
        });
      }
    }

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return {
      period: { startDate, endDate },
      entries,
      totals: {
        totalDebit,
        totalCredit,
      },
    };
  }

  /**
   * Grand Livre Général - Toutes les écritures pour un compte spécifique
   */
  async generateGeneralLedger(
    companyId: string,
    accountId: string,
    filters: AccountingReportFilters
  ): Promise<GeneralLedgerReport> {
    const account = await prisma.accounts.findUnique({
      where: { id: accountId, company_id: companyId },
    });

    if (!account) {
      throw new CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Calculer le solde d'ouverture (avant la période)
    // Inclure les écritures postées ET en brouillon pour avoir les données complètes
    const openingEntries = await prisma.journal_entry_lines.findMany({
      where: {
        account_id: accountId,
        journal_entries: {
          company_id: companyId,
          entry_date: {
            lt: startDate,
          },
          // Inclure draft et posted pour avoir toutes les données
          status: {
            in: ['draft', 'posted'],
          },
        },
      },
    });

    // CHECKLIST ÉTAPE 3 : Utiliser le point unique de calcul des soldes
    const balanceValidationService = (await import('./balanceValidation.service')).default;
    const openingBalance = await balanceValidationService.calculateBalanceFromEntries(
      companyId,
      accountId,
      new Date(startDate.getTime() - 1) // Un jour avant le début de la période
    );

    // Récupérer les écritures de la période
    // Inclure les écritures postées ET en brouillon pour avoir les données complètes
    const journalEntryLines = await prisma.journal_entry_lines.findMany({
      where: {
        account_id: accountId,
        journal_entries: {
          company_id: companyId,
          entry_date: {
            gte: startDate,
            lte: endDate,
          },
          // Inclure draft et posted pour avoir toutes les données
          status: {
            in: ['draft', 'posted'],
          },
        },
      },
      include: {
        journal_entries: {
          select: {
            id: true,
            entry_number: true,
            entry_date: true,
            description: true,
          },
        },
      },
      orderBy: {
        journal_entries: {
          entry_date: 'asc',
        },
      },
    });

    const entries: GeneralLedgerEntry[] = [];
    let runningBalance = openingBalance;

    for (const line of journalEntryLines) {
      const debit = line.debit.toNumber();
      const credit = line.credit.toNumber();

      // Les comptes d'actif et de charges sont des comptes de débit
      const isDebitAccount = account.type === 'asset' || account.type === 'expense';
      if (isDebitAccount) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      entries.push({
        date: line.journal_entries.entry_date,
        entryNumber: line.journal_entries.entry_number,
        reference: undefined, // JournalEntry n'a pas de champ reference
        description: line.description || line.journal_entries.description || '',
        debit,
        credit,
        balance: runningBalance,
        currency: 'CDF', // JournalEntryLine n'a pas de champ currency, utiliser la devise de la société
      });
    }

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
      },
      period: { startDate, endDate },
      openingBalance,
      entries,
      closingBalance: runningBalance,
      totals: {
        totalDebit,
        totalCredit,
      },
    };
  }

  /**
   * Balance Générale - Liste de tous les comptes avec leurs soldes
   */
  async generateTrialBalance(
    companyId: string,
    filters: AccountingReportFilters
  ): Promise<TrialBalanceReport> {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Récupérer tous les comptes actifs
    const accounts = await prisma.accounts.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        ...(filters.accountCode && {
          code: {
            startsWith: filters.accountCode,
          },
        }),
      },
      orderBy: {
        code: 'asc',
      },
    });

    // OPTIMISATION BATCH - Balance Générale
    // 1. Récupérer les totaux d'ouverture (avant startDate)
    const openingAggregations = await prisma.journal_entry_lines.groupBy({
      by: ['account_id'],
      where: {
        journal_entries: {
          company_id: companyId,
          entry_date: { lt: startDate },
          status: { in: ['draft', 'posted'] }
        }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    // 2. Récupérer les totaux de la période (entre startDate et endDate)
    const periodAggregations = await prisma.journal_entry_lines.groupBy({
      by: ['account_id'],
      where: {
        journal_entries: {
          company_id: companyId,
          entry_date: {
            gte: startDate,
            lte: endDate
          },
          status: { in: ['draft', 'posted'] }
        }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    const openingMap = new Map(openingAggregations.map(a => [a.account_id, {
      debit: Number(a._sum.debit || 0),
      credit: Number(a._sum.credit || 0)
    }]));

    const periodMap = new Map(periodAggregations.map(a => [a.account_id, {
      debit: Number(a._sum.debit || 0),
      credit: Number(a._sum.credit || 0)
    }]));

    const trialBalanceAccounts: TrialBalanceAccount[] = [];

    for (const account of accounts) {
      const opening = openingMap.get(account.id) || { debit: 0, credit: 0 };
      const period = periodMap.get(account.id) || { debit: 0, credit: 0 };

      const openingDebit = (opening as any).debit;
      const openingCredit = (opening as any).credit;
      const periodDebit = (period as any).debit;
      const periodCredit = (period as any).credit;

      const closingDebit = openingDebit + periodDebit;
      const closingCredit = openingCredit + periodCredit;

      const isDebitAccount = account.type === 'asset' || account.type === 'expense';
      const balance = isDebitAccount
        ? closingDebit - closingCredit
        : closingCredit - closingDebit;

      if (closingDebit === 0 && closingCredit === 0 && balance === 0) {
        continue;
      }

      trialBalanceAccounts.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        openingDebit,
        openingCredit,
        periodDebit,
        periodCredit,
        closingDebit,
        closingCredit,
        balance,
      });
    }

    // Calculer les totaux
    const totals = trialBalanceAccounts.reduce(
      (acc, account) => ({
        openingDebit: acc.openingDebit + account.openingDebit,
        openingCredit: acc.openingCredit + account.openingCredit,
        periodDebit: acc.periodDebit + account.periodDebit,
        periodCredit: acc.periodCredit + account.periodCredit,
        closingDebit: acc.closingDebit + account.closingDebit,
        closingCredit: acc.closingCredit + account.closingCredit,
        balance: acc.balance + account.balance,
      }),
      {
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
        balance: 0,
      }
    );

    return {
      period: { startDate, endDate },
      accounts: trialBalanceAccounts,
      totals,
    };
  }

  /**
   * Balance Âgée - Créances clients ou dettes fournisseurs par période d'échéance
   */
  async generateAgedBalance(
    companyId: string,
    type: 'receivables' | 'payables',
    asOfDate?: Date
  ): Promise<AgedBalanceReport> {
    const date = asOfDate || new Date();

    if (type === 'receivables') {
      // Créances clients
      const invoices = await prisma.invoices.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          status: {
            in: ['sent', 'partially_paid'],
          },
        },
        include: {
          customer: true,
          payments: true,
        },
      });

      const entries: AgedBalanceEntry[] = [];
      const totals = {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        total: 0,
      };

      for (const invoice of invoices) {
        // Calculer le solde restant
        const totalPaid = invoice.payments.reduce((sum: number, payment: any) => {
          return sum + Number(payment.amount);
        }, 0);
        const remainingBalance = Number(invoice.totalAmount) - totalPaid;
        if (remainingBalance <= 0) continue;

        // Calculer les jours de retard
        if (!invoice.dueDate) continue;
        const daysPastDue = Math.floor(
          (date.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        let current = 0;
        let days30 = 0;
        let days60 = 0;
        let days90 = 0;

        if (daysPastDue <= 0) {
          current = remainingBalance;
        } else if (daysPastDue <= 30) {
          days30 = remainingBalance;
        } else if (daysPastDue <= 60) {
          days60 = remainingBalance;
        } else {
          days90 = remainingBalance;
        }

        totals.current += current;
        totals.days30 += days30;
        totals.days60 += days60;
        totals.days90 += days90;
        totals.total += remainingBalance;

        entries.push({
          id: invoice.id,
          name: invoice.customer ? this.getCustomerName(invoice.customer) : 'Client inconnu',
          current,
          days30,
          days60,
          days90,
          total: remainingBalance,
          currency: (invoice as any).currency || 'CDF',
        });
      }

      return {
        type: 'receivables',
        period: { asOfDate: date },
        entries,
        totals,
      };
    } else {
      // Dettes fournisseurs (basées sur les dépenses non payées)
      const expenses = await prisma.expenses.findMany({
        where: {
          company_id: companyId,
          status: {
            in: ['draft', 'validated'],
          },
        },
        include: {
          supplier: true,
        },
      });

      const entries: AgedBalanceEntry[] = [];
      const totals = {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        total: 0,
      };

      for (const expense of expenses) {
        const amountDue = expense.amountTtc ? Number(expense.amountTtc) : Number(expense.totalAmount || 0);
        if (amountDue <= 0) continue;

        const daysPastDue = expense.paymentDate
          ? Math.floor((date.getTime() - expense.paymentDate.getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((date.getTime() - expense.expenseDate.getTime()) / (1000 * 60 * 60 * 24));

        let current = 0;
        let days30 = 0;
        let days60 = 0;
        let days90 = 0;

        if (daysPastDue <= 0) {
          current = amountDue;
        } else if (daysPastDue <= 30) {
          days30 = amountDue;
        } else if (daysPastDue <= 60) {
          days60 = amountDue;
        } else {
          days90 = amountDue;
        }

        totals.current += current;
        totals.days30 += days30;
        totals.days60 += days60;
        totals.days90 += days90;
        totals.total += amountDue;

        entries.push({
          id: expense.id,
          name: expense.supplier?.name || expense.supplierName || 'Fournisseur inconnu',
          current,
          days30,
          days60,
          days90,
          total: amountDue,
          currency: (expense as any).currency || 'CDF',
        });
      }

      return {
        type: 'payables',
        period: { asOfDate: date },
        entries,
        totals,
      };
    }
  }
}

export default new AccountingReportsService();

