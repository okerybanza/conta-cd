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
exports.AccountingReportsService = void 0;
const database_1 = __importDefault(require("../config/database"));
const CustomError_1 = __importDefault(require("../utils/CustomError"));
class AccountingReportsService {
    /**
     * Helper pour obtenir le nom d'un client
     */
    getCustomerName(customer) {
        if (customer.businessName)
            return customer.businessName;
        if (customer.firstName || customer.lastName) {
            return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        }
        return 'Client inconnu';
    }
    /**
     * Journal des Ventes - Liste des écritures comptables liées aux factures
     */
    async generateSalesJournal(companyId, filters) {
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        // Récupérer les écritures comptables liées aux factures
        // Inclure les écritures postées ET en brouillon pour avoir toutes les données
        const whereClause = {
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
        if (filters.customerId) {
            const invoices = await database_1.default.invoices.findMany({
                where: {
                    company_id: companyId,
                    customer_id: filters.customerId,
                    status: {
                        notIn: ['draft', 'cancelled'], // Exclure les factures en brouillon et annulées
                    },
                },
                select: { id: true },
            });
            const invoiceIds = invoices.map((inv) => inv.id);
            if (invoiceIds.length === 0) {
                return {
                    period: { startDate, endDate },
                    entries: [],
                    totals: { totalDebit: 0, totalCredit: 0 },
                };
            }
            whereClause.source_id = { in: invoiceIds };
        }
        const journalEntries = await database_1.default.journal_entries.findMany({
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
        const sourceIds = journalEntries.map((e) => e.source_id).filter((id) => !!id);
        const invoicesList = await database_1.default.invoices.findMany({
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
        const entries = [];
        for (const entry of journalEntries) {
            if (!entry.source_id)
                continue;
            const invoice = invoiceMap.get(entry.source_id);
            if (!invoice)
                continue;
            // Filtrer les lignes liées aux comptes de ventes (code commençant par 70)
            // Si aucun compte ne commence par 70, inclure toutes les lignes avec crédit > 0 (ventes)
            const salesLines = entry.journal_entry_lines.filter((line) => {
                const code = line.accounts?.code || '';
                // Comptes de produits (classe 7) ou lignes avec crédit (ventes)
                return code.startsWith('7') || (line.credit.toNumber() > 0 && line.debit.toNumber() === 0);
            });
            for (const line of salesLines) {
                entries.push({
                    date: entry.entry_date,
                    invoiceNumber: invoice.invoice_number,
                    customerName: invoice.customers ? this.getCustomerName(invoice.customers) : 'Client inconnu',
                    customerId: invoice.customer_id,
                    accountCode: line.accounts.code,
                    accountName: line.accounts.name,
                    description: line.description || entry.description || '',
                    debit: line.debit.toNumber(),
                    credit: line.credit.toNumber(),
                    currency: invoice.currency || 'CDF',
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
    async generatePurchaseJournal(companyId, filters) {
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        // Récupérer les écritures comptables liées aux dépenses
        // Inclure les écritures postées ET en brouillon pour avoir toutes les données
        const whereClause = {
            company_id: companyId,
            source_type: 'expense',
            entry_date: {
                gte: startDate,
                lte: endDate,
            },
            // Inclure toutes les écritures (draft et posted) pour avoir les données complètes
        };
        // Si filtre par fournisseur, récupérer d'abord les dépenses
        if (filters.supplierId) {
            const expenses = await database_1.default.expenses.findMany({
                where: {
                    company_id: companyId,
                    supplier_id: filters.supplierId,
                },
                select: { id: true },
            });
            const expenseIds = expenses.map((exp) => exp.id);
            if (expenseIds.length === 0) {
                return {
                    period: { startDate, endDate },
                    entries: [],
                    totals: { totalDebit: 0, totalCredit: 0 },
                };
            }
            whereClause.source_id = { in: expenseIds };
        }
        const journalEntries = await database_1.default.journal_entries.findMany({
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
        const sourceIds = journalEntries.map((e) => e.source_id).filter((id) => !!id);
        const expensesList = await database_1.default.expenses.findMany({
            where: {
                id: { in: sourceIds },
                company_id: companyId,
            },
            include: {
                suppliers: true,
            },
        });
        const expenseMap = new Map(expensesList.map((exp) => [exp.id, exp]));
        const entries = [];
        for (const entry of journalEntries) {
            if (!entry.source_id)
                continue;
            const expense = expenseMap.get(entry.source_id);
            if (!expense)
                continue;
            // Filtrer les lignes liées aux comptes de charges (code commençant par 6)
            // Si aucun compte ne commence par 6, inclure toutes les lignes avec débit > 0 (charges)
            const expenseLines = entry.journal_entry_lines.filter((line) => {
                const code = line.accounts?.code || '';
                // Comptes de charges (classe 6) ou lignes avec débit (charges)
                return code.startsWith('6') || (line.debit.toNumber() > 0 && line.credit.toNumber() === 0);
            });
            for (const line of expenseLines) {
                entries.push({
                    date: entry.entry_date,
                    expenseNumber: expense.expense_number,
                    supplierName: expense.suppliers?.name || expense.supplier_name || 'Fournisseur inconnu',
                    supplierId: expense.supplier_id || undefined,
                    accountCode: line.accounts.code,
                    accountName: line.accounts.name,
                    description: line.description || entry.description || '',
                    debit: line.debit.toNumber(),
                    credit: line.credit.toNumber(),
                    currency: expense.currency || 'CDF',
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
    async generateGeneralLedger(companyId, accountId, filters) {
        const account = await database_1.default.accounts.findUnique({
            where: { id: accountId, company_id: companyId },
        });
        if (!account) {
            throw new CustomError_1.default('Account not found', 404, 'ACCOUNT_NOT_FOUND');
        }
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        // Calculer le solde d'ouverture (avant la période)
        // Inclure les écritures postées ET en brouillon pour avoir les données complètes
        const openingEntries = await database_1.default.journal_entry_lines.findMany({
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
        const balanceValidationService = (await Promise.resolve().then(() => __importStar(require('./balanceValidation.service')))).default;
        const openingBalance = await balanceValidationService.calculateBalanceFromEntries(companyId, accountId, new Date(startDate.getTime() - 1) // Un jour avant le début de la période
        );
        // Récupérer les écritures de la période
        // Inclure les écritures postées ET en brouillon pour avoir les données complètes
        const journalEntryLines = await database_1.default.journal_entry_lines.findMany({
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
        const entries = [];
        let runningBalance = openingBalance;
        for (const line of journalEntryLines) {
            const debit = line.debit.toNumber();
            const credit = line.credit.toNumber();
            // Les comptes d'actif et de charges sont des comptes de débit
            const isDebitAccount = account.type === 'asset' || account.type === 'expense';
            if (isDebitAccount) {
                runningBalance += debit - credit;
            }
            else {
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
    async generateTrialBalance(companyId, filters) {
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        // Récupérer tous les comptes actifs
        const accounts = await database_1.default.accounts.findMany({
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
        const openingAggregations = await database_1.default.journal_entry_lines.groupBy({
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
        const periodAggregations = await database_1.default.journal_entry_lines.groupBy({
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
        const trialBalanceAccounts = [];
        for (const account of accounts) {
            const opening = (openingMap.get(account.id) || { debit: 0, credit: 0 });
            const period = (periodMap.get(account.id) || { debit: 0, credit: 0 });
            const openingDebit = opening.debit;
            const openingCredit = opening.credit;
            const periodDebit = period.debit;
            const periodCredit = period.credit;
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
        const totals = trialBalanceAccounts.reduce((acc, account) => ({
            openingDebit: acc.openingDebit + account.openingDebit,
            openingCredit: acc.openingCredit + account.openingCredit,
            periodDebit: acc.periodDebit + account.periodDebit,
            periodCredit: acc.periodCredit + account.periodCredit,
            closingDebit: acc.closingDebit + account.closingDebit,
            closingCredit: acc.closingCredit + account.closingCredit,
            balance: acc.balance + account.balance,
        }), {
            openingDebit: 0,
            openingCredit: 0,
            periodDebit: 0,
            periodCredit: 0,
            closingDebit: 0,
            closingCredit: 0,
            balance: 0,
        });
        return {
            period: { startDate, endDate },
            accounts: trialBalanceAccounts,
            totals,
        };
    }
    /**
     * Balance Âgée - Créances clients ou dettes fournisseurs par période d'échéance
     */
    async generateAgedBalance(companyId, type, asOfDate) {
        const date = asOfDate || new Date();
        if (type === 'receivables') {
            // Créances clients
            const invoices = await database_1.default.invoices.findMany({
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
            const entries = [];
            const totals = {
                current: 0,
                days30: 0,
                days60: 0,
                days90: 0,
                total: 0,
            };
            for (const invoice of invoices) {
                // Calculer le solde restant
                const totalPaid = invoice.payments.reduce((sum, payment) => {
                    return sum + Number(payment.amount);
                }, 0);
                const remainingBalance = Number(invoice.totalAmount) - totalPaid;
                if (remainingBalance <= 0)
                    continue;
                // Calculer les jours de retard
                if (!invoice.dueDate)
                    continue;
                const daysPastDue = Math.floor((date.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
                let current = 0;
                let days30 = 0;
                let days60 = 0;
                let days90 = 0;
                if (daysPastDue <= 0) {
                    current = remainingBalance;
                }
                else if (daysPastDue <= 30) {
                    days30 = remainingBalance;
                }
                else if (daysPastDue <= 60) {
                    days60 = remainingBalance;
                }
                else {
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
                    currency: invoice.currency || 'CDF',
                });
            }
            return {
                type: 'receivables',
                period: { asOfDate: date },
                entries,
                totals,
            };
        }
        else {
            // Dettes fournisseurs (basées sur les dépenses non payées)
            const expenses = await database_1.default.expenses.findMany({
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
            const entries = [];
            const totals = {
                current: 0,
                days30: 0,
                days60: 0,
                days90: 0,
                total: 0,
            };
            for (const expense of expenses) {
                const amountDue = expense.amountTtc ? Number(expense.amountTtc) : Number(expense.totalAmount || 0);
                if (amountDue <= 0)
                    continue;
                const daysPastDue = expense.paymentDate
                    ? Math.floor((date.getTime() - expense.paymentDate.getTime()) / (1000 * 60 * 60 * 24))
                    : Math.floor((date.getTime() - expense.expenseDate.getTime()) / (1000 * 60 * 60 * 24));
                let current = 0;
                let days30 = 0;
                let days60 = 0;
                let days90 = 0;
                if (daysPastDue <= 0) {
                    current = amountDue;
                }
                else if (daysPastDue <= 30) {
                    days30 = amountDue;
                }
                else if (daysPastDue <= 60) {
                    days60 = amountDue;
                }
                else {
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
                    currency: expense.currency || 'CDF',
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
exports.AccountingReportsService = AccountingReportsService;
exports.default = new AccountingReportsService();
//# sourceMappingURL=accountingReports.service.js.map