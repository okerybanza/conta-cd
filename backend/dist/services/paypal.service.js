"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const payment_service_1 = __importDefault(require("./payment.service"));
const subscription_service_1 = __importDefault(require("./subscription.service"));
const subscription_payment_service_1 = __importDefault(require("./subscription-payment.service"));
const platform_settings_service_1 = __importDefault(require("./platform-settings.service"));
const paypal_server_sdk_1 = require("@paypal/paypal-server-sdk");
class PayPalService {
    /**
     * Initialise le client PayPal selon le mode (sandbox/live)
     * Pour les abonnements, utilise la config Super Admin
     * Pour les factures, utilise la config de l'entreprise
     */
    async getPayPalClient(companyId, type) {
        let clientId;
        let secretKey;
        let mode;
        if (type === 'subscription') {
            // Pour les abonnements, utiliser la config Super Admin
            const platformConfig = await platform_settings_service_1.default.getPayPalConfig();
            if (!platformConfig.enabled || !platformConfig.clientId || !platformConfig.secretKey) {
                throw new error_middleware_1.CustomError('PayPal not configured for subscriptions. Please contact the administrator.', 400, 'PAYPAL_NOT_CONFIGURED');
            }
            clientId = platformConfig.clientId;
            secretKey = platformConfig.secretKey;
            mode = platformConfig.mode;
        }
        else {
            // Pour les factures, utiliser la config de l'entreprise
            const company = await database_1.default.companies.findUnique({
                where: { id: companyId },
            });
            if (!company || !company.paypal_enabled || !company.paypal_client_id || !company.paypal_secret_key) {
                throw new error_middleware_1.CustomError('PayPal not configured for this company', 400, 'PAYPAL_NOT_CONFIGURED');
            }
            clientId = company.paypal_client_id;
            secretKey = company.paypal_secret_key;
            mode = company.paypal_mode || 'sandbox';
        }
        const environment = mode === 'live' ? paypal_server_sdk_1.Environment.Production : paypal_server_sdk_1.Environment.Sandbox;
        return new paypal_server_sdk_1.Client({
            environment,
            clientCredentialsAuthCredentials: {
                oAuthClientId: clientId,
                oAuthClientSecret: secretKey,
            },
        });
    }
    /**
     * Obtient le controller Orders
     */
    async getOrdersController(companyId, type) {
        const client = await this.getPayPalClient(companyId, type);
        return new paypal_server_sdk_1.OrdersController(client);
    }
    /**
     * Crée une Order PayPal pour une facture ou un abonnement
     */
    async createOrder(companyId, data) {
        try {
            // Pour les abonnements, vérifier tout de suite que PayPal est configuré (éviter 500)
            if (data.type === 'subscription') {
                const platformConfig = await platform_settings_service_1.default.getPayPalConfig();
                if (!platformConfig.enabled || !platformConfig.clientId || !platformConfig.secretKey) {
                    throw new error_middleware_1.CustomError('Le paiement PayPal par abonnement n\'est pas configuré. Utilisez un autre moyen de paiement ou contactez le support.', 400, 'PAYPAL_NOT_CONFIGURED');
                }
            }
            // 1. Récupérer l'entreprise
            const company = await database_1.default.companies.findFirst({
                where: {
                    id: companyId,
                    deleted_at: null,
                },
            });
            if (!company) {
                throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
            }
            let description = data.description;
            let referenceId;
            let customId;
            let invoiceId;
            // 2. Gérer selon le type (facture ou abonnement)
            if (data.type === 'subscription') {
                // Pour un abonnement, récupérer le package
                if (!data.packageId) {
                    throw new error_middleware_1.CustomError('Package ID is required for subscription payment', 400, 'PACKAGE_ID_REQUIRED');
                }
                const pkg = await database_1.default.packages.findUnique({
                    where: { id: data.packageId },
                });
                if (!pkg) {
                    throw new error_middleware_1.CustomError('Package not found', 404, 'PACKAGE_NOT_FOUND');
                }
                description = description || `Abonnement ${pkg.name}`;
                referenceId = `subscription-${companyId}-${pkg.id}`;
                customId = JSON.stringify({ type: 'subscription', packageId: pkg.id, companyId });
            }
            else {
                // Pour une facture
                if (!data.invoiceId) {
                    throw new error_middleware_1.CustomError('Invoice ID is required for invoice payment', 400, 'INVOICE_ID_REQUIRED');
                }
                const invoice = await database_1.default.invoices.findFirst({
                    where: {
                        id: data.invoiceId,
                        company_id: companyId,
                        deleted_at: null,
                    },
                    include: {
                        customer: true,
                        payments: {
                            where: {
                                status: 'confirmed',
                            },
                        },
                    },
                });
                if (!invoice) {
                    throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
                }
                // Calculer le montant restant à payer
                const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
                const totalAmount = invoice.total_amount ?? invoice.totalAmount;
                const remainingAmount = Number(totalAmount) - totalPaid;
                if (remainingAmount <= 0) {
                    throw new error_middleware_1.CustomError('Invoice is already fully paid', 400, 'INVOICE_ALREADY_PAID');
                }
                // Ajuster le montant si nécessaire
                if (data.amount !== remainingAmount) {
                    data.amount = remainingAmount;
                }
                description = description || `Facture ${invoice.invoice_number ?? invoice.invoiceNumber}`;
                referenceId = invoice.id;
                customId = invoice.id;
                invoiceId = invoice.id;
            }
            // 3. Obtenir le controller Orders (utilise config Super Admin pour abonnements)
            const ordersController = await this.getOrdersController(companyId, data.type);
            // 4. Créer l'order via le controller
            const response = await ordersController.createOrder({
                body: {
                    intent: paypal_server_sdk_1.CheckoutPaymentIntent.Capture,
                    purchaseUnits: [
                        {
                            referenceId: referenceId,
                            description: description,
                            amount: {
                                currencyCode: data.currency || 'USD',
                                value: data.amount.toFixed(2),
                            },
                            invoiceId: invoiceId,
                            customId: customId,
                        },
                    ],
                    applicationContext: {
                        brandName: company.name || 'Conta',
                        landingPage: paypal_server_sdk_1.OrderApplicationContextLandingPage.NoPreference,
                        userAction: paypal_server_sdk_1.OrderApplicationContextUserAction.PayNow,
                        returnUrl: data.returnUrl,
                        cancelUrl: data.cancelUrl,
                    },
                },
                prefer: 'return=representation',
            });
            if (response.statusCode !== 201 || !response.result) {
                logger_1.default.error('PayPal order creation failed', {
                    statusCode: response.statusCode,
                    response: response.result,
                });
                throw new error_middleware_1.CustomError('Failed to create PayPal order', 500, 'PAYPAL_ORDER_CREATION_FAILED');
            }
            const order = response.result;
            logger_1.default.info('PayPal order created', {
                orderId: order.id,
                type: data.type,
                invoiceId: data.invoiceId,
                packageId: data.packageId,
                amount: data.amount,
            });
            // 5. Retourner les données de l'order
            return {
                orderId: order.id,
                status: order.status,
                links: order.links,
                invoiceId: data.invoiceId,
                subscriptionId: data.subscriptionId,
                packageId: data.packageId,
                amount: data.amount,
                currency: data.currency || 'USD',
                type: data.type,
            };
        }
        catch (error) {
            logger_1.default.error('Error creating PayPal order', {
                error: error.message,
                stack: error.stack,
                type: data.type,
                invoiceId: data.invoiceId,
                packageId: data.packageId,
            });
            if (error instanceof error_middleware_1.CustomError) {
                throw error;
            }
            const msg = error?.message || '';
            const isConfigError = /not configured|credential|unauthorized|PAYPAL_NOT_CONFIGURED/i.test(msg);
            throw new error_middleware_1.CustomError(isConfigError
                ? 'Le paiement PayPal n\'est pas configuré. Utilisez un autre moyen de paiement ou contactez le support.'
                : `Erreur lors de la création du paiement PayPal: ${msg}`, isConfigError ? 400 : 500, isConfigError ? 'PAYPAL_NOT_CONFIGURED' : 'PAYPAL_ERROR');
        }
    }
    /**
     * Capture une Order PayPal après approbation
     */
    async captureOrder(companyId, data) {
        try {
            // 1. Récupérer l'entreprise
            const company = await database_1.default.companies.findFirst({
                where: {
                    id: companyId,
                    // paypalEnabled: true, // Vérifié après récupération
                    deleted_at: null,
                },
            });
            if (!company) {
                throw new error_middleware_1.CustomError('Company not found or PayPal not enabled', 404, 'COMPANY_NOT_FOUND');
            }
            // 2. Vérifier que le paiement n'a pas déjà été traité
            const existingPayment = await database_1.default.payments.findFirst({
                where: {
                    transactionReference: data.orderId,
                    companyId,
                },
            });
            if (existingPayment) {
                logger_1.default.info('PayPal payment already processed', {
                    orderId: data.orderId,
                    paymentId: existingPayment.id,
                });
                return {
                    success: true,
                    message: 'Payment already processed',
                    paymentId: existingPayment.id,
                };
            }
            // 3. Gérer selon le type (facture ou abonnement)
            if (data.type === 'subscription') {
                return await this.captureSubscriptionPayment(companyId, data);
            }
            else {
                return await this.captureInvoicePayment(companyId, data);
            }
        }
        catch (error) {
            logger_1.default.error('Error capturing PayPal order', {
                error: error.message,
                stack: error.stack,
                orderId: data.orderId,
                type: data.type,
            });
            if (error instanceof error_middleware_1.CustomError) {
                throw error;
            }
            throw new error_middleware_1.CustomError(`Error capturing PayPal order: ${error.message}`, 500, 'PAYPAL_ERROR');
        }
    }
    /**
     * Capture un paiement PayPal pour une facture
     */
    async captureInvoicePayment(companyId, data) {
        if (!data.invoiceId) {
            throw new error_middleware_1.CustomError('Invoice ID is required', 400, 'INVOICE_ID_REQUIRED');
        }
        const company = await database_1.default.companies.findFirst({
            where: { id: companyId, deleted_at: null },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        if (!company.paypal_enabled || !company.paypal_client_id || !company.paypal_secret_key) {
            throw new error_middleware_1.CustomError('PayPal not enabled or not configured for this company', 400, 'PAYPAL_NOT_CONFIGURED');
        }
        // Récupérer la facture
        const invoice = await database_1.default.invoices.findFirst({
            where: { id: data.invoiceId, company_id: companyId, deleted_at: null },
            include: {
                payments: { where: { status: 'confirmed' } },
            },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        // Capturer l'order PayPal (utilise config entreprise pour factures)
        const ordersController = await this.getOrdersController(companyId, 'invoice');
        const response = await ordersController.captureOrder({
            id: data.orderId,
            body: {},
        });
        if (response.statusCode !== 201 || !response.result) {
            throw new error_middleware_1.CustomError('Failed to capture PayPal order', 500, 'PAYPAL_CAPTURE_FAILED');
        }
        const capture = response.result;
        if (capture.status !== 'COMPLETED') {
            throw new error_middleware_1.CustomError(`PayPal order capture status: ${capture.status}`, 400, 'PAYPAL_CAPTURE_NOT_COMPLETED');
        }
        const purchaseUnit = capture.purchaseUnits?.[0];
        const captureData = purchaseUnit?.payments?.captures?.[0];
        if (!captureData) {
            throw new error_middleware_1.CustomError('No capture data found in PayPal response', 500, 'PAYPAL_CAPTURE_DATA_MISSING');
        }
        const amount = parseFloat(captureData.amount?.value || '0');
        const currency = captureData.amount?.currencyCode || 'USD';
        // Créer le paiement
        const systemUser = await database_1.default.users.findFirst({
            where: { company_id: company.id, role: 'admin', deleted_at: null },
            orderBy: { created_at: 'asc' },
        });
        if (!systemUser) {
            throw new error_middleware_1.CustomError('No admin user found for company', 500, 'SYSTEM_ERROR');
        }
        const payment = await payment_service_1.default.create(company.id, systemUser.id, {
            invoiceId: invoice.id,
            amount: amount,
            currency: currency,
            paymentDate: new Date(),
            paymentMethod: 'paypal',
            transactionReference: data.orderId,
            reference: invoice.invoice_number ?? invoice.invoiceNumber,
            status: 'confirmed',
            notes: `Paiement PayPal - Order ID: ${data.orderId}, Capture ID: ${captureData.id}`,
        });
        logger_1.default.info('PayPal invoice payment created', {
            paymentId: payment.id,
            orderId: data.orderId,
            invoiceId: invoice.id,
        });
        return {
            success: true,
            message: 'Payment processed successfully',
            paymentId: payment.id,
            orderId: data.orderId,
            captureId: captureData.id,
            amount: amount,
            currency: currency,
        };
    }
    /**
     * Capture un paiement PayPal pour un abonnement
     */
    async captureSubscriptionPayment(companyId, data) {
        if (!data.packageId) {
            throw new error_middleware_1.CustomError('Package ID is required', 400, 'PACKAGE_ID_REQUIRED');
        }
        const company = await database_1.default.companies.findFirst({
            where: { id: companyId, deleted_at: null },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        if (!company.paypal_enabled || !company.paypal_client_id || !company.paypal_secret_key) {
            throw new error_middleware_1.CustomError('PayPal not enabled or not configured for this company', 400, 'PAYPAL_NOT_CONFIGURED');
        }
        // Récupérer le package
        const pkg = await database_1.default.packages.findUnique({
            where: { id: data.packageId },
        });
        if (!pkg) {
            throw new error_middleware_1.CustomError('Package not found', 404, 'PACKAGE_NOT_FOUND');
        }
        // Capturer l'order PayPal (utilise config Super Admin pour abonnements)
        const ordersController = await this.getOrdersController(companyId, 'subscription');
        const response = await ordersController.captureOrder({
            id: data.orderId,
            body: {},
        });
        if (response.statusCode !== 201 || !response.result) {
            throw new error_middleware_1.CustomError('Failed to capture PayPal order', 500, 'PAYPAL_CAPTURE_FAILED');
        }
        const capture = response.result;
        if (capture.status !== 'COMPLETED') {
            throw new error_middleware_1.CustomError(`PayPal order capture status: ${capture.status}`, 400, 'PAYPAL_CAPTURE_NOT_COMPLETED');
        }
        const purchaseUnit = capture.purchaseUnits?.[0];
        const captureData = purchaseUnit?.payments?.captures?.[0];
        if (!captureData) {
            throw new error_middleware_1.CustomError('No capture data found in PayPal response', 500, 'PAYPAL_CAPTURE_DATA_MISSING');
        }
        const amount = parseFloat(captureData.amount?.value || '0');
        const currency = captureData.amount?.currencyCode || 'USD';
        // Créer ou renouveler l'abonnement
        let subscription;
        const existing = await database_1.default.subscriptions.findUnique({
            where: { companyId },
        });
        if (existing) {
            // Renouveler l'abonnement existant
            subscription = await subscription_service_1.default.renew(companyId, false);
        }
        else {
            // Créer un nouvel abonnement
            subscription = await subscription_service_1.default.create(companyId, {
                packageId: data.packageId,
                billingCycle: 'monthly',
            });
        }
        // Enregistrer le paiement d'abonnement
        const systemUser = await database_1.default.users.findFirst({
            where: { company_id: company.id, role: 'admin', deleted_at: null },
            orderBy: { created_at: 'asc' },
        });
        if (!systemUser) {
            throw new error_middleware_1.CustomError('No admin user found for company', 500, 'SYSTEM_ERROR');
        }
        await subscription_payment_service_1.default.recordPayment(subscription.id, {
            subscriptionId: subscription.id,
            amount: amount,
            currency: currency,
            paymentMethod: 'paypal',
            paymentDate: new Date(),
            transactionReference: data.orderId,
            notes: `Paiement PayPal - Order ID: ${data.orderId}, Capture ID: ${captureData.id}`,
        }, systemUser.id);
        logger_1.default.info('PayPal subscription payment created', {
            subscriptionId: subscription.id,
            orderId: data.orderId,
            packageId: data.packageId,
        });
        return {
            success: true,
            message: 'Subscription payment processed successfully',
            subscriptionId: subscription.id,
            orderId: data.orderId,
            captureId: captureData.id,
            amount: amount,
            currency: currency,
        };
    }
    /**
     * Récupère les détails d'une Order PayPal
     */
    async getOrderDetails(companyId, orderId) {
        try {
            const company = await database_1.default.companies.findFirst({
                where: {
                    id: companyId,
                    // paypalEnabled: true, // Vérifié après récupération
                    deleted_at: null,
                },
            });
            if (!company) {
                throw new error_middleware_1.CustomError('Company not found or PayPal not enabled', 404, 'COMPANY_NOT_FOUND');
            }
            // Pour getOrderDetails, on ne connaît pas le type, on essaie d'abord avec la config entreprise
            // Si ça échoue, on essaie avec la config Super Admin
            let ordersController;
            try {
                ordersController = await this.getOrdersController(companyId, 'invoice');
            }
            catch {
                ordersController = await this.getOrdersController(companyId, 'subscription');
            }
            const response = await ordersController.getOrder({ id: orderId });
            if (response.statusCode !== 200 || !response.result) {
                throw new error_middleware_1.CustomError('Failed to get PayPal order details', 500, 'PAYPAL_ORDER_GET_FAILED');
            }
            return response.result;
        }
        catch (error) {
            logger_1.default.error('Error getting PayPal order details', {
                error: error.message,
                orderId,
            });
            if (error instanceof error_middleware_1.CustomError) {
                throw error;
            }
            throw new error_middleware_1.CustomError(`Error getting PayPal order: ${error.message}`, 500, 'PAYPAL_ERROR');
        }
    }
    /**
     * Valide un webhook PayPal (à implémenter selon la doc PayPal)
     */
    async validateWebhook(headers, body, company) {
        // TODO: Implémenter la validation de webhook PayPal selon la documentation
        // PayPal fournit un mécanisme de validation de webhook avec vérification de signature
        // Pour l'instant, on retourne true (à sécuriser en production)
        logger_1.default.warn('PayPal webhook validation not fully implemented');
        return true;
    }
    /**
     * Traite un webhook PayPal
     */
    async processWebhook(payload, headers, companyId) {
        try {
            logger_1.default.info('Processing PayPal webhook', {
                eventType: payload.event_type,
                resourceType: payload.resource_type,
            });
            // 1. Récupérer l'entreprise
            const company = await database_1.default.companies.findFirst({
                where: {
                    id: companyId,
                    // paypalEnabled: true, // Vérifié après récupération
                    deleted_at: null,
                },
            });
            if (!company) {
                throw new error_middleware_1.CustomError('Company not found or PayPal not enabled', 404, 'COMPANY_NOT_FOUND');
            }
            // 2. Valider le webhook (à implémenter)
            // const isValid = await this.validateWebhook(headers, payload, company);
            // if (!isValid) {
            //   throw new CustomError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
            // }
            // 3. Traiter selon le type d'événement
            const eventType = payload.event_type;
            const resource = payload.resource;
            // ===== ÉVÉNEMENTS DE PAIEMENT =====
            if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                const orderId = resource.supplementary_data?.related_ids?.order_id;
                if (orderId) {
                    // Trouver le paiement par orderId
                    const payment = await database_1.default.payments.findFirst({
                        where: {
                            transactionReference: orderId,
                            companyId: company.id,
                        },
                        include: {
                            invoice: true,
                        },
                    });
                    if (payment) {
                        logger_1.default.info('PayPal payment already processed via webhook', {
                            paymentId: payment.id,
                            orderId,
                        });
                        return {
                            success: true,
                            message: 'Payment already processed',
                            paymentId: payment.id,
                        };
                    }
                    logger_1.default.warn('PayPal webhook received but payment not found', {
                        orderId,
                        captureId: resource.id,
                    });
                }
            }
            else if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.REFUNDED') {
                // Gérer les paiements refusés ou remboursés
                const orderId = resource.supplementary_data?.related_ids?.order_id;
                if (orderId) {
                    const payment = await database_1.default.payments.findFirst({
                        where: {
                            transactionReference: orderId,
                            companyId: company.id,
                        },
                    });
                    if (payment) {
                        await database_1.default.payments.update({
                            where: { id: payment.id },
                            data: {
                                status: eventType === 'PAYMENT.CAPTURE.REFUNDED' ? 'refunded' : 'failed',
                                notes: `PayPal webhook: ${eventType}`,
                            },
                        });
                        logger_1.default.info('PayPal payment status updated via webhook', {
                            paymentId: payment.id,
                            orderId,
                            status: eventType,
                        });
                    }
                }
            }
            // ===== ÉVÉNEMENTS D'ABONNEMENTS =====
            else if (eventType?.startsWith('BILLING.SUBSCRIPTION.')) {
                const subscriptionId = resource.id || resource.subscription_id;
                if (!subscriptionId) {
                    logger_1.default.warn('PayPal subscription webhook received without subscription ID', {
                        eventType,
                        resource,
                    });
                    return {
                        success: true,
                        message: 'Webhook received but subscription ID not found',
                    };
                }
                // Trouver l'abonnement par companyId
                // Note: PayPal subscription ID sera stocké dans les notes ou dans une table de mapping si nécessaire
                const subscription = await database_1.default.subscriptions.findFirst({
                    where: {
                        companyId: company.id,
                    },
                    include: {
                        package: true,
                    },
                    orderBy: {
                        createdAt: 'desc', // Prendre le plus récent
                    },
                });
                if (!subscription) {
                    logger_1.default.warn('PayPal subscription webhook received but subscription not found', {
                        eventType,
                        subscriptionId,
                        companyId: company.id,
                    });
                    return {
                        success: true,
                        message: 'Webhook received but subscription not found in system',
                    };
                }
                // Traiter selon le type d'événement d'abonnement
                switch (eventType) {
                    case 'BILLING.SUBSCRIPTION.CREATED':
                        logger_1.default.info('PayPal subscription created', {
                            subscriptionId: subscription.id,
                            paypalSubscriptionId: subscriptionId,
                        });
                        break;
                    case 'BILLING.SUBSCRIPTION.ACTIVATED':
                    case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
                        await database_1.default.subscriptions.update({
                            where: { id: subscription.id },
                            data: {
                                status: 'active',
                                // Note: PayPal subscription ID peut être stocké dans les notes si nécessaire
                            },
                        });
                        logger_1.default.info('PayPal subscription activated', {
                            subscriptionId: subscription.id,
                            paypalSubscriptionId: subscriptionId,
                        });
                        break;
                    case 'BILLING.SUBSCRIPTION.SUSPENDED':
                        await database_1.default.subscriptions.update({
                            where: { id: subscription.id },
                            data: {
                                status: 'suspended',
                            },
                        });
                        logger_1.default.info('PayPal subscription suspended', {
                            subscriptionId: subscription.id,
                        });
                        break;
                    case 'BILLING.SUBSCRIPTION.CANCELLED':
                        await database_1.default.subscriptions.update({
                            where: { id: subscription.id },
                            data: {
                                status: 'cancelled',
                                endDate: new Date(),
                            },
                        });
                        logger_1.default.info('PayPal subscription cancelled', {
                            subscriptionId: subscription.id,
                        });
                        break;
                    case 'BILLING.SUBSCRIPTION.EXPIRED':
                        await database_1.default.subscriptions.update({
                            where: { id: subscription.id },
                            data: {
                                status: 'expired',
                                endDate: new Date(),
                            },
                        });
                        logger_1.default.info('PayPal subscription expired', {
                            subscriptionId: subscription.id,
                        });
                        break;
                    case 'BILLING.SUBSCRIPTION.UPDATED':
                        // Mettre à jour les informations de l'abonnement si nécessaire
                        logger_1.default.info('PayPal subscription updated', {
                            subscriptionId: subscription.id,
                            resource,
                        });
                        break;
                    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
                        // Marquer l'abonnement comme ayant un problème de paiement
                        await database_1.default.subscriptions.update({
                            where: { id: subscription.id },
                            data: {
                                status: 'payment_failed',
                            },
                        });
                        logger_1.default.warn('PayPal subscription payment failed', {
                            subscriptionId: subscription.id,
                        });
                        break;
                    default:
                        logger_1.default.info('PayPal subscription webhook received (unhandled event)', {
                            eventType,
                            subscriptionId: subscription.id,
                        });
                }
                return {
                    success: true,
                    message: `Subscription webhook processed: ${eventType}`,
                    subscriptionId: subscription.id,
                };
            }
            // ===== ÉVÉNEMENTS DE FACTURES PAYPAL (Invoicing) =====
            else if (eventType?.startsWith('INVOICING.INVOICE.')) {
                // Note: Nous gérons nos propres factures, mais ces événements peuvent être utiles
                // pour synchroniser avec les factures PayPal si nécessaire
                logger_1.default.info('PayPal invoice webhook received (not processed - using internal invoices)', {
                    eventType,
                    invoiceId: resource.id,
                });
                return {
                    success: true,
                    message: 'Invoice webhook received but not processed (using internal invoices)',
                };
            }
            // Événement non géré
            logger_1.default.info('PayPal webhook received (unhandled event type)', {
                eventType,
                resourceType: payload.resource_type,
            });
            return {
                success: true,
                message: 'Webhook processed (event type not specifically handled)',
            };
        }
        catch (error) {
            logger_1.default.error('Error processing PayPal webhook', {
                error: error.message,
                eventType: payload.event_type,
            });
            if (error instanceof error_middleware_1.CustomError) {
                throw error;
            }
            throw new error_middleware_1.CustomError(`Error processing webhook: ${error.message}`, 500, 'WEBHOOK_PROCESSING_ERROR');
        }
    }
}
exports.PayPalService = PayPalService;
exports.default = new PayPalService();
//# sourceMappingURL=paypal.service.js.map