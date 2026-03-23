import { Response, NextFunction } from 'express';
import contractService, {
  CreateContractData,
  UpdateContractData,
  SignContractData,
  ContractFilters,
} from '../services/contract.service';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import { z } from 'zod';
import logger from '../utils/logger';

// Schémas de validation
const createContractSchema = z.object({
  companyId: z.string().uuid(),
  accountantId: z.string().uuid(),
  type: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  templateId: z.string().optional(),
  fileUrl: z.string().url().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const updateContractSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  templateId: z.string().optional(),
  fileUrl: z.string().url().optional(),
  status: z.enum(['draft', 'pending', 'signed', 'expired', 'cancelled']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const signContractSchema = z.object({
  signature: z.string().min(1, 'Signature is required'),
});

export class ContractController {
  /**
   * POST /api/v1/contracts
   * Créer un contrat
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createContractSchema.parse(req.body);
      const contract = await contractService.create(data);
      res.status(201).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts/:id
   * Obtenir un contrat
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId || undefined;
      const accountantId = req.user?.id || undefined;
      
      const contract = await contractService.getById(id, companyId, accountantId);
      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts
   * Lister les contrats
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters: ContractFilters = {
        companyId: req.query.companyId as string | undefined,
        accountantId: req.query.accountantId as string | undefined,
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
      };

      // Si l'utilisateur a une entreprise, filtrer par défaut
      if (req.user?.companyId && !filters.companyId) {
        filters.companyId = req.user.companyId;
      }

      // Si l'utilisateur est un expert, filtrer par défaut
      if (req.user?.id && !filters.accountantId && req.user.companyId === null) {
        filters.accountantId = req.user.id;
      }

      const contracts = await contractService.list(filters);
      res.json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/contracts/:id
   * Mettre à jour un contrat
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateContractSchema.parse(req.body);
      const companyId = req.user?.companyId || undefined;
      const accountantId = req.user?.id || undefined;
      
      const contract = await contractService.update(id, data, companyId, accountantId);
      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/contracts/:id/sign/company
   * Signer un contrat (par l'entreprise)
   */
  async signByCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const data = signContractSchema.parse(req.body);
      
      const contract = await contractService.signByCompany(id, {
        ...data,
        signedBy: req.user.id,
      });
      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/contracts/:id/sign/accountant
   * Signer un contrat (par l'expert)
   */
  async signByAccountant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const data = signContractSchema.parse(req.body);
      const contract = await contractService.signByAccountant(id, {
        ...data,
        signedBy: req.user.id,
      });
      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/contracts/:id
   * Annuler un contrat
   */
  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      
      const companyId = req.user?.companyId || undefined;
      const accountantId = req.user?.id || undefined;
      
      const contract = await contractService.cancel(id, req.user.id, companyId, accountantId);
      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/contracts/templates
   * Obtenir les templates de contrats
   */
  async getTemplates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const templates = await contractService.getTemplates();
      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ContractController();

