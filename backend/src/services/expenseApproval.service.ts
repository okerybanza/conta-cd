import { randomUUID } from 'crypto';
import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import expenseApprovalRuleService from './expenseApprovalRule.service';
import expenseAttachmentService from './expenseAttachment.service';
import notificationService from './notification.service';
import realtimeService from './realtime.service';

export interface RequestApprovalData {
  comments?: string;
}

export interface ApproveExpenseData {
  comments?: string;
}

export interface RejectExpenseData {
  reason?: string;
  comments?: string;
}

const userPublicSelect = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
} as const;

export class ExpenseApprovalService {
  /**
   * Demander une approbation pour une dépense
   */
  async requestApproval(
    companyId: string,
    expenseId: string,
    userId: string,
    data?: RequestApprovalData
  ) {
    // Vérifier que la dépense existe
    const expense = await prisma.expenses.findFirst({
      where: {
        id: expenseId,
        company_id: companyId,
      },
      include: {
        expense_categories: true,
      },
    });

    if (!expense) {
      throw new CustomError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    const expRow = expense as any;

    // Vérifier que la dépense n'est pas déjà approuvée ou rejetée
    if (expRow.approval_status === 'approved' || expRow.approvalStatus === 'approved') {
      throw new CustomError('Expense is already approved', 400, 'ALREADY_APPROVED');
    }

    if (expRow.approval_status === 'rejected' || expRow.approvalStatus === 'rejected') {
      throw new CustomError('Expense is already rejected', 400, 'ALREADY_REJECTED');
    }

    // Vérifier si une approbation est nécessaire
    const amountTtc = Number(expense.amount_ttc || expense.total_amount || 0);
    const attachments = await expenseAttachmentService.list(companyId, expenseId);
    const hasJustificatif = attachments.length > 0;

    const approvalCheck = await expenseApprovalRuleService.requiresApproval(
      companyId,
      amountTtc,
      expense.category_id || null,
      hasJustificatif
    );

    if (!approvalCheck.requires || !approvalCheck.approvers || approvalCheck.approvers.length === 0) {
      throw new CustomError(
        'This expense does not require approval',
        400,
        'APPROVAL_NOT_REQUIRED'
      );
    }

    // Vérifier s'il existe déjà une approbation en attente
    const existingApproval = await prisma.expenseApproval.findFirst({
      where: {
        expenseId,
        companyId,
        status: 'pending',
      },
    });

    if (existingApproval) {
      throw new CustomError('An approval request is already pending', 400, 'APPROVAL_PENDING');
    }

    // Créer la demande d'approbation
    const approval = await prisma.expenseApproval.create({
      data: {
        id: randomUUID(),
        expenseId,
        companyId,
        ruleId: approvalCheck.ruleId || null,
        status: 'pending',
        requestedBy: userId,
        comments: data?.comments || null,
      },
      include: {
        ExpenseApprovalRule: true,
      },
    });

    const requesterProfile = await prisma.users.findUnique({
      where: { id: userId },
      select: userPublicSelect,
    });

    // Mettre à jour la dépense
    await prisma.expenses.update({
      where: { id: expenseId },
      data: {
        approval_required: true,
        approval_status: 'pending',
      } as any,
    });

    // Envoyer des notifications aux approbateurs
    const approvers = approvalCheck.approvers;
    for (const approverId of approvers) {
      try {
        const approver = await prisma.users.findUnique({
          where: { id: approverId },
          select: userPublicSelect,
        });

        if (approver) {
          await notificationService.sendExpenseApprovalRequest(
            companyId,
            approverId,
            expenseId,
            {
              expenseNumber: expense.expense_number,
              amount: amountTtc,
              requesterName:
                `${requesterProfile?.first_name || ''} ${requesterProfile?.last_name || ''}`.trim() ||
                requesterProfile?.email ||
                '',
            }
          );
        }
      } catch (error) {
        logger.error('Error sending approval notification', { approverId, error });
      }
    }

    // Émettre événement temps réel
    realtimeService.emitExpenseUpdated(companyId, approval);

    logger.info(`Expense approval requested: ${expenseId}`, {
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
  async approve(
    companyId: string,
    approvalId: string,
    approverId: string,
    data?: ApproveExpenseData
  ) {
    const approval = await prisma.expenseApproval.findFirst({
      where: {
        id: approvalId,
        companyId,
      },
      include: {
        ExpenseApprovalRule: {
          select: {
            approvers: true,
          },
        },
      },
    });

    if (!approval) {
      throw new CustomError('Approval request not found', 404, 'APPROVAL_NOT_FOUND');
    }

    if (approval.status !== 'pending') {
      throw new CustomError(`Approval request is ${approval.status}`, 400, 'INVALID_STATUS');
    }

    // Vérifier que l'utilisateur est un approbateur autorisé
    const approvers = (approval.ExpenseApprovalRule?.approvers as string[]) || [];
    if (!approvers.includes(approverId)) {
      throw new CustomError('You are not authorized to approve this expense', 403, 'UNAUTHORIZED');
    }

    // SPRINT 2 - TASK 2.2 (ACCT-014): Valider la ségrégation des tâches (SoD)
    const { default: sodService } = await import('./segregationOfDuties.service');
    await sodService.validateNotSelfApproving(
      companyId,
      approverId,
      'invoice',
      approval.expenseId
    );

    // Mettre à jour l'approbation
    const updated = await prisma.expenseApproval.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        comments: data?.comments || approval.comments,
        updatedAt: new Date(),
      },
      include: {
        ExpenseApprovalRule: true,
      },
    });

    const approverUser = await prisma.users.findUnique({
      where: { id: approverId },
      select: userPublicSelect,
    });

    // Mettre à jour la dépense
    await prisma.expenses.update({
      where: { id: approval.expenseId },
      data: {
        approval_status: 'approved',
        status: 'validated', // Passer en validée après approbation
      } as any,
    });

    // Notifier le demandeur
    try {
      const expRel = await prisma.expenses.findUnique({ where: { id: approval.expenseId } });
      await notificationService.sendExpenseApprovalResponse(
        companyId,
        approval.requestedBy,
        approval.expenseId,
        {
          status: 'approved',
          expenseNumber: expRel?.expense_number ?? (expRel as any)?.expenseNumber,
          approverName:
            `${approverUser?.first_name || ''} ${approverUser?.last_name || ''}`.trim() ||
            approverUser?.email ||
            'Approbateur',
        }
      );
    } catch (error) {
      logger.error('Error sending approval notification', { error });
    }

    // Émettre événement temps réel
    realtimeService.emitExpenseUpdated(companyId, updated);

    logger.info(`Expense approved: ${approval.expenseId}`, {
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
  async reject(
    companyId: string,
    approvalId: string,
    rejectorId: string,
    data: RejectExpenseData
  ) {
    const approval = await prisma.expenseApproval.findFirst({
      where: {
        id: approvalId,
        companyId,
      },
      include: {
        ExpenseApprovalRule: {
          select: {
            approvers: true,
          },
        },
      },
    });

    if (!approval) {
      throw new CustomError('Approval request not found', 404, 'APPROVAL_NOT_FOUND');
    }

    if (approval.status !== 'pending') {
      throw new CustomError(`Approval request is ${approval.status}`, 400, 'INVALID_STATUS');
    }

    // Vérifier que l'utilisateur est un approbateur autorisé
    const approvers = (approval.ExpenseApprovalRule?.approvers as string[]) || [];
    if (!approvers.includes(rejectorId)) {
      throw new CustomError('You are not authorized to reject this expense', 403, 'UNAUTHORIZED');
    }

    // Mettre à jour l'approbation
    const updated = await prisma.expenseApproval.update({
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
        ExpenseApprovalRule: true,
      },
    });

    const rejectorUser = await prisma.users.findUnique({
      where: { id: rejectorId },
      select: userPublicSelect,
    });

    // Mettre à jour la dépense
    await prisma.expenses.update({
      where: { id: approval.expenseId },
      data: {
        approval_status: 'rejected',
        // La dépense reste en draft ou passe en rejected selon la logique métier
      } as any,
    });

    // Notifier le demandeur
    try {
      const expRel = await prisma.expenses.findUnique({ where: { id: approval.expenseId } });
      await notificationService.sendExpenseApprovalResponse(
        companyId,
        approval.requestedBy,
        approval.expenseId,
        {
          status: 'rejected',
          expenseNumber: expRel?.expense_number ?? (expRel as any)?.expenseNumber,
          rejectorName:
            `${rejectorUser?.first_name || ''} ${rejectorUser?.last_name || ''}`.trim() ||
            rejectorUser?.email ||
            'Approbateur',
          reason: data.reason,
        }
      );
    } catch (error) {
      logger.error('Error sending rejection notification', { error });
    }

    // Émettre événement temps réel
    realtimeService.emitExpenseUpdated(companyId, updated);

    logger.info(`Expense rejected: ${approval.expenseId}`, {
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
  async listPendingForUser(companyId: string, userId: string) {
    // Trouver toutes les règles où l'utilisateur est approbateur
    const rules = await prisma.expenseApprovalRule.findMany({
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
    const approvals = await prisma.expenseApproval.findMany({
      where: {
        companyId,
        status: 'pending',
        ruleId: { in: ruleIds },
      },
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
    const enrichedApprovals = await Promise.all(
      approvals.map(async (approval) => {
        const expense = await prisma.expenses.findUnique({
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
              select: userPublicSelect,
            },
          },
        });

        // Récupérer le requester
        const requester = await prisma.users.findUnique({
          where: { id: approval.requestedBy },
          select: userPublicSelect,
        });

        return {
          ...approval,
          expense,
          requester,
        };
      })
    );

    return enrichedApprovals;
  }

  /**
   * Obtenir une approbation par ID
   */
  async getById(companyId: string, approvalId: string) {
    const approval = await prisma.expenseApproval.findFirst({
      where: {
        id: approvalId,
        companyId,
      },
      include: {
        ExpenseApprovalRule: true,
      },
    });

    if (!approval) {
      throw new CustomError('Approval not found', 404, 'APPROVAL_NOT_FOUND');
    }

    const expense = await prisma.expenses.findUnique({
      where: { id: approval.expenseId },
      include: {
        suppliers: true,
        expense_categories: true,
        users: {
          select: userPublicSelect,
        },
      },
    });

    const [requester, approver, rejector] = await Promise.all([
      prisma.users.findUnique({
        where: { id: approval.requestedBy },
        select: userPublicSelect,
      }),
      approval.approvedBy
        ? prisma.users.findUnique({
            where: { id: approval.approvedBy },
            select: userPublicSelect,
          })
        : Promise.resolve(null),
      approval.rejectedBy
        ? prisma.users.findUnique({
            where: { id: approval.rejectedBy },
            select: userPublicSelect,
          })
        : Promise.resolve(null),
    ]);

    const { ExpenseApprovalRule, ...rest } = approval;

    return {
      ...rest,
      rule: ExpenseApprovalRule,
      expense,
      requester,
      approver,
      rejector,
    };
  }

  /**
   * Obtenir l'historique d'approbation d'une dépense
   */
  async getByExpense(companyId: string, expenseId: string) {
    const approvals = await prisma.expenseApproval.findMany({
      where: {
        expenseId,
        companyId,
      },
      include: {
        ExpenseApprovalRule: {
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

    return Promise.all(
      approvals.map(async (a) => {
        const [requester, approver, rejector] = await Promise.all([
          prisma.users.findUnique({
            where: { id: a.requestedBy },
            select: userPublicSelect,
          }),
          a.approvedBy
            ? prisma.users.findUnique({
                where: { id: a.approvedBy },
                select: userPublicSelect,
              })
            : Promise.resolve(null),
          a.rejectedBy
            ? prisma.users.findUnique({
                where: { id: a.rejectedBy },
                select: userPublicSelect,
              })
            : Promise.resolve(null),
        ]);
        const { ExpenseApprovalRule, ...rest } = a;
        return {
          ...rest,
          rule: ExpenseApprovalRule,
          requester,
          approver,
          rejector,
        };
      })
    );
  }
}

export default new ExpenseApprovalService();
