"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementValidationService = void 0;
/**
 * ARCH-004: Règles de validation des mouvements de stock (DOC-03) et helpers.
 */
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
class StockMovementValidationService {
    /**
     * Vérifier que le module Stock est activé pour la company.
     */
    async ensureStockModuleEnabled(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { module_stock_enabled: true },
        });
        if (!company || !company.module_stock_enabled) {
            throw new error_middleware_1.CustomError('Stock module is not enabled for this company', 403, 'STOCK_MODULE_DISABLED');
        }
    }
    /**
     * Valider un mouvement selon DOC-03 (datarissage, module, produits actifs, entrepôts, stock suffisant pour OUT).
     */
    async validateMovement(companyId, movement, getStock) {
        const errors = [];
        const warnings = [];
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: {
                datarissage_completed: true,
                module_stock_enabled: true,
                stock_allow_negative: true,
            },
        });
        if (!company) {
            errors.push('Company not found');
            return { valid: false, errors, warnings };
        }
        if (!company.datarissage_completed) {
            errors.push('Datarissage must be completed before validating stock movements');
        }
        if (!company.module_stock_enabled) {
            errors.push('Stock module must be enabled');
        }
        for (const item of movement.items) {
            if (!item.products?.is_active) {
                errors.push(`Product ${item.products?.name ?? item.product_id} is not active`);
            }
            if (item.warehouse_id) {
                const warehouse = await database_1.default.warehouses.findFirst({
                    where: {
                        id: item.warehouse_id,
                        company_id: companyId,
                        is_active: true,
                        deleted_at: null,
                    },
                });
                if (!warehouse) {
                    errors.push(`Warehouse ${item.warehouse_id} is not valid or active`);
                }
            }
            if (movement.movement_type === 'OUT' && !company.stock_allow_negative) {
                const currentStock = await getStock(item.product_id, item.warehouse_id || undefined);
                if (currentStock < Number(item.quantity)) {
                    errors.push(`Insufficient stock for product ${item.products?.name ?? item.product_id}: available ${currentStock}, requested ${item.quantity}`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Type de mouvement inverse (IN↔OUT, ADJUSTMENT/TRANSFER invariants pour le libellé).
     */
    getReversedType(type) {
        switch (type) {
            case 'IN':
                return 'OUT';
            case 'OUT':
                return 'IN';
            case 'ADJUSTMENT':
            case 'TRANSFER':
                return type;
            default:
                throw new error_middleware_1.CustomError(`Invalid movement type: ${type}`, 400, 'INVALID_TYPE');
        }
    }
}
exports.StockMovementValidationService = StockMovementValidationService;
exports.default = new StockMovementValidationService();
//# sourceMappingURL=stockMovementValidation.service.js.map