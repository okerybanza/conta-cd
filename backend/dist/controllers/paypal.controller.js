"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalController = void 0;
const paypal_service_1 = __importDefault(require("../services/paypal.service"));
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
// Schémas de validation
const createOrderSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().uuid().optional(),
    subscriptionId: zod_1.z.string().uuid().optional(),
    packageId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('USD'),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['invoice', 'subscription']),
    returnUrl: zod_1.z.string().url(),
    cancelUrl: zod_1.z.string().url(),
});
const captureOrderSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    invoiceId: zod_1.z.string().uuid().optional(),
    subscriptionId: zod_1.z.string().uuid().optional(),
    packageId: zod_1.z.string().uuid().optional(),
    type: zod_1.z.enum(['invoice', 'subscription']),
});
class PayPalController {
    /**
     * Créer une Order PayPal pour une facture ou un abonnement
     * POST /api/v1/payments/paypal/init
     */
    async createOrder(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                });
            }
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'COMPANY_REQUIRED', message: 'Company ID is required' },
                });
            }
            // Valider les données
            const validation = createOrderSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: validation.error.errors,
                    },
                });
            }
            const data = validation.data;
            // Vérifier que les données sont cohérentes
            if (data.type === 'invoice' && !data.invoiceId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'invoiceId is required for invoice payment',
                    },
                });
            }
            if (data.type === 'subscription' && !data.packageId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'packageId is required for subscription payment',
                    },
                });
            }
            // Créer l'order PayPal
            const orderData = {
                invoiceId: data.invoiceId,
                subscriptionId: data.subscriptionId,
                packageId: data.packageId,
                amount: data.amount,
                currency: data.currency,
                description: data.description,
                returnUrl: data.returnUrl,
                cancelUrl: data.cancelUrl,
                type: data.type,
            };
            const result = await paypal_service_1.default.createOrder(companyId, orderData);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Error creating PayPal order', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
            });
            next(error);
        }
    }
    /**
     * Capturer une Order PayPal après approbation
     * POST /api/v1/payments/paypal/capture
     */
    async captureOrder(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                });
            }
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'COMPANY_REQUIRED', message: 'Company ID is required' },
                });
            }
            // Valider les données
            const validation = captureOrderSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: validation.error.errors,
                    },
                });
            }
            const data = validation.data;
            // Vérifier que les données sont cohérentes
            if (data.type === 'invoice' && !data.invoiceId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'invoiceId is required for invoice payment',
                    },
                });
            }
            if (data.type === 'subscription' && !data.packageId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'packageId is required for subscription payment',
                    },
                });
            }
            // Capturer l'order PayPal
            const captureData = {
                orderId: data.orderId,
                invoiceId: data.invoiceId,
                subscriptionId: data.subscriptionId,
                packageId: data.packageId,
                type: data.type,
            };
            const result = await paypal_service_1.default.captureOrder(companyId, captureData);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Error capturing PayPal order', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
            });
            next(error);
        }
    }
    /**
     * Récupérer les détails d'une Order PayPal
     * GET /api/v1/payments/paypal/order/:orderId
     */
    async getOrderDetails(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                });
            }
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'COMPANY_REQUIRED', message: 'Company ID is required' },
                });
            }
            const { orderId } = req.params;
            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Order ID is required' },
                });
            }
            const order = await paypal_service_1.default.getOrderDetails(companyId, orderId);
            res.status(200).json({
                success: true,
                data: order,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting PayPal order details', {
                error: error.message,
                orderId: req.params.orderId,
            });
            next(error);
        }
    }
}
exports.PayPalController = PayPalController;
exports.default = new PayPalController();
//# sourceMappingURL=paypal.controller.js.map