"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCoreService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
class InvoiceCoreService {
    /**
     * Obtenir l'ID réel à partir d'un identifiant (UUID ou numéro de facture)
     */
    async getInvoiceId(companyId, identifier) {
        // Si c'est déjà un UUID, on le retourne
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(identifier)) {
            return identifier;
        }
        // Sinon, on cherche par numéro de facture
        const invoice = await database_1.default.invoices.findFirst({
            where: {
                invoice_number: identifier,
                company_id: companyId,
                deleted_at: null,
            },
            select: { id: true },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        return invoice.id;
    }
    /**
     * Obtenir une facture par ID
     */
    async getById(companyId, invoiceId) {
        const realId = await this.getInvoiceId(companyId, invoiceId);
        const invoice = await database_1.default.invoices.findFirst({
            where: {
                id: realId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                customers: true,
                invoice_lines: {
                    include: {
                        products: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        return invoice;
    }
    /**
     * Lister les factures
     */
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters.customerId) {
            where.customer_id = filters.customerId;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.search) {
            where.OR = [
                { invoice_number: { contains: filters.search, mode: 'insensitive' } },
                { reference: { contains: filters.search, mode: 'insensitive' } },
                { customers: { first_name: { contains: filters.search, mode: 'insensitive' } } },
                { customers: { last_name: { contains: filters.search, mode: 'insensitive' } } },
                { customers: { business_name: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }
        if (filters.startDate || filters.endDate) {
            where.invoice_date = {};
            if (filters.startDate) {
                where.invoice_date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.invoice_date.lte = new Date(filters.endDate);
            }
        }
        // CODE-007: Une seule requête avec include pour éviter N+1
        const [invoices, total] = await Promise.all([
            database_1.default.invoices.findMany({
                where,
                include: {
                    customers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            business_name: true,
                            email: true,
                        },
                    },
                    // Inclure directement les lignes et paiements pour éviter les N+1
                    invoice_lines: true,
                    payments: {
                        // Ne pas retourner les paiements "supprimés" (deleted_at non null)
                        where: {
                            deleted_at: null,
                        },
                    },
                    _count: {
                        select: {
                            payments: true,
                            invoice_lines: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            database_1.default.invoices.count({ where }),
        ]);
        return {
            data: invoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.InvoiceCoreService = InvoiceCoreService;
exports.default = new InvoiceCoreService();
//# sourceMappingURL=invoiceCore.service.js.map