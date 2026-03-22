"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const warehouse_service_1 = __importDefault(require("../services/warehouse.service"));
const zod_1 = require("zod");
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
const baseWarehouseSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    isDefault: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional(),
});
const createWarehouseSchema = zod_1.z.preprocess(preprocessData, baseWarehouseSchema);
const updateWarehouseSchema = zod_1.z.preprocess(preprocessData, baseWarehouseSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
}));
class WarehouseController {
    /**
     * POST /api/v1/warehouses
     * Créer un entrepôt
     */
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createWarehouseSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const warehouse = await warehouse_service_1.default.create(companyId, data, req.user.id);
            res.status(201).json({
                success: true,
                data: warehouse,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/warehouses
     * Lister les entrepôts
     */
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const includeInactive = req.query.includeInactive === 'true';
            const warehouses = await warehouse_service_1.default.list(companyId, includeInactive);
            res.json({
                success: true,
                data: warehouses,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/warehouses/:id
     * Obtenir un entrepôt par ID
     */
    async getById(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const warehouse = await warehouse_service_1.default.getById(companyId, id);
            res.json({
                success: true,
                data: warehouse,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/warehouses/:id
     * Mettre à jour un entrepôt
     */
    async update(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const data = updateWarehouseSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const warehouse = await warehouse_service_1.default.update(companyId, id, data, req.user.id);
            res.json({
                success: true,
                data: warehouse,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/warehouses/:id
     * Supprimer un entrepôt
     */
    async delete(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await warehouse_service_1.default.delete(companyId, id, req.user.id);
            res.json({
                success: true,
                message: 'Warehouse deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/warehouses/default
     * Obtenir l'entrepôt par défaut
     */
    async getDefault(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const warehouse = await warehouse_service_1.default.getDefault(companyId);
            res.json({
                success: true,
                data: warehouse,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WarehouseController = WarehouseController;
exports.default = new WarehouseController();
//# sourceMappingURL=warehouse.controller.js.map