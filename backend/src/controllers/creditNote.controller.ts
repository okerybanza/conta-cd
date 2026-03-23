import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import creditNoteService from '../services/creditNote.service';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';

// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val: any) => {
  if (val === '' || val === null) return undefined;
  return val;
};

// Fonction helper pour préprocesser les données (ne transforme pas les champs requis)
const preprocessData = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  const cleaned: any = {};
  // Liste des champs requis qui ne doivent pas être transformés en undefined
  const requiredFields = ['invoiceId', 'amount', 'reason'];
  for (const [key, value] of Object.entries(data)) {
    // Ne pas transformer les champs requis en undefined
    if (requiredFields.includes(key) && value === '') {
      cleaned[key] = value; // Garder la chaîne vide pour que la validation Zod échoue avec un message clair
    } else {
      cleaned[key] = preprocessEmptyString(value);
    }
  }
  return cleaned;
};

// Schéma de base pour les avoirs
const baseCreditNoteSchema = z.object({
  taxAmount: z.number().nonnegative().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  creditNoteDate: z.coerce.date().optional(),
  currency: z.string().length(3).optional(),
  templateId: z.string().optional(),
  footerText: z.string().optional(),
  returnStock: z.boolean().optional(),
  lines: z.array(z.object({
    productId: z.string().uuid().optional(),
    description: z.string().min(1, 'Description requise'),
    quantity: z.number().positive('Quantité invalide'),
    unitPrice: z.number().nonnegative('Prix unitaire invalide'),
    taxRate: z.number().nonnegative('TVA invalide').optional(),
  })).optional(),
}).passthrough();

// Schémas de validation
const createCreditNoteSchema = z.preprocess(
  preprocessData,
  baseCreditNoteSchema.extend({
    invoiceId: z.string().uuid('Invalid invoice ID').min(1, 'Invoice ID is required'), // Requis pour la création
    amount: z.number().positive('Amount must be positive'), // Requis pour la création
    reason: z.string().min(1, 'Reason is required'), // Requis pour la création
  })
);

const updateCreditNoteSchema = z.preprocess(
  preprocessData,
  baseCreditNoteSchema.extend({
    reason: z.string().min(1).optional(),
    status: z.enum(['draft', 'sent', 'applied', 'cancelled']).optional(),
  })
);

export class CreditNoteController {
  /**
   * Créer un avoir
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const companyId = getCompanyId(req);
      const userId = req.user.id;

      const validatedData = createCreditNoteSchema.parse(req.body);

      const creditNote = await creditNoteService.create(companyId, userId, validatedData);

      res.status(201).json({
        success: true,
        data: creditNote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un avoir par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      const creditNote = await creditNoteService.getById(companyId, id);

      res.json({
        success: true,
        data: creditNote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les avoirs
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const filters = {
        invoiceId: req.query.invoiceId as string | undefined,
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await creditNoteService.list(companyId, filters);

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
   * Mettre à jour un avoir
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const companyId = getCompanyId(req);
      const userId = req.user.id;
      const { id } = req.params;

      const validatedData = updateCreditNoteSchema.parse(req.body);

      const creditNote = await creditNoteService.update(companyId, id, userId, validatedData);

      res.json({
        success: true,
        data: creditNote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un avoir
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;

      await creditNoteService.delete(companyId, id);

      res.json({
        success: true,
        message: 'Credit note deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Appliquer un avoir à une facture
   */
  async apply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const companyId = getCompanyId(req);
      const userId = req.user.id;
      const { id } = req.params;

      const creditNote = await creditNoteService.applyCreditNote(companyId, id, userId);

      res.json({
        success: true,
        data: creditNote,
        message: 'Credit note applied successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CreditNoteController();

