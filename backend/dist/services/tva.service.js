"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TVAService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const account_service_1 = __importDefault(require("./account.service"));
class TVAService {
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
            // Par défaut : mois en cours
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        return { startDate, endDate };
    }
    /**
     * Calculer la TVA collectée (sur factures)
     * TVA collectée = TVA sur les ventes (compte 445710)
     */
    async calculateVATCollected(companyId, filters = {}) {
        const { startDate, endDate } = this.getPeriodDates(filters);
        // Récupérer le compte TVA collectée (445710)
        const vatCollectedAccount = await account_service_1.default.getByCode(companyId, '445710');
        if (!vatCollectedAccount) {
            logger_1.default.warn('TVA collectée account (445710) not found', { companyId });
            return 0;
        }
        // Calculer le solde du compte TVA collectée pour la période
        const lines = await database_1.default.journal_entry_lines.findMany({
            where: {
                account_id: vatCollectedAccount.id,
                journal_entries: {
                    company_id: companyId,
                    entry_date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'posted',
                },
            },
        });
        // Pour le compte TVA collectée (passif), le crédit augmente le solde
        const total = lines.reduce((sum, line) => {
            return sum + Number(line.credit);
        }, 0);
        return total;
    }
    /**
     * Calculer la TVA déductible (sur dépenses)
     * TVA déductible = TVA sur les achats (compte 445660)
     */
    async calculateVATDeductible(companyId, filters = {}) {
        const { startDate, endDate } = this.getPeriodDates(filters);
        // Récupérer le compte TVA déductible (445660)
        const vatDeductibleAccount = await account_service_1.default.getByCode(companyId, '445660');
        if (!vatDeductibleAccount) {
            logger_1.default.warn('TVA déductible account (445660) not found', { companyId });
            return 0;
        }
        // Calculer le solde du compte TVA déductible pour la période
        const lines = await database_1.default.journal_entry_lines.findMany({
            where: {
                account_id: vatDeductibleAccount.id,
                journal_entries: {
                    company_id: companyId,
                    entry_date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'posted',
                },
            },
        });
        // Pour le compte TVA déductible (actif), le débit augmente le solde
        const total = lines.reduce((sum, line) => {
            return sum + Number(line.debit);
        }, 0);
        return total;
    }
    /**
     * Calculer la TVA à payer
     * TVA à payer = TVA collectée - TVA déductible
     */
    async calculateVATToPay(companyId, filters = {}) {
        const collected = await this.calculateVATCollected(companyId, filters);
        const deductible = await this.calculateVATDeductible(companyId, filters);
        return collected - deductible;
    }
    /**
     * Générer le rapport TVA détaillé
     */
    async generateVATReport(companyId, filters = {}) {
        const { startDate, endDate } = this.getPeriodDates(filters);
        // TVA COLLECTÉE - Factures
        const invoices = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                invoice_date: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    in: ['sent', 'paid', 'partially_paid'],
                },
                deleted_at: null,
                tax_amount: {
                    gt: 0,
                },
            },
            include: {
                customers: true,
            },
            orderBy: {
                invoice_date: 'asc',
            },
        });
        const collectedItems = [];
        const collectedByRate = new Map();
        for (const invoice of invoices) {
            const taxAmount = Number(invoice.tax_amount || 0);
            if (taxAmount > 0) {
                // Calculer le taux de TVA moyen (approximatif)
                const subtotalHt = Number(invoice.subtotal);
                const taxRate = subtotalHt > 0 ? (taxAmount / subtotalHt) * 100 : 0;
                const customerName = invoice.customers.type === 'particulier'
                    ? `${invoice.customers.first_name || ''} ${invoice.customers.last_name || ''}`.trim()
                    : invoice.customers.business_name || '';
                collectedItems.push({
                    date: invoice.invoice_date,
                    documentNumber: invoice.invoice_number,
                    documentType: 'invoice',
                    customerName,
                    amountHt: subtotalHt,
                    taxRate,
                    vatAmount: taxAmount,
                    currency: invoice.currency || 'CDF',
                });
                // Grouper par taux
                const rateKey = Math.round(taxRate);
                const existing = collectedByRate.get(rateKey) || { amount: 0, count: 0 };
                collectedByRate.set(rateKey, {
                    amount: existing.amount + taxAmount,
                    count: existing.count + 1,
                });
            }
        }
        // TVA DÉDUCTIBLE - Dépenses
        const expenses = await database_1.default.expenses.findMany({
            where: {
                company_id: companyId,
                expense_date: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    in: ['validated', 'paid'],
                },
                deleted_at: null,
                tax_amount: {
                    gt: 0,
                },
            },
            include: {
                suppliers: true,
            },
            orderBy: {
                expense_date: 'asc',
            },
        });
        const deductibleItems = [];
        const deductibleByRate = new Map();
        for (const expense of expenses) {
            const taxAmount = Number(expense.tax_amount || 0);
            if (taxAmount > 0) {
                const amountHt = Number(expense.amount_ht || expense.amount_ttc || 0);
                // Calculer le taux de TVA à partir de taxAmount et amountHt
                const taxRate = amountHt > 0 ? (taxAmount / amountHt) * 100 : 0;
                deductibleItems.push({
                    date: expense.expense_date,
                    documentNumber: expense.expense_number,
                    documentType: 'expense',
                    supplierName: expense.suppliers?.name || expense.supplier_name || '',
                    amountHt,
                    taxRate,
                    vatAmount: taxAmount,
                    currency: expense.currency || 'CDF',
                });
                // Grouper par taux
                const rateKey = Math.round(taxRate);
                const existing = deductibleByRate.get(rateKey) || { amount: 0, count: 0 };
                deductibleByRate.set(rateKey, {
                    amount: existing.amount + taxAmount,
                    count: existing.count + 1,
                });
            }
        }
        // Calculer les totaux
        const totalCollected = collectedItems.reduce((sum, item) => sum + item.vatAmount, 0);
        const totalDeductible = deductibleItems.reduce((sum, item) => sum + item.vatAmount, 0);
        const vatToPay = totalCollected - totalDeductible;
        return {
            period: { startDate, endDate },
            collected: {
                items: collectedItems,
                total: totalCollected,
                byRate: Array.from(collectedByRate.entries())
                    .map(([rate, data]) => ({ rate, ...data }))
                    .sort((a, b) => b.rate - a.rate),
            },
            deductible: {
                items: deductibleItems,
                total: totalDeductible,
                byRate: Array.from(deductibleByRate.entries())
                    .map(([rate, data]) => ({ rate, ...data }))
                    .sort((a, b) => b.rate - a.rate),
            },
            summary: {
                totalCollected,
                totalDeductible,
                vatToPay,
                netVAT: vatToPay, // Alias pour clarté
            },
        };
    }
    /**
     * Générer une déclaration TVA pour une période
     */
    async generateVATDeclaration(companyId, period // Format: "2025-01"
    ) {
        // Parser la période
        const [year, month] = period.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const filters = {
            startDate,
            endDate,
        };
        const vatCollected = await this.calculateVATCollected(companyId, filters);
        const vatDeductible = await this.calculateVATDeductible(companyId, filters);
        const vatToPay = vatCollected - vatDeductible;
        return {
            period,
            vatCollected,
            vatDeductible,
            vatToPay,
            status: 'draft',
        };
    }
}
exports.TVAService = TVAService;
exports.default = new TVAService();
//# sourceMappingURL=tva.service.js.map