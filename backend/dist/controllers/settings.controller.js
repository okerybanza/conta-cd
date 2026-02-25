"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const settings_service_1 = __importDefault(require("../services/settings.service"));
const zod_1 = require("zod");
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
const updateCompanySettingsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    businessName: zod_1.z.string().max(255).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().max(50).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    country: zod_1.z.string().max(100).optional(),
    postalCode: zod_1.z.string().max(20).optional(),
    nif: zod_1.z.string().max(50).optional(),
    rccm: zod_1.z.string().max(50).optional(),
    def: zod_1.z.string().max(50).optional(),
    currency: zod_1.z.enum(['CDF', 'USD', 'EUR']).optional(),
    invoicePrefix: zod_1.z.string().max(20).optional(),
    invoiceNumberingType: zod_1.z.enum(['sequential', 'year-based', 'custom']).optional(),
    invoiceTemplateId: zod_1.z.string().optional(),
    rdcNormalizedEnabled: zod_1.z.boolean().optional(),
    defaultPaymentTerms: zod_1.z.string().optional(),
    defaultDueDays: zod_1.z.number().int().min(0).max(365).optional(),
    // Maxicash désactivé - ne plus utiliser
    // Configuration PayPal
    paypalEnabled: zod_1.z.boolean().optional(),
    paypalClientId: zod_1.z.string().max(100).optional(),
    paypalSecretKey: zod_1.z.string().max(255).optional(),
    paypalMode: zod_1.z.enum(['sandbox', 'live']).optional(),
    paypalWebhookId: zod_1.z.string().max(100).optional(),
    // Configuration Rappels Automatiques
    remindersEnabled: zod_1.z.boolean().optional(),
    reminderDaysBefore: zod_1.z.number().int().min(0).max(30).optional(),
    reminderDaysAfter: zod_1.z.number().int().min(0).max(90).optional(),
    reminderFrequency: zod_1.z.enum(['daily', 'weekly']).optional(),
    reminderMethods: zod_1.z.array(zod_1.z.enum(['email', 'whatsapp'])).optional(),
});
// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en null)
const preprocessEmptyString = (val) => {
    if (val === '' || val === undefined)
        return undefined;
    return val;
};
const updateUserSettingsSchema = zod_1.z.preprocess((data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
}, zod_1.z.object({
    firstName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().max(100).optional(),
    phone: zod_1.z.string().max(50).optional(),
    language: zod_1.z.enum(['fr', 'en']).optional(),
    timezone: zod_1.z.string().optional(),
    preferences: zod_1.z.record(zod_1.z.any()).optional(),
}).passthrough());
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
});
class SettingsController {
    // Obtenir paramètres entreprise
    async getCompanySettings(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const logger = require('../utils/logger').default;
            logger.debug('Getting company settings', { companyId, userId: req.user.id });
            const settings = await settings_service_1.default.getCompanySettings(companyId);
            res.json({
                success: true,
                data: settings,
            });
        }
        catch (error) {
            const logger = require('../utils/logger').default;
            logger.error('Error in getCompanySettings controller', {
                error: error.message,
                stack: error.stack,
                errorCode: error.code,
                errorName: error.name,
            });
            next(error);
        }
    }
    // Mettre à jour paramètres entreprise
    async updateCompanySettings(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            // Filtrer les champs non reconnus (comme templateCategory qui est uniquement frontend)
            const { templateCategory, ...bodyData } = req.body;
            // Convertir les chaînes vides en undefined pour les champs optionnels
            const cleanedData = {};
            for (const [key, value] of Object.entries(bodyData)) {
                if (value === '' || value === null) {
                    cleanedData[key] = undefined;
                }
                else {
                    cleanedData[key] = value;
                }
            }
            // Logger pour debug (enlever en production si nécessaire)
            const logger = require('../utils/logger').default;
            logger.debug('Updating company settings', {
                companyId: (0, auth_middleware_1.getCompanyId)(req),
                fieldsCount: Object.keys(cleanedData).length,
                fields: Object.keys(cleanedData)
            });
            const data = updateCompanySettingsSchema.parse(cleanedData);
            const settings = await settings_service_1.default.updateCompanySettings((0, auth_middleware_1.getCompanyId)(req), data);
            res.json({
                success: true,
                data: settings,
                message: 'Paramètres mis à jour avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour logo (upload fichier)
    async uploadLogo(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            if (!req.file) {
                throw new Error('No file uploaded');
            }
            // Construire l'URL complète du logo
            const baseUrl = process.env.BACKEND_URL || env_1.default.FRONTEND_URL || (req.protocol + '://' + req.get('host'));
            const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;
            const result = await settings_service_1.default.updateLogo((0, auth_middleware_1.getCompanyId)(req), logoUrl);
            res.json({
                success: true,
                data: result,
                message: 'Logo mis à jour avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour logo (URL)
    async updateLogo(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { logoUrl } = req.body;
            if (!logoUrl) {
                throw new Error('Logo URL is required');
            }
            const result = await settings_service_1.default.updateLogo((0, auth_middleware_1.getCompanyId)(req), logoUrl);
            res.json({
                success: true,
                data: result,
                message: 'Logo mis à jour avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir paramètres utilisateur
    async getUserSettings(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const logger = require('../utils/logger').default;
            logger.debug('Getting user settings', { userId: req.user.id });
            const settings = await settings_service_1.default.getUserSettings(req.user.id);
            res.json({
                success: true,
                data: settings,
            });
        }
        catch (error) {
            const logger = require('../utils/logger').default;
            logger.error('Error in getUserSettings controller', {
                error: error.message,
                stack: error.stack,
                errorCode: error.code,
                errorName: error.name,
                userId: req.user?.id,
            });
            next(error);
        }
    }
    // Mettre à jour paramètres utilisateur
    async updateUserSettings(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            logger_1.default.debug('updateUserSettings - Request body received', {
                userId: req.user.id,
                body: req.body,
                bodyKeys: Object.keys(req.body || {}),
            });
            const data = updateUserSettingsSchema.parse(req.body);
            logger_1.default.debug('updateUserSettings - Schema validation passed', {
                userId: req.user.id,
                validatedData: data,
            });
            const settings = await settings_service_1.default.updateUserSettings(req.user.id, data);
            res.json({
                success: true,
                data: settings,
                message: 'Paramètres mis à jour avec succès',
            });
        }
        catch (error) {
            logger_1.default.error('updateUserSettings - Error', {
                userId: req.user?.id,
                error: error.message,
                errorName: error.name,
                errorStack: error.stack,
                body: req.body,
                zodError: error.issues || error.errors,
            });
            next(error);
        }
    }
    // Changer mot de passe
    async changePassword(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
            await settings_service_1.default.changePassword(req.user.id, currentPassword, newPassword);
            res.json({
                success: true,
                message: 'Mot de passe modifié avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
exports.default = new SettingsController();
//# sourceMappingURL=settings.controller.js.map