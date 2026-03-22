"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccountingEquation = exports.getCashFlowStatement = exports.getBalanceSheet = exports.getIncomeStatement = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const financialStatements_service_1 = __importDefault(require("../services/financialStatements.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const financialStatementFiltersSchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    period: zod_1.z.enum(['month', 'quarter', 'year']).optional(),
    compareWithPrevious: zod_1.z.boolean().optional(),
});
/**
 * Obtenir le Compte de Résultat
 */
const getIncomeStatement = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les filtres
        const filters = financialStatementFiltersSchema.parse(req.query);
        // Convertir les dates string en Date si présentes
        const processedFilters = {
            ...filters,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        const incomeStatement = await financialStatements_service_1.default.generateIncomeStatement(companyId, processedFilters);
        logger_1.default.info(`Income statement generated for company ${companyId}`, {
            companyId,
            period: incomeStatement.period,
        });
        res.json(incomeStatement);
    }
    catch (error) {
        logger_1.default.error('Error generating income statement', { error: error.message, stack: error.stack });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid filters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            message: error.message || 'Error generating income statement',
        });
    }
};
exports.getIncomeStatement = getIncomeStatement;
/**
 * Obtenir le Bilan
 */
const getBalanceSheet = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les filtres
        const filters = financialStatementFiltersSchema.parse(req.query);
        // Convertir les dates string en Date si présentes
        const processedFilters = {
            ...filters,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        const balanceSheet = await financialStatements_service_1.default.generateBalanceSheet(companyId, processedFilters);
        logger_1.default.info(`Balance sheet generated for company ${companyId}`, {
            companyId,
            asOfDate: balanceSheet.period.asOfDate,
            isBalanced: balanceSheet.equation.isBalanced,
        });
        res.json(balanceSheet);
    }
    catch (error) {
        logger_1.default.error('Error generating balance sheet', { error: error.message, stack: error.stack });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid filters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            message: error.message || 'Error generating balance sheet',
        });
    }
};
exports.getBalanceSheet = getBalanceSheet;
/**
 * Obtenir le Tableau de Flux de Trésorerie
 */
const getCashFlowStatement = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les filtres
        const filters = financialStatementFiltersSchema.parse(req.query);
        // Convertir les dates string en Date si présentes
        const processedFilters = {
            ...filters,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        };
        const cashFlowStatement = await financialStatements_service_1.default.generateCashFlowStatement(companyId, processedFilters);
        logger_1.default.info(`Cash flow statement generated for company ${companyId}`, {
            companyId,
            period: cashFlowStatement.period,
        });
        res.json(cashFlowStatement);
    }
    catch (error) {
        logger_1.default.error('Error generating cash flow statement', { error: error.message, stack: error.stack });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Invalid filters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            message: error.message || 'Error generating cash flow statement',
        });
    }
};
exports.getCashFlowStatement = getCashFlowStatement;
/**
 * Valider l'équation comptable
 */
const validateAccountingEquation = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const asOfDate = req.query.asOfDate
            ? new Date(req.query.asOfDate)
            : new Date();
        const validation = await financialStatements_service_1.default.validateAccountingEquation(companyId, asOfDate);
        logger_1.default.info(`Accounting equation validated for company ${companyId}`, {
            companyId,
            isValid: validation.isValid,
        });
        res.json(validation);
    }
    catch (error) {
        logger_1.default.error('Error validating accounting equation', { error: error.message, stack: error.stack });
        res.status(500).json({
            message: error.message || 'Error validating accounting equation',
        });
    }
};
exports.validateAccountingEquation = validateAccountingEquation;
//# sourceMappingURL=financialStatements.controller.js.map