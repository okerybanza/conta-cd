"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class SettingsService {
    // Obtenir les paramètres de l'entreprise
    async getCompanySettings(companyId) {
        if (!companyId) {
            throw new error_middleware_1.CustomError('Company ID is required', 400, 'COMPANY_ID_REQUIRED');
        }
        try {
            const company = await database_1.default.companies.findUnique({
                where: { id: companyId },
                // Ne pas utiliser select pour éviter les erreurs si des champs manquent
                // Prisma retournera tous les champs disponibles
            });
            if (!company) {
                throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
            }
            // Mapper les données snake_case vers camelCase pour le frontend
            // Utiliser des valeurs par défaut pour les champs optionnels qui pourraient être null
            return {
                id: company.id,
                name: company.name || '',
                businessName: company.business_name || null,
                logoUrl: company.logo_url || null,
                email: company.email || '',
                phone: company.phone || null,
                address: company.address || null,
                city: company.city || null,
                country: company.country || 'RDC',
                postalCode: company.postal_code || null,
                nif: company.nif || null,
                rccm: company.rccm || null,
                def: company.def || null,
                currency: company.currency || 'CDF',
                invoicePrefix: company.invoice_prefix || 'FAC',
                invoiceNumberingType: company.invoice_numbering_type || 'sequential',
                nextInvoiceNumber: company.next_invoice_number || 1,
                invoiceTemplateId: company.invoice_template_id || 'template-1-modern',
                rdcNormalizedEnabled: company.rdc_normalized_enabled ?? false,
                defaultPaymentTerms: company.default_payment_terms || null,
                defaultDueDays: company.default_due_days || 30,
                maxicashEnabled: company.maxicash_enabled ?? false,
                maxicashMerchantId: company.maxicash_merchant_id || null,
                maxicashSecretKey: company.maxicash_secret_key || null,
                maxicashSubMerchantId: company.maxicash_sub_merchant_id || null,
                maxicashWebhookUrl: company.maxicash_webhook_url || null,
                paypalEnabled: company.paypal_enabled ?? false,
                paypalClientId: company.paypal_client_id || null,
                paypalSecretKey: company.paypal_secret_key || null,
                paypalMode: company.paypal_mode || 'sandbox',
                paypalWebhookId: company.paypal_webhook_id || null,
                visapayEnabled: company.visapay_enabled ?? false,
                visapayMerchantId: company.visapay_merchant_id || null,
                visapayApiKey: company.visapay_api_key || null,
                visapaySecretKey: company.visapay_secret_key || null,
                visapayMode: company.visapay_mode || 'sandbox',
                visapayWebhookUrl: company.visapay_webhook_url || null,
                visapayEncryptionMethod: company.visapay_encryption_method || null,
                visapayEncryptionKeyId: company.visapay_encryption_key_id || null,
                visapaySigningKeyId: company.visapay_signing_key_id || null,
                visapayVisaEncryptionPublicKey: company.visapay_visa_encryption_public_key || null,
                visapayVisaEncryptionKeyId: company.visapay_visa_encryption_key_id || null,
                visapayClientEncryptionPrivateKey: company.visapay_client_encryption_private_key || null,
                visapayClientEncryptionKeyId: company.visapay_client_encryption_key_id || null,
                visapayClientSigningPrivateKey: company.visapay_client_signing_private_key || null,
                visapayClientSigningKeyId: company.visapay_client_signing_key_id || null,
                visapayVisaSigningPublicKey: company.visapay_visa_signing_public_key || null,
                visapayVisaSigningKeyId: company.visapay_visa_signing_key_id || null,
                remindersEnabled: company.reminders_enabled ?? false,
                reminderDaysBefore: company.reminder_days_before || 3,
                reminderDaysAfter: company.reminder_days_after || 7,
                reminderFrequency: company.reminder_frequency || 'daily',
                reminderMethods: Array.isArray(company.reminder_methods) ? company.reminder_methods : ['email'],
                createdAt: company.created_at,
                updatedAt: company.updated_at,
            };
        }
        catch (error) {
            logger_1.default.error('Error in getCompanySettings', {
                companyId,
                error: error.message,
                stack: error.stack,
                errorName: error.name,
                errorCode: error.code,
            });
            // Si c'est une erreur Prisma, la transformer en CustomError
            if (error.code === 'P2002' || error.code === 'P2025') {
                throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
            }
            throw error;
        }
    }
    // Mettre à jour les paramètres de l'entreprise
    async updateCompanySettings(companyId, data) {
        // Vérifier que l'entreprise existe
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        // Validation NIF unique si fourni (seulement si le NIF change)
        if (data.nif && data.nif.trim() !== '' && data.nif !== company.nif) {
            try {
                const existingCompany = await database_1.default.companies.findFirst({
                    where: {
                        nif: data.nif,
                        id: { not: companyId },
                        deleted_at: null,
                    },
                });
                if (existingCompany) {
                    throw new error_middleware_1.CustomError('NIF already exists', 400, 'NIF_EXISTS');
                }
            }
            catch (error) {
                if (error instanceof error_middleware_1.CustomError) {
                    throw error;
                }
                logger_1.default.error('Error validating NIF', { error: error.message });
                // Ne pas bloquer la mise à jour si la validation échoue
            }
        }
        // Validation email unique si fourni (seulement si l'email change)
        if (data.email && data.email.trim() !== '' && data.email !== company.email) {
            try {
                const existingCompany = await database_1.default.companies.findFirst({
                    where: {
                        email: data.email,
                        id: { not: companyId },
                        deleted_at: null,
                    },
                });
                if (existingCompany) {
                    throw new error_middleware_1.CustomError('Email already exists', 400, 'EMAIL_EXISTS');
                }
            }
            catch (error) {
                if (error instanceof error_middleware_1.CustomError) {
                    throw error;
                }
                logger_1.default.error('Error validating email', { error: error.message });
                // Ne pas bloquer la mise à jour si la validation échoue
            }
        }
        // Validation devise
        if (data.currency && !['CDF', 'USD', 'EUR'].includes(data.currency)) {
            throw new error_middleware_1.CustomError('Invalid currency', 400, 'INVALID_CURRENCY');
        }
        // Validation type de numérotation
        if (data.invoiceNumberingType &&
            !['sequential', 'year-based', 'custom'].includes(data.invoiceNumberingType)) {
            throw new error_middleware_1.CustomError('Invalid invoice numbering type', 400, 'INVALID_NUMBERING_TYPE');
        }
        // Mapper les données camelCase vers snake_case pour Prisma
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.businessName !== undefined)
            updateData.business_name = data.businessName;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.address !== undefined)
            updateData.address = data.address;
        if (data.city !== undefined)
            updateData.city = data.city;
        if (data.country !== undefined)
            updateData.country = data.country;
        if (data.postalCode !== undefined)
            updateData.postal_code = data.postalCode;
        if (data.nif !== undefined)
            updateData.nif = data.nif;
        if (data.rccm !== undefined)
            updateData.rccm = data.rccm;
        if (data.def !== undefined)
            updateData.def = data.def;
        if (data.currency !== undefined)
            updateData.currency = data.currency;
        if (data.invoicePrefix !== undefined)
            updateData.invoice_prefix = data.invoicePrefix;
        if (data.invoiceNumberingType !== undefined)
            updateData.invoice_numbering_type = data.invoiceNumberingType;
        if (data.invoiceTemplateId !== undefined)
            updateData.invoice_template_id = data.invoiceTemplateId;
        if (data.rdcNormalizedEnabled !== undefined)
            updateData.rdc_normalized_enabled = data.rdcNormalizedEnabled;
        if (data.defaultPaymentTerms !== undefined)
            updateData.default_payment_terms = data.defaultPaymentTerms;
        if (data.defaultDueDays !== undefined)
            updateData.default_due_days = data.defaultDueDays;
        if (data.paypalEnabled !== undefined)
            updateData.paypal_enabled = data.paypalEnabled;
        if (data.paypalClientId !== undefined)
            updateData.paypal_client_id = data.paypalClientId;
        if (data.paypalSecretKey !== undefined)
            updateData.paypal_secret_key = data.paypalSecretKey;
        if (data.paypalMode !== undefined)
            updateData.paypal_mode = data.paypalMode;
        if (data.paypalWebhookId !== undefined)
            updateData.paypal_webhook_id = data.paypalWebhookId;
        if (data.remindersEnabled !== undefined)
            updateData.reminders_enabled = data.remindersEnabled;
        if (data.reminderDaysBefore !== undefined)
            updateData.reminder_days_before = data.reminderDaysBefore;
        if (data.reminderDaysAfter !== undefined)
            updateData.reminder_days_after = data.reminderDaysAfter;
        if (data.reminderFrequency !== undefined)
            updateData.reminder_frequency = data.reminderFrequency;
        if (data.reminderMethods !== undefined) {
            // reminder_methods est un String[] dans Prisma
            updateData.reminder_methods = Array.isArray(data.reminderMethods)
                ? data.reminderMethods
                : [];
        }
        updateData.updated_at = new Date();
        // Mettre à jour
        const updated = await database_1.default.companies.update({
            where: { id: companyId },
            data: updateData,
            select: {
                id: true,
                name: true,
                business_name: true,
                logo_url: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                country: true,
                postal_code: true,
                nif: true,
                rccm: true,
                def: true,
                currency: true,
                invoice_prefix: true,
                invoice_numbering_type: true,
                next_invoice_number: true,
                invoice_template_id: true,
                rdc_normalized_enabled: true,
                default_payment_terms: true,
                default_due_days: true,
                maxicash_enabled: true,
                maxicash_merchant_id: true,
                maxicash_secret_key: true,
                maxicash_sub_merchant_id: true,
                maxicash_webhook_url: true,
                paypal_enabled: true,
                paypal_client_id: true,
                paypal_secret_key: true,
                paypal_mode: true,
                paypal_webhook_id: true,
                visapay_enabled: true,
                visapay_merchant_id: true,
                visapay_api_key: true,
                visapay_secret_key: true,
                visapay_mode: true,
                visapay_webhook_url: true,
                visapay_encryption_method: true,
                visapay_encryption_key_id: true,
                visapay_signing_key_id: true,
                visapay_visa_encryption_public_key: true,
                visapay_visa_encryption_key_id: true,
                visapay_client_encryption_private_key: true,
                visapay_client_encryption_key_id: true,
                visapay_client_signing_private_key: true,
                visapay_client_signing_key_id: true,
                visapay_visa_signing_public_key: true,
                visapay_visa_signing_key_id: true,
                reminders_enabled: true,
                reminder_days_before: true,
                reminder_days_after: true,
                reminder_frequency: true,
                reminder_methods: true,
                created_at: true,
                updated_at: true,
            },
        });
        logger_1.default.info('Company settings updated', { companyId });
        // Mapper les données snake_case vers camelCase pour le frontend
        return {
            id: updated.id,
            name: updated.name,
            businessName: updated.business_name,
            logoUrl: updated.logo_url,
            email: updated.email,
            phone: updated.phone,
            address: updated.address,
            city: updated.city,
            country: updated.country,
            postalCode: updated.postal_code,
            nif: updated.nif,
            rccm: updated.rccm,
            def: updated.def,
            currency: updated.currency,
            invoicePrefix: updated.invoice_prefix,
            invoiceNumberingType: updated.invoice_numbering_type,
            nextInvoiceNumber: updated.next_invoice_number,
            invoiceTemplateId: updated.invoice_template_id,
            rdcNormalizedEnabled: updated.rdc_normalized_enabled,
            defaultPaymentTerms: updated.default_payment_terms,
            defaultDueDays: updated.default_due_days,
            maxicashEnabled: updated.maxicash_enabled,
            maxicashMerchantId: updated.maxicash_merchant_id,
            maxicashSecretKey: updated.maxicash_secret_key,
            maxicashSubMerchantId: updated.maxicash_sub_merchant_id,
            maxicashWebhookUrl: updated.maxicash_webhook_url,
            paypalEnabled: updated.paypal_enabled,
            paypalClientId: updated.paypal_client_id,
            paypalSecretKey: updated.paypal_secret_key,
            paypalMode: updated.paypal_mode,
            paypalWebhookId: updated.paypal_webhook_id,
            visapayEnabled: updated.visapay_enabled,
            visapayMerchantId: updated.visapay_merchant_id,
            visapayApiKey: updated.visapay_api_key,
            visapaySecretKey: updated.visapay_secret_key,
            visapayMode: updated.visapay_mode,
            visapayWebhookUrl: updated.visapay_webhook_url,
            visapayEncryptionMethod: updated.visapay_encryption_method,
            visapayEncryptionKeyId: updated.visapay_encryption_key_id,
            visapaySigningKeyId: updated.visapay_signing_key_id,
            visapayVisaEncryptionPublicKey: updated.visapay_visa_encryption_public_key,
            visapayVisaEncryptionKeyId: updated.visapay_visa_encryption_key_id,
            visapayClientEncryptionPrivateKey: updated.visapay_client_encryption_private_key,
            visapayClientEncryptionKeyId: updated.visapay_client_encryption_key_id,
            visapayClientSigningPrivateKey: updated.visapay_client_signing_private_key,
            visapayClientSigningKeyId: updated.visapay_client_signing_key_id,
            visapayVisaSigningPublicKey: updated.visapay_visa_signing_public_key,
            visapayVisaSigningKeyId: updated.visapay_visa_signing_key_id,
            remindersEnabled: updated.reminders_enabled,
            reminderDaysBefore: updated.reminder_days_before,
            reminderDaysAfter: updated.reminder_days_after,
            reminderFrequency: updated.reminder_frequency,
            reminderMethods: updated.reminder_methods || [],
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        };
    }
    // Mettre à jour le logo
    async updateLogo(companyId, logoUrl) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        const updated = await database_1.default.companies.update({
            where: { id: companyId },
            data: {
                logo_url: logoUrl,
                updated_at: new Date(),
            },
            select: {
                id: true,
                logo_url: true,
            },
        });
        logger_1.default.info('Company logo updated', { companyId });
        // Mapper les données snake_case vers camelCase pour le frontend
        return {
            id: updated.id,
            logoUrl: updated.logo_url,
        };
    }
    // Obtenir les paramètres utilisateur
    async getUserSettings(userId) {
        if (!userId) {
            throw new error_middleware_1.CustomError('User ID is required', 400, 'USER_ID_REQUIRED');
        }
        try {
            const user = await database_1.default.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    language: true,
                    timezone: true,
                    preferences: true,
                    two_factor_enabled: true,
                    role: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            if (!user) {
                throw new error_middleware_1.CustomError('User not found', 404, 'USER_NOT_FOUND');
            }
            // Mapper les données snake_case vers camelCase pour le frontend
            return {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                language: user.language,
                timezone: user.timezone,
                preferences: user.preferences,
                twoFactorEnabled: user.two_factor_enabled,
                role: user.role,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
            };
        }
        catch (error) {
            logger_1.default.error('Error in getUserSettings', {
                userId,
                error: error.message,
                stack: error.stack,
                errorName: error.name,
                errorCode: error.code,
            });
            // Si c'est une erreur Prisma, la transformer en CustomError
            if (error.code === 'P2002' || error.code === 'P2025') {
                throw new error_middleware_1.CustomError('User not found', 404, 'USER_NOT_FOUND');
            }
            throw error;
        }
    }
    // Mettre à jour les paramètres utilisateur
    async updateUserSettings(userId, data) {
        // Validation langue
        if (data.language && !['fr', 'en'].includes(data.language)) {
            throw new error_middleware_1.CustomError('Invalid language', 400, 'INVALID_LANGUAGE');
        }
        // Validation timezone
        if (data.timezone) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
            }
            catch (error) {
                throw new error_middleware_1.CustomError('Invalid timezone', 400, 'INVALID_TIMEZONE');
            }
        }
        // Mapper les données camelCase vers snake_case pour Prisma
        const updateData = {
            updated_at: new Date(),
        };
        if (data.firstName !== undefined && data.firstName !== null)
            updateData.first_name = data.firstName;
        if (data.lastName !== undefined && data.lastName !== null)
            updateData.last_name = data.lastName;
        if (data.phone !== undefined && data.phone !== null)
            updateData.phone = data.phone;
        if (data.language !== undefined && data.language !== null)
            updateData.language = data.language;
        if (data.timezone !== undefined && data.timezone !== null)
            updateData.timezone = data.timezone;
        if (data.preferences !== undefined && data.preferences !== null)
            updateData.preferences = data.preferences;
        const updated = await database_1.default.users.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                language: true,
                timezone: true,
                preferences: true,
                two_factor_enabled: true,
                role: true,
                created_at: true,
                updated_at: true,
            },
        });
        logger_1.default.info('User settings updated', { userId });
        // Mapper les données snake_case vers camelCase pour le frontend
        return {
            id: updated.id,
            email: updated.email,
            firstName: updated.first_name,
            lastName: updated.last_name,
            phone: updated.phone,
            language: updated.language,
            timezone: updated.timezone,
            preferences: updated.preferences,
            twoFactorEnabled: updated.two_factor_enabled,
            role: updated.role,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        };
    }
    // Changer le mot de passe
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.default.users.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.CustomError('User not found', 404, 'USER_NOT_FOUND');
        }
        // Vérifier le mot de passe actuel
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
            throw new error_middleware_1.CustomError('Current password is incorrect', 400, 'INVALID_PASSWORD');
        }
        // Valider le nouveau mot de passe
        if (newPassword.length < 8) {
            throw new error_middleware_1.CustomError('Password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
        }
        // Hasher le nouveau mot de passe
        const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
        const newPasswordHash = await bcrypt.hash(newPassword, rounds);
        // Mettre à jour
        await database_1.default.users.update({
            where: { id: userId },
            data: {
                password_hash: newPasswordHash,
                updated_at: new Date(),
            },
        });
        logger_1.default.info('User password changed', { userId });
        return { success: true };
    }
}
exports.SettingsService = SettingsService;
exports.default = new SettingsService();
//# sourceMappingURL=settings.service.js.map