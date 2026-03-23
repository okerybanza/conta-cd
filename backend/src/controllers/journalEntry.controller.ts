import { Request, Response, NextFunction } from 'express';
import journalEntryService from '../services/journalEntry.service';
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
    if (key === 'lines' && Array.isArray(value)) {
      // Traiter les lignes d'écriture séparément
      cleaned[key] = value.map((line: any) => {
        const cleanedLine: any = {};
        for (const [lineKey, lineValue] of Object.entries(line)) {
          cleanedLine[lineKey] = preprocessEmptyString(lineValue);
        }
        return cleanedLine;
      });
    } else {
      cleaned[key] = preprocessEmptyString(value);
    }
  }
  return cleaned;
};

const journalEntryLineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().optional(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  currency: z.string().optional(),
});

const createJournalEntrySchema = z.preprocess(
  preprocessData,
  z.object({
    entryDate: z.string().or(z.date()),
    description: z.string().optional(),
    reference: z.string().optional(),
    sourceType: z.enum(['invoice', 'expense', 'payment', 'manual', 'credit_note', 'payroll']),
    sourceId: z.string().uuid().optional(),
    lines: z.array(journalEntryLineSchema).min(2),
    notes: z.string().optional(),
    reason: z.string().max(500).optional(), // ACCT-001: Why the entry was created (max 500 chars)
  }).passthrough()
);

const updateJournalEntrySchema = z.preprocess(
  preprocessData,
  z.object({
    entryDate: z.string().or(z.date()).optional(),
    description: z.string().optional(),
    reference: z.string().optional(),
    sourceType: z.enum(['invoice', 'expense', 'payment', 'manual', 'credit_note', 'payroll']).optional(),
    sourceId: z.string().uuid().optional(),
    lines: z.array(journalEntryLineSchema).min(2).optional(),
    notes: z.string().optional(),
    reason: z.string().max(500).optional(), // ACCT-001: Why the entry was modified (max 500 chars)
    status: z.enum(['draft', 'posted', 'reversed']).optional(),
  }).passthrough()
);

const journalEntryFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sourceType: z.enum(['invoice', 'expense', 'payment', 'manual', 'credit_note', 'payroll']).optional(),
  sourceId: z.string().uuid().optional(),
  status: z.enum(['draft', 'posted', 'reversed']).optional(),
  accountId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export class JournalEntryController {
  /**
   * POST /api/v1/journal-entries
   * Créer une écriture comptable
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createJournalEntrySchema.parse(req.body);
      const entry = await journalEntryService.create(getCompanyId(req), {
        ...data,
        createdBy: req.user.id,
      });
      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/journal-entries
   * Lister les écritures comptables
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = journalEntryFiltersSchema.parse(req.query);
      const result = await journalEntryService.list(getCompanyId(req), filters);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/journal-entries/:id
   * Obtenir une écriture par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const entry = await journalEntryService.getById(getCompanyId(req), id);
      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/journal-entries/:id
   * Mettre à jour une écriture (seulement si draft)
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateJournalEntrySchema.parse(req.body);
      const entry = await journalEntryService.update(getCompanyId(req), id, data);
      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/journal-entries/:id/post
   * Poster une écriture (changer de draft à posted)
   */
  async post(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const entry = await journalEntryService.post(getCompanyId(req), id);
      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/journal-entries/:id/reverse
   * SPRINT 1 - TASK 1.3 (ARCH-010): Reverse a posted journal entry
   * Creates a compensating entry with flipped debits/credits
   */
  async reverse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        throw new CustomError(
          'Reason is required for journal entry reversal (ACCT-001)',
          400,
          'REASON_REQUIRED'
        );
      }

      const result = await journalEntryService.reverse(
        getCompanyId(req),
        id,
        req.user.id,
        reason
      );

      res.json({
        success: true,
        data: result,
        message: 'Journal entry reversed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/journal-entries/:id
   * Supprimer une écriture (seulement si draft)
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await journalEntryService.delete(getCompanyId(req), id);
      res.json({
        success: true,
        message: 'Journal entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new JournalEntryController();

