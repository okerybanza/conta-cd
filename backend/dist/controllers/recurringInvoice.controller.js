"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringInvoiceController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const recurringInvoice_service_1 = __importDefault(require("../services/recurringInvoice.service"));
const zod_1 = require("zod");
const createRecurringInvoiceSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    frequency: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    interval: zod_1.z.number().int().positive().optional().default(1),
    startDate: zod_1.z.string().transform((str) => new Date(str)),
    endDate: zod_1.z.string().transform((str) => new Date(str)).optional(),
    dueDateDays: zod_1.z.number().int().positive().optional().default(30),
    currency: zod_1.z.string().length(3).optional().default('CDF'),
    reference: zod_1.z.string().optional(),
    poNumber: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    paymentTerms: zod_1.z.string().optional(),
    lines: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid().optional(),
        name: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        quantity: zod_1.z.number().positive(),
        unitPrice: zod_1.z.number().nonnegative(),
        taxRate: zod_1.z.number().nonnegative().max(100).optional().default(0),
    })).min(1),
    transportFees: zod_1.z.number().nonnegative().optional(),
    platformFees: zod_1.z.number().nonnegative().optional(),
    autoSend: zod_1.z.boolean().optional().default(false),
    sendToCustomer: zod_1.z.boolean().optional().default(true),
});
const updateRecurringInvoiceSchema = createRecurringInvoiceSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
class RecurringInvoiceController {
    /**
     * Créer une facture récurrente
     * POST /api/v1/recurring-invoices
     */
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const data = createRecurringInvoiceSchema.parse(req.body);
            const recurringInvoice = await recurringInvoice_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), req.user.id, data);
            res.status(201).json({
                success: true,
                data: recurringInvoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtenir une facture récurrente
     * GET /api/v1/recurring-invoices/:id
     */
    async getById(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const recurringInvoice = await recurringInvoice_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), req.params.id);
            res.json({
                success: true,
                data: recurringInvoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Lister les factures récurrentes
     * GET /api/v1/recurring-invoices
     */
    async list(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                customerId: req.query.customerId,
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            };
            const result = await recurringInvoice_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Mettre à jour une facture récurrente
     * PUT /api/v1/recurring-invoices/:id
     */
    async update(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const data = updateRecurringInvoiceSchema.parse(req.body);
            const recurringInvoice = await recurringInvoice_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), req.params.id, data);
            res.json({
                success: true,
                data: recurringInvoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Supprimer une facture récurrente
     * DELETE /api/v1/recurring-invoices/:id
     */
    async delete(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            await recurringInvoice_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), req.params.id);
            res.json({
                success: true,
                message: 'Recurring invoice deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Générer manuellement la prochaine facture
     * POST /api/v1/recurring-invoices/:id/generate
     */
    async generate(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const invoiceId = await recurringInvoice_service_1.default.generateNextInvoice(req.params.id);
            if (!invoiceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Invoice cannot be generated at this time',
                });
            }
            res.json({
                success: true,
                data: { invoiceId },
                message: 'Invoice generated successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtenir l'historique des factures générées
     * GET /api/v1/recurring-invoices/:id/history
     */
    async getHistory(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const invoices = await recurringInvoice_service_1.default.getGenerationHistory((0, auth_middleware_1.getCompanyId)(req), req.params.id);
            res.json({
                success: true,
                data: invoices,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RecurringInvoiceController = RecurringInvoiceController;
exports.default = new RecurringInvoiceController();
//# sourceMappingURL=recurringInvoice.controller.js.map