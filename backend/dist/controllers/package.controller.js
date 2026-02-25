"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageController = void 0;
const package_service_1 = __importDefault(require("../services/package.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class PackageController {
    /**
     * GET /api/v1/packages
     * Liste tous les packages actifs
     */
    async list(req, res, next) {
        try {
            const packages = await package_service_1.default.getAll();
            // Transformer price en priceMonthly pour le frontend
            const transformedPackages = packages.map((pkg) => ({
                ...pkg,
                priceMonthly: Number(pkg.price),
                priceYearly: pkg.billingCycle === 'yearly' ? Number(pkg.price) : Number(pkg.price) * 10, // Approximation
                price: undefined, // Retirer price pour éviter confusion
            }));
            res.json({
                success: true,
                data: transformedPackages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/packages/:id
     * Obtenir un package par ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const packageData = await package_service_1.default.getById(id);
            // Transformer price en priceMonthly pour le frontend
            const transformed = {
                ...packageData,
                priceMonthly: Number(packageData.price),
                priceYearly: packageData.billingCycle === 'yearly'
                    ? Number(packageData.price)
                    : Number(packageData.price) * 10,
                price: undefined,
            };
            res.json({
                success: true,
                data: transformed,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/packages/code/:code
     * Obtenir un package par code
     */
    async getByCode(req, res, next) {
        try {
            const { code } = req.params;
            const packageData = await package_service_1.default.getByCode(code);
            // Transformer price en priceMonthly pour le frontend
            const transformed = {
                ...packageData,
                priceMonthly: Number(packageData.price),
                priceYearly: packageData.billingCycle === 'yearly'
                    ? Number(packageData.price)
                    : Number(packageData.price) * 10,
                price: undefined,
            };
            res.json({
                success: true,
                data: transformed,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/packages
     * Créer un nouveau package (Super Admin uniquement)
     */
    async create(req, res, next) {
        try {
            const { code, name, description, price, currency, limits, features, isActive, displayOrder } = req.body;
            if (!code || !name || price === undefined) {
                throw new error_middleware_1.CustomError('code, name et price sont requis', 400, 'MISSING_REQUIRED_FIELDS');
            }
            const newPackage = await package_service_1.default.create({
                code,
                name,
                description,
                price,
                currency,
                limits,
                features,
                isActive,
                displayOrder,
            });
            // Logger l'action si c'est un Super Admin
            // TODO: Implémenter l'audit pour les packages
            if (req.user && (req.user.isSuperAdmin || req.user.isContaUser)) {
                logger_1.default.info('Package created', {
                    userId: req.user.id,
                    packageId: newPackage.id,
                    packageName: newPackage.name,
                });
            }
            res.json({
                success: true,
                data: newPackage,
                message: 'Package créé avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/packages/:id
     * Mettre à jour un package (Super Admin uniquement)
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description, price, limits, features, isActive, displayOrder } = req.body;
            // Récupérer l'ancien package pour l'audit
            const oldPackage = await package_service_1.default.getById(id);
            const oldData = {
                name: oldPackage.name,
                description: oldPackage.description,
                price: Number(oldPackage.price),
                limits: oldPackage.limits,
                features: oldPackage.features,
                isActive: oldPackage.is_active ?? true,
                displayOrder: oldPackage.display_order ?? 0,
            };
            const updated = await package_service_1.default.update(id, {
                name,
                description,
                price,
                limits,
                features,
                isActive,
                displayOrder,
            });
            // Logger l'action si c'est un Super Admin
            // TODO: Implémenter l'audit pour les packages
            if (req.user && (req.user.isSuperAdmin || req.user.isContaUser)) {
                logger_1.default.info('Package updated', {
                    userId: req.user.id,
                    packageId: id,
                    packageName: updated.name,
                });
            }
            res.json({
                success: true,
                data: updated,
                message: 'Package mis à jour avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/packages/:id
     * Supprimer un package (Super Admin uniquement)
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const { force } = req.query;
            // Récupérer le package avant suppression pour l'audit
            const packageData = await package_service_1.default.getById(id);
            const packageInfo = {
                id: packageData.id,
                code: packageData.code,
                name: packageData.name,
            };
            // Obtenir le nombre de subscriptions actives
            const activeSubscriptions = await package_service_1.default.getActiveSubscriptionsCount(id);
            const result = await package_service_1.default.delete(id, force === 'true');
            // Logger l'action si c'est un Super Admin
            // TODO: Implémenter l'audit pour les packages
            if (req.user && (req.user.isSuperAdmin || req.user.isContaUser)) {
                logger_1.default.info('Package deleted', {
                    userId: req.user.id,
                    packageId: id,
                    packageInfo,
                    activeSubscriptions,
                    force: force === 'true',
                }, req.ip, req.get('user-agent'));
            }
            res.json({
                success: true,
                data: result,
                message: result.message || 'Package supprimé avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/packages/:id/subscriptions-count
     * Obtenir le nombre de subscriptions actives pour un package
     */
    async getSubscriptionsCount(req, res, next) {
        try {
            const { id } = req.params;
            const count = await package_service_1.default.getActiveSubscriptionsCount(id);
            res.json({
                success: true,
                data: { count },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PackageController = PackageController;
exports.default = new PackageController();
//# sourceMappingURL=package.controller.js.map