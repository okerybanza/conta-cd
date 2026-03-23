import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import employeeDocumentService from '../services/employeeDocument.service';
import { z } from 'zod';

const createEmployeeDocumentSchema = z.object({
  employeeId: z.string().uuid(),
  documentType: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  fileId: z.string().uuid(),
  expiryDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

const updateEmployeeDocumentSchema = z.object({
  documentType: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  fileId: z.string().uuid().optional(),
  expiryDate: z.string().or(z.date()).nullable().optional(),
  notes: z.string().optional(),
});

const listEmployeeDocumentsSchema = z.object({
  employeeId: z.string().uuid().optional(),
  documentType: z.string().optional(),
  isExpired: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export class EmployeeDocumentController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = createEmployeeDocumentSchema.parse(req.body);
      const document = await employeeDocumentService.create(getCompanyId(req), data);
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const document = await employeeDocumentService.getById(getCompanyId(req), id);
      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = listEmployeeDocumentsSchema.parse(req.query);
      const result = await employeeDocumentService.list(getCompanyId(req), filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const data = updateEmployeeDocumentSchema.parse(req.body);
      const document = await employeeDocumentService.update(getCompanyId(req), id, data);
      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      await employeeDocumentService.delete(getCompanyId(req), id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async getExpiring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const daysBeforeExpiry = req.query.days
        ? parseInt(req.query.days as string, 10)
        : 30;
      const documents = await employeeDocumentService.getExpiringDocuments(
        getCompanyId(req),
        daysBeforeExpiry
      );
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  async getExpired(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const documents = await employeeDocumentService.getExpiredDocuments(getCompanyId(req));
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeDocumentController();

