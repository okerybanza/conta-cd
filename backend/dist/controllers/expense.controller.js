"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseController = void 0;
const expense_service_1 = __importDefault(require("../services/expense.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
// Fonction helper pour préprocesser les données
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
// Schéma de base pour les dépenses
const baseExpenseSchema = zod_1.z.object({
    expenseDate: zod_1.z.string().or(zod_1.z.date()),
    supplierId: zod_1.z.string().uuid().optional(),
    supplierName: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    accountId: zod_1.z.string().uuid().optional(),
    taxRate: zod_1.z.number().min(0).max(100).optional(),
    paymentDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    status: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    currency: zod_1.z.string().optional(),
    reason: zod_1.z.string().max(500).optional(), // ACCT-001: Why the expense was recorded/modified (max 500 chars)
    mobileMoneyProvider: zod_1.z.string().optional(),
    mobileMoneyNumber: zod_1.z.string().optional(),
    transactionReference: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    checkNumber: zod_1.z.string().optional(),
    cardLastFour: zod_1.z.string().optional(),
}).passthrough();
// Schémas de validation
const createExpenseSchema = zod_1.z.preprocess(preprocessData, baseExpenseSchema.extend({
    amountHt: zod_1.z.number().positive(), // Requis pour la création
    amountTtc: zod_1.z.number().positive(), // Requis pour la création
    paymentMethod: zod_1.z.string(), // Requis pour la création
}));
const updateExpenseSchema = zod_1.z.preprocess(preprocessData, baseExpenseSchema.extend({
    amountHt: zod_1.z.number().positive().optional(),
    amountTtc: zod_1.z.number().positive().optional(),
    paymentMethod: zod_1.z.string().optional(),
}));
const expenseFiltersSchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    supplierId: zod_1.z.string().uuid().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
class ExpenseController {
    /**
     * POST /api/v1/expenses
     * Créer une dépense
     */
    async create(req, res, next) {
        try {
            const data = createExpenseSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const expense = await expense_service_1.default.create(companyId, req.user.id, data);
            res.status(201).json({
                success: true,
                data: expense,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses
     * Lister les dépenses
     */
    async list(req, res, next) {
        try {
            const filters = expenseFiltersSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const result = await expense_service_1.default.list(companyId, filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/:id
     * Obtenir une dépense par ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const expense = await expense_service_1.default.getById(companyId, id);
            res.json({
                success: true,
                data: expense,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/expenses/:id
     * Mettre à jour une dépense
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = updateExpenseSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const expense = await expense_service_1.default.update(companyId, id, req.user.id, data);
            res.json({
                success: true,
                data: expense,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/expenses/:id
     * Supprimer une dépense
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await expense_service_1.default.delete(companyId, id);
            res.json({
                success: true,
                message: 'Expense deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/expenses/:id/duplicate
     * Dupliquer une dépense
     */
    async duplicate(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const expense = await expense_service_1.default.duplicate(companyId, id, req.user.id);
            res.status(201).json({
                success: true,
                data: expense,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExpenseController = ExpenseController;
exports.default = new ExpenseController();
//# sourceMappingURL=expense.controller.js.map