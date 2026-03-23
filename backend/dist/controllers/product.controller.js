"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const product_service_1 = __importDefault(require("../services/product.service"));
const stock_service_1 = __importDefault(require("../services/stock.service"));
const logger_1 = __importDefault(require("../utils/logger"));
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
        // Ignorer stockQuantity car il n'est plus utilisé (DOC-03)
        if (key === 'stockQuantity')
            continue;
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
// Schémas de validation
const createProductSchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    sku: zod_1.z.string().optional(),
    type: zod_1.z.enum(['service', 'product']).optional(),
    unitPrice: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(100).optional(),
    category: zod_1.z.string().optional(),
    trackStock: zod_1.z.boolean().optional(),
    lowStockThreshold: zod_1.z.number().int().nonnegative().optional(),
    isActive: zod_1.z.boolean().optional(),
}).passthrough());
const updateProductSchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    sku: zod_1.z.string().optional(),
    type: zod_1.z.enum(['service', 'product']).optional(),
    unitPrice: zod_1.z.number().nonnegative().optional(),
    currency: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(100).optional(),
    category: zod_1.z.string().optional(),
    trackStock: zod_1.z.boolean().optional(),
    lowStockThreshold: zod_1.z.number().int().nonnegative().optional(),
    isActive: zod_1.z.boolean().optional(),
}).passthrough());
const listProductsSchema = zod_1.z.object({
    type: zod_1.z.enum(['service', 'product']).optional(),
    category: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(5000).optional(),
});
class ProductController {
    // Créer un article
    async create(req, res, next) {
        try {
            logger_1.default.info('[ProductController] create called', { body: req.body, userId: req.user?.id });
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            logger_1.default.info('[ProductController] Validating schema...');
            const validated = createProductSchema.parse(req.body);
            // Type assertion nécessaire car z.preprocess() avec extend() ne préserve pas exactement le type
            const data = validated;
            logger_1.default.info('[ProductController] Schema validated', { data: { name: data.name, type: data.type } });
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            logger_1.default.info('[ProductController] Calling productService.create', { companyId });
            const product = await product_service_1.default.create(companyId, data);
            logger_1.default.info('[ProductController] Product created successfully', { productId: product.id });
            res.status(201).json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            logger_1.default.error('[ProductController] Error in create', {
                error: error.message,
                stack: error.stack,
                name: error.name,
                body: req.body,
            });
            next(error);
        }
    }
    // Obtenir un article
    async getById(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const product = await product_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Lister les articles
    async list(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = listProductsSchema.parse(req.query);
            const result = await product_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir les catégories
    async getCategories(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const categories = await product_service_1.default.getCategories((0, auth_middleware_1.getCompanyId)(req));
            res.json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour un article
    async update(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const data = updateProductSchema.parse(req.body);
            const product = await product_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data);
            res.json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Supprimer un article
    async delete(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            await product_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                message: 'Product deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Exporter en CSV
    async exportCSV(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = listProductsSchema.parse(req.query);
            const csvContent = await product_service_1.default.exportToCSV((0, auth_middleware_1.getCompanyId)(req), filters);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
            res.send(csvContent);
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir les alertes de stock faible
    async getStockAlerts(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const alerts = await stock_service_1.default.getLowStockAlerts((0, auth_middleware_1.getCompanyId)(req));
            res.json({
                success: true,
                data: alerts,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
exports.default = new ProductController();
//# sourceMappingURL=product.controller.js.map