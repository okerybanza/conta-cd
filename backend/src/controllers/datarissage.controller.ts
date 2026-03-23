import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import datarissageService from '../services/datarissage.service';
import { z } from 'zod';

// Schémas de validation
const step1Schema = z.object({
  raisonSociale: z.string().min(1),
  pays: z.string().min(1),
  devise: z.string().length(3),
  timezone: z.string().min(1),
  typeActivite: z.string().min(1),
});

const step2Schema = z.object({
  businessType: z.enum(['commerce', 'services', 'production', 'logistique', 'ong', 'multi_activite']),
});

const step3Schema = z.object({
  moduleFacturation: z.boolean(),
  moduleComptabilite: z.boolean(),
  moduleStock: z.boolean(),
  moduleRh: z.boolean(),
});

const step4Schema = z.object({
  stockManagementType: z.enum(['simple', 'multi_warehouses']),
  stockTrackingType: z.enum(['quantity', 'lots', 'serial_numbers']),
  stockAllowNegative: z.boolean(),
  stockValuationMethod: z.enum(['fifo', 'weighted_average']),
}).optional();

const step5Schema = z.object({
  rhOrganizationType: z.enum(['simple', 'departmental', 'multi_entity']),
  rhPayrollEnabled: z.boolean(),
  rhPayrollCycle: z.enum(['monthly', 'other']),
  rhAccountingIntegration: z.boolean(),
}).optional();

const step6Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const completeDatarissageSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
  step5: step5Schema,
  step6: step6Schema,
});

export class DatarissageController {
  /**
   * Compléter le datarissage (toutes les étapes)
   */
  async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      const data = completeDatarissageSchema.parse(req.body);
      const result = await datarissageService.completeDatarissage(
        req.user.companyId,
        data,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Datarissage complété avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir l'état du datarissage
   */
  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      const status = await datarissageService.getDatarissageStatus(req.user.companyId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifier si un champ est verrouillé
   */
  async checkLocked(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.companyId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      const { field } = req.params;
      const isLocked = await datarissageService.isFieldLocked(req.user.companyId, field);

      res.json({
        success: true,
        data: {
          field,
          locked: isLocked,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DatarissageController();

