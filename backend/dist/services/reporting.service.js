"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const quota_service_1 = __importDefault(require("./quota.service"));
const error_middleware_1 = require("../middleware/error.middleware");
class ReportingService {
    // Générer rapport revenus
    async generateRevenueReport(companyId, filters) {
        // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
        // (bloquera notamment le plan Gratuit)
        const hasAdvancedReports = await quota_service_1.default.checkFeature(companyId, 'advanced_reports');
        if (!hasAdvancedReports) {
            throw new error_middleware_1.CustomError('Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.', 403, 'FEATURE_NOT_AVAILABLE', { feature: 'advanced_reports' });
        }
        const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate || new Date();
        // Revenus totaux
        const payments = await database_1.default.payment.findMany({
            where: {
                companyId,
                status: 'confirmed',
                paymentDate: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(filters.customerId && {
                    invoice: {
                        customerId: filters.customerId,
                    },
                }),
            },
            include: {
                invoice: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
        const invoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                deletedAt: null,
                invoiceDate: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    notIn: ['draft', 'cancelled'], // Exclure les factures en brouillon et annulées
                },
                ...(filters.customerId && {
                    customerId: filters.customerId,
                }),
                ...(filters.status && {
                    status: filters.status,
                }),
            },
            include: {
                customer: true,
            },
        });
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalInvoices = invoices.length;
        const totalPayments = payments.length;
        const averageInvoice = totalInvoices > 0
            ? invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0) / totalInvoices
            : 0;
        const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
        // Par mois
        const byMonth = this.groupByMonth(payments, invoices, startDate, endDate);
        // Par client
        const byCustomer = this.groupByCustomer(payments, invoices);
        return {
            period: `${(0, date_fns_1.format)(startDate, 'dd MMM yyyy', { locale: locale_1.fr })} - ${(0, date_fns_1.format)(endDate, 'dd MMM yyyy', { locale: locale_1.fr })}`,
            totalRevenue,
            totalInvoices,
            totalPayments,
            averageInvoice,
            averagePayment,
            byMonth,
            byCustomer,
        };
    }
    // Générer rapport factures impayées
    async generateUnpaidInvoicesReport(companyId, filters) {
        // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
        const hasAdvancedReports = await quota_service_1.default.checkFeature(companyId, 'advanced_reports');
        if (!hasAdvancedReports) {
            throw new error_middleware_1.CustomError('Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.', 403, 'FEATURE_NOT_AVAILABLE', { feature: 'advanced_reports' });
        }
        const now = new Date();
        const invoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                deletedAt: null,
                status: {
                    in: ['sent', 'partially_paid'],
                },
                ...(filters?.customerId && {
                    customerId: filters.customerId,
                }),
            },
            include: {
                customer: true,
            },
            orderBy: {
                dueDate: 'asc',
            },
        });
        const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount || 0)), 0);
        const overdueInvoices = invoices.filter((inv) => inv.dueDate && new Date(inv.dueDate) < now);
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount || 0)), 0);
        const invoiceData = invoices.map((inv) => {
            const customer = inv.customer;
            const customerName = customer.type === 'particulier'
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.businessName || '';
            const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
            const daysOverdue = dueDate && dueDate < now
                ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            return {
                invoiceNumber: inv.invoiceNumber,
                customerName,
                invoiceDate: inv.invoiceDate.toISOString(),
                dueDate: inv.dueDate ? inv.dueDate.toISOString() : '',
                totalTtc: Number(inv.totalAmount),
                remainingBalance: Number(inv.totalAmount) - Number(inv.paidAmount || 0),
                daysOverdue,
                currency: inv.currency || 'CDF',
            };
        });
        return {
            totalCount: invoices.length,
            totalAmount,
            overdueCount: overdueInvoices.length,
            overdueAmount,
            invoices: invoiceData,
        };
    }
    // Générer rapport paiements
    async generatePaymentsReport(companyId, filters) {
        // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
        const hasAdvancedReports = await quota_service_1.default.checkFeature(companyId, 'advanced_reports');
        if (!hasAdvancedReports) {
            throw new error_middleware_1.CustomError('Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.', 403, 'FEATURE_NOT_AVAILABLE', { feature: 'advanced_reports' });
        }
        const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate || new Date();
        const payments = await database_1.default.payment.findMany({
            where: {
                companyId,
                status: 'confirmed',
                paymentDate: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(filters.customerId && {
                    invoice: {
                        customerId: filters.customerId,
                    },
                }),
                ...(filters.paymentMethod && {
                    paymentMethod: filters.paymentMethod,
                }),
            },
            include: {
                invoice: {
                    include: {
                        customer: true,
                    },
                },
            },
            orderBy: {
                paymentDate: 'desc',
            },
        });
        const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalCount = payments.length;
        // Par méthode
        const byMethod = this.groupPaymentsByMethod(payments);
        // Par mois
        const byMonth = this.groupPaymentsByMonth(payments, startDate, endDate);
        // Détails paiements
        const paymentData = payments.map((p) => {
            const customer = p.invoice.customer;
            const customerName = customer.type === 'particulier'
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.businessName || '';
            return {
                paymentDate: p.paymentDate.toISOString(),
                invoiceNumber: p.invoice.invoiceNumber,
                customerName,
                amount: Number(p.amount),
                method: p.paymentMethod,
                currency: p.currency || 'CDF',
            };
        });
        return {
            totalAmount,
            totalCount,
            byMethod,
            byMonth,
            payments: paymentData,
        };
    }
    /**
     * Générer un rapport des dépenses par fournisseur
     */
    async generateSupplierExpensesReport(companyId, filters) {
        // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
        const hasAdvancedReports = await quota_service_1.default.checkFeature(companyId, 'advanced_reports');
        if (!hasAdvancedReports) {
            throw new error_middleware_1.CustomError('Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.', 403, 'FEATURE_NOT_AVAILABLE', { feature: 'advanced_reports' });
        }
        const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate || new Date();
        const expenses = await database_1.default.expense.findMany({
            where: {
                companyId,
                deletedAt: null,
                expenseDate: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(filters.status && { status: filters.status }),
                ...(filters.supplierId && { supplierId: filters.supplierId }),
            },
            include: {
                supplier: true,
            },
        });
        const bySupplier = new Map();
        for (const exp of expenses) {
            const supplierId = exp.supplierId || 'no-supplier';
            const supplierName = exp.supplier?.name || exp.supplierName || 'Sans fournisseur';
            const entry = bySupplier.get(supplierId) || {
                id: supplierId,
                name: supplierName,
                email: exp.supplier?.email || null,
                phone: exp.supplier?.phone || null,
                city: exp.supplier?.city || null,
                country: exp.supplier?.country || null,
                totalAmount: 0,
                expenseCount: 0,
            };
            entry.totalAmount += Number(exp.amountTtc || exp.totalAmount || 0);
            entry.expenseCount += 1;
            bySupplier.set(supplierId, entry);
        }
        const items = Array.from(bySupplier.values()).sort((a, b) => b.totalAmount - a.totalAmount);
        const totalExpenses = items.reduce((sum, item) => sum + item.totalAmount, 0);
        return {
            totalSuppliers: items.length,
            totalExpenses,
            items: items.map((item) => ({
                supplierId: item.id,
                name: item.name,
                email: item.email,
                phone: item.phone,
                city: item.city,
                country: item.country,
                totalAmount: item.totalAmount,
                expenseCount: item.expenseCount,
            })),
        };
    }
    // Générer journal comptable
    async generateAccountingJournal(companyId, filters) {
        // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
        const hasAdvancedReports = await quota_service_1.default.checkFeature(companyId, 'advanced_reports');
        if (!hasAdvancedReports) {
            throw new error_middleware_1.CustomError('Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.', 403, 'FEATURE_NOT_AVAILABLE', { feature: 'advanced_reports' });
        }
        const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate || new Date();
        // Récupérer toutes les transactions
        const invoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                deletedAt: null,
                invoiceDate: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(filters.customerId && {
                    customerId: filters.customerId,
                }),
                ...(filters.status && {
                    status: filters.status,
                }),
            },
            include: {
                customer: true,
            },
            orderBy: {
                invoiceDate: 'asc',
            },
        });
        const payments = await database_1.default.payment.findMany({
            where: {
                companyId,
                status: 'confirmed',
                paymentDate: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(filters.customerId && {
                    invoice: {
                        customerId: filters.customerId,
                    },
                }),
            },
            include: {
                invoice: {
                    include: {
                        customer: true,
                    },
                },
            },
            orderBy: {
                paymentDate: 'asc',
            },
        });
        // Créer les entrées
        const entries = [];
        let balance = 0;
        // Factures (créances)
        for (const invoice of invoices) {
            const customer = invoice.customer;
            const customerName = customer.type === 'particulier'
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.businessName || '';
            const amount = Number(invoice.totalAmount);
            balance += amount;
            entries.push({
                date: invoice.invoiceDate.toISOString(),
                type: 'Facture',
                reference: invoice.invoiceNumber,
                description: `Facture ${invoice.invoiceNumber} - ${customerName}`,
                debit: amount,
                credit: 0,
                balance,
                currency: invoice.currency || 'CDF',
            });
        }
        // Paiements (encaissements)
        for (const payment of payments) {
            const customer = payment.invoice.customer;
            const customerName = customer.type === 'particulier'
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.businessName || '';
            const amount = Number(payment.amount);
            balance -= amount;
            entries.push({
                date: payment.paymentDate.toISOString(),
                type: 'Paiement',
                reference: payment.reference || payment.id,
                description: `Paiement ${payment.invoice.invoiceNumber} - ${customerName} (${payment.paymentMethod})`,
                debit: 0,
                credit: amount,
                balance,
                currency: payment.currency || 'CDF',
            });
        }
        // Trier par date
        entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Calculer les totaux
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
        const finalBalance = totalDebit - totalCredit;
        return {
            entries,
            totals: {
                totalDebit,
                totalCredit,
                finalBalance,
            },
        };
    }
    // Exporter en CSV
    async exportToCSV(data, headers) {
        const csvRows = [];
        // Headers
        csvRows.push(headers.join(','));
        // Data rows
        for (const row of data) {
            const values = headers.map((header) => {
                const value = row[header] || '';
                // Échapper les virgules et guillemets
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    }
    // Helper: Grouper par mois
    groupByMonth(payments, invoices, startDate, endDate) {
        const months = new Map();
        // Initialiser tous les mois
        const current = new Date(startDate);
        while (current <= endDate) {
            const monthKey = (0, date_fns_1.format)(current, 'MMM yyyy', { locale: locale_1.fr });
            months.set(monthKey, { revenue: 0, invoices: 0, payments: 0 });
            current.setMonth(current.getMonth() + 1);
        }
        // Ajouter les paiements
        for (const payment of payments) {
            const monthKey = (0, date_fns_1.format)(payment.paymentDate, 'MMM yyyy', { locale: locale_1.fr });
            const month = months.get(monthKey);
            if (month) {
                month.revenue += Number(payment.amount);
                month.payments += 1;
            }
        }
        // Ajouter les factures
        for (const invoice of invoices) {
            const monthKey = (0, date_fns_1.format)(invoice.invoiceDate, 'MMM yyyy', { locale: locale_1.fr });
            const month = months.get(monthKey);
            if (month) {
                month.invoices += 1;
            }
        }
        return Array.from(months.entries()).map(([month, data]) => ({
            month,
            ...data,
        }));
    }
    // Helper: Grouper par client
    groupByCustomer(payments, invoices) {
        const customers = new Map();
        // Ajouter les paiements
        for (const payment of payments) {
            const customer = payment.invoice.customer;
            const customerId = customer.id;
            const customerName = customer.type === 'particulier'
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.businessName || '';
            if (!customers.has(customerId)) {
                customers.set(customerId, {
                    customerId,
                    customerName,
                    revenue: 0,
                    invoices: 0,
                });
            }
            const customerData = customers.get(customerId);
            customerData.revenue += Number(payment.amount);
        }
        // Ajouter les factures
        for (const invoice of invoices) {
            const customerId = invoice.customerId;
            if (!customers.has(customerId)) {
                const customer = invoice.customer;
                const customerName = customer.type === 'particulier'
                    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                    : customer.businessName || '';
                customers.set(customerId, {
                    customerId,
                    customerName,
                    revenue: 0,
                    invoices: 0,
                });
            }
            const customerData = customers.get(customerId);
            customerData.invoices += 1;
        }
        return Array.from(customers.values()).sort((a, b) => b.revenue - a.revenue);
    }
    // Helper: Grouper paiements par méthode
    groupPaymentsByMethod(payments) {
        const methods = new Map();
        for (const payment of payments) {
            const method = payment.paymentMethod;
            if (!methods.has(method)) {
                methods.set(method, { count: 0, amount: 0 });
            }
            const methodData = methods.get(method);
            methodData.count += 1;
            methodData.amount += Number(payment.amount);
        }
        return Array.from(methods.entries()).map(([method, data]) => ({
            method,
            ...data,
        }));
    }
    // Helper: Grouper paiements par mois
    groupPaymentsByMonth(payments, startDate, endDate) {
        const months = new Map();
        // Initialiser tous les mois
        const current = new Date(startDate);
        while (current <= endDate) {
            const monthKey = (0, date_fns_1.format)(current, 'MMM yyyy', { locale: locale_1.fr });
            months.set(monthKey, { count: 0, amount: 0 });
            current.setMonth(current.getMonth() + 1);
        }
        // Ajouter les paiements
        for (const payment of payments) {
            const monthKey = (0, date_fns_1.format)(payment.paymentDate, 'MMM yyyy', { locale: locale_1.fr });
            const month = months.get(monthKey);
            if (month) {
                month.count += 1;
                month.amount += Number(payment.amount);
            }
        }
        return Array.from(months.entries()).map(([month, data]) => ({
            month,
            ...data,
        }));
    }
    // 4. Rapport de vieillissement des créances (Aging Report)
    async generateAgingReport(companyId) {
        const invoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                deletedAt: null,
                status: { in: ['sent', 'partially_paid'] },
            },
            include: {
                customer: true,
                payments: {
                    where: {
                        status: 'confirmed',
                        deletedAt: null,
                    },
                    select: {
                        amount: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        // Filtrer les factures avec solde restant > 0
        const invoicesWithBalance = invoices.filter((invoice) => {
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            return totalAmount - paidAmount > 0;
        });
        const now = new Date();
        const byPeriod = [
            { period: '0-30 jours', min: 0, max: 30, count: 0, amount: 0 },
            { period: '31-60 jours', min: 31, max: 60, count: 0, amount: 0 },
            { period: '61-90 jours', min: 61, max: 90, count: 0, amount: 0 },
            { period: 'Plus de 90 jours', min: 91, max: Infinity, count: 0, amount: 0 },
        ];
        const invoiceDetails = invoicesWithBalance.map((invoice) => {
            // Calculer le solde restant
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const remainingBalance = totalAmount - paidAmount;
            const dueDate = new Date(invoice.dueDate || invoice.invoiceDate);
            const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)));
            let ageCategory = '0-30 jours';
            if (daysOverdue > 90)
                ageCategory = 'Plus de 90 jours';
            else if (daysOverdue > 60)
                ageCategory = '61-90 jours';
            else if (daysOverdue > 30)
                ageCategory = '31-60 jours';
            const period = byPeriod.find((p) => daysOverdue >= p.min && daysOverdue <= p.max);
            if (period) {
                period.count += 1;
                period.amount += remainingBalance;
            }
            const customerName = invoice.customer.type === 'particulier'
                ? `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim()
                : invoice.customer.businessName || '';
            return {
                invoiceNumber: invoice.invoiceNumber,
                customerName,
                invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
                dueDate: invoice.dueDate?.toISOString().split('T')[0] || invoice.invoiceDate.toISOString().split('T')[0],
                totalTtc: Number(invoice.totalAmount),
                remainingBalance: remainingBalance,
                daysOverdue,
                ageCategory,
                currency: invoice.currency || 'CDF',
            };
        });
        return {
            totalOutstanding: invoiceDetails.reduce((sum, inv) => sum + inv.remainingBalance, 0),
            byPeriod: byPeriod.map(({ period, count, amount }) => ({ period, count, amount })),
            invoices: invoiceDetails,
        };
    }
    // 5. Rapport de performance clients (Customer Performance)
    async generateCustomerPerformanceReport(companyId, filters) {
        const where = {
            companyId,
            deletedAt: null,
            status: {
                not: 'draft', // Exclure les factures en brouillon
            },
        };
        if (filters.startDate || filters.endDate) {
            where.invoiceDate = {};
            if (filters.startDate)
                where.invoiceDate.gte = filters.startDate;
            if (filters.endDate)
                where.invoiceDate.lte = filters.endDate;
        }
        if (filters.customerId) {
            where.customerId = filters.customerId;
        }
        const invoices = await database_1.default.invoices.findMany({
            where,
            include: {
                customer: true,
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    take: 1,
                },
            },
            orderBy: { invoiceDate: 'desc' },
        });
        const customerMap = new Map();
        for (const invoice of invoices) {
            const customerId = invoice.customerId;
            if (!customerMap.has(customerId)) {
                const customerName = invoice.customer.type === 'particulier'
                    ? `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim()
                    : invoice.customer.businessName || '';
                customerMap.set(customerId, {
                    customerId,
                    customerName,
                    totalInvoiced: 0,
                    totalPaid: 0,
                    totalOutstanding: 0,
                    invoiceCount: 0,
                    lastInvoiceDate: undefined,
                    lastPaymentDate: undefined,
                });
            }
            const customer = customerMap.get(customerId);
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = Number(invoice.paidAmount || 0);
            const remainingBalance = totalAmount - paidAmount;
            customer.totalInvoiced += totalAmount;
            customer.totalPaid += paidAmount;
            customer.totalOutstanding += remainingBalance;
            customer.invoiceCount += 1;
            if (!customer.lastInvoiceDate || invoice.invoiceDate > new Date(customer.lastInvoiceDate)) {
                customer.lastInvoiceDate = invoice.invoiceDate.toISOString().split('T')[0];
            }
            if (invoice.payments.length > 0) {
                const lastPayment = invoice.payments[0];
                if (!customer.lastPaymentDate || lastPayment.paymentDate > new Date(customer.lastPaymentDate)) {
                    customer.lastPaymentDate = lastPayment.paymentDate.toISOString().split('T')[0];
                }
            }
        }
        const customers = Array.from(customerMap.values()).map((customer) => ({
            ...customer,
            averageInvoice: customer.invoiceCount > 0 ? customer.totalInvoiced / customer.invoiceCount : 0,
            paymentRate: customer.totalInvoiced > 0 ? (customer.totalPaid / customer.totalInvoiced) * 100 : 0,
        }));
        const summary = {
            totalCustomers: customers.length,
            totalInvoiced: customers.reduce((sum, c) => sum + c.totalInvoiced, 0),
            totalPaid: customers.reduce((sum, c) => sum + c.totalPaid, 0),
            totalOutstanding: customers.reduce((sum, c) => sum + c.totalOutstanding, 0),
            averagePaymentRate: customers.length > 0
                ? customers.reduce((sum, c) => sum + c.paymentRate, 0) / customers.length
                : 0,
        };
        return { customers: customers.sort((a, b) => b.totalInvoiced - a.totalInvoiced), summary };
    }
    // 6. Rapport de produits/services les plus vendus
    async generateTopProductsReport(companyId, filters) {
        const where = {
            companyId,
            deletedAt: null,
            status: {
                not: 'draft', // Exclure les factures en brouillon
            },
        };
        if (filters.startDate || filters.endDate) {
            where.invoiceDate = {};
            if (filters.startDate)
                where.invoiceDate.gte = filters.startDate;
            if (filters.endDate)
                where.invoiceDate.lte = filters.endDate;
        }
        const invoices = await database_1.default.invoices.findMany({
            where,
            include: {
                lines: {
                    include: { product: true },
                },
            },
        });
        const productMap = new Map();
        for (const invoice of invoices) {
            for (const line of invoice.lines) {
                const productId = line.productId || `custom-${line.description || line.id}`;
                const productName = line.product?.name || line.description || 'Article sans nom';
                if (!productMap.has(productId)) {
                    productMap.set(productId, {
                        productId: line.productId || undefined,
                        productName,
                        quantity: 0,
                        revenue: 0,
                        invoiceCount: 0,
                    });
                }
                const product = productMap.get(productId);
                product.quantity += Number(line.quantity);
                product.revenue += Number(line.total);
                product.invoiceCount += 1;
            }
        }
        const products = Array.from(productMap.values())
            .map((product) => ({
            ...product,
            averagePrice: product.quantity > 0 ? product.revenue / product.quantity : 0,
        }))
            .sort((a, b) => b.revenue - a.revenue);
        return {
            products,
            summary: {
                totalProducts: products.length,
                totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
                totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
            },
        };
    }
    // 7. Rapport de trésorerie (Cash Flow)
    async generateCashFlowReport(companyId, filters) {
        const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate || new Date();
        const payments = await database_1.default.payment.findMany({
            where: {
                companyId,
                deletedAt: null,
                paymentDate: { gte: startDate, lte: endDate },
            },
            include: { invoice: true },
        });
        const periods = new Map();
        const current = new Date(startDate);
        while (current <= endDate) {
            const monthKey = (0, date_fns_1.format)(current, 'MMM yyyy', { locale: locale_1.fr });
            periods.set(monthKey, { income: 0, expenses: 0 });
            current.setMonth(current.getMonth() + 1);
        }
        for (const payment of payments) {
            const monthKey = (0, date_fns_1.format)(payment.paymentDate, 'MMM yyyy', { locale: locale_1.fr });
            const period = periods.get(monthKey);
            if (period) {
                period.income += Number(payment.amount);
            }
        }
        // Récupérer les dépenses de la période
        const expensesData = await database_1.default.expense.findMany({
            where: {
                companyId,
                deletedAt: null,
                expenseDate: { gte: startDate, lte: endDate },
            },
            select: {
                expenseDate: true,
                amountTtc: true,
            },
        });
        // Grouper les dépenses par période
        for (const expense of expensesData) {
            const monthKey = (0, date_fns_1.format)(expense.expenseDate, 'MMM yyyy', { locale: locale_1.fr });
            const period = periods.get(monthKey);
            if (period) {
                period.expenses += Number(expense.amountTtc);
            }
        }
        let openingBalance = 0;
        const periodData = Array.from(periods.entries()).map(([period, data]) => {
            const closingBalance = openingBalance + data.income - data.expenses;
            const result = {
                period,
                openingBalance,
                income: data.income,
                expenses: data.expenses,
                closingBalance,
            };
            openingBalance = closingBalance;
            return result;
        });
        return {
            periods: periodData,
            summary: {
                totalIncome: periodData.reduce((sum, p) => sum + p.income, 0),
                totalExpenses: periodData.reduce((sum, p) => sum + p.expenses, 0),
                netCashFlow: periodData.reduce((sum, p) => sum + p.income - p.expenses, 0),
            },
        };
    }
    // 8. Rapport de taxes (Tax Report)
    async generateTaxReport(companyId, filters) {
        const where = {
            companyId,
            deletedAt: null,
            status: {
                not: 'draft', // Exclure les factures en brouillon
            },
        };
        if (filters.startDate || filters.endDate) {
            where.invoiceDate = {};
            if (filters.startDate)
                where.invoiceDate.gte = filters.startDate;
            if (filters.endDate)
                where.invoiceDate.lte = filters.endDate;
        }
        const invoices = await database_1.default.invoices.findMany({
            where,
            include: {
                customer: true,
                lines: true,
            },
        });
        const taxMap = new Map();
        const invoiceDetails = [];
        for (const invoice of invoices) {
            let invoiceTaxable = 0;
            let invoiceTax = 0;
            const taxRates = new Set();
            for (const line of invoice.lines) {
                const lineTotal = Number(line.total);
                const taxRate = Number(line.taxRate || 0);
                const taxable = lineTotal / (1 + taxRate / 100);
                const tax = lineTotal - taxable;
                invoiceTaxable += taxable;
                invoiceTax += tax;
                taxRates.add(taxRate);
                if (!taxMap.has(taxRate)) {
                    taxMap.set(taxRate, { taxableAmount: 0, taxAmount: 0, invoiceCount: 0 });
                }
                const taxData = taxMap.get(taxRate);
                taxData.taxableAmount += taxable;
                taxData.taxAmount += tax;
            }
            if (invoiceTaxable > 0) {
                taxMap.forEach((data, rate) => {
                    if (taxRates.has(rate)) {
                        data.invoiceCount += 1;
                    }
                });
                const customerName = invoice.customer.type === 'particulier'
                    ? `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim()
                    : invoice.customer.businessName || '';
                invoiceDetails.push({
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
                    customerName,
                    taxableAmount: invoiceTaxable,
                    taxAmount: invoiceTax,
                    taxRate: Array.from(taxRates)[0] || 0,
                    currency: invoice.currency || 'CDF',
                });
            }
        }
        return {
            byRate: Array.from(taxMap.entries())
                .map(([taxRate, data]) => ({ taxRate, ...data }))
                .sort((a, b) => b.taxRate - a.taxRate),
            summary: {
                totalTaxable: Array.from(taxMap.values()).reduce((sum, d) => sum + d.taxableAmount, 0),
                totalTax: Array.from(taxMap.values()).reduce((sum, d) => sum + d.taxAmount, 0),
            },
            invoices: invoiceDetails,
        };
    }
    // 9. Rapport de rentabilité par période
    async generateProfitabilityReport(companyId, filters) {
        const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate || new Date();
        const [invoices, expenses] = await Promise.all([
            database_1.default.invoices.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    status: {
                        not: 'draft', // Exclure les factures en brouillon
                    },
                    invoiceDate: { gte: startDate, lte: endDate },
                },
                include: { lines: true },
            }),
            database_1.default.expense.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    expenseDate: { gte: startDate, lte: endDate },
                },
            }),
        ]);
        const periods = new Map();
        const current = new Date(startDate);
        while (current <= endDate) {
            const monthKey = (0, date_fns_1.format)(current, 'MMM yyyy', { locale: locale_1.fr });
            periods.set(monthKey, { revenue: 0, costs: 0, invoiceCount: 0 });
            current.setMonth(current.getMonth() + 1);
        }
        // Calculer les revenus
        for (const invoice of invoices) {
            const monthKey = (0, date_fns_1.format)(invoice.invoiceDate, 'MMM yyyy', { locale: locale_1.fr });
            const period = periods.get(monthKey);
            if (period) {
                period.revenue += Number(invoice.totalAmount);
                period.invoiceCount += 1;
            }
        }
        // Calculer les coûts réels à partir des dépenses
        for (const expense of expenses) {
            const monthKey = (0, date_fns_1.format)(expense.expenseDate, 'MMM yyyy', { locale: locale_1.fr });
            const period = periods.get(monthKey);
            if (period) {
                period.costs += Number(expense.amountTtc);
            }
        }
        const periodData = Array.from(periods.entries()).map(([period, data]) => {
            const profit = data.revenue - data.costs;
            return {
                period,
                revenue: data.revenue,
                costs: data.costs,
                profit,
                profitMargin: data.revenue > 0 ? (profit / data.revenue) * 100 : 0,
                invoiceCount: data.invoiceCount,
            };
        });
        const totalRevenue = periodData.reduce((sum, p) => sum + p.revenue, 0);
        const totalCosts = periodData.reduce((sum, p) => sum + p.costs, 0);
        const totalProfit = totalRevenue - totalCosts;
        return {
            periods: periodData,
            summary: {
                totalRevenue,
                totalCosts,
                totalProfit,
                averageProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
            },
        };
    }
    // 10. Rapport de conformité RDC (ACCT-003) — contrôles de base côté système
    async generateRdcComplianceReport(companyId, filters) {
        const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
        const endDate = filters.endDate || new Date();
        const issues = [];
        // 1) Vérifier les écritures déséquilibrées (OHADA: ∑débits = ∑crédits)
        const unbalancedEntries = await database_1.default.journal_entries.findMany({
            where: {
                company_id: companyId,
                entry_date: { gte: startDate, lte: endDate },
                deleted_at: null,
            },
            include: {
                journal_entry_lines: true,
            },
        });
        for (const entry of unbalancedEntries) {
            const totalDebit = entry.journal_entry_lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
            const totalCredit = entry.journal_entry_lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                issues.push({
                    type: 'UNBALANCED_ENTRY',
                    severity: 'error',
                    message: `Écriture déséquilibrée: débits ${totalDebit} ≠ crédits ${totalCredit}`,
                    details: {
                        entryId: entry.id,
                        entryNumber: entry.entry_number,
                        totalDebit,
                        totalCredit,
                    },
                });
            }
        }
        // 2) Vérifier les écritures sur périodes closes/verrouillées (ACCT-002/004)
        const entriesWithPeriods = await database_1.default.journal_entries.findMany({
            where: {
                company_id: companyId,
                entry_date: { gte: startDate, lte: endDate },
                deleted_at: null,
            },
            include: {
                fiscal_periods: true,
            },
        });
        for (const entry of entriesWithPeriods) {
            const period = entry.fiscal_periods;
            if (!period)
                continue;
            if (period.status === 'closed' || period.status === 'locked') {
                issues.push({
                    type: 'PERIOD_VIOLATION',
                    severity: 'error',
                    message: `Écriture sur période ${period.status} (${period.name})`,
                    details: {
                        entryId: entry.id,
                        entryNumber: entry.entry_number,
                        periodId: period.id,
                        periodName: period.name,
                        periodStatus: period.status,
                    },
                });
            }
        }
        logger_1.default.info('RDC compliance report generated', {
            companyId,
            startDate,
            endDate,
            issuesCount: issues.length,
        });
        return {
            period: { startDate, endDate },
            issues,
        };
    }
    // 10. Rapport de prévisions (Forecast Report)
    async generateForecastReport(companyId) {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        // const next90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        // Revenus des 30 derniers jours
        const recentPayments = await database_1.default.payment.findMany({
            where: {
                companyId,
                deletedAt: null,
                paymentDate: { gte: last30Days, lte: now },
            },
        });
        const recentRevenue = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        // Factures en attente (non payées uniquement)
        const pendingInvoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                deletedAt: null,
                status: { in: ['sent', 'partially_paid'] },
                dueDate: { lte: next30Days },
            },
            include: {
                payments: {
                    where: {
                        status: 'confirmed',
                        deletedAt: null,
                    },
                    select: {
                        amount: true,
                    },
                },
            },
        });
        // Calculer le solde restant pour chaque facture
        const invoicesWithBalance = pendingInvoices.map((inv) => {
            const totalAmount = Number(inv.totalAmount);
            const paidAmount = inv.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            return {
                ...inv,
                remainingBalance: totalAmount - paidAmount,
            };
        }).filter((inv) => inv.remainingBalance > 0);
        const expectedRevenue = invoicesWithBalance.reduce((sum, inv) => sum + inv.remainingBalance, 0);
        const overdueRisk = invoicesWithBalance
            .filter((inv) => inv.dueDate && new Date(inv.dueDate) < now)
            .reduce((sum, inv) => sum + inv.remainingBalance, 0);
        // Revenus des 90 derniers jours pour calculer la tendance
        const last90Payments = await database_1.default.payment.findMany({
            where: {
                companyId,
                deletedAt: null,
                paymentDate: { gte: last90Days, lte: now },
            },
        });
        const last90Revenue = last90Payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const averageMonthlyRevenue = last90Revenue / 3;
        const growthRate = recentRevenue > 0 ? ((recentRevenue - last90Revenue / 3) / (last90Revenue / 3)) * 100 : 0;
        const projectedRevenue = averageMonthlyRevenue * (1 + growthRate / 100);
        return {
            next30Days: {
                expectedRevenue,
                expectedInvoices: invoicesWithBalance.length,
                overdueRisk,
            },
            next90Days: {
                expectedRevenue: expectedRevenue * 3, // Estimation simple
                expectedInvoices: invoicesWithBalance.length * 3,
            },
            trends: {
                averageMonthlyRevenue,
                growthRate,
                projectedRevenue,
            },
        };
    }
    // 11. Rapport de comparaison période (Period Comparison)
    async generatePeriodComparisonReport(companyId, period1Start, period1End, period2Start, period2End) {
        const [period1Invoices, period1Payments, period2Invoices, period2Payments] = await Promise.all([
            database_1.default.invoices.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    status: {
                        not: 'draft', // Exclure les factures en brouillon
                    },
                    invoiceDate: { gte: period1Start, lte: period1End },
                },
            }),
            database_1.default.payment.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    paymentDate: { gte: period1Start, lte: period1End },
                },
            }),
            database_1.default.invoices.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    status: {
                        not: 'draft', // Exclure les factures en brouillon
                    },
                    invoiceDate: { gte: period2Start, lte: period2End },
                },
            }),
            database_1.default.payment.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    paymentDate: { gte: period2Start, lte: period2End },
                },
            }),
        ]);
        const period1Revenue = period1Payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const period2Revenue = period2Payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const period1 = {
            revenue: period1Revenue,
            invoices: period1Invoices.length,
            payments: period1Payments.length,
            averageInvoice: period1Invoices.length > 0 ? period1Revenue / period1Invoices.length : 0,
        };
        const period2 = {
            revenue: period2Revenue,
            invoices: period2Invoices.length,
            payments: period2Payments.length,
            averageInvoice: period2Invoices.length > 0 ? period2Revenue / period2Invoices.length : 0,
        };
        return {
            period1,
            period2,
            comparison: {
                revenueChange: period2Revenue - period1Revenue,
                revenueChangePercent: period1Revenue > 0 ? ((period2Revenue - period1Revenue) / period1Revenue) * 100 : 0,
                invoiceChange: period2Invoices.length - period1Invoices.length,
                invoiceChangePercent: period1Invoices.length > 0
                    ? ((period2Invoices.length - period1Invoices.length) / period1Invoices.length) * 100
                    : 0,
            },
        };
    }
    // 12. Rapport de synthèse financière (Financial Summary)
    async generateFinancialSummaryReport(companyId, filters) {
        const revenueReport = await this.generateRevenueReport(companyId, filters);
        const agingReport = await this.generateAgingReport(companyId);
        const paymentsReport = await this.generatePaymentsReport(companyId, filters);
        // Calculer les métriques clés
        const allInvoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                deletedAt: null,
                status: {
                    notIn: ['draft', 'cancelled'], // Exclure les factures en brouillon et annulées
                },
                ...(filters.startDate || filters.endDate
                    ? {
                        invoiceDate: {
                            ...(filters.startDate ? { gte: filters.startDate } : {}),
                            ...(filters.endDate ? { lte: filters.endDate } : {}),
                        },
                    }
                    : {}),
            },
            include: { payments: true },
        });
        const totalInvoiced = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalPaid = allInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
        const averageInvoice = allInvoices.length > 0 ? totalInvoiced / allInvoices.length : 0;
        // Calculer le délai moyen de paiement
        let totalDaysToPay = 0;
        let paidInvoicesCount = 0;
        for (const invoice of allInvoices) {
            if (invoice.payments.length > 0) {
                const firstPayment = invoice.payments.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())[0];
                const daysToPay = Math.floor((firstPayment.paymentDate.getTime() - invoice.invoiceDate.getTime()) / (24 * 60 * 60 * 1000));
                totalDaysToPay += daysToPay;
                paidInvoicesCount += 1;
            }
        }
        const daysToPay = paidInvoicesCount > 0 ? totalDaysToPay / paidInvoicesCount : 0;
        return {
            revenue: {
                total: revenueReport.totalRevenue,
                byMonth: revenueReport.byMonth.map((m) => ({ month: m.month, amount: m.revenue })),
                byCustomer: revenueReport.byCustomer.slice(0, 10).map((c) => ({ customerName: c.customerName, amount: c.revenue })),
            },
            outstanding: {
                total: agingReport.totalOutstanding,
                overdue: agingReport.invoices
                    .filter((inv) => inv.daysOverdue > 0)
                    .reduce((sum, inv) => sum + inv.remainingBalance, 0),
                aging: agingReport.byPeriod,
            },
            payments: {
                total: paymentsReport.totalAmount,
                byMethod: paymentsReport.byMethod,
            },
            keyMetrics: {
                averageInvoice,
                averagePayment: paymentsReport.totalCount > 0 ? paymentsReport.totalAmount / paymentsReport.totalCount : 0,
                collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
                daysToPay,
            },
        };
    }
}
exports.ReportingService = ReportingService;
exports.default = new ReportingService();
//# sourceMappingURL=reporting.service.js.map