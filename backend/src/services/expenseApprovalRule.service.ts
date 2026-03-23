import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateApprovalRuleData {
  name?: string;
  description?: string;
  enabled?: boolean;
  amountThreshold?: number | null;
  categoryId?: string | null;
  requireJustificatif?: boolean;
  approvers?: string[]; // Array d'IDs d'utilisateurs
}

export interface UpdateApprovalRuleData extends Partial<CreateApprovalRuleData> {}

export class ExpenseApprovalRuleService {
  /**
   * Créer une règle d'approbation
   */
  async create(companyId: string, data: CreateApprovalRuleData) {
    // Vérifier que les approbateurs existent et appartiennent à l'entreprise
    if (data.approvers && data.approvers.length > 0) {
      const users = await prisma.users.findMany({
        where: {
          id: { in: data.approvers },
          companyId,
        },
      });

      if (users.length !== data.approvers.length) {
        throw new CustomError(
          'One or more approvers do not exist or do not belong to this company',
          400,
          'INVALID_APPROVERS'
        );
      }
    }

    // Vérifier la catégorie si fournie
    if (data.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: {
          id: data.categoryId,
          companyId,
        },
      });

      if (!category) {
        throw new CustomError('Expense category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const rule = await prisma.expenseApprovalRule.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        enabled: data.enabled !== false,
        amountThreshold: data.amountThreshold ? new Decimal(data.amountThreshold) : null,
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
  async list(companyId: string, includeDisabled: boolean = false) {
    const where: any = { companyId };
    if (!includeDisabled) {
      where.enabled = true;
    }

    const rules = await prisma.expenseApprovalRule.findMany({
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
  async getById(companyId: string, ruleId: string) {
    const rule = await prisma.expenseApprovalRule.findFirst({
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
      throw new CustomError('Approval rule not found', 404, 'RULE_NOT_FOUND');
    }

    return rule;
  }

  /**
   * Mettre à jour une règle
   */
  async update(companyId: string, ruleId: string, data: UpdateApprovalRuleData) {
    const rule = await this.getById(companyId, ruleId);

    // Vérifier les approbateurs si fournis
    if (data.approvers && data.approvers.length > 0) {
      const users = await prisma.users.findMany({
        where: {
          id: { in: data.approvers },
          companyId,
        },
      });

      if (users.length !== data.approvers.length) {
        throw new CustomError(
          'One or more approvers do not exist or do not belong to this company',
          400,
          'INVALID_APPROVERS'
        );
      }
    }

    // Vérifier la catégorie si fournie
    if (data.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: {
          id: data.categoryId,
          companyId,
        },
      });

      if (!category) {
        throw new CustomError('Expense category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const updated = await prisma.expenseApprovalRule.update({
      where: { id: ruleId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.amountThreshold !== undefined && {
          amountThreshold: data.amountThreshold ? new Decimal(data.amountThreshold) : null,
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
  async delete(companyId: string, ruleId: string) {
    await this.getById(companyId, ruleId);

    await prisma.expenseApprovalRule.delete({
      where: { id: ruleId },
    });
  }

  /**
   * Trouver les règles applicables pour une dépense
   */
  async findApplicableRules(
    companyId: string,
    amountTtc: number,
    categoryId?: string | null
  ) {
    const rules = await prisma.expenseApprovalRule.findMany({
      where: {
        companyId,
        enabled: true,
        AND: [
          { OR: [{ categoryId: null }, { categoryId: categoryId || null }] },
          { OR: [{ amountThreshold: null }, { amountThreshold: { lte: new Decimal(amountTtc) } }] },
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
  async requiresApproval(
    companyId: string,
    amountTtc: number,
    categoryId?: string | null,
    hasJustificatif?: boolean
  ): Promise<{ requires: boolean; ruleId?: string; approvers?: string[] }> {
    const applicableRules = await this.findApplicableRules(companyId, amountTtc, categoryId);

    if (applicableRules.length === 0) {
      return { requires: false };
    }

    // Prendre la première règle applicable (la plus prioritaire)
    const rule = applicableRules[0];

    // Vérifier si un justificatif est requis
    if (rule.requireJustificatif && !hasJustificatif) {
      return { requires: true, ruleId: rule.id, approvers: rule.approvers as string[] };
    }

    // Vérifier qu'il y a des approbateurs
    const approvers = (rule.approvers as string[]) || [];
    if (approvers.length === 0) {
      return { requires: false };
    }

    return { requires: true, ruleId: rule.id, approvers };
  }
}

export default new ExpenseApprovalRuleService();

