"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const stock_movement_service_1 = __importDefault(require("../services/stock-movement.service"));
const zod_1 = require("zod");
// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
// Fonction helper pour préprocesser les données
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'items' && Array.isArray(value)) {
            // Préprocesser chaque item du tableau
            cleaned[key] = value.map((item) => {
                if (typeof item !== 'object' || item === null)
                    return item;
                const cleanedItem = {};
                for (const [itemKey, itemValue] of Object.entries(item)) {
                    cleanedItem[itemKey] = preprocessEmptyString(itemValue);
                }
                return cleanedItem;
            });
        }
        else {
            cleaned[key] = preprocessEmptyString(value);
        }
    }
    return cleaned;
};
// Schémas de validation
const stockMovementItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    warehouseId: zod_1.z.string().uuid().optional(),
    warehouseToId: zod_1.z.string().uuid().optional(),
    quantity: zod_1.z.number().positive(),
    batchId: zod_1.z.string().optional(),
    serialNumber: zod_1.z.string().optional(),
});
const createMovementSchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    movementType: zod_1.z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
    items: zod_1.z.array(stockMovementItemSchema).min(1),
    reference: zod_1.z.string().optional(),
    referenceId: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
}).passthrough());
const listMovementsSchema = zod_1.z.object({
    movementType: zod_1.z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']).optional(),
    status: zod_1.z.enum(['DRAFT', 'VALIDATED']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
const reverseMovementSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, "Reason must be at least 5 characters long"),
});
class StockMovementController {
    // Créer un mouvement
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createMovementSchema.parse(req.body);
            const movementId = await stock_movement_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), req.user.id, data);
            res.status(201).json({
                success: true,
                data: { id: movementId },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Valider un mouvement
    async validate(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            await stock_movement_service_1.default.validate((0, auth_middleware_1.getCompanyId)(req), id, req.user.id);
            res.json({
                success: true,
                message: 'Stock movement validated successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Inverser un mouvement
    async reverse(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const { reason } = reverseMovementSchema.parse(req.body);
            const reversalId = await stock_movement_service_1.default.reverse((0, auth_middleware_1.getCompanyId)(req), id, req.user.id, reason);
            res.json({
                success: true,
                data: { reversalId },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir un mouvement
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const movement = await stock_movement_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                data: movement,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Lister les mouvements
    async list(req, res, next) {
        try {
            const filters = listMovementsSchema.parse(req.query);
            const result = await stock_movement_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), {
                ...filters,
                startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            });
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Calculer le stock disponible
    async calculateStock(req, res, next) {
        try {
            const { productId } = req.params;
            const { warehouseId } = req.query;
            const stock = await stock_movement_service_1.default.calculateStock((0, auth_middleware_1.getCompanyId)(req), productId, warehouseId);
            res.json({
                success: true,
                data: { stock },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StockMovementController = StockMovementController;
exports.default = new StockMovementController();
//# sourceMappingURL=stock-movement.controller.js.map