"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const subscription_service_1 = __importDefault(require("./subscription.service"));
const package_service_1 = __importDefault(require("./package.service"));
const cache_service_1 = __importDefault(require("./cache.service"));
class DashboardService {
    /**
     * Obtenir les statistiques du tableau de bord pour une entreprise
     */
    async getDashboardStats(companyId) {
        const cacheKey = `dashboard:stats:${companyId}`;
        // Essayer de récupérer depuis le cache
        const cachedStats = await cache_service_1.default.get(cacheKey);
        if (cachedStats) {
            return cachedStats;
        }
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        // 1. Récupérer toutes les données de base en parallèle
        const [totalRevenue, revenueThisMonth, revenueLastMonth, totalInvoiced, totalInvoices, invoicesThisMonth, unpaidStats, overdueStats, totalPayments, paymentsThisMonth, averagePayment, totalCustomers, activeCustomers, totalExpenses, expensesThisMonth, expensesLastMonth,] = await Promise.all([
            this.getTotalRevenue(companyId),
            this.getRevenueForPeriod(companyId, firstDayOfMonth, lastDayOfMonth),
            this.getRevenueForPeriod(companyId, firstDayLastMonth, lastDayLastMonth),
            this.getTotalInvoiced(companyId),
            this.getTotalInvoices(companyId),
            this.getInvoicesForPeriod(companyId, firstDayOfMonth, lastDayOfMonth),
            this.getUnpaidInvoicesStats(companyId),
            this.getOverdueInvoicesStats(companyId),
            this.getTotalPayments(companyId),
            this.getPaymentsForPeriod(companyId, firstDayOfMonth, lastDayOfMonth),
            this.getAveragePayment(companyId),
            this.getTotalCustomers(companyId),
            this.getActiveCustomers(companyId),
            this.getTotalExpenses(companyId),
            this.getExpensesForPeriod(companyId, firstDayOfMonth, lastDayOfMonth),
            this.getExpensesForPeriod(companyId, firstDayLastMonth, lastDayLastMonth),
        ]);
        // Calculs dérivés
        const revenueGrowth = revenueLastMonth > 0
            ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
            : 0;
        const expensesGrowth = expensesLastMonth > 0
            ? ((expensesThisMonth - expensesLastMonth) / expensesLastMonth) * 100
            : 0;
        const collectionRate = totalInvoiced > 0 ? (totalRevenue / totalInvoiced) * 100 : 0;
        const profit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        const averageDaysToPay = await this.getAverageDaysToPay(companyId);
        const topCustomers = await this.getTopCustomers(companyId, 5);
        // Évolution
        const revenueByMonth = await this.getRevenueByMonth(companyId, 12);
        const expensesByMonth = await this.getExpensesByMonth(companyId, 12);
        const profitByMonth = await this.getProfitByMonth(companyId, 12);
        const outstandingByMonth = await this.getOutstandingByMonth(companyId, 12);
        const invoicesByStatus = await this.getInvoicesByStatus(companyId);
        const recentPayments = await this.getRecentPayments(companyId, 10);
        // Top fournisseurs (5 principaux par montant de dépenses)
        const topSuppliersRaw = await database_1.default.expenses.groupBy({
            by: ['supplier_id'],
            where: {
                company_id: companyId,
                deleted_at: null,
                supplier_id: { not: null },
            },
            _sum: {
                amount_ttc: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    amount_ttc: 'desc',
                },
            },
            take: 5,
        });
        const supplierIds = topSuppliersRaw
            .map((s) => s.supplier_id)
            .filter((id) => !!id);
        const suppliers = supplierIds.length
            ? await database_1.default.suppliers.findMany({
                where: { id: { in: supplierIds } },
                select: { id: true, name: true },
            })
            : [];
        const topSuppliers = topSuppliersRaw.map((row) => {
            const supplier = suppliers.find((s) => s.id === row.supplier_id);
            return {
                supplier_id: row.supplier_id || '',
                name: supplier?.name || 'Fournisseur inconnu',
                totalExpenses: Number(row._sum.amount_ttc || 0),
                expenseCount: row._count.id || 0,
            };
        });
        // 2. Récupérer l'abonnement actif et les fonctionnalités
        let packageFeatures = {};
        let packageLimits = {};
        let subscriptionInfo = null;
        try {
            const subscription = await subscription_service_1.default.getActive(companyId);
            packageFeatures = await package_service_1.default.getFeatures(subscription.package_id);
            packageLimits = await package_service_1.default.getLimits(subscription.package_id);
            subscriptionInfo = {
                packageCode: subscription.packages.code,
                packageName: subscription.packages.name,
                status: subscription.status,
            };
        }
        catch (error) {
            // Si pas d'abonnement, utiliser les valeurs par défaut (plan gratuit)
            logger_1.default.warn(`No subscription found for company ${companyId}, using default (free) plan`);
            packageFeatures = {
                expenses: false,
                accounting: false,
                recurring_invoices: false,
                api: false,
            };
            packageLimits = {
                top_customers_display: 5,
            };
            subscriptionInfo = {
                packageCode: 'essential',
                packageName: 'Essential',
                status: 'trial',
            };
        }
        // 3. Filtrer les données selon l'abonnement
        const filteredStats = {
            // Toujours disponible
            totalRevenue,
            revenueThisMonth,
            revenueLastMonth,
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            totalInvoiced,
            collectionRate: Math.round(collectionRate * 100) / 100,
            totalInvoices,
            invoicesThisMonth,
            unpaidInvoices: unpaidStats.count,
            unpaidAmount: unpaidStats.amount,
            overdueInvoices: overdueStats.count,
            overdueAmount: overdueStats.amount,
            totalPayments,
            paymentsThisMonth,
            averagePayment,
            averageDaysToPay: Math.round(averageDaysToPay),
            totalCustomers,
            activeCustomers,
            // Conditionnel selon l'abonnement
            totalExpenses: packageFeatures.expenses ? totalExpenses : 0,
            expensesThisMonth: packageFeatures.expenses ? expensesThisMonth : 0,
            expensesLastMonth: packageFeatures.expenses ? expensesLastMonth : 0,
            expensesGrowth: packageFeatures.expenses ? Math.round(expensesGrowth * 100) / 100 : 0,
            profit: packageFeatures.expenses ? Math.round(profit) : 0,
            profitMargin: packageFeatures.expenses ? Math.round(profitMargin * 100) / 100 : 0,
            // Top clients limité selon le plan
            topCustomers: topCustomers.slice(0, packageLimits.top_customers_display || 5),
            // Graphiques conditionnels
            revenueByMonth,
            expensesByMonth: packageFeatures.expenses ? expensesByMonth : [],
            profitByMonth: packageFeatures.expenses ? profitByMonth : [],
            outstandingByMonth: packageFeatures.accounting ? outstandingByMonth : [],
            invoicesByStatus,
            recentPayments: recentPayments.slice(0, packageLimits.recent_items_display || 10),
            topSuppliers,
        };
        // 4. Mettre en cache (TTL 15 minutes = 900 secondes)
        await cache_service_1.default.set(cacheKey, filteredStats, 900);
        return filteredStats;
    }
    // Revenu total (SPRINT 2 - TASK 2.4: Multi-Currency - use base amounts)
    async getTotalRevenue(companyId) {
        const result = await database_1.default.payments.aggregate({
            where: {
                company_id: companyId,
                status: 'confirmed',
            },
            _sum: {
                base_amount: true, // Use base currency amount
            },
        });
        return Number(result._sum.base_amount || 0);
    }
    // Revenu pour une période (SPRINT 2 - TASK 2.4: Multi-Currency)
    async getRevenueForPeriod(companyId, startDate, endDate) {
        // Vérifier que les dates sont valides
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 0;
        }
        const result = await database_1.default.payments.aggregate({
            where: {
                company_id: companyId,
                status: 'confirmed',
                payment_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                base_amount: true, // Use base currency amount
            },
        });
        return Number(result._sum.base_amount || 0);
    }
    // Total factures
    async getTotalInvoices(companyId) {
        return database_1.default.invoices.count({
            where: {
                company_id: companyId,
                deleted_at: null,
            },
        });
    }
    // Factures pour une période
    async getInvoicesForPeriod(companyId, startDate, endDate) {
        return database_1.default.invoices.count({
            where: {
                company_id: companyId,
                deleted_at: null,
                invoice_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }
    // Statistiques factures impayées
    async getUnpaidInvoicesStats(companyId) {
        const invoices = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                status: {
                    in: ['sent', 'partially_paid'],
                },
            },
            select: {
                total_amount: true,
                paid_amount: true,
            },
        });
        const count = invoices.length;
        const amount = invoices.reduce((sum, inv) => {
            const remainingBalance = Number(inv.total_amount || 0) - Number(inv.paid_amount || 0);
            return sum + Math.max(0, remainingBalance);
        }, 0);
        return { count, amount };
    }
    // Statistiques factures en retard
    async getOverdueInvoicesStats(companyId) {
        const now = new Date();
        const invoices = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                status: {
                    in: ['sent', 'partially_paid'],
                },
                due_date: {
                    lt: now,
                },
            },
            select: {
                total_amount: true,
                paid_amount: true,
            },
        });
        const count = invoices.length;
        const amount = invoices.reduce((sum, inv) => {
            const remainingBalance = Number(inv.total_amount || 0) - Number(inv.paid_amount || 0);
            return sum + Math.max(0, remainingBalance);
        }, 0);
        return { count, amount };
    }
    // Total paiements
    async getTotalPayments(companyId) {
        return database_1.default.payments.count({
            where: {
                company_id: companyId,
                status: 'confirmed',
            },
        });
    }
    // Paiements pour une période
    async getPaymentsForPeriod(companyId, startDate, endDate) {
        return database_1.default.payments.count({
            where: {
                company_id: companyId,
                status: 'confirmed',
                payment_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }
    // Paiement moyen
    async getAveragePayment(companyId) {
        const result = await database_1.default.payments.aggregate({
            where: {
                company_id: companyId,
                status: 'confirmed',
            },
            _avg: {
                amount: true,
            },
        });
        return Number(result._avg.amount || 0);
    }
    // Total clients
    async getTotalCustomers(companyId) {
        return database_1.default.customers.count({
            where: {
                company_id: companyId,
                deleted_at: null,
            },
        });
    }
    // Clients actifs (avec factures dans les 90 derniers jours)
    async getActiveCustomers(companyId) {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const activeCustomerIds = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                invoice_date: {
                    gte: ninetyDaysAgo,
                },
                status: {
                    notIn: ['draft', 'cancelled'],
                },
            },
            distinct: ['customer_id'],
            select: {
                customer_id: true,
            },
        });
        return activeCustomerIds.length;
    }
    // Revenus par mois (12 derniers mois) - OPTIMISATION SPRINT 5
    async getRevenueByMonth(companyId, months = 12) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1, 0, 0, 0);
        // Récupérer tous les paiements confirmés sur la période en une seule requête
        const payments = await database_1.default.payments.findMany({
            where: {
                company_id: companyId,
                status: 'confirmed',
                payment_date: {
                    gte: startDate
                },
            },
            select: {
                payment_date: true,
                base_amount: true
            }
        });
        const results = [];
        const revenueMap = new Map();
        // Initialiser la map pour chaque mois
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
            });
            revenueMap.set(monthKey, 0);
        }
        // Agréger en mémoire
        for (const payment of payments) {
            if (!payment.payment_date)
                continue;
            const monthKey = payment.payment_date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
            });
            if (revenueMap.has(monthKey)) {
                const current = revenueMap.get(monthKey) || 0;
                revenueMap.set(monthKey, current + Number(payment.base_amount || 0));
            }
        }
        // Convertir la map en tableau de résultats
        for (const [month, revenue] of revenueMap.entries()) {
            results.push({ month, revenue });
        }
        return results;
    }
    // Total facturé (toutes factures valides)
    async getTotalInvoiced(companyId) {
        const result = await database_1.default.invoices.aggregate({
            where: {
                company_id: companyId,
                deleted_at: null,
                status: {
                    notIn: ['draft', 'cancelled'],
                },
            },
            _sum: {
                total_amount: true,
            },
        });
        return Number(result._sum.total_amount || 0);
    }
    // Total dépenses (SPRINT 2 - TASK 2.4: Multi-Currency)
    async getTotalExpenses(companyId) {
        const result = await database_1.default.expenses.aggregate({
            where: {
                company_id: companyId,
                deleted_at: null,
            },
            _sum: {
                base_amount_ttc: true, // Use base currency amount
            },
        });
        return Number(result._sum.base_amount_ttc || 0);
    }
    // Dépenses pour une période (SPRINT 2 - TASK 2.4: Multi-Currency)
    async getExpensesForPeriod(companyId, startDate, endDate) {
        // Vérifier que les dates sont valides
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 0;
        }
        const result = await database_1.default.expenses.aggregate({
            where: {
                company_id: companyId,
                deleted_at: null,
                expense_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                base_amount_ttc: true, // Use base currency amount
            },
        });
        return Number(result._sum.base_amount_ttc || 0);
    }
    // Délai moyen de paiement
    async getAverageDaysToPay(companyId) {
        const paidInvoices = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                status: 'paid',
                paid_at: {
                    not: null,
                },
            },
            include: {
                payments: {
                    where: {
                        status: 'confirmed',
                    },
                    orderBy: {
                        payment_date: 'asc',
                    },
                    take: 1,
                },
            },
        });
        if (paidInvoices.length === 0)
            return 0;
        let totalDays = 0;
        let count = 0;
        for (const invoice of paidInvoices) {
            if (invoice.payments.length > 0 && invoice.paid_at) {
                const firstPayment = invoice.payments[0];
                const daysDiff = Math.floor((firstPayment.payment_date.getTime() - invoice.invoice_date.getTime()) /
                    (1000 * 60 * 60 * 24));
                totalDays += daysDiff;
                count++;
            }
        }
        return count > 0 ? totalDays / count : 0;
    }
    // Top clients
    async getTopCustomers(companyId, limit = 5) {
        const payments = await database_1.default.payments.findMany({
            where: {
                company_id: companyId,
                status: 'confirmed',
                deleted_at: null,
            },
            include: {
                invoices: {
                    include: {
                        customers: true,
                    },
                },
            },
        });
        const customerMap = new Map();
        for (const payment of payments) {
            const customer = payment.invoices?.customers;
            const customerId = customer?.id;
            if (!customerId)
                continue;
            const customerName = customer?.type === 'particulier'
                ? `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()
                : customer?.business_name || '';
            const existing = customerMap.get(customerId) || {
                name: customerName,
                revenue: 0,
                count: 0,
            };
            existing.revenue += Number(payment.amount);
            customerMap.set(customerId, existing);
        }
        // Compter les factures par client
        const invoices = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                status: {
                    notIn: ['draft', 'cancelled'],
                },
            },
            select: {
                customer_id: true,
            },
        });
        for (const invoice of invoices) {
            const existing = customerMap.get(invoice.customer_id);
            if (existing) {
                existing.count++;
            }
        }
        return Array.from(customerMap.entries())
            .map(([customerId, data]) => ({
            customerId,
            customerName: data.name,
            totalRevenue: data.revenue,
            invoiceCount: data.count,
        }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);
    }
    // Bénéfice par mois
    async getProfitByMonth(companyId, months = 12) {
        const revenueByMonth = await this.getRevenueByMonth(companyId, months);
        const expensesByMonth = await this.getExpensesByMonth(companyId, months);
        return revenueByMonth.map((revenue, index) => ({
            month: revenue.month,
            profit: revenue.revenue - (expensesByMonth[index]?.expenses || 0),
        }));
    }
    // Créances en cours par mois (OPTIMISATION SPRINT 5)
    async getOutstandingByMonth(companyId, months = 12) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1, 0, 0, 0);
        // Récupérer toutes les factures impayées pertinentes en une seule requête
        const invoices = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                status: {
                    in: ['sent', 'partially_paid'],
                },
            },
            select: {
                total_amount: true,
                paid_amount: true,
                invoice_date: true
            },
        });
        const results = [];
        const outstandingMap = new Map();
        // Initialiser
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
            });
            outstandingMap.set(monthKey, 0);
        }
        // Agréger en mémoire pour chaque mois (plus complexe car cumulatif par rapport à la date de fin de mois)
        for (const [monthKey] of outstandingMap.entries()) {
            // Trouver la date de fin pour ce mois clé
            // Note primitive et peu efficace en O(N*M), mais M=12 et N est raisonnable
            // On peut faire mieux mais 12 itérations sur les factures est mieux que 12 requêtes DB
            const monthIndex = results.length; // Problème : order is important
            // Simpler: recalculate results at the end
        }
        // Alternative: Re-loop months and filter invoices
        const monthsData = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
            monthsData.push({
                key: date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
                date: endOfMonth
            });
        }
        return monthsData.map(m => {
            const amount = invoices.reduce((sum, inv) => {
                if (inv.invoice_date <= m.date) {
                    const balance = Number(inv.total_amount || 0) - Number(inv.paid_amount || 0);
                    return sum + Math.max(0, balance);
                }
                return sum;
            }, 0);
            return { month: m.key, amount };
        });
    }
    // Dépenses par mois
    async getExpensesByMonth(companyId, months = 12) {
        const results = [];
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        // Récupérer toutes les dépenses de la période
        const expenses = await database_1.default.expenses.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                expense_date: {
                    gte: startDate,
                    lte: now,
                },
            },
            select: {
                expense_date: true,
                amount_ttc: true,
            },
        });
        // Grouper par mois
        const expensesByMonth = new Map();
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
            });
            expensesByMonth.set(monthKey, 0);
        }
        // Calculer les totaux par mois
        for (const expense of expenses) {
            const expenseDate = new Date(expense.expense_date);
            const monthKey = expenseDate.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
            });
            const current = expensesByMonth.get(monthKey) || 0;
            expensesByMonth.set(monthKey, current + Number(expense.amount_ttc));
        }
        // Convertir en array
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
            });
            results.push({
                month: monthKey,
                expenses: expensesByMonth.get(monthKey) || 0,
            });
        }
        return results;
    }
    // Factures par statut
    async getInvoicesByStatus(companyId) {
        const result = await database_1.default.invoices.groupBy({
            by: ['status'],
            where: {
                company_id: companyId,
                deleted_at: null,
            },
            _count: {
                id: true,
            },
        });
        return result.map((item) => ({
            status: item.status,
            count: item._count.id,
        }));
    }
    // Paiements récents
    async getRecentPayments(companyId, limit = 10) {
        const payments = await database_1.default.payments.findMany({
            where: {
                company_id: companyId,
                status: 'confirmed',
            },
            take: limit,
            orderBy: {
                payment_date: 'desc',
            },
            include: {
                invoices: {
                    include: {
                        customers: true,
                    },
                },
            },
        });
        return payments.map((payment) => {
            const customer = payment.invoices?.customers;
            const customerName = customer?.type === 'particulier'
                ? `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()
                : customer?.business_name || '';
            return {
                id: payment.id,
                invoiceNumber: payment.invoices?.invoice_number,
                amount: Number(payment.amount),
                currency: payment.currency || 'CDF',
                paymentDate: payment.payment_date.toISOString(),
                customerName,
            };
        });
    }
    /**
     * Invalider le cache du dashboard pour une entreprise
     */
    async invalidateCache(companyId) {
        await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}:*`);
        logger_1.default.info(`Dashboard cache invalidated for company: ${companyId}`);
    }
}
exports.DashboardService = DashboardService;
exports.default = new DashboardService();
//# sourceMappingURL=dashboard.service.js.map