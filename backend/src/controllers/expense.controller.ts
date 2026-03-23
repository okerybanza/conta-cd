import { Request, Response, NextFunction } from 'express';
import expenseService from '../services/expense.service';
import { CustomError } from '../middleware/error.middleware';
import { authenticate, AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import { z } from 'zod';

// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val: any) => {
  if (val === '' || val === null) return undefined;
  return val;
};

// Fonction helper pour préprocesser les données
const preprocessData = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = preprocessEmptyString(value);
  }
  return cleaned;
};

// Schéma de base pour les dépenses
const baseExpenseSchema = z.object({
  expenseDate: z.string().or(z.date()),
  supplierId: z.string().uuid().optional(),
  supplierName: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  paymentDate: z.string().or(z.date()).optional(),
  status: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().optional(),
  reason: z.string().max(500).optional(), // ACCT-001: Why the expense was recorded/modified (max 500 chars)
  mobileMoneyProvider: z.string().optional(),
  mobileMoneyNumber: z.string().optional(),
  transactionReference: z.string().optional(),
  bankName: z.string().optional(),
  checkNumber: z.string().optional(),
  cardLastFour: z.string().optional(),
}).passthrough();

// Schémas de validation
const createExpenseSchema = z.preprocess(
  preprocessData,
  baseExpenseSchema.extend({
    amountHt: z.number().positive(), // Requis pour la création
    amountTtc: z.number().positive(), // Requis pour la création
    paymentMethod: z.string(), // Requis pour la création
  })
);

const updateExpenseSchema = z.preprocess(
  preprocessData,
  baseExpenseSchema.extend({
    amountHt: z.number().positive().optional(),
    amountTtc: z.number().positive().optional(),
    paymentMethod: z.string().optional(),
  })
);

const expenseFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export class ExpenseController {
  /**
   * POST /api/v1/expenses
   * Créer une dépense
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createExpenseSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const expense = await expenseService.create(companyId, req.user.id, data);
      res.status(201).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses
   * Lister les dépenses
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = expenseFiltersSchema.parse(req.query);
      const companyId = getCompanyId(req);
      const result = await expenseService.list(companyId, filters);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/:id
   * Obtenir une dépense par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const expense = await expenseService.getById(companyId, id);
      res.json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/expenses/:id
   * Mettre à jour une dépense
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateExpenseSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const expense = await expenseService.update(companyId, id, req.user.id, data);
      res.json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/expenses/:id
   * Supprimer une dépense
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      await expenseService.delete(companyId, id);
      res.json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/expenses/:id/duplicate
   * Dupliquer une dépense
   */
  async duplicate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const expense = await expenseService.duplicate(companyId, id, req.user.id);
      res.status(201).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseController();

