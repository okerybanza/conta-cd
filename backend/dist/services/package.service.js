"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = require("crypto");
class PackageService {
    /**
     * Obtenir tous les packages actifs
     */
    async getAll() {
        const packages = await database_1.default.packages.findMany({
            where: {
                is_active: true,
            },
            orderBy: {
                display_order: 'asc',
            },
        });
        return packages;
    }
    /**
     * Obtenir un package par ID
     */
    async getById(packageId) {
        const packageData = await database_1.default.packages.findUnique({
            where: { id: packageId },
        });
        if (!packageData) {
            throw new error_middleware_1.CustomError('Package not found', 404, 'PACKAGE_NOT_FOUND');
        }
        return packageData;
    }
    /**
     * Obtenir un package par code
     */
    async getByCode(code) {
        const packageData = await database_1.default.packages.findUnique({
            where: { code },
        });
        if (!packageData) {
            throw new error_middleware_1.CustomError('Package not found', 404, 'PACKAGE_NOT_FOUND');
        }
        return packageData;
    }
    /**
     * Obtenir les limites d'un package
     */
    async getLimits(packageId) {
        const packageData = await this.getById(packageId);
        return packageData.limits || {};
    }
    /**
     * Obtenir les fonctionnalités d'un package
     */
    async getFeatures(packageId) {
        const packageData = await this.getById(packageId);
        return packageData.features || {};
    }
    /**
     * Vérifier si un package a une fonctionnalité
     */
    async hasFeature(packageId, feature) {
        const features = await this.getFeatures(packageId);
        return features[feature] === true;
    }
    /**
     * Obtenir la limite d'une métrique pour un package
     */
    async getLimit(packageId, metric) {
        const limits = await this.getLimits(packageId);
        const limit = limits[metric];
        // null signifie illimité
        return limit === null ? null : (limit || 0);
    }
    /**
     * Créer un nouveau package (Super Admin uniquement)
     */
    async create(data) {
        // Vérifier si le code existe déjà
        const existing = await database_1.default.packages.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            throw new error_middleware_1.CustomError('Un package avec ce code existe déjà', 400, 'PACKAGE_CODE_EXISTS');
        }
        // Obtenir le dernier displayOrder pour définir le suivant
        const lastPackage = await database_1.default.packages.findFirst({
            orderBy: { display_order: 'desc' },
        });
        const newPackage = await database_1.default.packages.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                code: data.code,
                name: data.name,
                description: data.description || null,
                price: data.price,
                currency: data.currency || 'CDF',
                limits: (data.limits || {}),
                features: (data.features || {}),
                is_active: data.isActive !== undefined ? data.isActive : true,
                display_order: data.displayOrder !== undefined ? data.displayOrder : (lastPackage?.display_order || 0) + 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Package created: ${newPackage.id}`, {
            packageId: newPackage.id,
            code: newPackage.code,
            name: newPackage.name,
        });
        return newPackage;
    }
    /**
     * Mettre à jour un package (Super Admin uniquement)
     */
    async update(packageId, data) {
        const packageData = await this.getById(packageId);
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.price !== undefined)
            updateData.price = data.price;
        if (data.limits)
            updateData.limits = data.limits;
        if (data.features)
            updateData.features = data.features;
        if (data.isActive !== undefined)
            updateData.is_active = data.isActive;
        if (data.displayOrder !== undefined)
            updateData.display_order = data.displayOrder;
        const updated = await database_1.default.packages.update({
            where: { id: packageId },
            data: updateData,
        });
        logger_1.default.info(`Package updated: ${packageId}`, {
            packageId,
            changes: Object.keys(data),
        });
        return updated;
    }
    /**
     * Supprimer un package (Super Admin uniquement)
     * Conditions :
     * - Ne peut pas être supprimé s'il a des subscriptions actives
     * - Ne peut pas être supprimé s'il est le seul plan actif
     */
    async delete(packageId, force = false) {
        const packageData = await this.getById(packageId);
        // Vérifier s'il y a des subscriptions actives
        const activeSubscriptions = await database_1.default.subscriptions.count({
            where: {
                package_id: packageId,
                status: 'active',
            },
        });
        if (activeSubscriptions > 0 && !force) {
            throw new error_middleware_1.CustomError(`Ce plan ne peut pas être supprimé car ${activeSubscriptions} entreprise${activeSubscriptions > 1 ? 's' : ''} ${activeSubscriptions > 1 ? 'l\'utilisent' : 'l\'utilise'} actuellement. Vous pouvez le désactiver à la place.`, 400, 'PACKAGE_HAS_ACTIVE_SUBSCRIPTIONS');
        }
        // Vérifier s'il reste d'autres plans actifs
        const otherActivePackages = await database_1.default.packages.count({
            where: {
                is_active: true,
                id: { not: packageId },
            },
        });
        if (otherActivePackages === 0 && !force) {
            throw new error_middleware_1.CustomError('Ce plan ne peut pas être supprimé car il est le dernier plan actif. Vous devez avoir au moins un plan actif.', 400, 'LAST_ACTIVE_PACKAGE');
        }
        // Si force est true, désactiver toutes les subscriptions actives
        if (force && activeSubscriptions > 0) {
            await database_1.default.subscriptions.updateMany({
                where: {
                    package_id: packageId,
                    status: 'active',
                },
                data: {
                    status: 'cancelled',
                },
            });
        }
        // Supprimer le package
        await database_1.default.packages.delete({
            where: { id: packageId },
        });
        logger_1.default.info(`Package deleted: ${packageId}`, {
            packageId,
            code: packageData.code,
            name: packageData.name,
            force,
            activeSubscriptions: activeSubscriptions,
        });
        return { success: true, message: 'Package supprimé avec succès' };
    }
    /**
     * Obtenir le nombre de subscriptions actives pour un package
     */
    async getActiveSubscriptionsCount(packageId) {
        return await database_1.default.subscriptions.count({
            where: {
                package_id: packageId,
                status: 'active',
            },
        });
    }
}
exports.PackageService = PackageService;
exports.default = new PackageService();
//# sourceMappingURL=package.service.js.map