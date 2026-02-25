"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_service_1 = __importDefault(require("../services/notification.service"));
const email_service_1 = __importDefault(require("../services/email.service"));
const env_1 = __importDefault(require("../config/env"));
// SMS service désactivé - ne garder que Email et WhatsApp
const whatsapp_service_1 = __importDefault(require("../services/whatsapp/whatsapp.service"));
const zod_1 = require("zod");
const invoice_service_1 = __importDefault(require("../services/invoice.service"));
const payment_service_1 = __importDefault(require("../services/payment.service"));
const database_1 = __importDefault(require("../config/database"));
const sendInvoiceNotificationSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().uuid(),
    methods: zod_1.z.array(zod_1.z.enum(['email', 'whatsapp'])).min(1),
});
const sendPaymentNotificationSchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid(),
    methods: zod_1.z.array(zod_1.z.enum(['email', 'whatsapp'])).min(1),
});
const sendPaymentReminderSchema = zod_1.z.object({
    methods: zod_1.z.array(zod_1.z.enum(['email', 'whatsapp'])).min(1),
});
const testEmailSchema = zod_1.z.object({
    to: zod_1.z.string().email(),
    subject: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
const testWhatsAppSchema = zod_1.z.object({
    to: zod_1.z.string(),
    message: zod_1.z.string().optional(),
});
class NotificationController {
    // Envoyer notification facture
    async sendInvoiceNotification(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { invoiceId } = req.params;
            const { methods } = sendInvoiceNotificationSchema.parse(req.body);
            // Récupérer la facture
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.getById(companyId, invoiceId);
            // Préparer les données
            const notificationData = {
                invoiceId: invoice.id,
                companyId: companyId,
                customerId: invoice.customer_id,
                invoiceNumber: invoice.invoice_number,
                invoiceDate: invoice.invoice_date.toISOString(),
                dueDate: invoice.due_date ? invoice.due_date.toISOString() : undefined,
                totalTTC: Number(invoice.total_amount),
                currency: invoice.currency || 'CDF',
                remainingBalance: Number(invoice.total_amount) - Number(invoice.paid_amount || 0),
                invoiceUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${encodeURIComponent(invoice.invoice_number)}`,
                notes: invoice.notes || undefined,
                methods,
            };
            await notification_service_1.default.sendInvoiceNotification(notificationData);
            res.json({
                success: true,
                message: 'Notification sent successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Envoyer notification paiement
    async sendPaymentNotification(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { paymentId } = req.params;
            const { methods } = sendPaymentNotificationSchema.parse(req.body);
            // Récupérer le paiement
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const payment = await payment_service_1.default.getById(companyId, paymentId);
            // Récupérer la facture
            const invoice = await invoice_service_1.default.getById(companyId, payment.invoice_id);
            // Préparer les données
            const notificationData = {
                invoiceId: invoice.id,
                companyId: companyId,
                customerId: invoice.customer_id,
                invoiceNumber: invoice.invoice_number,
                paymentDate: payment.payment_date.toISOString(),
                amount: Number(payment.amount),
                currency: payment.currency || 'CDF',
                paymentMethod: payment.payment_method,
                remainingBalance: Number(invoice.total_amount) - Number(invoice.paid_amount || 0),
                methods,
            };
            await notification_service_1.default.sendPaymentNotification(notificationData);
            res.json({
                success: true,
                message: 'Notification sent successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Envoyer rappel de paiement
    async sendPaymentReminder(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { invoiceId } = req.params;
            const { methods } = sendPaymentReminderSchema.parse(req.body);
            // Récupérer la facture
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.getById(companyId, invoiceId);
            if (!invoice.due_date) {
                throw new Error('Invoice has no due date');
            }
            // Calculer les jours de retard
            const due_date = new Date(invoice.due_date);
            const today = new Date();
            const daysOverdue = Math.max(0, Math.floor((today.getTime() - due_date.getTime()) / (1000 * 60 * 60 * 24)));
            // Préparer les données
            const reminderData = {
                invoiceId: invoice.id,
                companyId: companyId,
                customerId: invoice.customer_id,
                invoiceNumber: invoice.invoice_number,
                dueDate: invoice.due_date.toISOString(),
                remainingBalance: Number(invoice.total_amount) - Number(invoice.paid_amount || 0),
                currency: invoice.currency || 'CDF',
                daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
                invoiceUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${encodeURIComponent(invoice.invoice_number)}`,
                methods,
            };
            await notification_service_1.default.sendPaymentReminder(reminderData);
            res.json({
                success: true,
                message: 'Payment reminder sent successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Tester email
    async testEmail(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { to, subject, message } = testEmailSchema.parse(req.body);
            // Tester la connexion SMTP
            const connectionOk = await email_service_1.default.testConnection();
            if (!connectionOk) {
                throw new Error('SMTP connection failed');
            }
            // Envoyer un email de test
            await email_service_1.default.sendEmail({
                from: env_1.default.SMTP_FROM || env_1.default.SMTP_USER,
                to,
                subject: subject || 'Test Email - Conta',
                template: 'welcome',
                data: {
                    firstName: 'Test',
                    companyName: 'Conta',
                    message: message || 'Ceci est un email de test depuis Conta.',
                },
            });
            res.json({
                success: true,
                message: 'Test email sent successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Tester WhatsApp
    async testWhatsApp(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { to, message } = testWhatsAppSchema.parse(req.body);
            if (!whatsapp_service_1.default.isServiceConfigured()) {
                throw new Error('WhatsApp service not configured');
            }
            const result = await whatsapp_service_1.default.sendText({
                to,
                message: message || 'Ceci est un message WhatsApp de test depuis Conta.',
            });
            if (!result.ok) {
                throw new Error(result.error || 'Failed to send WhatsApp message');
            }
            res.json({
                success: true,
                message: 'Test WhatsApp sent successfully',
                messageId: result.providerMessageId,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Lister les notifications
    async listNotifications(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const where = {
                companyId: companyId,
            };
            if (req.query.type) {
                where.type = req.query.type;
            }
            if (req.query.status) {
                where.status = req.query.status;
            }
            const [notifications, total] = await Promise.all([
                database_1.default.notifications.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { created_at: 'desc' },
                }),
                database_1.default.notifications.count({ where }),
            ]);
            res.json({
                success: true,
                data: notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
exports.default = new NotificationController();
//# sourceMappingURL=notification.controller.js.map