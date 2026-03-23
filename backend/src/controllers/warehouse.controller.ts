import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import warehouseService from '../services/warehouse.service';
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

const baseWarehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
  notes: z.string().optional(),
});

const createWarehouseSchema = z.preprocess(
  preprocessData,
  baseWarehouseSchema
);

const updateWarehouseSchema = z.preprocess(
  preprocessData,
  baseWarehouseSchema.partial().extend({
    isActive: z.boolean().optional(),
  })
);

export class WarehouseController {
  /**
   * POST /api/v1/warehouses
   * Créer un entrepôt
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = createWarehouseSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const warehouse = await warehouseService.create(companyId, data, req.user.id);
      res.status(201).json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/warehouses
   * Lister les entrepôts
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const companyId = getCompanyId(req);
      const includeInactive = req.query.includeInactive === 'true';
      const warehouses = await warehouseService.list(companyId, includeInactive);
      res.json({
        success: true,
        data: warehouses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/warehouses/:id
   * Obtenir un entrepôt par ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const warehouse = await warehouseService.getById(companyId, id);
      res.json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/warehouses/:id
   * Mettre à jour un entrepôt
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const data = updateWarehouseSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const warehouse = await warehouseService.update(companyId, id, data, req.user.id);
      res.json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/warehouses/:id
   * Supprimer un entrepôt
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const companyId = getCompanyId(req);
      await warehouseService.delete(companyId, id, req.user.id);
      res.json({
        success: true,
        message: 'Warehouse deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/warehouses/default
   * Obtenir l'entrepôt par défaut
   */
  async getDefault(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const companyId = getCompanyId(req);
      const warehouse = await warehouseService.getDefault(companyId);
      res.json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WarehouseController();
