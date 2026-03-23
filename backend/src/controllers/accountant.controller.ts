import { Response, NextFunction } from 'express';
import accountantService from '../services/accountant.service';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import { z } from 'zod';
import logger from '../utils/logger';

// Schémas de validation
const searchAccountantsSchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  isAvailable: z.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

const inviteAccountantSchema = z.object({
  accountantId: z.string().uuid(),
  message: z.string().optional(),
});

const acceptInvitationSchema = z.object({
  contractId: z.string().uuid().optional(),
  acceptanceMessage: z.string().optional(),
});

const rejectInvitationSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

const createProfileSchema = z.object({
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  experienceYears: z.number().int().positive().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  professionalEmail: z.string().email().optional(),
  professionalPhone: z.string().optional(),
  website: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  maxCompanies: z.number().int().positive().optional(),
});

const updateProfileSchema = createProfileSchema.partial();

export class AccountantController {
  /**
   * GET /api/v1/accountants/firms
   * Suggérer / lister les cabinets d'experts (type LinkedIn)
   */
  async searchFirms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        search: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
      });
      const { search, country, city } = schema.parse(req.query);

      const firms = await accountantService.searchFirms({ query: search, country, city });

      res.json({
        success: true,
        data: firms,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accountants/search
   * Rechercher des experts comptables
   */
  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = searchAccountantsSchema.parse(req.query);
      const result = await accountantService.searchAccountants(filters);
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
   * GET /api/v1/accountants/:id
   * Obtenir le profil d'un expert
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const profile = await accountantService.getAccountantProfile(id);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/accountants/invite
   * Inviter un expert comptable (par une entreprise)
   */
  async invite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const data = inviteAccountantSchema.parse(req.body);
      if (!req.user?.id) {
        throw new Error('User not authenticated');
      }
      const relation = await accountantService.inviteAccountant(companyId, data.accountantId, req.user.id);
      res.status(201).json({
        success: true,
        data: relation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/accountants/invitations/:id/accept
   * Accepter une invitation (par l'expert)
   */
  async acceptInvitation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = acceptInvitationSchema.parse(req.body);
      
      // Vérifier que l'utilisateur est un expert
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const relation = await accountantService.acceptInvitation(id, req.user.id);
      res.json({
        success: true,
        data: relation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/accountants/invitations/:id/reject
   * Rejeter une invitation (par l'expert)
   */
  async rejectInvitation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = rejectInvitationSchema.parse(req.body);
      
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const relation = await accountantService.rejectInvitation(id, req.user.id);
      res.json({
        success: true,
        data: relation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accountants/invitations
   * Obtenir les invitations reçues (pour un expert)
   */
  async getInvitations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const invitations = await accountantService.getInvitations(req.user.id);
      res.json({
        success: true,
        data: invitations,
      });
    } catch (error: any) {
      // Si l'expert n'est pas trouvé, retourner une liste vide plutôt qu'une 404
      if (error.code === 'ACCOUNTANT_NOT_FOUND') {
        return res.json({
          success: true,
          data: [],
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/accountants/companies
   * Obtenir les entreprises gérées (pour un expert)
   */
  async getManagedCompanies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const companies = await accountantService.getManagedCompanies(req.user.id);
      res.json({
        success: true,
        data: companies,
      });
    } catch (error: any) {
      // Si l'expert n'est pas trouvé, retourner une liste vide plutôt qu'une 404
      if (error.code === 'ACCOUNTANT_NOT_FOUND') {
        return res.json({
          success: true,
          data: [],
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/accountants/company/:companyId
   * Obtenir les experts d'une entreprise
   */
  async getCompanyAccountants(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const { companyId: paramCompanyId } = req.params;
      
      // Vérifier que l'utilisateur a accès à cette entreprise
      if (paramCompanyId && paramCompanyId !== companyId) {
        throw new Error('Unauthorized');
      }
      
      const accountants = await accountantService.getCompanyAccountants(companyId);
      res.json({
        success: true,
        data: accountants,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/accountants/relations/:id
   * Révocation d'un expert (par l'entreprise)
   */
  async revoke(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      const { id } = req.params;
      if (!req.user?.id) {
        throw new Error('User not authenticated');
      }
      const relation = await accountantService.revokeAccountant(companyId, id);
      res.json({
        success: true,
        data: relation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/accountants/profile
   * Créer ou mettre à jour le profil expert
   */
  async createOrUpdateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const data = createProfileSchema.parse(req.body);
      const profile = await accountantService.createOrUpdateProfile(req.user.id, data);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/accountants/profile
   * Mettre à jour le profil expert
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const data = updateProfileSchema.parse(req.body);
      const profile = await accountantService.createOrUpdateProfile(req.user.id, data);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/accountants/cabinet
   * Créer le propre cabinet d'un expert comptable
   */
  async createCabinet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }

      const schema = z.object({
        name: z.string().min(1, 'Le nom du cabinet est requis'),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const company = await accountantService.createOwnCabinet(req.user.id, data);
      
      res.status(201).json({
        success: true,
        data: company,
        message: 'Cabinet créé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accountants/dashboard-stats
   * Obtenir les statistiques consolidées pour le dashboard expert comptable
   */
  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }

      const stats = await accountantService.getDashboardStats(req.user.id);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      // Si l'expert n'est pas trouvé, retourner des stats vides
      if (error.code === 'ACCOUNTANT_NOT_FOUND') {
        return res.json({
          success: true,
          data: {
            totalCompanies: 0,
            activeCompanies: 0,
            pendingInvitations: 0,
            totalRevenue: 0,
            totalInvoices: 0,
            unpaidInvoices: 0,
            companiesStats: [],
          },
        });
      }
      next(error);
    }
  }
}

export default new AccountantController();

