"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFiscalPeriod = exports.updateFiscalPeriod = exports.unlockFiscalPeriod = exports.lockFiscalPeriod = exports.reopenFiscalPeriod = exports.closeFiscalPeriod = exports.getCurrentFiscalPeriod = exports.listFiscalPeriods = exports.getFiscalPeriod = exports.createFiscalPeriod = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const fiscalPeriod_service_1 = __importDefault(require("../services/fiscalPeriod.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const createFiscalPeriodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        startDate: zod_1.z.string().or(zod_1.z.date()),
        endDate: zod_1.z.string().or(zod_1.z.date()),
        notes: zod_1.z.string().optional(),
    }),
});
const updateFiscalPeriodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        startDate: zod_1.z.string().or(zod_1.z.date()).optional(),
        endDate: zod_1.z.string().or(zod_1.z.date()).optional(),
        notes: zod_1.z.string().optional(),
    }),
});
/**
 * Créer un exercice comptable
 */
const createFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const userId = req.user.id;
        const validated = createFiscalPeriodSchema.parse(req);
        const period = await fiscalPeriod_service_1.default.create(companyId, validated.body, userId);
        logger_1.default.info(`Fiscal period created via API`, { companyId, periodId: period.id });
        res.status(201).json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error creating fiscal period', { error: error.message, stack: error.stack });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid data',
                errors: error.errors,
            });
        }
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error creating fiscal period',
            code: error.code,
        });
    }
};
exports.createFiscalPeriod = createFiscalPeriod;
/**
 * Obtenir un exercice par ID
 */
const getFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const periodId = req.params.id;
        const period = await fiscalPeriod_service_1.default.getById(companyId, periodId);
        res.json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting fiscal period', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error getting fiscal period',
            code: error.code,
        });
    }
};
exports.getFiscalPeriod = getFiscalPeriod;
/**
 * Lister les exercices
 */
const listFiscalPeriods = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const filters = {};
        if (req.query.isClosed !== undefined) {
            filters.isClosed = req.query.isClosed === 'true';
        }
        if (req.query.isLocked !== undefined) {
            filters.isLocked = req.query.isLocked === 'true';
        }
        if (req.query.year) {
            filters.year = parseInt(req.query.year);
        }
        const periods = await fiscalPeriod_service_1.default.list(companyId, filters);
        res.json({
            success: true,
            data: periods,
        });
    }
    catch (error) {
        logger_1.default.error('Error listing fiscal periods', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error listing fiscal periods',
            code: error.code,
        });
    }
};
exports.listFiscalPeriods = listFiscalPeriods;
/**
 * Obtenir l'exercice en cours
 */
const getCurrentFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const period = await fiscalPeriod_service_1.default.getCurrent(companyId);
        res.json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting current fiscal period', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error getting current fiscal period',
            code: error.code,
        });
    }
};
exports.getCurrentFiscalPeriod = getCurrentFiscalPeriod;
/**
 * Clôturer un exercice
 */
const closeFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const userId = req.user.id;
        const periodId = req.params.id;
        const period = await fiscalPeriod_service_1.default.close(companyId, periodId, userId);
        logger_1.default.info(`Fiscal period closed via API`, { companyId, periodId, userId });
        res.json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error closing fiscal period', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error closing fiscal period',
            code: error.code,
        });
    }
};
exports.closeFiscalPeriod = closeFiscalPeriod;
/**
 * Rouvrir un exercice
 */
const reopenFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const userId = req.user.id;
        const periodId = req.params.id;
        const period = await fiscalPeriod_service_1.default.reopen(companyId, periodId, userId);
        logger_1.default.info(`Fiscal period reopened via API`, { companyId, periodId, userId });
        res.json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error reopening fiscal period', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error reopening fiscal period',
            code: error.code,
        });
    }
};
exports.reopenFiscalPeriod = reopenFiscalPeriod;
/**
 * Verrouiller une période
 */
const lockFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const userId = req.user.id;
        const periodId = req.params.id;
        const period = await fiscalPeriod_service_1.default.lock(companyId, periodId, userId);
        logger_1.default.info(`Fiscal period locked via API`, { companyId, periodId, userId });
        res.json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error locking fiscal period', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error locking fiscal period',
            code: error.code,
        });
    }
};
exports.lockFiscalPeriod = lockFiscalPeriod;
/**
 * Déverrouiller une période
 */
const unlockFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const userId = req.user.id;
        const periodId = req.params.id;
        const period = await fiscalPeriod_service_1.default.unlock(companyId, periodId, userId);
        logger_1.default.info(`Fiscal period unlocked via API`, { companyId, periodId, userId });
        res.json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error unlocking fiscal period', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error unlocking fiscal period',
            code: error.code,
        });
    }
};
exports.unlockFiscalPeriod = unlockFiscalPeriod;
/**
 * Mettre à jour un exercice
 */
const updateFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const periodId = req.params.id;
        const validated = updateFiscalPeriodSchema.parse(req);
        const period = await fiscalPeriod_service_1.default.update(companyId, periodId, validated.body);
        logger_1.default.info(`Fiscal period updated via API`, { companyId, periodId });
        res.json({
            success: true,
            data: period,
        });
    }
    catch (error) {
        logger_1.default.error('Error updating fiscal period', { error: error.message, stack: error.stack });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid data',
                errors: error.errors,
            });
        }
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error updating fiscal period',
            code: error.code,
        });
    }
};
exports.updateFiscalPeriod = updateFiscalPeriod;
/**
 * Supprimer un exercice
 */
const deleteFiscalPeriod = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const periodId = req.params.id;
        const result = await fiscalPeriod_service_1.default.delete(companyId, periodId);
        logger_1.default.info(`Fiscal period deleted via API`, { companyId, periodId });
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error deleting fiscal period', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error deleting fiscal period',
            code: error.code,
        });
    }
};
exports.deleteFiscalPeriod = deleteFiscalPeriod;
//# sourceMappingURL=fiscalPeriod.controller.js.map