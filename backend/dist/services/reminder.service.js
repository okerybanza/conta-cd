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
exports.ReminderService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const notification_service_1 = __importDefault(require("./notification.service"));
const env_1 = __importDefault(require("../config/env"));
class ReminderService {
    /**
     * Traiter les rappels de paiement pour les factures en attente
     */
    async processPaymentReminders() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Récupérer toutes les entreprises avec rappels activés
        const companies = await database_1.default.companies.findMany({
            where: {
                remindersEnabled: true,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                remindersEnabled: true,
                reminderDaysBefore: true,
                reminderDaysAfter: true,
                reminderFrequency: true,
                reminderMethods: true,
            },
        });
        logger_1.default.info('Processing payment reminders', { companyCount: companies.length });
        const results = [];
        for (const company of companies) {
            try {
                // Calculer les dates pour les rappels
                const daysBefore = company.reminderDaysBefore || 3;
                const daysAfter = company.reminderDaysAfter || 7;
                // Date avant échéance (rappels préventifs)
                const beforeDate = new Date(today);
                beforeDate.setDate(beforeDate.getDate() + daysBefore);
                // Date après échéance (rappels de retard)
                const afterDate = new Date(today);
                afterDate.setDate(afterDate.getDate() - daysAfter);
                // Récupérer les factures qui nécessitent un rappel
                const invoices = await database_1.default.invoices.findMany({
                    where: {
                        companyId: company.id,
                        status: { in: ['sent', 'partially_paid'] },
                        deletedAt: null,
                        OR: [
                            // Factures avec échéance dans X jours (rappels préventifs)
                            {
                                dueDate: {
                                    gte: new Date(beforeDate.getTime() - 24 * 60 * 60 * 1000), // J-1 pour éviter doublons
                                    lte: beforeDate,
                                },
                                sentAt: {
                                    // Pas de rappel si déjà envoyé aujourd'hui
                                    not: {
                                        gte: new Date(today),
                                    },
                                },
                            },
                            // Factures en retard (rappels de retard)
                            {
                                dueDate: {
                                    lte: afterDate,
                                },
                                sentAt: {
                                    // Pas de rappel si déjà envoyé aujourd'hui
                                    not: {
                                        gte: new Date(today),
                                    },
                                },
                            },
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
                                email: true,
                                phone: true,
                                mobile: true,
                            },
                        },
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
                // Filtrer les factures avec solde restant > 0
                const invoicesWithBalance = invoices.filter((invoice) => {
                    const totalAmount = Number(invoice.totalAmount);
                    const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
                    const remainingBalance = totalAmount - paidAmount;
                    return remainingBalance > 0;
                });
                logger_1.default.info('Found invoices for reminders', {
                    companyId: company.id,
                    count: invoicesWithBalance.length,
                });
                for (const invoice of invoicesWithBalance) {
                    try {
                        // Calculer le nombre de jours de retard
                        const daysOverdue = invoice.dueDate
                            ? Math.floor((today.getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000))
                            : 0;
                        // Déterminer les méthodes de rappel
                        const methods = company.reminderMethods || ['email'];
                        // Calculer le solde restant
                        const totalAmount = Number(invoice.totalAmount);
                        const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
                        const remainingBalance = totalAmount - paidAmount;
                        // Envoyer le rappel
                        await notification_service_1.default.sendPaymentReminder({
                            invoiceId: invoice.id,
                            companyId: company.id,
                            customerId: invoice.customerId,
                            invoiceNumber: invoice.invoiceNumber,
                            dueDate: invoice.dueDate?.toISOString() || new Date().toISOString(),
                            remainingBalance: remainingBalance,
                            currency: invoice.currency || 'CDF',
                            daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
                            invoiceUrl: `${env_1.default.FRONTEND_URL}/invoices/${invoice.id}`,
                            methods,
                        });
                        // ARCH-007: Mise à jour facture via événement uniquement (dernier rappel envoyé)
                        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
                        const { InvoiceUpdated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
                        await eventBus.publish(new InvoiceUpdated({ companyId: company.id, userId: undefined, timestamp: new Date() }, invoice.id, { sent_at: new Date() }, undefined));
                        results.push({
                            companyId: company.id,
                            invoiceId: invoice.id,
                            success: true,
                        });
                        logger_1.default.info('Payment reminder sent', {
                            companyId: company.id,
                            invoiceId: invoice.id,
                            daysOverdue,
                        });
                    }
                    catch (error) {
                        logger_1.default.error('Failed to send reminder for invoice', {
                            companyId: company.id,
                            invoiceId: invoice.id,
                            error: error.message,
                        });
                        results.push({
                            companyId: company.id,
                            invoiceId: invoice.id,
                            success: false,
                            error: error.message,
                        });
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Error processing reminders for company', {
                    companyId: company.id,
                    error: error.message,
                });
                results.push({
                    companyId: company.id,
                    success: false,
                    error: error.message,
                });
            }
        }
        return results;
    }
    /**
     * Obtenir les statistiques des rappels pour une entreprise
     */
    async getReminderStats(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: {
                remindersEnabled: true,
                reminderDaysBefore: true,
                reminderDaysAfter: true,
                reminderFrequency: true,
                reminderMethods: true,
            },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysBefore = company.reminderDaysBefore || 3;
        const daysAfter = company.reminderDaysAfter || 7;
        const beforeDate = new Date(today);
        beforeDate.setDate(beforeDate.getDate() + daysBefore);
        const afterDate = new Date(today);
        afterDate.setDate(afterDate.getDate() - daysAfter);
        // Factures nécessitant un rappel préventif
        const preventiveInvoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                status: { in: ['sent', 'overdue'] },
                deletedAt: null,
                dueDate: {
                    gte: today,
                    lte: beforeDate,
                },
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
        // Filtrer celles avec solde restant > 0
        const preventiveCount = preventiveInvoices.filter((invoice) => {
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            return totalAmount - paidAmount > 0;
        }).length;
        // Factures en retard nécessitant un rappel
        const overdueInvoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
                status: { in: ['sent', 'overdue'] },
                deletedAt: null,
                dueDate: {
                    lte: afterDate,
                },
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
        // Filtrer celles avec solde restant > 0
        const overdueCount = overdueInvoices.filter((invoice) => {
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            return totalAmount - paidAmount > 0;
        }).length;
        return {
            enabled: company.remindersEnabled || false,
            daysBefore: company.reminderDaysBefore || 3,
            daysAfter: company.reminderDaysAfter || 7,
            frequency: company.reminderFrequency || 'daily',
            methods: company.reminderMethods || ['email'],
            preventiveCount,
            overdueCount,
            totalPending: preventiveCount + overdueCount,
        };
    }
}
exports.ReminderService = ReminderService;
exports.default = new ReminderService();
//# sourceMappingURL=reminder.service.js.map