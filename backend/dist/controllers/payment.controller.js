"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_service_1 = __importDefault(require("../services/payment.service"));
const zod_1 = require("zod");
// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
// Fonction helper pour préprocesser les données
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
// Schéma de base pour les paiements
const basePaymentSchema = zod_1.z.object({
    currency: zod_1.z.string().optional(),
    paymentDate: zod_1.z.coerce.date().optional(),
    mobileMoneyProvider: zod_1.z.string().optional(),
    mobileMoneyNumber: zod_1.z.string().optional(),
    transactionReference: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    checkNumber: zod_1.z.string().optional(),
    cardLastFour: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(), reason: zod_1.z.string().max(500).optional(), // ACCT-001: Why the payment was made/modified (max 500 chars)  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
}).passthrough();
// Schémas de validation
const createPaymentSchema = zod_1.z.preprocess(preprocessData, basePaymentSchema.extend({
    invoiceId: zod_1.z.string().uuid(), // Requis pour la création
    amount: zod_1.z.number().positive(), // Requis pour la création
    paymentMethod: zod_1.z.enum([
        'cash',
        'mobile_money',
        'bank_transfer',
        'check',
        'card',
        'other',
    ]), // Requis pour la création
}));
const updatePaymentSchema = zod_1.z.preprocess(preprocessData, basePaymentSchema.extend({
    invoiceId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().positive().optional(),
    paymentMethod: zod_1.z.enum([
        'cash',
        'mobile_money',
        'bank_transfer',
        'check',
        'card',
        'other',
    ]).optional(),
}));
const listPaymentsSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().uuid().optional(),
    paymentMethod: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
class PaymentController {
    // Créer un paiement
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const data = createPaymentSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const payment = await payment_service_1.default.create(companyId, req.user.id, data);
            res.status(201).json({
                success: true,
                data: payment,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir un paiement
    async getById(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const payment = await payment_service_1.default.getById(companyId, id);
            res.json({
                success: true,
                data: payment,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Lister les paiements
    async list(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = listPaymentsSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const result = await payment_service_1.default.list(companyId, filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir les paiements d'une facture
    async getByInvoice(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { invoiceId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const payments = await payment_service_1.default.getByInvoice(companyId, invoiceId);
            res.json({
                success: true,
                data: payments,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour un paiement
    async update(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const data = updatePaymentSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const payment = await payment_service_1.default.update(companyId, id, data);
            res.json({
                success: true,
                data: payment,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Supprimer un paiement
    async delete(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await payment_service_1.default.delete(companyId, id);
            res.json({
                success: true,
                message: 'Payment deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
exports.default = new PaymentController();
//# sourceMappingURL=payment.controller.js.map