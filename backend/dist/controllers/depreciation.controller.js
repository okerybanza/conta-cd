"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepreciation = exports.generateDepreciationTable = exports.generateDepreciationEntry = exports.calculateMonthlyDepreciation = exports.updateDepreciation = exports.listDepreciations = exports.getDepreciation = exports.createDepreciation = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const depreciation_service_1 = __importDefault(require("../services/depreciation.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const createDepreciationSchema = zod_1.z.object({
    assetAccountId: zod_1.z.string().uuid(),
    depreciationAccountId: zod_1.z.string().uuid(),
    assetName: zod_1.z.string().min(1).max(255),
    acquisitionDate: zod_1.z.string().or(zod_1.z.date()),
    acquisitionCost: zod_1.z.number().positive(),
    depreciationMethod: zod_1.z.enum(['linear', 'declining']),
    depreciationRate: zod_1.z.number().min(0).max(100).optional(),
    usefulLife: zod_1.z.number().int().positive(),
    notes: zod_1.z.string().optional(),
});
const updateDepreciationSchema = zod_1.z.object({
    assetName: zod_1.z.string().min(1).max(255).optional(),
    depreciationMethod: zod_1.z.enum(['linear', 'declining']).optional(),
    depreciationRate: zod_1.z.number().min(0).max(100).optional(),
    usefulLife: zod_1.z.number().int().positive().optional(),
    isActive: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional(),
});
/**
 * Créer un plan d'amortissement
 */
const createDepreciation = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const userId = req.user.id;
        const data = createDepreciationSchema.parse(req.body);
        const depreciation = await depreciation_service_1.default.create(companyId, data, userId);
        logger_1.default.info(`Depreciation created: ${depreciation.id}`, { companyId, userId });
        res.status(201).json({
            success: true,
            data: depreciation,
        });
    }
    catch (error) {
        logger_1.default.error('Error creating depreciation', { error: error.message, stack: error.stack });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid data',
                errors: error.errors,
            });
        }
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error creating depreciation',
            code: error.code,
        });
    }
};
exports.createDepreciation = createDepreciation;
/**
 * Obtenir un plan d'amortissement par ID
 */
const getDepreciation = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { id } = req.params;
        const depreciation = await depreciation_service_1.default.getById(companyId, id);
        res.json({
            success: true,
            data: depreciation,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting depreciation', { error: error.message });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error getting depreciation',
            code: error.code,
        });
    }
};
exports.getDepreciation = getDepreciation;
/**
 * Lister les plans d'amortissement
 */
const listDepreciations = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const isActive = req.query.isActive
            ? req.query.isActive === 'true'
            : undefined;
        const depreciations = await depreciation_service_1.default.list(companyId, { isActive });
        res.json({
            success: true,
            data: depreciations,
        });
    }
    catch (error) {
        logger_1.default.error('Error listing depreciations', { error: error.message });
        res.status(500).json({
            message: error.message || 'Error listing depreciations',
        });
    }
};
exports.listDepreciations = listDepreciations;
/**
 * Mettre à jour un plan d'amortissement
 */
const updateDepreciation = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { id } = req.params;
        const data = updateDepreciationSchema.parse(req.body);
        const depreciation = await depreciation_service_1.default.update(companyId, id, data);
        logger_1.default.info(`Depreciation updated: ${id}`, { companyId });
        res.json({
            success: true,
            data: depreciation,
        });
    }
    catch (error) {
        logger_1.default.error('Error updating depreciation', { error: error.message });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid data',
                errors: error.errors,
            });
        }
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error updating depreciation',
            code: error.code,
        });
    }
};
exports.updateDepreciation = updateDepreciation;
/**
 * Calculer l'amortissement mensuel
 */
const calculateMonthlyDepreciation = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { id } = req.params;
        const monthlyDepreciation = await depreciation_service_1.default.calculateMonthlyDepreciation(companyId, id);
        res.json({
            success: true,
            data: { monthlyDepreciation },
        });
    }
    catch (error) {
        logger_1.default.error('Error calculating monthly depreciation', { error: error.message });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error calculating monthly depreciation',
            code: error.code,
        });
    }
};
exports.calculateMonthlyDepreciation = calculateMonthlyDepreciation;
/**
 * Générer une écriture d'amortissement
 */
const generateDepreciationEntry = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const userId = req.user.id;
        const { id } = req.params;
        const { period } = req.body;
        if (!period || !/^\d{4}-\d{2}$/.test(period)) {
            return res.status(400).json({
                message: 'Invalid period format. Expected format: YYYY-MM (e.g., 2025-01)',
            });
        }
        const entry = await depreciation_service_1.default.generateDepreciationEntry(companyId, id, period, userId);
        logger_1.default.info(`Depreciation entry generated: ${entry.id}`, {
            companyId,
            depreciationId: id,
            period,
        });
        res.json({
            success: true,
            data: entry,
        });
    }
    catch (error) {
        logger_1.default.error('Error generating depreciation entry', { error: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error generating depreciation entry',
            code: error.code,
        });
    }
};
exports.generateDepreciationEntry = generateDepreciationEntry;
/**
 * Générer le tableau d'amortissement
 */
const generateDepreciationTable = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { id } = req.params;
        const table = await depreciation_service_1.default.generateDepreciationTable(companyId, id);
        res.json({
            success: true,
            data: table,
        });
    }
    catch (error) {
        logger_1.default.error('Error generating depreciation table', { error: error.message });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error generating depreciation table',
            code: error.code,
        });
    }
};
exports.generateDepreciationTable = generateDepreciationTable;
/**
 * Supprimer un plan d'amortissement
 */
const deleteDepreciation = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { id } = req.params;
        await depreciation_service_1.default.delete(companyId, id);
        logger_1.default.info(`Depreciation deleted: ${id}`, { companyId });
        res.json({
            success: true,
            message: 'Depreciation deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting depreciation', { error: error.message });
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error deleting depreciation',
            code: error.code,
        });
    }
};
exports.deleteDepreciation = deleteDepreciation;
//# sourceMappingURL=depreciation.controller.js.map