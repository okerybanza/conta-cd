import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import expenseApprovalService from '../services/expenseApproval.service';
import expenseApprovalRuleService from '../services/expenseApprovalRule.service';
import { CustomError } from '../middleware/error.middleware';
import { z } from 'zod';

const requestApprovalSchema = z.object({
  comments: z.string().optional(),
});

const approveSchema = z.object({
  comments: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
  comments: z.string().optional(),
});

const createRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  amountThreshold: z.number().positive().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  requireJustificatif: z.boolean().optional(),
  approvers: z.array(z.string().uuid()).min(1, 'At least one approver is required'),
});

const updateRuleSchema = createRuleSchema.partial();

export class ExpenseApprovalController {
  /**
   * POST /api/v1/expenses/:id/approval/request
   * Demander une approbation pour une dépense
   */
  async requestApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: expenseId } = req.params;
      const companyId = getCompanyId(req);
      const data = requestApprovalSchema.parse(req.body);

      const approval = await expenseApprovalService.requestApproval(
        companyId,
        expenseId,
        req.user.id,
        data
      );

      res.status(201).json({
        success: true,
        data: approval,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/expenses/approvals/:id/approve
   * Approuver une dépense
   */
  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: approvalId } = req.params;
      const companyId = getCompanyId(req);
      const data = approveSchema.parse(req.body);

      const approval = await expenseApprovalService.approve(
        companyId,
        approvalId,
        req.user.id,
        data
      );

      res.json({
        success: true,
        data: approval,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/expenses/approvals/:id/reject
   * Rejeter une dépense
   */
  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: approvalId } = req.params;
      const companyId = getCompanyId(req);
      const data = rejectSchema.parse(req.body);

      const approval = await expenseApprovalService.reject(
        companyId,
        approvalId,
        req.user.id,
        data
      );

      res.json({
        success: true,
        data: approval,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/approvals/pending
   * Lister les approbations en attente pour l'utilisateur connecté
   */
  async listPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const approvals = await expenseApprovalService.listPendingForUser(companyId, req.user.id);

      res.json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/approvals/:id
   * Obtenir une approbation par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: approvalId } = req.params;
      const companyId = getCompanyId(req);

      const approval = await expenseApprovalService.getById(companyId, approvalId);

      res.json({
        success: true,
        data: approval,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/:id/approvals
   * Obtenir l'historique d'approbation d'une dépense
   */
  async getByExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: expenseId } = req.params;
      const companyId = getCompanyId(req);

      const approvals = await expenseApprovalService.getByExpense(companyId, expenseId);

      res.json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== RÈGLES D'APPROBATION =====

  /**
   * POST /api/v1/expenses/approval-rules
   * Créer une règle d'approbation
   */
  async createRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const data = createRuleSchema.parse(req.body);

      const rule = await expenseApprovalRuleService.create(companyId, data);

      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/approval-rules
   * Lister les règles d'approbation
   */
  async listRules(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const includeDisabled = req.query.includeDisabled === 'true';

      const rules = await expenseApprovalRuleService.list(companyId, includeDisabled);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/approval-rules/:id
   * Obtenir une règle par ID
   */
  async getRuleById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: ruleId } = req.params;
      const companyId = getCompanyId(req);

      const rule = await expenseApprovalRuleService.getById(companyId, ruleId);

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/expenses/approval-rules/:id
   * Mettre à jour une règle
   */
  async updateRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: ruleId } = req.params;
      const companyId = getCompanyId(req);
      const data = updateRuleSchema.parse(req.body);

      const rule = await expenseApprovalRuleService.update(companyId, ruleId, data);

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/expenses/approval-rules/:id
   * Supprimer une règle
   */
  async deleteRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: ruleId } = req.params;
      const companyId = getCompanyId(req);

      await expenseApprovalRuleService.delete(companyId, ruleId);

      res.json({
        success: true,
        message: 'Approval rule deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseApprovalController();

