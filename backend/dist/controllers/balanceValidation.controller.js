"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateAllBalances = exports.recalculateAccountBalance = exports.validateAllBalances = exports.validateAccountBalance = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const balanceValidation_service_1 = __importDefault(require("../services/balanceValidation.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Valider le solde d'un compte spécifique
 */
const validateAccountBalance = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { accountId } = req.params;
        const autoCorrect = req.query.autoCorrect === 'true';
        const result = await balanceValidation_service_1.default.validateAccountBalance(companyId, accountId, autoCorrect);
        logger_1.default.info(`Account balance validated: ${accountId}`, {
            companyId,
            accountId,
            isSynchronized: result.isSynchronized,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Error validating account balance', {
            error: error.message,
            stack: error.stack,
        });
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error validating account balance',
        });
    }
};
exports.validateAccountBalance = validateAccountBalance;
/**
 * Valider tous les soldes d'une entreprise
 */
const validateAllBalances = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const autoCorrect = req.query.autoCorrect === 'true';
        const report = await balanceValidation_service_1.default.validateAllBalances(companyId, autoCorrect);
        logger_1.default.info(`All balances validated for company ${companyId}`, {
            companyId,
            synchronized: report.synchronized,
            desynchronized: report.desynchronized,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logger_1.default.error('Error validating all balances', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error validating all balances',
        });
    }
};
exports.validateAllBalances = validateAllBalances;
/**
 * Recalculer le solde d'un compte spécifique
 */
const recalculateAccountBalance = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { accountId } = req.params;
        const result = await balanceValidation_service_1.default.recalculateAccountBalance(companyId, accountId);
        logger_1.default.info(`Account balance recalculated: ${accountId}`, {
            companyId,
            accountId,
            difference: result.difference,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Error recalculating account balance', {
            error: error.message,
            stack: error.stack,
        });
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error recalculating account balance',
        });
    }
};
exports.recalculateAccountBalance = recalculateAccountBalance;
/**
 * Recalculer tous les soldes d'une entreprise
 */
const recalculateAllBalances = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const result = await balanceValidation_service_1.default.recalculateAllBalances(companyId);
        logger_1.default.info(`All balances recalculated for company ${companyId}`, {
            companyId,
            recalculated: result.recalculated,
            totalAdjustment: result.totalAdjustment,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Error recalculating all balances', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error recalculating all balances',
        });
    }
};
exports.recalculateAllBalances = recalculateAllBalances;
//# sourceMappingURL=balanceValidation.controller.js.map