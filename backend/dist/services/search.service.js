"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class SearchService {
    /**
     * Recherche globale dans tous les modules
     */
    async globalSearch(companyId, query, limit = 10) {
        if (!query || query.trim().length < 2) {
            return { results: [], total: 0 };
        }
        const searchTerm = query.trim();
        const results = [];
        try {
            // Recherche dans les clients
            const customers = await database_1.default.customers.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: searchTerm, mode: 'insensitive' } },
                        { lastName: { contains: searchTerm, mode: 'insensitive' } },
                        { businessName: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                        { phone: { contains: searchTerm, mode: 'insensitive' } },
                        { mobile: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                take: Math.ceil(limit * 0.4), // 40% pour les clients
                orderBy: { createdAt: 'desc' },
            });
            customers.forEach((customer) => {
                const title = customer.type === 'particulier'
                    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                    : customer.businessName || '';
                const subtitle = customer.email || customer.phone || customer.mobile || '';
                results.push({
                    type: 'customer',
                    id: customer.id,
                    title,
                    subtitle,
                    description: customer.type === 'particulier' ? 'Client particulier' : 'Client entreprise',
                    url: `/customers/${customer.id}`,
                    metadata: {
                        type: customer.type,
                        email: customer.email,
                        phone: customer.phone,
                    },
                });
            });
            // Recherche dans les factures
            const invoices = await database_1.default.invoices.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    OR: [
                        { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
                        { reference: { contains: searchTerm, mode: 'insensitive' } },
                        { customer: { businessName: { contains: searchTerm, mode: 'insensitive' } } },
                        { customer: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
                        { customer: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
                    ],
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            type: true,
                            firstName: true,
                            lastName: true,
                            businessName: true,
                        },
                    },
                },
                take: Math.ceil(limit * 0.3), // 30% pour les factures
                orderBy: { createdAt: 'desc' },
            });
            invoices.forEach((invoice) => {
                const customerName = invoice.customer.type === 'particulier'
                    ? `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim()
                    : invoice.customer.businessName || '';
                results.push({
                    type: 'invoice',
                    id: invoice.id,
                    title: invoice.invoiceNumber,
                    subtitle: customerName,
                    description: `Facture ${invoice.status} - ${new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: invoice.currency || 'CDF',
                    }).format(Number(invoice.totalAmount))}`,
                    url: `/invoices/${invoice.id}`,
                    metadata: {
                        status: invoice.status,
                        total: Number(invoice.totalAmount),
                        currency: invoice.currency,
                        date: invoice.invoiceDate,
                    },
                });
            });
            // Recherche dans les articles
            const products = await database_1.default.products.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                        { sku: { contains: searchTerm, mode: 'insensitive' } },
                        { category: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                take: Math.ceil(limit * 0.2), // 20% pour les articles
                orderBy: { createdAt: 'desc' },
            });
            products.forEach((product) => {
                results.push({
                    type: 'product',
                    id: product.id,
                    title: product.name,
                    subtitle: product.category || product.type === 'service' ? 'Service' : 'Produit',
                    description: product.sku
                        ? `SKU: ${product.sku} - ${new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: product.currency || 'CDF',
                        }).format(Number(product.price))}`
                        : `${new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: product.currency || 'CDF',
                        }).format(Number(product.price))}`,
                    url: `/products/${product.id}/edit`,
                    metadata: {
                        type: product.type,
                        sku: product.sku,
                        price: Number(product.price),
                    },
                });
            });
            // Recherche dans les paiements
            const payments = await database_1.default.payment.findMany({
                where: {
                    companyId,
                    deletedAt: null,
                    OR: [
                        { transactionReference: { contains: searchTerm, mode: 'insensitive' } },
                        { reference: { contains: searchTerm, mode: 'insensitive' } },
                        { invoice: { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } } },
                        { invoice: { customer: { businessName: { contains: searchTerm, mode: 'insensitive' } } } },
                        { invoice: { customer: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
                        { invoice: { customer: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
                    ],
                },
                include: {
                    invoice: {
                        include: {
                            customer: {
                                select: {
                                    type: true,
                                    firstName: true,
                                    lastName: true,
                                    businessName: true,
                                },
                            },
                        },
                    },
                },
                take: Math.ceil(limit * 0.1), // 10% pour les paiements
                orderBy: { createdAt: 'desc' },
            });
            payments.forEach((payment) => {
                const customerName = payment.invoice?.customer
                    ? payment.invoice.customer.type === 'particulier'
                        ? `${payment.invoice.customer.firstName || ''} ${payment.invoice.customer.lastName || ''}`.trim()
                        : payment.invoice.customer.businessName || ''
                    : '';
                results.push({
                    type: 'payment',
                    id: payment.id,
                    title: payment.transactionReference || payment.reference || `Paiement #${payment.id.slice(0, 8)}`,
                    subtitle: payment.invoice?.invoiceNumber || customerName,
                    description: `${new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: payment.currency || 'CDF',
                    }).format(Number(payment.amount))} - ${payment.paymentMethod}`,
                    url: `/payments/${payment.id}/edit`,
                    metadata: {
                        amount: Number(payment.amount),
                        currency: payment.currency,
                        method: payment.paymentMethod,
                        date: payment.paymentDate,
                    },
                });
            });
            // Trier par pertinence (les plus récents en premier)
            results.sort((a, b) => {
                // Prioriser les correspondances exactes dans le titre
                const aExact = a.title.toLowerCase() === searchTerm.toLowerCase();
                const bExact = b.title.toLowerCase() === searchTerm.toLowerCase();
                if (aExact && !bExact)
                    return -1;
                if (!aExact && bExact)
                    return 1;
                // Ensuite par type (clients et factures en priorité)
                const typePriority = {
                    customer: 1,
                    invoice: 2,
                    product: 3,
                    payment: 4,
                };
                return typePriority[a.type] - typePriority[b.type];
            });
            return {
                results: results.slice(0, limit),
                total: results.length,
            };
        }
        catch (error) {
            logger_1.default.error('Error in global search', { error, companyId, query });
            throw new error_middleware_1.CustomError('Error performing search', 500, 'SEARCH_ERROR');
        }
    }
}
exports.SearchService = SearchService;
exports.default = new SearchService();
//# sourceMappingURL=search.service.js.map