"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
const supplier_service_1 = __importDefault(require("../services/supplier.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
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
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
// Schéma de base pour les fournisseurs
const baseSupplierSchema = zod_1.z.object({
    businessName: zod_1.z.string().optional(),
    contactPerson: zod_1.z.string().optional(),
    email: zod_1.z.union([zod_1.z.string().email(), zod_1.z.literal('')]).optional().transform(val => val === '' ? undefined : val),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
    nif: zod_1.z.string().optional(),
    rccm: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    accountId: zod_1.z.string().uuid().optional(),
}).passthrough();
// Schémas de validation
const createSupplierSchema = zod_1.z.preprocess(preprocessData, baseSupplierSchema.extend({
    name: zod_1.z.string().min(1), // Requis pour la création
}));
const updateSupplierSchema = zod_1.z.preprocess(preprocessData, baseSupplierSchema.extend({
    name: zod_1.z.string().min(1).optional(),
}));
const supplierFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
class SupplierController {
    /**
     * POST /api/v1/suppliers
     * Créer un fournisseur
     */
    async create(req, res, next) {
        try {
            const validated = createSupplierSchema.parse(req.body);
            // Type assertion nécessaire car z.preprocess() avec extend() ne préserve pas exactement le type
            const data = validated;
            const supplier = await supplier_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), data);
            res.status(201).json({
                success: true,
                data: supplier,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/suppliers
     * Lister les fournisseurs
     */
    async list(req, res, next) {
        try {
            const filters = supplierFiltersSchema.parse(req.query);
            const result = await supplier_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/suppliers/:id
     * Obtenir un fournisseur par ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const supplier = await supplier_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                data: supplier,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/suppliers/:id
     * Mettre à jour un fournisseur
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = updateSupplierSchema.parse(req.body);
            const supplier = await supplier_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data);
            res.json({
                success: true,
                data: supplier,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/suppliers/:id
     * Supprimer un fournisseur
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await supplier_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                message: 'Supplier deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SupplierController = SupplierController;
exports.default = new SupplierController();
//# sourceMappingURL=supplier.controller.js.map