import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import supportService from '../services/support.service';
import logger from '../utils/logger';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';

const createTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  message: z.string().min(1),
  category: z.enum(['technical', 'billing', 'feature', 'bug', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  response: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const listTicketsSchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export class SupportController {
  // Créer un ticket de support
  async createTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const userId = req.user.id;
      const userEmail = req.user.email;

      const validatedData = createTicketSchema.parse(req.body);

      const ticket = await supportService.createTicket({
        companyId,
        userId,
        userEmail,
        ...validatedData,
      });

      res.status(201).json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  // Lister les tickets de l'entreprise
  async listTickets(req: any, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const filters = listTicketsSchema.parse(req.query);

      const result = await supportService.getCompanyTickets(companyId, filters);

      res.json({
        success: true,
        data: result.tickets,
        pagination: result.pagination,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  // Récupérer un ticket spécifique
  async getTicket(req: any, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const { ticketId } = req.params;

      const ticket = await supportService.getTicket(ticketId, companyId);

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      if (error.message === 'Ticket not found') {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }
      next(error);
    }
  }

  // Mettre à jour un ticket
  async updateTicket(req: any, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const { ticketId } = req.params;
      const validatedData = updateTicketSchema.parse(req.body);

      const ticket = await supportService.updateTicket(ticketId, companyId, validatedData);

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
      }
      if (error.message === 'Ticket not found') {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }
      next(error);
    }
  }
}

export default new SupportController();

