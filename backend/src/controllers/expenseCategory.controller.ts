import { Request, Response, NextFunction } from 'express';
import expenseCategoryService from '../services/expenseCategory.service';
import { CustomError } from '../middleware/error.middleware';
import { authenticate, AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  accountId: z.string().uuid().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export class ExpenseCategoryController {
  /**
   * POST /api/v1/expense-categories
   * Créer une catégorie
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await expenseCategoryService.create(getCompanyId(req), data);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expense-categories
   * Lister les catégories
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await expenseCategoryService.list(getCompanyId(req), includeInactive);
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expense-categories/:id
   * Obtenir une catégorie par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await expenseCategoryService.getById(getCompanyId(req), id);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/expense-categories/:id
   * Mettre à jour une catégorie
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateCategorySchema.parse(req.body);
      const category = await expenseCategoryService.update(getCompanyId(req), id, data);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/expense-categories/:id
   * Supprimer une catégorie
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await expenseCategoryService.delete(getCompanyId(req), id);
      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseCategoryController();

