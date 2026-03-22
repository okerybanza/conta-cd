"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const database_1 = __importDefault(require("../config/database"));
const queue_service_1 = require("./queue.service");
const logger_1 = __importDefault(require("../utils/logger"));
// Using process.env directly
const quota_service_1 = __importDefault(require("./quota.service"));
const whatsapp_service_1 = __importDefault(require("./whatsapp/whatsapp.service"));
const crypto_1 = require("crypto");
class NotificationService {
    // Envoyer notification facture envoyée
    async sendInvoiceNotification(data) {
        try {
            // Vérifier les limites AVANT envoi
            if (data.methods.includes('email')) {
                await quota_service_1.default.checkLimit(data.companyId, 'emails_sent');
            }
            // Note: WhatsApp quota check peut être ajouté plus tard si nécessaire
            // if (data.methods.includes('whatsapp')) {
            //   await quotaService.checkLimit(data.companyId, 'whatsapp_sent');
            // }
            // Récupérer les informations client et entreprise
            const [customer, company] = await Promise.all([
                database_1.default.customers.findUnique({
                    where: { id: data.customerId },
                }),
                database_1.default.companies.findUnique({
                    where: { id: data.companyId },
                }),
            ]);
            if (!customer || !company) {
                throw new Error('Customer or company not found');
            }
            const clientName = customer.type === 'particulier'
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                : customer.business_name || '';
            const invoiceUrl = data.invoiceUrl || `${process.env.FRONTEND_URL}/invoices/${data.invoiceId}`;
            // Préparer les données du template
            // Utiliser le logo de l'entreprise pour les emails de factures (avec fallback vers logo Conta)
            const templateData = {
                company_id: data.companyId,
                companyName: company.name,
                companyLogo: company.logo_url || undefined, // Logo entreprise (sera remplacé par platformLogo si absent)
                clientName,
                invoiceNumber: data.invoiceNumber,
                invoiceDate: new Date(data.invoiceDate).toLocaleDateString('fr-FR'),
                dueDate: data.dueDate
                    ? new Date(data.dueDate).toLocaleDateString('fr-FR')
                    : undefined,
                totalTTC: new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: data.currency,
                }).format(data.totalTTC),
                currency: data.currency,
                invoiceUrl,
                notes: data.notes,
                relatedType: 'invoice',
                relatedId: data.invoiceId,
            };
            // Envoyer par email si demandé
            if (data.methods.includes('email') && customer.email) {
                // Générer le PDF de la facture pour l'attacher
                let pdfAttachment;
                try {
                    const invoice = await database_1.default.invoices.findUnique({
                        where: { id: data.invoiceId },
                        include: {
                            invoice_lines: true,
                        },
                    });
                    if (invoice) {
                        const pdfService = require('./pdf.service').default;
                        const templateService = require('./template.service').default;
                        const rdcService = require('./rdc.service').default;
                        // Générer QR code si facture RDC normalisée
                        let qrCodeBase64;
                        // Vérifier si la facture est RDC normalisée via les paramètres de l'entreprise
                        const isRdcNormalized = company.rdc_normalized_enabled || false;
                        if (isRdcNormalized && company.nif) {
                            try {
                                qrCodeBase64 = await rdcService.generateQRCodeBase64({
                                    nif: company.nif,
                                    def: company.def || undefined,
                                    invoiceNumber: invoice.invoice_number,
                                    invoiceDate: invoice.invoice_date.toISOString().split('T')[0],
                                    totalTTC: Number(invoice.total_amount),
                                    currency: invoice.currency || 'CDF',
                                });
                            }
                            catch (error) {
                                // Ignorer erreur QR code
                            }
                        }
                        // Préparer les données du template
                        const invoiceTemplateData = templateService.prepareInvoiceData(invoice, company, customer, qrCodeBase64);
                        // Générer le PDF
                        const templateId = invoice.template_id || company.invoice_template_id || 'template-standard';
                        const pdfBuffer = await pdfService.generateInvoicePDF(templateId, invoiceTemplateData);
                        pdfAttachment = {
                            filename: `facture-${data.invoiceNumber}.pdf`,
                            content: pdfBuffer,
                        };
                    }
                }
                catch (error) {
                    logger_1.default.warn('Error generating PDF attachment for email', {
                        invoiceId: data.invoiceId,
                        error: error.message,
                    });
                    // Continuer sans PDF si la génération échoue
                }
                const invoiceFrom = process.env.SMTP_INVOICE_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
                await (0, queue_service_1.queueEmail)(data.companyId, customer.email, `Facture ${data.invoiceNumber} - ${company.name}`, 'invoice-sent', templateData, pdfAttachment ? [pdfAttachment] : undefined, invoiceFrom);
            }
            // Envoyer par WhatsApp si demandé
            if (data.methods.includes('whatsapp') && (customer.phone || customer.mobile)) {
                const phoneNumber = this.formatPhoneNumber(customer.phone || customer.mobile || '');
                if (phoneNumber) {
                    try {
                        const whatsappMessage = `Bonjour ${clientName},\n\nVotre facture ${data.invoiceNumber} d'un montant de ${templateData.totalTTC} est disponible.\n\nDate d'échéance: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}\n\nConsultez votre facture: ${invoiceUrl}`;
                        // 1. Créer la notification en DB avec statut 'pending'
                        const notification = await database_1.default.notifications.create({
                            data: {
                                id: (0, crypto_1.randomUUID)(),
                                company_id: data.companyId,
                                type: 'whatsapp',
                                title: `Notification WhatsApp - Facture ${data.invoiceNumber}`,
                                message: whatsappMessage,
                                updated_at: new Date(),
                                data: {
                                    relatedType: 'invoice',
                                    relatedId: data.invoiceId,
                                    recipient: phoneNumber,
                                    status: 'pending',
                                },
                            },
                        });
                        // 2. Ajouter à la file d'attente résiliente (BullMQ)
                        const { queueWhatsApp } = require('./queue.service');
                        await queueWhatsApp({
                            company_id: data.companyId,
                            to: phoneNumber,
                            message: whatsappMessage,
                            relatedType: 'invoice',
                            relatedId: data.invoiceId,
                            notificationId: notification.id
                        });
                        logger_1.default.info('WhatsApp invoice notification queued', {
                            invoiceId: data.invoiceId,
                            notificationId: notification.id
                        });
                    }
                    catch (error) {
                        logger_1.default.error('Error queuing WhatsApp invoice notification', {
                            invoiceId: data.invoiceId,
                            error: error.message,
                        });
                    }
                }
            }
            logger_1.default.info('Invoice notification queued', {
                invoiceId: data.invoiceId,
                methods: data.methods,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending invoice notification', {
                invoiceId: data.invoiceId,
                error: error.message,
            });
            throw error;
        }
    }
    // Envoyer notification paiement reçu
    async sendPaymentNotification(data) {
        try {
            const [customer, company] = await Promise.all([
                database_1.default.customers.findUnique({
                    where: { id: data.customerId },
                }),
                database_1.default.companies.findUnique({
                    where: { id: data.companyId },
                }),
            ]);
            if (!customer || !company) {
                throw new Error('Customer or company not found');
            }
            const clientName = customer.type === 'particulier'
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                : customer.business_name || '';
            // Utiliser le logo de l'entreprise pour les emails de paiements (avec fallback vers logo Conta)
            const templateData = {
                company_id: data.companyId,
                companyName: company.name,
                companyLogo: company.logo_url || undefined, // Logo entreprise (sera remplacé par platformLogo si absent)
                clientName,
                invoiceNumber: data.invoiceNumber,
                paymentDate: new Date(data.paymentDate).toLocaleDateString('fr-FR'),
                paymentMethod: this.formatPaymentMethod(data.paymentMethod),
                amount: new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: data.currency,
                }).format(data.amount),
                remainingBalance: data.remainingBalance
                    ? new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: data.currency,
                    }).format(data.remainingBalance)
                    : undefined,
                currency: data.currency,
                relatedType: 'payment',
                relatedId: data.invoiceId,
            };
            if (data.methods.includes('email') && customer.email) {
                const notifFrom = process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
                await (0, queue_service_1.queueEmail)(data.companyId, customer.email, `Paiement reçu - Facture ${data.invoiceNumber}`, 'payment-received', templateData, undefined, notifFrom);
            }
            // Envoyer par WhatsApp si demandé
            if (data.methods.includes('whatsapp') && (customer.phone || customer.mobile)) {
                const phoneNumber = this.formatPhoneNumber(customer.phone || customer.mobile || '');
                if (phoneNumber) {
                    try {
                        const whatsappMessage = `Bonjour ${clientName},\n\nNous avons reçu votre paiement de ${templateData.amount} pour la facture ${data.invoiceNumber}.\n\nMéthode de paiement: ${templateData.paymentMethod}\n${data.remainingBalance > 0 ? `Solde restant: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: data.currency }).format(data.remainingBalance)}` : 'Facture réglée'}\n\nMerci !`;
                        // 1. Créer la notification
                        const notification = await database_1.default.notifications.create({
                            data: {
                                id: (0, crypto_1.randomUUID)(),
                                company_id: data.companyId,
                                type: 'whatsapp',
                                title: `Notification WhatsApp - Paiement reçu - Facture ${data.invoiceNumber}`,
                                message: whatsappMessage,
                                updated_at: new Date(),
                                data: {
                                    relatedType: 'payment',
                                    relatedId: data.invoiceId,
                                    recipient: phoneNumber,
                                    status: 'pending',
                                },
                            },
                        });
                        // 2. Queuer
                        const { queueWhatsApp } = require('./queue.service');
                        await queueWhatsApp({
                            company_id: data.companyId,
                            to: phoneNumber,
                            message: whatsappMessage,
                            relatedType: 'payment',
                            relatedId: data.invoiceId,
                            notificationId: notification.id
                        });
                    }
                    catch (error) {
                        logger_1.default.error('Error queuing WhatsApp payment notification', {
                            invoiceId: data.invoiceId,
                            error: error.message,
                        });
                    }
                }
            }
            logger_1.default.info('Payment notification queued', {
                invoiceId: data.invoiceId,
                methods: data.methods,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending payment notification', {
                invoiceId: data.invoiceId,
                error: error.message,
            });
            throw error;
        }
    }
    // Envoyer rappel de paiement
    async sendPaymentReminder(data) {
        try {
            const [customer, company] = await Promise.all([
                database_1.default.customers.findUnique({
                    where: { id: data.customerId },
                }),
                database_1.default.companies.findUnique({
                    where: { id: data.companyId },
                }),
            ]);
            if (!customer || !company) {
                throw new Error('Customer or company not found');
            }
            const clientName = customer.type === 'particulier'
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                : customer.business_name || '';
            const invoiceUrl = data.invoiceUrl || `${process.env.FRONTEND_URL}/invoices/${data.invoiceId}`;
            // Utiliser le logo de l'entreprise pour les emails de rappels (avec fallback vers logo Conta)
            const templateData = {
                company_id: data.companyId,
                companyName: company.name,
                companyLogo: company.logo_url || undefined, // Logo entreprise (sera remplacé par platformLogo si absent)
                clientName,
                invoiceNumber: data.invoiceNumber,
                dueDate: new Date(data.dueDate).toLocaleDateString('fr-FR'),
                remainingBalance: new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: data.currency,
                }).format(data.remainingBalance),
                currency: data.currency,
                daysOverdue: data.daysOverdue,
                invoiceUrl,
                relatedType: 'invoice',
                relatedId: data.invoiceId,
            };
            if (data.methods.includes('email') && customer.email) {
                const notifFrom = process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
                await (0, queue_service_1.queueEmail)(data.companyId, customer.email, `Rappel de paiement - Facture ${data.invoiceNumber}`, 'payment-reminder', templateData, undefined, notifFrom);
            }
            // Envoyer par WhatsApp si demandé
            if (data.methods.includes('whatsapp') && (customer.phone || customer.mobile)) {
                const phoneNumber = this.formatPhoneNumber(customer.phone || customer.mobile || '');
                if (phoneNumber) {
                    try {
                        const daysOverdueText = data.daysOverdue && data.daysOverdue > 0
                            ? `\n\n⚠️ En retard de ${data.daysOverdue} jour${data.daysOverdue > 1 ? 's' : ''}`
                            : '';
                        const whatsappMessage = `Bonjour ${clientName},\n\nRappel de paiement\n\nFacture: ${data.invoiceNumber}\nMontant: ${templateData.remainingBalance}\nÉchéance: ${templateData.dueDate}${daysOverdueText}\n\nConsultez votre facture: ${invoiceUrl}`;
                        // 1. Créer
                        const notification = await database_1.default.notifications.create({
                            data: {
                                id: (0, crypto_1.randomUUID)(),
                                company_id: data.companyId,
                                type: 'whatsapp',
                                title: `Rappel WhatsApp - Facture ${data.invoiceNumber}`,
                                message: whatsappMessage,
                                updated_at: new Date(),
                                data: {
                                    relatedType: 'invoice',
                                    relatedId: data.invoiceId,
                                    recipient: phoneNumber,
                                    status: 'pending',
                                },
                            },
                        });
                        // 2. Queuer
                        const { queueWhatsApp } = require('./queue.service');
                        await queueWhatsApp({
                            company_id: data.companyId,
                            to: phoneNumber,
                            message: whatsappMessage,
                            relatedType: 'invoice',
                            relatedId: data.invoiceId,
                            notificationId: notification.id
                        });
                    }
                    catch (error) {
                        logger_1.default.error('Error queuing WhatsApp reminder', {
                            invoiceId: data.invoiceId,
                            error: error.message,
                        });
                    }
                }
            }
            logger_1.default.info('Payment reminder queued', {
                invoiceId: data.invoiceId,
                methods: data.methods,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending payment reminder', {
                invoiceId: data.invoiceId,
                error: error.message,
            });
            throw error;
        }
    }
    // Formater le numéro de téléphone pour SMS (format international)
    formatPhoneNumber(phone) {
        if (!phone)
            return null;
        // Nettoyer le numéro
        let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
        // Si commence par +, garder tel quel
        if (cleaned.startsWith('+')) {
            return cleaned;
        }
        // Si commence par 0, remplacer par +243 (RDC)
        if (cleaned.startsWith('0')) {
            return '+243' + cleaned.substring(1);
        }
        // Si commence par 243, ajouter +
        if (cleaned.startsWith('243')) {
            return '+' + cleaned;
        }
        // Sinon, ajouter +243
        return '+243' + cleaned;
    }
    // Formater le mode de paiement pour affichage
    formatPaymentMethod(method) {
        const methods = {
            cash: 'Espèces',
            mobile_money: 'Mobile Money',
            bank_transfer: 'Virement bancaire',
            check: 'Chèque',
            card: 'Carte bancaire',
            other: 'Autre',
        };
        return methods[method] || method;
    }
    /**
     * Envoyer notification de demande d'approbation de dépense
     */
    async sendExpenseApprovalRequest(companyId, approverId, expenseId, data) {
        try {
            const approver = await database_1.default.users.findUnique({
                where: { id: approverId },
            });
            const company = await database_1.default.companies.findUnique({
                where: { id: companyId },
            });
            if (!approver || !company) {
                throw new Error('Approver or company not found');
            }
            const expenseUrl = `${process.env.FRONTEND_URL}/expenses/${expenseId}`;
            const amountFormatted = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'CDF',
            }).format(data.amount);
            // Email
            if (approver.email) {
                await (0, queue_service_1.queueEmail)(companyId, approver.email, `Demande d'approbation - Dépense ${data.expenseNumber}`, 'expense-approval-request', {
                    company_id: companyId,
                    approverName: `${approver.first_name || ''} ${approver.last_name || ''}`.trim() || approver.email,
                    expenseNumber: data.expenseNumber,
                    amount: amountFormatted,
                    requesterName: data.requesterName,
                    expenseUrl,
                });
            }
            // WhatsApp
            try {
                const phone = approver.phone;
                if (phone) {
                    const message = `${data.requesterName} demande l'approbation de la dépense ${data.expenseNumber} (${amountFormatted}).`;
                    await whatsapp_service_1.default.sendText({
                        to: phone,
                        message,
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Error sending WhatsApp approval request', { error });
            }
            // Enregistrer la notification
            await database_1.default.notifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    company_id: companyId,
                    type: 'expense_approval',
                    title: `Demande d'approbation - ${data.expenseNumber}`,
                    message: `${data.requesterName} demande l'approbation de la dépense ${data.expenseNumber} (${amountFormatted})`,
                    updated_at: new Date(),
                    data: {
                        expenseId,
                        expenseNumber: data.expenseNumber,
                        amount: data.amount,
                        requesterName: data.requesterName,
                        status: 'pending',
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error sending expense approval request notification', { error });
            throw error;
        }
    }
    /**
     * Envoyer notification de réponse d'approbation (approuvé/rejeté)
     */
    async sendExpenseApprovalResponse(companyId, requesterId, expenseId, data) {
        try {
            const requester = await database_1.default.users.findUnique({
                where: { id: requesterId },
            });
            const company = await database_1.default.companies.findUnique({
                where: { id: companyId },
            });
            if (!requester || !company) {
                throw new Error('Requester or company not found');
            }
            const expenseUrl = `${process.env.FRONTEND_URL}/expenses/${expenseId}`;
            const isApproved = data.status === 'approved';
            const approverName = data.approverName || data.rejectorName || 'Approbateur';
            // Email
            if (requester.email) {
                await (0, queue_service_1.queueEmail)(companyId, requester.email, isApproved
                    ? `Dépense ${data.expenseNumber} approuvée`
                    : `Dépense ${data.expenseNumber} rejetée`, isApproved ? 'expense-approval-approved' : 'expense-approval-rejected', {
                    company_id: companyId,
                    requesterName: `${requester.first_name || ''} ${requester.last_name || ''}`.trim() || requester.email,
                    expenseNumber: data.expenseNumber,
                    approverName,
                    expenseUrl,
                    ...(data.reason && { rejectionReason: data.reason }),
                });
            }
            // WhatsApp
            try {
                const phone = requester.phone;
                if (phone) {
                    const message = isApproved
                        ? `Votre demande d'approbation pour la dépense ${data.expenseNumber} a été approuvée par ${approverName}.`
                        : `Votre demande d'approbation pour la dépense ${data.expenseNumber} a été rejetée par ${approverName}${data.reason ? ` : ${data.reason}` : ''}.`;
                    await whatsapp_service_1.default.sendText({
                        to: phone,
                        message,
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Error sending WhatsApp approval response', { error });
            }
            // Enregistrer la notification
            await database_1.default.notifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    company_id: companyId,
                    type: 'expense_approval',
                    title: isApproved
                        ? `Dépense ${data.expenseNumber} approuvée`
                        : `Dépense ${data.expenseNumber} rejetée`,
                    message: isApproved
                        ? `${approverName} a approuvé la dépense ${data.expenseNumber}`
                        : `${approverName} a rejeté la dépense ${data.expenseNumber}${data.reason ? ` : ${data.reason}` : ''}`,
                    updated_at: new Date(),
                    data: {
                        expenseId,
                        expenseNumber: data.expenseNumber,
                        status: data.status,
                        approverName,
                        ...(data.reason && { rejectionReason: data.reason }),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error sending expense approval response notification', { error });
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
//# sourceMappingURL=notification.service.js.map