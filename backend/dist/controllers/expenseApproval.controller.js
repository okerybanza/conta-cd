"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseApprovalController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const expenseApproval_service_1 = __importDefault(require("../services/expenseApproval.service"));
const expenseApprovalRule_service_1 = __importDefault(require("../services/expenseApprovalRule.service"));
const zod_1 = require("zod");
const requestApprovalSchema = zod_1.z.object({
    comments: zod_1.z.string().optional(),
});
const approveSchema = zod_1.z.object({
    comments: zod_1.z.string().optional(),
});
const rejectSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Rejection reason is required'),
    comments: zod_1.z.string().optional(),
});
const createRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().optional(),
    amountThreshold: zod_1.z.number().positive().nullable().optional(),
    categoryId: zod_1.z.string().uuid().nullable().optional(),
    requireJustificatif: zod_1.z.boolean().optional(),
    approvers: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one approver is required'),
});
const updateRuleSchema = createRuleSchema.partial();
class ExpenseApprovalController {
    /**
     * POST /api/v1/expenses/:id/approval/request
     * Demander une approbation pour une dépense
     */
    async requestApproval(req, res, next) {
        try {
            const { id: expenseId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const data = requestApprovalSchema.parse(req.body);
            const approval = await expenseApproval_service_1.default.requestApproval(companyId, expenseId, req.user.id, data);
            res.status(201).json({
                success: true,
                data: approval,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/expenses/approvals/:id/approve
     * Approuver une dépense
     */
    async approve(req, res, next) {
        try {
            const { id: approvalId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const data = approveSchema.parse(req.body);
            const approval = await expenseApproval_service_1.default.approve(companyId, approvalId, req.user.id, data);
            res.json({
                success: true,
                data: approval,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/expenses/approvals/:id/reject
     * Rejeter une dépense
     */
    async reject(req, res, next) {
        try {
            const { id: approvalId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const data = rejectSchema.parse(req.body);
            const approval = await expenseApproval_service_1.default.reject(companyId, approvalId, req.user.id, data);
            res.json({
                success: true,
                data: approval,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/approvals/pending
     * Lister les approbations en attente pour l'utilisateur connecté
     */
    async listPending(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const approvals = await expenseApproval_service_1.default.listPendingForUser(companyId, req.user.id);
            res.json({
                success: true,
                data: approvals,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/approvals/:id
     * Obtenir une approbation par ID
     */
    async getById(req, res, next) {
        try {
            const { id: approvalId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const approval = await expenseApproval_service_1.default.getById(companyId, approvalId);
            res.json({
                success: true,
                data: approval,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/:id/approvals
     * Obtenir l'historique d'approbation d'une dépense
     */
    async getByExpense(req, res, next) {
        try {
            const { id: expenseId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const approvals = await expenseApproval_service_1.default.getByExpense(companyId, expenseId);
            res.json({
                success: true,
                data: approvals,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // ===== RÈGLES D'APPROBATION =====
    /**
     * POST /api/v1/expenses/approval-rules
     * Créer une règle d'approbation
     */
    async createRule(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const data = createRuleSchema.parse(req.body);
            const rule = await expenseApprovalRule_service_1.default.create(companyId, data);
            res.status(201).json({
                success: true,
                data: rule,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/approval-rules
     * Lister les règles d'approbation
     */
    async listRules(req, res, next) {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const includeDisabled = req.query.includeDisabled === 'true';
            const rules = await expenseApprovalRule_service_1.default.list(companyId, includeDisabled);
            res.json({
                success: true,
                data: rules,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/approval-rules/:id
     * Obtenir une règle par ID
     */
    async getRuleById(req, res, next) {
        try {
            const { id: ruleId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const rule = await expenseApprovalRule_service_1.default.getById(companyId, ruleId);
            res.json({
                success: true,
                data: rule,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/expenses/approval-rules/:id
     * Mettre à jour une règle
     */
    async updateRule(req, res, next) {
        try {
            const { id: ruleId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const data = updateRuleSchema.parse(req.body);
            const rule = await expenseApprovalRule_service_1.default.update(companyId, ruleId, data);
            res.json({
                success: true,
                data: rule,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/expenses/approval-rules/:id
     * Supprimer une règle
     */
    async deleteRule(req, res, next) {
        try {
            const { id: ruleId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await expenseApprovalRule_service_1.default.delete(companyId, ruleId);
            res.json({
                success: true,
                message: 'Approval rule deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExpenseApprovalController = ExpenseApprovalController;
exports.default = new ExpenseApprovalController();
//# sourceMappingURL=expenseApproval.controller.js.map