"use strict";
/**
 * Service de gestion des entrepôts (Warehouses)
 * DOC-03 : Support multi-entrepôts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const uuid_1 = require("uuid");
const audit_service_1 = __importDefault(require("./audit.service"));
class WarehouseService {
    /**
     * Créer un entrepôt
     * DOC-08 : Audit logging obligatoire
     */
    async create(companyId, data, userId) {
        // Si c'est l'entrepôt par défaut, désactiver les autres
        if (data.isDefault) {
            await database_1.default.warehouses.updateMany({
                where: {
                    company_id: companyId,
                    is_default: true,
                },
                data: {
                    is_default: false,
                },
            });
        }
        const warehouse = await database_1.default.warehouses.create({
            data: {
                id: (0, uuid_1.v4)(),
                company_id: companyId,
                name: data.name,
                code: data.code || null,
                address: data.address || null,
                city: data.city || null,
                country: data.country || null,
                is_default: data.isDefault || false,
                notes: data.notes || null,
                is_active: true,
            },
        });
        logger_1.default.info(`Warehouse created`, {
            warehouseId: warehouse.id,
            companyId,
            name: warehouse.name,
        });
        // DOC-08: Log de création
        if (userId) {
            await audit_service_1.default.logCreate(companyId, userId, undefined, undefined, 'warehouse', warehouse.id, warehouse, 'stock');
        }
        return warehouse;
    }
    /**
     * Lister les entrepôts d'une entreprise
     */
    async list(companyId, includeInactive = false) {
        const warehouses = await database_1.default.warehouses.findMany({
            where: {
                company_id: companyId,
                ...(includeInactive ? {} : { is_active: true }),
                deleted_at: null,
            },
            orderBy: [
                { is_default: 'desc' },
                { name: 'asc' },
            ],
        });
        return warehouses;
    }
    /**
     * Obtenir un entrepôt par ID
     */
    async getById(companyId, warehouseId) {
        const warehouse = await database_1.default.warehouses.findFirst({
            where: {
                id: warehouseId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!warehouse) {
            throw new error_middleware_1.CustomError('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
        }
        return warehouse;
    }
    /**
     * Mettre à jour un entrepôt
     * DOC-08 : Audit logging obligatoire
     */
    async update(companyId, warehouseId, data, userId) {
        const before = await this.getById(companyId, warehouseId); // Vérifier existence et récupérer état avant
        // Si on définit comme défaut, désactiver les autres
        if (data.isDefault) {
            await database_1.default.warehouses.updateMany({
                where: {
                    company_id: companyId,
                    is_default: true,
                    id: { not: warehouseId },
                },
                data: {
                    is_default: false,
                },
            });
        }
        const warehouse = await database_1.default.warehouses.update({
            where: { id: warehouseId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.code !== undefined && { code: data.code || null }),
                ...(data.address !== undefined && { address: data.address || null }),
                ...(data.city !== undefined && { city: data.city || null }),
                ...(data.country !== undefined && { country: data.country || null }),
                ...(data.isDefault !== undefined && { is_default: data.isDefault }),
                ...(data.isActive !== undefined && { is_active: data.isActive }),
                ...(data.notes !== undefined && { notes: data.notes || null }),
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Warehouse updated`, {
            warehouseId,
            companyId,
        });
        // DOC-08: Log de modification
        if (userId) {
            await audit_service_1.default.logUpdate(companyId, userId, undefined, undefined, 'warehouse', warehouseId, before, warehouse, 'stock');
        }
        return warehouse;
    }
    /**
     * Supprimer un entrepôt (soft delete)
     * DOC-08 : Audit logging obligatoire
     * DOC-03 : Vérification mouvements validés (règle non négociable)
     */
    async delete(companyId, warehouseId, userId) {
        const before = await this.getById(companyId, warehouseId); // Vérifier existence et récupérer état avant
        // Vérifier qu'il n'y a pas de mouvements de stock liés
        const movementsCount = await database_1.default.stock_movement_items.count({
            where: {
                warehouse_id: warehouseId,
                stock_movements: {
                    company_id: companyId,
                    status: 'VALIDATED',
                },
            },
        });
        if (movementsCount > 0) {
            throw new error_middleware_1.CustomError(`Cannot delete warehouse with validated stock movements (${movementsCount} movements)`, 400, 'WAREHOUSE_HAS_MOVEMENTS');
        }
        await database_1.default.warehouses.update({
            where: { id: warehouseId },
            data: {
                deleted_at: new Date(),
                is_active: false,
            },
        });
        logger_1.default.info(`Warehouse deleted`, {
            warehouseId,
            companyId,
        });
        // DOC-08: Log de suppression (soft delete)
        if (userId) {
            await audit_service_1.default.logDelete(companyId, userId, undefined, undefined, 'warehouse', warehouseId, before, 'stock');
        }
    }
    /**
     * Obtenir l'entrepôt par défaut d'une entreprise
     */
    async getDefault(companyId) {
        const warehouse = await database_1.default.warehouses.findFirst({
            where: {
                company_id: companyId,
                is_default: true,
                is_active: true,
                deleted_at: null,
            },
        });
        return warehouse;
    }
}
exports.WarehouseService = WarehouseService;
exports.default = new WarehouseService();
//# sourceMappingURL=warehouse.service.js.map