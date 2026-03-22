"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const account_service_1 = __importDefault(require("../services/account.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
const baseAccountSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
    category: zod_1.z.enum(['1', '2', '3', '4', '5', '6', '7', '8']).optional(),
    parentId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().optional(),
});
const createAccountSchema = zod_1.z.preprocess(preprocessData, baseAccountSchema);
const updateAccountSchema = zod_1.z.preprocess(preprocessData, baseAccountSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
}));
const accountFiltersSchema = zod_1.z.object({
    type: zod_1.z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),
    category: zod_1.z.enum(['1', '2', '3', '4', '5', '6', '7', '8']).optional(),
    parentId: zod_1.z.string().uuid().nullable().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(),
});
class AccountController {
    /**
     * POST /api/v1/accounts
     * Créer un compte comptable
     */
    async create(req, res, next) {
        try {
            const data = createAccountSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const account = await account_service_1.default.create(companyId, data);
            res.status(201).json({
                success: true,
                data: account,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accounts
     * Lister les comptes
     */
    async list(req, res, next) {
        try {
            const filters = accountFiltersSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const accounts = await account_service_1.default.list(companyId, filters);
            res.json({
                success: true,
                data: accounts,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accounts/tree
     * Obtenir l'arborescence des comptes
     */
    async getTree(req, res, next) {
        try {
            const filters = accountFiltersSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const tree = await account_service_1.default.getTree(companyId, filters);
            res.json({
                success: true,
                data: tree,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accounts/:id
     * Obtenir un compte par ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const account = await account_service_1.default.getById(companyId, id);
            res.json({
                success: true,
                data: account,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accounts/code/:code
     * Obtenir un compte par code
     */
    async getByCode(req, res, next) {
        try {
            const { code } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const account = await account_service_1.default.getByCode(companyId, code);
            res.json({
                success: true,
                data: account,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/accounts/:id
     * Mettre à jour un compte
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = updateAccountSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const account = await account_service_1.default.update(companyId, id, data);
            res.json({
                success: true,
                data: account,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/accounts/:id
     * Supprimer un compte
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await account_service_1.default.delete(companyId, id);
            res.json({
                success: true,
                message: 'Account deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accounts/:id/balance
     * Obtenir le solde total (compte + enfants)
     */
    async getTotalBalance(req, res, next) {
        try {
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const balance = await account_service_1.default.getTotalBalance(companyId, id);
            res.json({
                success: true,
                data: { balance },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/accounts/by-type/:type
     * Obtenir les comptes par type
     */
    async findByType(req, res, next) {
        try {
            const { type } = req.params;
            const { category } = req.query;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const accounts = await account_service_1.default.findByTypeAndCategory(companyId, type, category);
            res.json({
                success: true,
                data: accounts,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AccountController = AccountController;
exports.default = new AccountController();
//# sourceMappingURL=account.controller.js.map