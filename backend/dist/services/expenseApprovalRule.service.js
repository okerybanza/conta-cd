"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseApprovalRuleService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const library_1 = require("@prisma/client/runtime/library");
class ExpenseApprovalRuleService {
    /**
     * Créer une règle d'approbation
     */
    async create(companyId, data) {
        // Vérifier que les approbateurs existent et appartiennent à l'entreprise
        if (data.approvers && data.approvers.length > 0) {
            const users = await database_1.default.users.findMany({
                where: {
                    id: { in: data.approvers },
                    companyId,
                },
            });
            if (users.length !== data.approvers.length) {
                throw new error_middleware_1.CustomError('One or more approvers do not exist or do not belong to this company', 400, 'INVALID_APPROVERS');
            }
        }
        // Vérifier la catégorie si fournie
        if (data.categoryId) {
            const category = await database_1.default.expenseCategory.findFirst({
                where: {
                    id: data.categoryId,
                    companyId,
                },
            });
            if (!category) {
                throw new error_middleware_1.CustomError('Expense category not found', 404, 'CATEGORY_NOT_FOUND');
            }
        }
        const rule = await database_1.default.expenseApprovalRule.create({
            data: {
                companyId,
                name: data.name,
                description: data.description,
                enabled: data.enabled !== false,
                amountThreshold: data.amountThreshold ? new library_1.Decimal(data.amountThreshold) : null,
                categoryId: data.categoryId || null,
                requireJustificatif: data.requireJustificatif || false,
                approvers: data.approvers || [],
            },
        });
        return rule;
    }
    /**
     * Lister les règles d'approbation d'une entreprise
     */
    async list(companyId, includeDisabled = false) {
        const where = { companyId };
        if (!includeDisabled) {
            where.enabled = true;
        }
        const rules = await database_1.default.expenseApprovalRule.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return rules;
    }
    /**
     * Obtenir une règle par ID
     */
    async getById(companyId, ruleId) {
        const rule = await database_1.default.expenseApprovalRule.findFirst({
            where: {
                id: ruleId,
                companyId,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!rule) {
            throw new error_middleware_1.CustomError('Approval rule not found', 404, 'RULE_NOT_FOUND');
        }
        return rule;
    }
    /**
     * Mettre à jour une règle
     */
    async update(companyId, ruleId, data) {
        const rule = await this.getById(companyId, ruleId);
        // Vérifier les approbateurs si fournis
        if (data.approvers && data.approvers.length > 0) {
            const users = await database_1.default.users.findMany({
                where: {
                    id: { in: data.approvers },
                    companyId,
                },
            });
            if (users.length !== data.approvers.length) {
                throw new error_middleware_1.CustomError('One or more approvers do not exist or do not belong to this company', 400, 'INVALID_APPROVERS');
            }
        }
        // Vérifier la catégorie si fournie
        if (data.categoryId) {
            const category = await database_1.default.expenseCategory.findFirst({
                where: {
                    id: data.categoryId,
                    companyId,
                },
            });
            if (!category) {
                throw new error_middleware_1.CustomError('Expense category not found', 404, 'CATEGORY_NOT_FOUND');
            }
        }
        const updated = await database_1.default.expenseApprovalRule.update({
            where: { id: ruleId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.enabled !== undefined && { enabled: data.enabled }),
                ...(data.amountThreshold !== undefined && {
                    amountThreshold: data.amountThreshold ? new library_1.Decimal(data.amountThreshold) : null,
                }),
                ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
                ...(data.requireJustificatif !== undefined && { requireJustificatif: data.requireJustificatif }),
                ...(data.approvers && { approvers: data.approvers }),
                updatedAt: new Date(),
            },
        });
        return updated;
    }
    /**
     * Supprimer une règle
     */
    async delete(companyId, ruleId) {
        await this.getById(companyId, ruleId);
        await database_1.default.expenseApprovalRule.delete({
            where: { id: ruleId },
        });
    }
    /**
     * Trouver les règles applicables pour une dépense
     */
    async findApplicableRules(companyId, amountTtc, categoryId) {
        const rules = await database_1.default.expenseApprovalRule.findMany({
            where: {
                companyId,
                enabled: true,
                AND: [
                    {
                        OR: [
                            { categoryId: null }, // Règle pour toutes catégories
                            { categoryId: categoryId || null }, // Règle pour cette catégorie
                        ],
                    },
                    {
                        OR: [
                            { amountThreshold: null }, // Pas de seuil
                            { amountThreshold: { lte: new library_1.Decimal(amountTtc) } }, // Seuil atteint
                        ],
                    },
                ],
            },
            orderBy: [
                { amountThreshold: 'desc' }, // Priorité aux seuils les plus élevés
                { createdAt: 'desc' },
            ],
        });
        return rules;
    }
    /**
     * Vérifier si une dépense nécessite une approbation
     */
    async requiresApproval(companyId, amountTtc, categoryId, hasJustificatif) {
        const applicableRules = await this.findApplicableRules(companyId, amountTtc, categoryId);
        if (applicableRules.length === 0) {
            return { requires: false };
        }
        // Prendre la première règle applicable (la plus prioritaire)
        const rule = applicableRules[0];
        // Vérifier si un justificatif est requis
        if (rule.requireJustificatif && !hasJustificatif) {
            return { requires: true, ruleId: rule.id, approvers: rule.approvers };
        }
        // Vérifier qu'il y a des approbateurs
        const approvers = rule.approvers || [];
        if (approvers.length === 0) {
            return { requires: false };
        }
        return { requires: true, ruleId: rule.id, approvers };
    }
}
exports.ExpenseApprovalRuleService = ExpenseApprovalRuleService;
exports.default = new ExpenseApprovalRuleService();
//# sourceMappingURL=expenseApprovalRule.service.js.map