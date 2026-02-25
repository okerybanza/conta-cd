"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseCategoryService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class ExpenseCategoryService {
    /**
     * Créer une catégorie de dépense
     */
    async create(companyId, data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new error_middleware_1.CustomError('Category name is required', 400, 'VALIDATION_ERROR');
        }
        // Vérifier nom unique
        const existing = await database_1.default.expenseCategory.findFirst({
            where: {
                companyId,
                name: data.name.trim(),
            },
        });
        if (existing) {
            throw new error_middleware_1.CustomError('Category name already exists', 409, 'CATEGORY_EXISTS');
        }
        // Vérifier compte comptable si fourni
        if (data.accountId) {
            const account = await database_1.default.accounts.findFirst({
                where: {
                    id: data.accountId,
                    companyId,
                },
            });
            if (!account) {
                throw new error_middleware_1.CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
            }
            if (account.type !== 'expense') {
                throw new error_middleware_1.CustomError('Account must be of type expense', 400, 'INVALID_ACCOUNT_TYPE');
            }
        }
        const category = await database_1.default.expenseCategory.create({
            data: {
                companyId,
                name: data.name.trim(),
                description: data.description,
                accountId: data.accountId,
                isActive: true,
            },
        });
        logger_1.default.info(`Expense category created: ${category.id}`, {
            companyId,
            categoryId: category.id,
        });
        return category;
    }
    /**
     * Obtenir une catégorie par ID
     */
    async getById(companyId, categoryId) {
        const category = await database_1.default.expenseCategory.findFirst({
            where: {
                id: categoryId,
                companyId,
            },
        });
        if (!category) {
            throw new error_middleware_1.CustomError('Expense category not found', 404, 'CATEGORY_NOT_FOUND');
        }
        return category;
    }
    /**
     * Lister les catégories
     */
    async list(companyId, includeInactive = false) {
        const where = {
            companyId,
        };
        if (!includeInactive) {
            where.isActive = true;
        }
        const categories = await database_1.default.expenseCategory.findMany({
            where,
            orderBy: {
                name: 'asc',
            },
        });
        return categories;
    }
    /**
     * Mettre à jour une catégorie
     */
    async update(companyId, categoryId, data) {
        await this.getById(companyId, categoryId);
        // Vérifier nom unique si modifié
        if (data.name) {
            const existing = await database_1.default.expenseCategory.findFirst({
                where: {
                    companyId,
                    name: data.name.trim(),
                    id: { not: categoryId },
                },
            });
            if (existing) {
                throw new error_middleware_1.CustomError('Category name already exists', 409, 'CATEGORY_EXISTS');
            }
        }
        const updated = await database_1.default.expenseCategory.update({
            where: { id: categoryId },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.accountId !== undefined && { accountId: data.accountId }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
        logger_1.default.info(`Expense category updated: ${categoryId}`, { companyId, categoryId });
        return updated;
    }
    /**
     * Supprimer une catégorie (soft delete via isActive)
     */
    async delete(companyId, categoryId) {
        await this.getById(companyId, categoryId);
        // Vérifier qu'il n'y a pas de dépenses liées
        const expenseCount = await database_1.default.expense.count({
            where: {
                categoryId,
                companyId,
                deletedAt: null,
            },
        });
        if (expenseCount > 0) {
            throw new error_middleware_1.CustomError('Cannot delete category with existing expenses', 400, 'CATEGORY_HAS_EXPENSES');
        }
        await database_1.default.expenseCategory.delete({
            where: { id: categoryId },
        });
        logger_1.default.info(`Expense category deleted: ${categoryId}`, { companyId, categoryId });
        return { success: true };
    }
}
exports.ExpenseCategoryService = ExpenseCategoryService;
exports.default = new ExpenseCategoryService();
//# sourceMappingURL=expenseCategory.service.js.map