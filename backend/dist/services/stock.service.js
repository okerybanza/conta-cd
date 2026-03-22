"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const event_bus_1 = require("../events/event-bus");
const domain_event_1 = require("../events/domain-event");
const stock_movement_service_1 = __importDefault(require("./stock-movement.service"));
class StockService {
    /**
     * Vérifier si le stock est disponible pour un produit
     */
    async checkStock(companyId, productId, requestedQuantity) {
        const product = await database_1.default.products.findFirst({
            where: {
                id: productId,
                company_id: companyId,
                deleted_at: null,
            },
            select: {
                id: true,
                name: true,
                type: true,
                stock: true,
                min_stock: true,
                track_stock: true,
            },
        });
        if (!product) {
            throw new error_middleware_1.CustomError('Product not found', 404, 'PRODUCT_NOT_FOUND');
        }
        // Si c'est un service ou si le suivi de stock est désactivé
        if (product.type === 'service' || product.track_stock === false) {
            return {
                available: true,
                requested: requestedQuantity,
                availableQuantity: Infinity,
                productId: product.id,
                productName: product.name,
            };
        }
        // Calculer le stock réel via le service de mouvement
        const currentStock = await stock_movement_service_1.default.calculateStock(companyId, productId);
        const available = currentStock >= requestedQuantity;
        return {
            available,
            requested: requestedQuantity,
            availableQuantity: currentStock,
            productId: product.id,
            productName: product.name,
        };
    }
    /**
     * Vérifier le stock pour plusieurs produits
     */
    async checkMultipleStocks(companyId, items) {
        const results = [];
        for (const item of items) {
            if (!item.productId)
                continue;
            try {
                const result = await this.checkStock(companyId, item.productId, item.quantity);
                results.push(result);
            }
            catch (error) {
                logger_1.default.error('Error checking stock for product', {
                    companyId,
                    productId: item.productId,
                    error: error.message,
                });
                results.push({
                    available: false,
                    requested: item.quantity,
                    availableQuantity: 0,
                    productId: item.productId,
                    productName: 'Unknown',
                });
            }
        }
        return results;
    }
    /**
     * Décrémenter le stock d'un produit (via StockMovementService)
     */
    async decrementStock(companyId, productId, quantity, reference, referenceId, userId) {
        const movementId = await stock_movement_service_1.default.create(companyId, userId || 'system', {
            movementType: 'OUT',
            items: [{ productId, quantity }],
            reference,
            referenceId,
        });
        await stock_movement_service_1.default.validate(companyId, movementId, userId || 'system');
    }
    /**
     * Incrémenter le stock d'un produit (via StockMovementService)
     */
    async incrementStock(companyId, productId, quantity, reference, referenceId, userId) {
        const movementId = await stock_movement_service_1.default.create(companyId, userId || 'system', {
            movementType: 'IN',
            items: [{ productId, quantity }],
            reference,
            referenceId,
        });
        await stock_movement_service_1.default.validate(companyId, movementId, userId || 'system');
    }
    /**
     * Obtenir les alertes de stock faible
     */
    async getLowStockAlerts(companyId) {
        const products = await database_1.default.products.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                is_active: true,
                type: 'product',
                track_stock: true,
            },
            select: {
                id: true,
                name: true,
                min_stock: true,
            },
        });
        const alerts = [];
        for (const product of products) {
            const currentStock = await stock_movement_service_1.default.calculateStock(companyId, product.id);
            const minStock = Number(product.min_stock || 0);
            if (currentStock <= minStock) {
                let status = 'low';
                if (currentStock <= 0)
                    status = 'out_of_stock';
                else if (currentStock <= minStock / 2)
                    status = 'critical';
                alerts.push({
                    productId: product.id,
                    productName: product.name,
                    currentStock,
                    minStock,
                    status,
                });
            }
        }
        return alerts;
    }
    /**
     * Ajuster le stock à une valeur spécifique
     */
    async adjustStock(companyId, productId, newQuantity, reason, userId) {
        const currentStock = await stock_movement_service_1.default.calculateStock(companyId, productId);
        const adjustment = newQuantity - currentStock;
        if (adjustment === 0)
            return;
        const movementType = adjustment > 0 ? 'IN' : 'OUT';
        const movementId = await stock_movement_service_1.default.create(companyId, userId || 'system', {
            movementType: adjustment > 0 ? 'IN' : 'OUT',
            items: [{ productId, quantity: Math.abs(adjustment) }],
            reason: `Adjustment: ${reason}`,
        });
        await stock_movement_service_1.default.validate(companyId, movementId, userId || 'system');
        // Trigger explicit event for backward compatibility / other listeners if needed
        const event = new domain_event_1.StockAdjusted({
            companyId,
            userId,
            timestamp: new Date(),
        }, productId, currentStock, newQuantity, reason, undefined);
        await event_bus_1.eventBus.publish(event);
    }
    /**
     * Obtenir le stock actuel d'un produit (méthode de compatibilité)
     */
    async getProductStock(companyId, productId) {
        return stock_movement_service_1.default.calculateStock(companyId, productId);
    }
}
exports.StockService = StockService;
exports.default = new StockService();
//# sourceMappingURL=stock.service.js.map