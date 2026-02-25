"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReconciliationReport = exports.reconcileJournalEntries = exports.reconcileInvoices = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const reconciliation_service_1 = __importDefault(require("../services/reconciliation.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const reconciliationPeriodSchema = zod_1.z.object({
    startDate: zod_1.z.string().transform((str) => new Date(str)),
    endDate: zod_1.z.string().transform((str) => new Date(str)),
});
/**
 * Réconcilier les factures avec leurs paiements
 */
const reconcileInvoices = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider la période
        const period = reconciliationPeriodSchema.parse(req.query);
        const results = await reconciliation_service_1.default.reconcileInvoicesPayments(companyId, period);
        logger_1.default.info(`Invoice reconciliation requested for company ${companyId}`, {
            companyId,
            period,
            totalInvoices: results.length,
        });
        res.json({
            success: true,
            data: results,
            summary: {
                total: results.length,
                reconciled: results.filter((r) => r.isReconciled).length,
                unreconciled: results.filter((r) => !r.isReconciled).length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error reconciling invoices', {
            error: error.message,
            stack: error.stack,
        });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid period parameters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error reconciling invoices',
        });
    }
};
exports.reconcileInvoices = reconcileInvoices;
/**
 * Réconcilier les transactions avec leurs écritures comptables
 */
const reconcileJournalEntries = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider la période
        const period = reconciliationPeriodSchema.parse(req.query);
        const results = await reconciliation_service_1.default.reconcileJournalEntries(companyId, period);
        logger_1.default.info(`Journal entry reconciliation requested for company ${companyId}`, {
            companyId,
            period,
            totalTransactions: results.length,
        });
        res.json({
            success: true,
            data: results,
            summary: {
                total: results.length,
                reconciled: results.filter((r) => r.isReconciled).length,
                unreconciled: results.filter((r) => !r.isReconciled).length,
                missingEntries: results.filter((r) => !r.journalEntryId).length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error reconciling journal entries', {
            error: error.message,
            stack: error.stack,
        });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid period parameters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error reconciling journal entries',
        });
    }
};
exports.reconcileJournalEntries = reconcileJournalEntries;
/**
 * Générer un rapport de réconciliation complet
 */
const generateReconciliationReport = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider la période
        const period = reconciliationPeriodSchema.parse(req.query);
        const report = await reconciliation_service_1.default.generateReconciliationReport(companyId, period);
        logger_1.default.info(`Reconciliation report generated for company ${companyId}`, {
            companyId,
            period,
            hasIssues: report.summary.hasIssues,
            totalIssues: report.summary.totalIssues,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logger_1.default.error('Error generating reconciliation report', {
            error: error.message,
            stack: error.stack,
        });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid period parameters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating reconciliation report',
        });
    }
};
exports.generateReconciliationReport = generateReconciliationReport;
//# sourceMappingURL=reconciliation.controller.js.map