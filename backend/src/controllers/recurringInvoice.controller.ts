import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import recurringInvoiceService, {
  CreateRecurringInvoiceData,
  UpdateRecurringInvoiceData,
} from '../services/recurringInvoice.service';
import { z } from 'zod';

const createRecurringInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  interval: z.number().int().positive().optional().default(1),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  dueDateDays: z.number().int().positive().optional().default(30),
  currency: z.string().length(3).optional().default('CDF'),
  reference: z.string().optional(),
  poNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  lines: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().nonnegative().max(100).optional().default(0),
    })
  ).min(1),
  transportFees: z.number().nonnegative().optional(),
  platformFees: z.number().nonnegative().optional(),
  autoSend: z.boolean().optional().default(false),
  sendToCustomer: z.boolean().optional().default(true),
});

const updateRecurringInvoiceSchema = createRecurringInvoiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export class RecurringInvoiceController {
  /**
   * Créer une facture récurrente
   * POST /api/v1/recurring-invoices
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = createRecurringInvoiceSchema.parse(req.body);
      const recurringInvoice = await recurringInvoiceService.create(
        getCompanyId(req),
        req.user.id,
        data
      );

      res.status(201).json({
        success: true,
        data: recurringInvoice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une facture récurrente
   * GET /api/v1/recurring-invoices/:id
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const recurringInvoice = await recurringInvoiceService.getById(
        getCompanyId(req),
        req.params.id
      );

      res.json({
        success: true,
        data: recurringInvoice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les factures récurrentes
   * GET /api/v1/recurring-invoices
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        customerId: req.query.customerId as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await recurringInvoiceService.list(getCompanyId(req), filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une facture récurrente
   * PUT /api/v1/recurring-invoices/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = updateRecurringInvoiceSchema.parse(req.body);
      const recurringInvoice = await recurringInvoiceService.update(
        getCompanyId(req),
        req.params.id,
        data
      );

      res.json({
        success: true,
        data: recurringInvoice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une facture récurrente
   * DELETE /api/v1/recurring-invoices/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await recurringInvoiceService.delete(getCompanyId(req), req.params.id);

      res.json({
        success: true,
        message: 'Recurring invoice deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Générer manuellement la prochaine facture
   * POST /api/v1/recurring-invoices/:id/generate
   */
  async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const invoiceId = await recurringInvoiceService.generateNextInvoice(req.params.id);

      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: 'Invoice cannot be generated at this time',
        });
      }

      res.json({
        success: true,
        data: { invoiceId },
        message: 'Invoice generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir l'historique des factures générées
   * GET /api/v1/recurring-invoices/:id/history
   */
  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const invoices = await recurringInvoiceService.getGenerationHistory(
        getCompanyId(req),
        req.params.id
      );

      res.json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RecurringInvoiceController();

