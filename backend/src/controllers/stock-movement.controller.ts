import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import stockMovementService from '../services/stock-movement.service';
import { z } from 'zod';

// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val: any) => {
  if (val === '' || val === null) return undefined;
  return val;
};

// Fonction helper pour préprocesser les données
const preprocessData = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'items' && Array.isArray(value)) {
      // Préprocesser chaque item du tableau
      cleaned[key] = value.map((item: any) => {
        if (typeof item !== 'object' || item === null) return item;
        const cleanedItem: any = {};
        for (const [itemKey, itemValue] of Object.entries(item)) {
          cleanedItem[itemKey] = preprocessEmptyString(itemValue);
        }
        return cleanedItem;
      });
    } else {
      cleaned[key] = preprocessEmptyString(value);
    }
  }
  return cleaned;
};

// Schémas de validation
const stockMovementItemSchema = z.object({
    productId: z.string().uuid(),
    warehouseId: z.string().uuid().optional(),
    warehouseToId: z.string().uuid().optional(),
    quantity: z.number().positive(),
    batchId: z.string().optional(),
    serialNumber: z.string().optional(),
});

const createMovementSchema = z.preprocess(
    preprocessData,
    z.object({
        movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
        items: z.array(stockMovementItemSchema).min(1),
        reference: z.string().optional(),
        referenceId: z.string().optional(),
        reason: z.string().optional(),
    }).passthrough()
);

const listMovementsSchema = z.object({
    movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']).optional(),
    status: z.enum(['DRAFT', 'VALIDATED']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
});

const reverseMovementSchema = z.object({
    reason: z.string().min(5, "Reason must be at least 5 characters long"),
});

export class StockMovementController {
    // Créer un mouvement
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const data = createMovementSchema.parse(req.body);
            const movementId = await stockMovementService.create(getCompanyId(req), req.user.id, data as any);

            res.status(201).json({
                success: true,
                data: { id: movementId },
            });
        } catch (error) {
            next(error);
        }
    }

    // Valider un mouvement
    async validate(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const { id } = req.params;
            await stockMovementService.validate(getCompanyId(req), id, req.user.id);

            res.json({
                success: true,
                message: 'Stock movement validated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    // Inverser un mouvement
    async reverse(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const { id } = req.params;
            const { reason } = reverseMovementSchema.parse(req.body);

            const reversalId = await stockMovementService.reverse(
                getCompanyId(req),
                id,
                req.user.id,
                reason
            );

            res.json({
                success: true,
                data: { reversalId },
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir un mouvement
    async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const movement = await stockMovementService.getById(getCompanyId(req), id);

            res.json({
                success: true,
                data: movement,
            });
        } catch (error) {
            next(error);
        }
    }

    // Lister les mouvements
    async list(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const filters = listMovementsSchema.parse(req.query);
            const result = await stockMovementService.list(getCompanyId(req), {
                ...filters,
                startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            });

            res.json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    // Calculer le stock disponible
    async calculateStock(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;
            const { warehouseId } = req.query;

            const stock = await stockMovementService.calculateStock(
                getCompanyId(req),
                productId,
                warehouseId as string | undefined
            );

            res.json({
                success: true,
                data: { stock },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new StockMovementController();
