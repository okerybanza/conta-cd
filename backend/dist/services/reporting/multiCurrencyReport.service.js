"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiCurrencyReportService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const cache_service_1 = __importDefault(require("../cache.service"));
class MultiCurrencyReportService {
    async getCurrencyBreakdown(companyId, startDate, endDate) {
        const cacheKey = `multi_currency:breakdown:${companyId}:${startDate.toISOString()}:${endDate.toISOString()}`;
        const cached = await cache_service_1.default.get(cacheKey);
        if (cached)
            return cached;
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { currency: true },
        });
        const baseCurrency = company?.currency || 'CDF';
        // Get invoice breakdown by currency
        const invoiceBreakdown = await database_1.default.invoices.groupBy({
            by: ['currency', 'base_currency'],
            where: {
                companyId,
                deletedAt: null,
                status: { notIn: ['draft', 'cancelled'] },
                invoiceDate: { gte: startDate, lte: endDate },
            },
            _count: { id: true },
            _sum: {
                total_amount: true,
                base_total_amount: true,
                exchange_rate: true,
            },
        });
        // Get expense breakdown by currency
        const expenseBreakdown = await database_1.default.expenses.groupBy({
            by: ['currency', 'base_currency'],
            where: {
                company_id: companyId,
                deleted_at: null,
                expense_date: { gte: startDate, lte: endDate },
            },
            _count: { id: true },
            _sum: {
                amount_ttc: true,
                base_amount_ttc: true,
                exchange_rate: true,
            },
        });
        // Get payment breakdown by currency
        const paymentBreakdown = await database_1.default.payments.groupBy({
            by: ['currency', 'base_currency'],
            where: {
                company_id: companyId,
                status: 'confirmed',
                payment_date: { gte: startDate, lte: endDate },
            },
            _count: { id: true },
            _sum: {
                amount: true,
                base_amount: true,
                exchange_rate: true,
            },
        });
        // Combine all currencies
        const currencyMap = new Map();
        // Process invoices
        for (const inv of invoiceBreakdown) {
            const currency = inv.currency || baseCurrency;
            if (!currencyMap.has(currency)) {
                currencyMap.set(currency, {
                    currency,
                    baseCurrency: inv.base_currency || baseCurrency,
                    invoices: { count: 0, total: 0, baseTotal: 0 },
                    expenses: { count: 0, total: 0, baseTotal: 0 },
                    payments: { count: 0, total: 0, baseTotal: 0 },
                    averageRate: 1,
                    netPosition: 0,
                });
            }
            const breakdown = currencyMap.get(currency);
            breakdown.invoices.count = inv._count.id;
            breakdown.invoices.total = Number(inv._sum.total_amount || 0);
            breakdown.invoices.baseTotal = Number(inv._sum.base_total_amount || 0);
            breakdown.averageRate = inv._count.id > 0 ? Number(inv._sum.exchange_rate || 0) / inv._count.id : 1;
        }
        // Process expenses
        for (const exp of expenseBreakdown) {
            const currency = exp.currency || baseCurrency;
            if (!currencyMap.has(currency)) {
                currencyMap.set(currency, {
                    currency,
                    baseCurrency: exp.base_currency || baseCurrency,
                    invoices: { count: 0, total: 0, baseTotal: 0 },
                    expenses: { count: 0, total: 0, baseTotal: 0 },
                    payments: { count: 0, total: 0, baseTotal: 0 },
                    averageRate: 1,
                    netPosition: 0,
                });
            }
            const breakdown = currencyMap.get(currency);
            breakdown.expenses.count = exp._count.id;
            breakdown.expenses.total = Number(exp._sum.amount_ttc || 0);
            breakdown.expenses.baseTotal = Number(exp._sum.base_amount_ttc || 0);
        }
        // Process payments
        for (const pay of paymentBreakdown) {
            const currency = pay.currency || baseCurrency;
            if (!currencyMap.has(currency)) {
                currencyMap.set(currency, {
                    currency,
                    baseCurrency: pay.base_currency || baseCurrency,
                    invoices: { count: 0, total: 0, baseTotal: 0 },
                    expenses: { count: 0, total: 0, baseTotal: 0 },
                    payments: { count: 0, total: 0, baseTotal: 0 },
                    averageRate: 1,
                    netPosition: 0,
                });
            }
            const breakdown = currencyMap.get(currency);
            breakdown.payments.count = pay._count.id;
            breakdown.payments.total = Number(pay._sum.amount || 0);
            breakdown.payments.baseTotal = Number(pay._sum.base_amount || 0);
        }
        // Calculate net position
        const breakdown = Array.from(currencyMap.values()).map(b => ({
            ...b,
            netPosition: b.invoices.baseTotal - b.expenses.baseTotal,
        }));
        breakdown.sort((a, b) => b.invoices.baseTotal - a.invoices.baseTotal);
        const totals = {
            invoicesBase: breakdown.reduce((sum, b) => sum + b.invoices.baseTotal, 0),
            expensesBase: breakdown.reduce((sum, b) => sum + b.expenses.baseTotal, 0),
            paymentsBase: breakdown.reduce((sum, b) => sum + b.payments.baseTotal, 0),
            netBase: breakdown.reduce((sum, b) => sum + b.netPosition, 0),
        };
        const result = {
            period: { start: startDate, end: endDate },
            baseCurrency,
            breakdown,
            totals,
        };
        await cache_service_1.default.set(cacheKey, result, 900);
        return result;
    }
    async getExchangeRateHistory(startDate, endDate, currencies) {
        const where = {
            effective_date: { gte: startDate, lte: endDate },
        };
        if (currencies && currencies.length > 0) {
            where.OR = [
                { from_currency: { in: currencies } },
                { to_currency: { in: currencies } },
            ];
        }
        const rates = await database_1.default.exchange_rates.findMany({
            where,
            orderBy: [{ effective_date: 'desc' }, { from_currency: 'asc' }],
            take: 100,
        });
        return rates.map(r => ({
            date: r.effective_date,
            fromCurrency: r.from_currency,
            toCurrency: r.to_currency,
            rate: Number(r.rate),
            source: r.source || 'manual',
        }));
    }
    async getCurrencyExposure(companyId) {
        const result = await database_1.default.invoices.groupBy({
            by: ['currency', 'base_currency'],
            where: {
                companyId,
                deletedAt: null,
                status: { in: ['sent', 'overdue', 'partial'] },
            },
            _sum: {
                total_amount: true,
                base_total_amount: true,
                paid_amount: true,
                exchange_rate: true,
            },
            _count: { id: true },
        });
        return result.map(r => ({
            currency: r.currency || 'CDF',
            outstandingInvoices: Number(r._sum.total_amount || 0) - Number(r._sum.paid_amount || 0),
            outstandingBase: Number(r._sum.base_total_amount || 0),
            averageRate: r._count.id > 0 ? Number(r._sum.exchange_rate || 0) / r._count.id : 1,
        }));
    }
}
exports.MultiCurrencyReportService = MultiCurrencyReportService;
exports.default = new MultiCurrencyReportService();
//# sourceMappingURL=multiCurrencyReport.service.js.map