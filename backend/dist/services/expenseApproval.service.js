"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseApprovalService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const expenseApprovalRule_service_1 = __importDefault(require("./expenseApprovalRule.service"));
const expenseAttachment_service_1 = __importDefault(require("./expenseAttachment.service"));
const notification_service_1 = __importDefault(require("./notification.service"));
const realtime_service_1 = __importDefault(require("./realtime.service"));
class ExpenseApprovalService {
    /**
     * Demander une approbation pour une dépense
     */
    async requestApproval(companyId, expenseId, userId, data) {
        // Vérifier que la dépense existe
        const expense = await database_1.default.expense.findFirst({
            where: {
                id: expenseId,
                companyId,
            },
            include: {
                category: true,
            },
        });
        if (!expense) {
            throw new error_middleware_1.CustomError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
        }
        // Vérifier que la dépense n'est pas déjà approuvée ou rejetée
        if (expense.approvalStatus === 'approved') {
            throw new error_middleware_1.CustomError('Expense is already approved', 400, 'ALREADY_APPROVED');
        }
        if (expense.approvalStatus === 'rejected') {
            throw new error_middleware_1.CustomError('Expense is already rejected', 400, 'ALREADY_REJECTED');
        }
        // Vérifier si une approbation est nécessaire
        const amountTtc = Number(expense.amountTtc || expense.totalAmount || 0);
        const attachments = await expenseAttachment_service_1.default.list(companyId, expenseId);
        const hasJustificatif = attachments.length > 0;
        const approvalCheck = await expenseApprovalRule_service_1.default.requiresApproval(companyId, amountTtc, expense.categoryId || null, hasJustificatif);
        if (!approvalCheck.requires || !approvalCheck.approvers || approvalCheck.approvers.length === 0) {
            throw new error_middleware_1.CustomError('This expense does not require approval', 400, 'APPROVAL_NOT_REQUIRED');
        }
        // Vérifier s'il existe déjà une approbation en attente
        const existingApproval = await database_1.default.expenseApproval.findFirst({
            where: {
                expenseId,
                companyId,
                status: 'pending',
            },
        });
        if (existingApproval) {
            throw new error_middleware_1.CustomError('An approval request is already pending', 400, 'APPROVAL_PENDING');
        }
        // Créer la demande d'approbation
        const approval = await database_1.default.expenseApproval.create({
            data: {
                expenseId,
                companyId,
                ruleId: approvalCheck.ruleId || null,
                status: 'pending',
                requestedBy: userId,
                comments: data?.comments || null,
            },
            include: {
                expense: {
                    select: {
                        id: true,
                        expenseNumber: true,
                        amountTtc: true,
                        totalAmount: true,
                        description: true,
                    },
                },
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        // Mettre à jour la dépense
        await database_1.default.expense.update({
            where: { id: expenseId },
            data: {
                approvalRequired: true,
                approvalStatus: 'pending',
            },
        });
        // Envoyer des notifications aux approbateurs
        const approvers = approvalCheck.approvers;
        for (const approverId of approvers) {
            try {
                const approver = await database_1.default.users.findUnique({
                    where: { id: approverId },
                    select: { email: true, firstName: true, lastName: true },
                });
                if (approver) {
                    await notification_service_1.default.sendExpenseApprovalRequest(companyId, approverId, expenseId, {
                        expenseNumber: expense.expenseNumber,
                        amount: amountTtc,
                        requesterName: `${approval.requester.firstName || ''} ${approval.requester.lastName || ''}`.trim() || approval.requester.email,
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Error sending approval notification', { approverId, error });
            }
        }
        // Émettre événement temps réel
        realtime_service_1.default.emitExpenseUpdated(companyId, approval);
        logger_1.default.info(`Expense approval requested: ${expenseId}`, {
            companyId,
            expenseId,
            ruleId: approvalCheck.ruleId,
            approvers: approvers.length,
        });
        return approval;
    }
    /**
     * Approuver une dépense
     */
    async approve(companyId, approvalId, approverId, data) {
        const approval = await database_1.default.expenseApproval.findFirst({
            where: {
                id: approvalId,
                companyId,
            },
            include: {
                expense: true,
                rule: {
                    select: {
                        approvers: true,
                    },
                },
            },
        });
        if (!approval) {
            throw new error_middleware_1.CustomError('Approval request not found', 404, 'APPROVAL_NOT_FOUND');
        }
        if (approval.status !== 'pending') {
            throw new error_middleware_1.CustomError(`Approval request is ${approval.status}`, 400, 'INVALID_STATUS');
        }
        // Vérifier que l'utilisateur est un approbateur autorisé
        const approvers = approval.rule?.approvers || [];
        if (!approvers.includes(approverId)) {
            throw new error_middleware_1.CustomError('You are not authorized to approve this expense', 403, 'UNAUTHORIZED');
        }
        // SPRINT 2 - TASK 2.2 (ACCT-014): Valider la ségrégation des tâches (SoD)
        const { default: sodService } = await Promise.resolve().then(() => __importStar(require('./segregationOfDuties.service')));
        await sodService.validateNotSelfApproving(companyId, approverId, 'expense', approval.expenseId);
        // Mettre à jour l'approbation
        const updated = await database_1.default.expenseApproval.update({
            where: { id: approvalId },
            data: {
                status: 'approved',
                approvedBy: approverId,
                approvedAt: new Date(),
                comments: data?.comments || approval.comments,
                updatedAt: new Date(),
            },
            include: {
                expense: true,
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        // Mettre à jour la dépense
        await database_1.default.expense.update({
            where: { id: approval.expenseId },
            data: {
                approvalStatus: 'approved',
                status: 'validated', // Passer en validée après approbation
            },
        });
        // Notifier le demandeur
        try {
            await notification_service_1.default.sendExpenseApprovalResponse(companyId, approval.requestedBy, approval.expenseId, {
                status: 'approved',
                expenseNumber: approval.expense.expenseNumber,
                approverName: `${updated.approver?.firstName || ''} ${updated.approver?.lastName || ''}`.trim() || updated.approver?.email || 'Approbateur',
            });
        }
        catch (error) {
            logger_1.default.error('Error sending approval notification', { error });
        }
        // Émettre événement temps réel
        realtime_service_1.default.emitExpenseUpdated(companyId, updated);
        logger_1.default.info(`Expense approved: ${approval.expenseId}`, {
            companyId,
            expenseId: approval.expenseId,
            approvalId,
            approverId,
        });
        return updated;
    }
    /**
     * Rejeter une dépense
     */
    async reject(companyId, approvalId, rejectorId, data) {
        const approval = await database_1.default.expenseApproval.findFirst({
            where: {
                id: approvalId,
                companyId,
            },
            include: {
                expense: true,
                rule: {
                    select: {
                        approvers: true,
                    },
                },
            },
        });
        if (!approval) {
            throw new error_middleware_1.CustomError('Approval request not found', 404, 'APPROVAL_NOT_FOUND');
        }
        if (approval.status !== 'pending') {
            throw new error_middleware_1.CustomError(`Approval request is ${approval.status}`, 400, 'INVALID_STATUS');
        }
        // Vérifier que l'utilisateur est un approbateur autorisé
        const approvers = approval.rule?.approvers || [];
        if (!approvers.includes(rejectorId)) {
            throw new error_middleware_1.CustomError('You are not authorized to reject this expense', 403, 'UNAUTHORIZED');
        }
        // Mettre à jour l'approbation
        const updated = await database_1.default.expenseApproval.update({
            where: { id: approvalId },
            data: {
                status: 'rejected',
                rejectedBy: rejectorId,
                rejectedAt: new Date(),
                rejectionReason: data.reason,
                comments: data.comments || null,
                updatedAt: new Date(),
            },
            include: {
                expense: true,
                rejector: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        // Mettre à jour la dépense
        await database_1.default.expense.update({
            where: { id: approval.expenseId },
            data: {
                approvalStatus: 'rejected',
                // La dépense reste en draft ou passe en rejected selon la logique métier
            },
        });
        // Notifier le demandeur
        try {
            await notification_service_1.default.sendExpenseApprovalResponse(companyId, approval.requestedBy, approval.expenseId, {
                status: 'rejected',
                expenseNumber: approval.expense.expenseNumber,
                rejectorName: `${updated.rejector?.firstName || ''} ${updated.rejector?.lastName || ''}`.trim() || updated.rejector?.email || 'Approbateur',
                reason: data.reason,
            });
        }
        catch (error) {
            logger_1.default.error('Error sending rejection notification', { error });
        }
        // Émettre événement temps réel
        realtime_service_1.default.emitExpenseUpdated(companyId, updated);
        logger_1.default.info(`Expense rejected: ${approval.expenseId}`, {
            companyId,
            expenseId: approval.expenseId,
            approvalId,
            rejectorId,
            reason: data.reason,
        });
        return updated;
    }
    /**
     * Lister les approbations en attente pour un utilisateur
     */
    async listPendingForUser(companyId, userId) {
        // Trouver toutes les règles où l'utilisateur est approbateur
        const rules = await database_1.default.expenseApprovalRule.findMany({
            where: {
                companyId,
                enabled: true,
                approvers: {
                    array_contains: [userId],
                },
            },
            select: { id: true },
        });
        const ruleIds = rules.map((r) => r.id);
        // Trouver les approbations en attente pour ces règles
        const approvals = await database_1.default.expenseApproval.findMany({
            where: {
                companyId,
                status: 'pending',
                ruleId: { in: ruleIds },
            },
            // Note: ExpenseApproval n'a pas de relation directe avec expenses dans le schéma
            // On doit récupérer l'expense séparément si nécessaire
            include: {
                ExpenseApprovalRule: {
                    select: {
                        id: true,
                        name: true,
                        amountThreshold: true,
                    },
                },
            },
            orderBy: {
                requestedAt: 'asc', // Plus anciennes en premier
            },
        });
        // Enrichir avec les données d'expense pour chaque approbation
        const enrichedApprovals = await Promise.all(approvals.map(async (approval) => {
            const expense = await database_1.default.expenses.findUnique({
                where: { id: approval.expenseId },
                include: {
                    suppliers: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    expense_categories: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            });
            // Récupérer le requester
            const requester = await database_1.default.users.findUnique({
                where: { id: approval.requestedBy },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            });
            return {
                ...approval,
                expense,
                requester,
            };
        }));
        return enrichedApprovals;
    }
    /**
     * Obtenir une approbation par ID
     */
    async getById(companyId, approvalId) {
        const approval = await database_1.default.expenseApproval.findFirst({
            where: {
                id: approvalId,
                companyId,
            },
            include: {
                expense: {
                    include: {
                        supplier: true,
                        category: true,
                        creator: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                rejector: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                rule: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!approval) {
            throw new error_middleware_1.CustomError('Approval not found', 404, 'APPROVAL_NOT_FOUND');
        }
        return approval;
    }
    /**
     * Obtenir l'historique d'approbation d'une dépense
     */
    async getByExpense(companyId, expenseId) {
        const approvals = await database_1.default.expenseApproval.findMany({
            where: {
                expenseId,
                companyId,
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                rejector: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                rule: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return approvals;
    }
}
exports.ExpenseApprovalService = ExpenseApprovalService;
exports.default = new ExpenseApprovalService();
//# sourceMappingURL=expenseApproval.service.js.map