"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVATDeclaration = exports.getVATToPay = exports.getVATDeductible = exports.getVATCollected = exports.getVATReport = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const tva_service_1 = __importDefault(require("../services/tva.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const vatReportFiltersSchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    period: zod_1.z.enum(['month', 'quarter', 'year']).optional(),
});
/**
 * Obtenir le rapport TVA
 */
const getVATReport = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les filtres
        const filters = vatReportFiltersSchema.parse(req.query);
        // Convertir les dates string en Date si présentes
        const processedFilters = {
            ...filters,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        const report = await tva_service_1.default.generateVATReport(companyId, processedFilters);
        logger_1.default.info(`VAT report generated for company ${companyId}`, {
            companyId,
            period: report.period,
            vatToPay: report.summary.vatToPay,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logger_1.default.error('Error generating VAT report', { error: error.message, stack: error.stack });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid filters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            message: error.message || 'Error generating VAT report',
        });
    }
};
exports.getVATReport = getVATReport;
/**
 * Calculer la TVA collectée
 */
const getVATCollected = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const filters = vatReportFiltersSchema.parse(req.query);
        const processedFilters = {
            ...filters,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        const amount = await tva_service_1.default.calculateVATCollected(companyId, processedFilters);
        res.json({
            success: true,
            data: { amount },
        });
    }
    catch (error) {
        logger_1.default.error('Error calculating VAT collected', { error: error.message });
        res.status(500).json({
            message: error.message || 'Error calculating VAT collected',
        });
    }
};
exports.getVATCollected = getVATCollected;
/**
 * Calculer la TVA déductible
 */
const getVATDeductible = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const filters = vatReportFiltersSchema.parse(req.query);
        const processedFilters = {
            ...filters,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        const amount = await tva_service_1.default.calculateVATDeductible(companyId, processedFilters);
        res.json({
            success: true,
            data: { amount },
        });
    }
    catch (error) {
        logger_1.default.error('Error calculating VAT deductible', { error: error.message });
        res.status(500).json({
            message: error.message || 'Error calculating VAT deductible',
        });
    }
};
exports.getVATDeductible = getVATDeductible;
/**
 * Calculer la TVA à payer
 */
const getVATToPay = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const filters = vatReportFiltersSchema.parse(req.query);
        const processedFilters = {
            ...filters,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        const amount = await tva_service_1.default.calculateVATToPay(companyId, processedFilters);
        res.json({
            success: true,
            data: { amount },
        });
    }
    catch (error) {
        logger_1.default.error('Error calculating VAT to pay', { error: error.message });
        res.status(500).json({
            message: error.message || 'Error calculating VAT to pay',
        });
    }
};
exports.getVATToPay = getVATToPay;
/**
 * Générer une déclaration TVA
 */
const generateVATDeclaration = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const period = req.query.period;
        if (!period || !/^\d{4}-\d{2}$/.test(period)) {
            return res.status(400).json({
                message: 'Invalid period format. Expected format: YYYY-MM (e.g., 2025-01)',
            });
        }
        const declaration = await tva_service_1.default.generateVATDeclaration(companyId, period);
        logger_1.default.info(`VAT declaration generated for company ${companyId}`, {
            companyId,
            period,
            vatToPay: declaration.vatToPay,
        });
        res.json({
            success: true,
            data: declaration,
        });
    }
    catch (error) {
        logger_1.default.error('Error generating VAT declaration', { error: error.message, stack: error.stack });
        res.status(500).json({
            message: error.message || 'Error generating VAT declaration',
        });
    }
};
exports.generateVATDeclaration = generateVATDeclaration;
//# sourceMappingURL=tva.controller.js.map