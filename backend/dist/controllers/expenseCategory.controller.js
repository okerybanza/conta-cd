"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseCategoryController = void 0;
const expenseCategory_service_1 = __importDefault(require("../services/expenseCategory.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    accountId: zod_1.z.string().uuid().optional(),
});
const updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
class ExpenseCategoryController {
    /**
     * POST /api/v1/expense-categories
     * Créer une catégorie
     */
    async create(req, res, next) {
        try {
            const data = createCategorySchema.parse(req.body);
            const category = await expenseCategory_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), data);
            res.status(201).json({
                success: true,
                data: category,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expense-categories
     * Lister les catégories
     */
    async list(req, res, next) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const categories = await expenseCategory_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), includeInactive);
            res.json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expense-categories/:id
     * Obtenir une catégorie par ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await expenseCategory_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                data: category,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/expense-categories/:id
     * Mettre à jour une catégorie
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = updateCategorySchema.parse(req.body);
            const category = await expenseCategory_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data);
            res.json({
                success: true,
                data: category,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/expense-categories/:id
     * Supprimer une catégorie
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await expenseCategory_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                message: 'Category deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExpenseCategoryController = ExpenseCategoryController;
exports.default = new ExpenseCategoryController();
//# sourceMappingURL=expenseCategory.controller.js.map