"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgedBalance = exports.getTrialBalance = exports.getGeneralLedger = exports.getPurchaseJournal = exports.getSalesJournal = void 0;
const accountingReports_service_1 = __importDefault(require("../services/accountingReports.service"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middleware/auth.middleware");
const salesJournalSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        customerId: zod_1.z.string().uuid().optional(),
    }),
});
const purchaseJournalSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        supplierId: zod_1.z.string().uuid().optional(),
    }),
});
const generalLedgerSchema = zod_1.z.object({
    params: zod_1.z.object({
        accountId: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
const trialBalanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        accountCode: zod_1.z.string().optional(),
    }),
});
const agedBalanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z.enum(['receivables', 'payables']),
        asOfDate: zod_1.z.string().optional(),
    }),
});
const getSalesJournal = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }
        const { query } = salesJournalSchema.parse({ query: req.query });
        const filters = {
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            customerId: query.customerId,
        };
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const report = await accountingReports_service_1.default.generateSalesJournal(companyId, filters);
        res.status(200).json({ success: true, data: report });
    }
    catch (error) {
        next(error);
    }
};
exports.getSalesJournal = getSalesJournal;
const getPurchaseJournal = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }
        const { query } = purchaseJournalSchema.parse({ query: req.query });
        const filters = {
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            supplierId: query.supplierId,
        };
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const report = await accountingReports_service_1.default.generatePurchaseJournal(companyId, filters);
        res.status(200).json({ success: true, data: report });
    }
    catch (error) {
        next(error);
    }
};
exports.getPurchaseJournal = getPurchaseJournal;
const getGeneralLedger = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }
        const { params, query } = generalLedgerSchema.parse({
            params: req.params,
            query: req.query,
        });
        const filters = {
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        };
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const report = await accountingReports_service_1.default.generateGeneralLedger(companyId, params.accountId, filters);
        res.status(200).json({ success: true, data: report });
    }
    catch (error) {
        next(error);
    }
};
exports.getGeneralLedger = getGeneralLedger;
const getTrialBalance = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }
        const { query } = trialBalanceSchema.parse({ query: req.query });
        const filters = {
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            accountCode: query.accountCode,
        };
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const report = await accountingReports_service_1.default.generateTrialBalance(companyId, filters);
        res.status(200).json({ success: true, data: report });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrialBalance = getTrialBalance;
const getAgedBalance = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }
        const { query } = agedBalanceSchema.parse({ query: req.query });
        const type = query.type;
        const asOfDate = query.asOfDate ? new Date(query.asOfDate) : undefined;
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        const report = await accountingReports_service_1.default.generateAgedBalance(companyId, type, asOfDate);
        res.status(200).json({ success: true, data: report });
    }
    catch (error) {
        next(error);
    }
};
exports.getAgedBalance = getAgedBalance;
//# sourceMappingURL=accountingReports.controller.js.map