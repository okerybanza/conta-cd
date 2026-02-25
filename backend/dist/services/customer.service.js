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
exports.CustomerService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const quota_service_1 = __importDefault(require("./quota.service"));
const usage_service_1 = __importDefault(require("./usage.service"));
const cache_service_1 = __importDefault(require("./cache.service"));
const crypto_1 = require("crypto");
class CustomerService {
    // Créer un client
    async create(companyId, data) {
        // Vérifier la limite de clients AVANT création
        await quota_service_1.default.checkLimit(companyId, 'customers');
        // Validation selon le type
        if (data.type === 'particulier') {
            if (!data.firstName || !data.lastName) {
                throw new error_middleware_1.CustomError('First name and last name are required for particulier', 400, 'VALIDATION_ERROR');
            }
        }
        else if (data.type === 'entreprise') {
            if (!data.businessName) {
                throw new error_middleware_1.CustomError('Business name is required for entreprise', 400, 'VALIDATION_ERROR');
            }
        }
        // Vérifier email unique si fourni
        if (data.email) {
            const existingCustomer = await database_1.default.customers.findFirst({
                where: {
                    company_id: companyId,
                    email: data.email,
                    deleted_at: null,
                },
            });
            if (existingCustomer) {
                throw new error_middleware_1.CustomError('Email already exists', 409, 'EMAIL_EXISTS');
            }
        }
        // Créer le client
        const customer = await database_1.default.customers.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                company_id: companyId,
                first_name: data.firstName,
                last_name: data.lastName,
                business_name: data.businessName,
                contact_person: data.contactPerson,
                email: data.email,
                phone: data.phone,
                mobile: data.mobile,
                address: data.address,
                city: data.city,
                country: data.country,
                postal_code: data.postalCode,
                nif: data.nif,
                rccm: data.rccm,
                notes: data.notes,
                tags: data.tags || [],
                type: data.type || 'particulier',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        // Incrémenter le compteur d'usage APRÈS création réussie
        await usage_service_1.default.increment(companyId, 'customers');
        // ARCH-001: journal domain_events centralisé + cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { CustomerCreated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new CustomerCreated({ companyId, timestamp: new Date() }, customer.id));
        logger_1.default.info(`Customer created: ${customer.id}`, {
            company_id: companyId,
            customerId: customer.id,
            type: customer.type,
        });
        return customer;
    }
    // Obtenir un client par ID
    async getById(companyId, customerId) {
        const customer = await database_1.default.customers.findFirst({
            where: {
                id: customerId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!customer) {
            throw new error_middleware_1.CustomError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
        }
        // SPRINT 3 - TASK 3.3 (PERF-002): Use aggregation instead of multiple findMany
        const [allInvoiceStats, unpaidInvoiceStats] = await Promise.all([
            // All invoices (except draft/cancelled) for totalInvoiced and totalPaid
            database_1.default.invoices.aggregate({
                where: {
                    customer_id: customerId,
                    company_id: companyId,
                    deleted_at: null,
                    status: {
                        notIn: ['draft', 'cancelled'],
                    },
                },
                _count: { id: true },
                _sum: {
                    total_amount: true,
                    paid_amount: true,
                },
            }),
            // Unpaid invoices for totalOutstanding
            database_1.default.invoices.aggregate({
                where: {
                    customer_id: customerId,
                    company_id: companyId,
                    deleted_at: null,
                    status: {
                        in: ['sent', 'partially_paid'],
                    },
                },
                _sum: {
                    total_amount: true,
                    paid_amount: true,
                },
            }),
        ]);
        const invoiceCount = allInvoiceStats._count.id;
        const totalInvoiced = Number(allInvoiceStats._sum.total_amount || 0);
        const totalPaid = Number(allInvoiceStats._sum.paid_amount || 0);
        const totalOutstanding = Number(unpaidInvoiceStats._sum.total_amount || 0) - Number(unpaidInvoiceStats._sum.paid_amount || 0);
        return {
            ...customer,
            invoiceCount,
            totalInvoiced,
            totalPaid,
            totalOutstanding,
        };
    }
    // Lister les clients avec filtres
    async list(companyId, filters = {}) {
        // SPRINT 3 - TASK 3.2 (UX-015): Advanced Caching
        // Create cache key from filters
        const cacheKey = `customers:list:${companyId}:${JSON.stringify(filters)}`;
        // Try to get from cache first
        const cached = await cache_service_1.default.get(cacheKey);
        if (cached) {
            logger_1.default.debug(`Cache hit for customer list: ${companyId}`);
            return cached;
        }
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        // Construire les conditions de recherche
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.search) {
            where.OR = [
                { first_name: { contains: filters.search, mode: 'insensitive' } },
                { last_name: { contains: filters.search, mode: 'insensitive' } },
                { business_name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
                { mobile: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters.city) {
            where.city = filters.city;
        }
        if (filters.country) {
            where.country = filters.country;
        }
        // SPRINT 3 - TASK 3.3 (PERF-002): N+1 Query Optimization
        // Fetch customers, total count, and aggregated invoice stats in parallel
        const [customers, total, allInvoiceStats, unpaidInvoiceStats] = await Promise.all([
            database_1.default.customers.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            database_1.default.customers.count({ where }),
            // Aggregate all invoices (except draft/cancelled) for totalInvoiced and totalPaid
            database_1.default.invoices.groupBy({
                by: ['customer_id'],
                where: {
                    company_id: companyId,
                    deleted_at: null,
                    status: {
                        notIn: ['draft', 'cancelled'],
                    },
                },
                _count: { id: true },
                _sum: {
                    total_amount: true,
                    paid_amount: true,
                },
            }),
            // Aggregate unpaid invoices for totalOutstanding
            database_1.default.invoices.groupBy({
                by: ['customer_id'],
                where: {
                    company_id: companyId,
                    deleted_at: null,
                    status: {
                        in: ['sent', 'partially_paid'],
                    },
                },
                _sum: {
                    total_amount: true,
                    paid_amount: true,
                },
            }),
        ]);
        // Create lookup maps for O(1) access
        const allStatsMap = new Map(allInvoiceStats.map((stat) => [
            stat.customer_id,
            {
                invoiceCount: stat._count.id,
                totalInvoiced: Number(stat._sum.total_amount || 0),
                totalPaid: Number(stat._sum.paid_amount || 0),
            },
        ]));
        const unpaidStatsMap = new Map(unpaidInvoiceStats.map((stat) => [
            stat.customer_id,
            Number(stat._sum.total_amount || 0) - Number(stat._sum.paid_amount || 0),
        ]));
        // Merge stats with customers in memory (fast O(n) operation)
        const customersWithStats = customers.map((customer) => {
            const stats = allStatsMap.get(customer.id) || {
                invoiceCount: 0,
                totalInvoiced: 0,
                totalPaid: 0,
            };
            const totalOutstanding = unpaidStatsMap.get(customer.id) || 0;
            return {
                ...customer,
                ...stats,
                totalOutstanding,
            };
        });
        const result = {
            data: customersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        // Cache for 10 minutes (600 seconds)
        await cache_service_1.default.set(cacheKey, result, 600);
        logger_1.default.debug(`Cached customer list for company: ${companyId}`);
        return result;
    }
    // Mettre à jour un client
    async update(companyId, customerId, data) {
        // Vérifier que le client existe
        const existingCustomer = await this.getById(companyId, customerId);
        // Vérifier email unique si modifié
        if (data.email && data.email !== existingCustomer.email) {
            const emailExists = await database_1.default.customers.findFirst({
                where: {
                    company_id: companyId,
                    email: data.email,
                    deleted_at: null,
                    id: { not: customerId },
                },
            });
            if (emailExists) {
                throw new error_middleware_1.CustomError('Email already exists', 409, 'EMAIL_EXISTS');
            }
        }
        // Mapper les champs camelCase vers snake_case
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.first_name = data.firstName;
        if (data.lastName !== undefined)
            updateData.last_name = data.lastName;
        if (data.businessName !== undefined)
            updateData.business_name = data.businessName;
        if (data.contactPerson !== undefined)
            updateData.contact_person = data.contactPerson;
        if (data.postalCode !== undefined)
            updateData.postal_code = data.postalCode;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.mobile !== undefined)
            updateData.mobile = data.mobile;
        if (data.address !== undefined)
            updateData.address = data.address;
        if (data.city !== undefined)
            updateData.city = data.city;
        if (data.country !== undefined)
            updateData.country = data.country;
        if (data.nif !== undefined)
            updateData.nif = data.nif;
        if (data.rccm !== undefined)
            updateData.rccm = data.rccm;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.tags !== undefined)
            updateData.tags = data.tags;
        updateData.updated_at = new Date();
        // Mettre à jour
        const customer = await database_1.default.customers.update({
            where: { id: customerId },
            data: updateData,
        });
        // ARCH-001: journal domain_events centralisé + cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { CustomerUpdated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new CustomerUpdated({ companyId, timestamp: new Date() }, customerId));
        logger_1.default.info(`Customer updated: ${customerId}`, {
            company_id: companyId,
            customerId,
        });
        return customer;
    }
    // Supprimer un client (soft delete)
    async delete(companyId, customerId) {
        // Vérifier que le client existe
        await this.getById(companyId, customerId);
        // Vérifier qu'il n'y a pas de factures liées
        const invoiceCount = await database_1.default.invoices.count({
            where: {
                customer_id: customerId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (invoiceCount > 0) {
            throw new error_middleware_1.CustomError('Cannot delete customer with existing invoices', 400, 'CUSTOMER_HAS_INVOICES');
        }
        // Soft delete
        await database_1.default.customers.update({
            where: { id: customerId },
            data: { deleted_at: new Date(), updated_at: new Date() },
        });
        // Décrémenter le compteur d'usage
        await usage_service_1.default.decrement(companyId, 'customers');
        // ARCH-001: journal domain_events centralisé + cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { CustomerDeleted } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new CustomerDeleted({ companyId, timestamp: new Date() }, customerId));
        logger_1.default.info(`Customer deleted: ${customerId}`, {
            company_id: companyId,
            customerId,
        });
        return { success: true };
    }
    // Exporter en CSV
    async exportToCSV(companyId, filters = {}) {
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { businessName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const customers = await database_1.default.customers.findMany({
            where,
            orderBy: { created_at: 'desc' },
        });
        // Générer CSV
        const headers = [
            'ID',
            'Type',
            'Nom',
            'Prénom',
            'Raison Sociale',
            'Contact Principal',
            'Email',
            'Téléphone',
            'Mobile',
            'Adresse',
            'Ville',
            'Pays',
            'Code Postal',
            'NIF',
            'RCCM',
            'Date Création',
        ];
        const rows = customers.map((customer) => {
            const name = customer.type === 'particulier'
                ? `${customer.lastName || ''} ${customer.firstName || ''}`.trim()
                : customer.businessName || '';
            return [
                customer.id,
                customer.type,
                customer.type === 'particulier' ? customer.lastName || '' : '',
                customer.type === 'particulier' ? customer.firstName || '' : '',
                customer.type === 'entreprise' ? customer.businessName || '' : '',
                customer.type === 'entreprise' ? customer.contactPerson || '' : '',
                customer.email || '',
                customer.phone || '',
                customer.mobile || '',
                customer.address || '',
                customer.city || '',
                customer.country || '',
                customer.postalCode || '',
                customer.nif || '',
                customer.rccm || '',
                customer.createdAt.toISOString(),
            ];
        });
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');
        return csvContent;
    }
}
exports.CustomerService = CustomerService;
exports.default = new CustomerService();
//# sourceMappingURL=customer.service.js.map