"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementCalculationService = void 0;
/**
 * ARCH-004: Calcul des stocks à partir des mouvements validés (DOC-03).
 * Le stock est calculé, jamais stocké.
 */
const database_1 = __importDefault(require("../../config/database"));
class StockMovementCalculationService {
    /**
     * Calculer le stock disponible pour un produit (et entrepôt si spécifié).
     */
    async calculateStock(companyId, productId, warehouseId) {
        const stockMap = await this.calculateStockMany(companyId, [productId], warehouseId);
        return stockMap.get(productId) || 0;
    }
    /**
     * Calculer le stock pour plusieurs produits (batch, évite N+1).
     */
    async calculateStockMany(companyId, productIds, warehouseId) {
        if (!productIds || productIds.length === 0) {
            return new Map();
        }
        const items = await database_1.default.stock_movement_items.findMany({
            where: {
                product_id: { in: productIds },
                stock_movements: {
                    company_id: companyId,
                    status: 'VALIDATED',
                    reversed_at: null,
                },
                ...(warehouseId
                    ? {
                        OR: [
                            { warehouse_id: warehouseId },
                            { warehouse_to_id: warehouseId },
                        ],
                    }
                    : {}),
            },
            include: {
                stock_movements: {
                    select: { movement_type: true },
                },
            },
        });
        const stockMap = new Map();
        for (const pid of productIds) {
            stockMap.set(pid, 0);
        }
        for (const item of items) {
            const productId = item.product_id;
            const quantity = Number(item.quantity);
            const movementType = item.stock_movements.movement_type;
            let currentStock = stockMap.get(productId) || 0;
            switch (movementType) {
                case 'IN':
                    currentStock += quantity;
                    break;
                case 'OUT':
                    currentStock -= quantity;
                    break;
                case 'ADJUSTMENT':
                    currentStock += quantity;
                    break;
                case 'TRANSFER':
                    if (warehouseId) {
                        if (item.warehouse_id === warehouseId) {
                            currentStock -= quantity;
                        }
                        else if (item.warehouse_to_id === warehouseId) {
                            currentStock += quantity;
                        }
                    }
                    break;
            }
            stockMap.set(productId, currentStock);
        }
        for (const pid of productIds) {
            const val = stockMap.get(pid) || 0;
            stockMap.set(pid, Math.max(0, val));
        }
        return stockMap;
    }
}
exports.StockMovementCalculationService = StockMovementCalculationService;
exports.default = new StockMovementCalculationService();
//# sourceMappingURL=stockMovementCalculation.service.js.map