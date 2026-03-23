import { Request, Response, NextFunction } from 'express';
import accountService from '../services/account.service';
import { CustomError } from '../middleware/error.middleware';
import { authenticate, AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import { z } from 'zod';

const preprocessEmptyString = (val: any) => {
  if (val === '' || val === null) return undefined;
  return val;
};

const preprocessData = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = preprocessEmptyString(value);
  }
  return cleaned;
};

const baseAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  category: z.enum(['1', '2', '3', '4', '5', '6', '7', '8']).optional(),
  parentId: z.string().uuid().optional(),
  description: z.string().optional(),
});

const createAccountSchema = z.preprocess(
  preprocessData,
  baseAccountSchema
);

const updateAccountSchema = z.preprocess(
  preprocessData,
  baseAccountSchema.partial().extend({
    isActive: z.boolean().optional(),
  })
);

const accountFiltersSchema = z.object({
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),
  category: z.enum(['1', '2', '3', '4', '5', '6', '7', '8']).optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export class AccountController {
  /**
   * POST /api/v1/accounts
   * Créer un compte comptable
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createAccountSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const account = await accountService.create(companyId, data as any);
      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accounts
   * Lister les comptes
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = accountFiltersSchema.parse(req.query);
      const companyId = getCompanyId(req);
      const accounts = await accountService.list(companyId, filters);
      res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accounts/tree
   * Obtenir l'arborescence des comptes
   */
  async getTree(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = accountFiltersSchema.parse(req.query);
      const companyId = getCompanyId(req);
      const tree = await accountService.getTree(companyId, filters);
      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accounts/:id
   * Obtenir un compte par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const account = await accountService.getById(companyId, id);
      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accounts/code/:code
   * Obtenir un compte par code
   */
  async getByCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const companyId = getCompanyId(req);
      const account = await accountService.getByCode(companyId, code);
      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/accounts/:id
   * Mettre à jour un compte
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateAccountSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const account = await accountService.update(companyId, id, data);
      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/accounts/:id
   * Supprimer un compte
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      await accountService.delete(companyId, id);
      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accounts/:id/balance
   * Obtenir le solde total (compte + enfants)
   */
  async getTotalBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const balance = await accountService.getTotalBalance(companyId, id);
      res.json({
        success: true,
        data: { balance },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accounts/by-type/:type
   * Obtenir les comptes par type
   */
  async findByType(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const { category } = req.query;
      const companyId = getCompanyId(req);
      const accounts = await accountService.findByTypeAndCategory(
        companyId,
        type as any,
        category as any
      );
      res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountController();

