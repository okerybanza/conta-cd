"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualReconcile = exports.listBankStatements = exports.getBankStatement = exports.reconcileStatement = exports.parseCSV = exports.importBankStatement = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const bankReconciliation_service_1 = __importDefault(require("../services/bankReconciliation.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const importStatementSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid(),
    statementNumber: zod_1.z.string(),
    startDate: zod_1.z.string().transform((str) => new Date(str)),
    endDate: zod_1.z.string().transform((str) => new Date(str)),
    openingBalance: zod_1.z.number(),
    closingBalance: zod_1.z.number(),
    transactions: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string().transform((str) => new Date(str)),
        valueDate: zod_1.z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
        description: zod_1.z.string(),
        reference: zod_1.z.string().optional(),
        amount: zod_1.z.number(),
        balance: zod_1.z.number().optional(),
    })),
});
/**
 * Importer un relevé bancaire
 */
const importBankStatement = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les données
        const data = importStatementSchema.parse(req.body);
        const statement = await bankReconciliation_service_1.default.importBankStatement(companyId, data.accountId, {
            accountId: data.accountId,
            statementNumber: data.statementNumber,
            startDate: data.startDate,
            endDate: data.endDate,
            openingBalance: data.openingBalance,
            closingBalance: data.closingBalance,
            transactions: data.transactions,
        });
        logger_1.default.info(`Bank statement imported`, {
            companyId,
            statementId: statement.id,
        });
        res.json({
            success: true,
            data: statement,
        });
    }
    catch (error) {
        logger_1.default.error('Error importing bank statement', {
            error: error.message,
            stack: error.stack,
        });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data',
                errors: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error importing bank statement',
        });
    }
};
exports.importBankStatement = importBankStatement;
/**
 * Parser un fichier CSV
 */
const parseCSV = async (req, res) => {
    try {
        const csvContent = req.body.csvContent || req.body.content;
        if (!csvContent || typeof csvContent !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'CSV content is required',
            });
        }
        const transactions = bankReconciliation_service_1.default.parseCSV(csvContent);
        res.json({
            success: true,
            data: {
                transactions,
                count: transactions.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error parsing CSV', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error parsing CSV',
        });
    }
};
exports.parseCSV = parseCSV;
/**
 * Rapprocher un relevé bancaire
 */
const reconcileStatement = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { statementId } = req.params;
        // Vérifier que le relevé appartient à l'entreprise
        const statement = await bankReconciliation_service_1.default.getBankStatement(statementId, companyId);
        if (!statement) {
            return res.status(404).json({
                success: false,
                message: 'Bank statement not found',
            });
        }
        await bankReconciliation_service_1.default.reconcileStatement(statementId);
        const updatedStatement = await bankReconciliation_service_1.default.getBankStatement(statementId, companyId);
        res.json({
            success: true,
            data: updatedStatement,
        });
    }
    catch (error) {
        logger_1.default.error('Error reconciling bank statement', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error reconciling bank statement',
        });
    }
};
exports.reconcileStatement = reconcileStatement;
/**
 * Obtenir un relevé bancaire
 */
const getBankStatement = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const { statementId } = req.params;
        const statement = await bankReconciliation_service_1.default.getBankStatement(statementId, companyId);
        if (!statement) {
            return res.status(404).json({
                success: false,
                message: 'Bank statement not found',
            });
        }
        res.json({
            success: true,
            data: statement,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting bank statement', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting bank statement',
        });
    }
};
exports.getBankStatement = getBankStatement;
/**
 * Lister les relevés bancaires
 */
const listBankStatements = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const accountId = req.query.accountId;
        const statements = await bankReconciliation_service_1.default.listBankStatements(companyId, accountId);
        res.json({
            success: true,
            data: statements,
        });
    }
    catch (error) {
        logger_1.default.error('Error listing bank statements', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error listing bank statements',
        });
    }
};
exports.listBankStatements = listBankStatements;
/**
 * Rapprocher manuellement une transaction
 */
const manualReconcile = async (req, res) => {
    try {
        const { bankTransactionId } = req.params;
        const { accountingTransactionId, accountingTransactionType } = req.body;
        if (!accountingTransactionId || !accountingTransactionType) {
            return res.status(400).json({
                success: false,
                message: 'accountingTransactionId and accountingTransactionType are required',
            });
        }
        await bankReconciliation_service_1.default.manualReconcile(bankTransactionId, accountingTransactionId, accountingTransactionType);
        res.json({
            success: true,
            message: 'Transaction reconciled manually',
        });
    }
    catch (error) {
        logger_1.default.error('Error manual reconciling', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error manual reconciling',
        });
    }
};
exports.manualReconcile = manualReconcile;
//# sourceMappingURL=bankReconciliation.controller.js.map