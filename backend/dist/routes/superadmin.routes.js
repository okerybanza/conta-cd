"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const superadmin_middleware_1 = require("../middleware/superadmin.middleware");
const superadmin_service_1 = __importDefault(require("../services/superadmin.service"));
const package_service_1 = __importDefault(require("../services/package.service"));
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
/**
 * GET /api/v1/super-admin/stats
 * Obtenir les statistiques globales de la plateforme
 */
router.get('/stats', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const stats = await superadmin_service_1.default.getGlobalStats();
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/super-admin/companies
 * Obtenir toutes les entreprises avec filtres
 */
router.get('/companies', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const filters = {
            search: req.query.search,
            plan: req.query.plan,
            country: req.query.country,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        };
        const result = await superadmin_service_1.default.getAllCompanies(filters);
        res.json({
            success: true,
            data: result.companies,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/super-admin/companies/:id
 * Obtenir les détails d'une entreprise
 */
router.get('/companies/:id', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const company = await superadmin_service_1.default.getCompanyById(req.params.id);
        res.json({
            success: true,
            data: company,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/super-admin/companies/:id/usage
 * Obtenir l'utilisation d'une entreprise
 */
router.get('/companies/:id/usage', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const usage = await superadmin_service_1.default.getCompanyUsage(req.params.id);
        res.json({
            success: true,
            data: usage,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/super-admin/companies/:id/suspend
 * Suspendre une entreprise
 */
router.put('/companies/:id/suspend', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const { reason, notifyUser } = req.body;
        await superadmin_service_1.default.updateCompanyStatus(req.params.id, 'suspended', reason, req.user.id);
        res.json({
            success: true,
            message: 'Entreprise suspendue avec succès',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/super-admin/companies/:id/unsuspend
 * Réactiver une entreprise
 */
router.put('/companies/:id/unsuspend', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        await superadmin_service_1.default.updateCompanyStatus(req.params.id, 'active', undefined, req.user.id);
        res.json({
            success: true,
            message: 'Entreprise réactivée avec succès',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/super-admin/companies/:id/change-plan
 * Changer le plan d'une entreprise
 */
router.put('/companies/:id/change-plan', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const { packageId } = req.body;
        if (!packageId) {
            return res.status(400).json({
                success: false,
                message: 'packageId est requis',
            });
        }
        const subscription = await subscription_service_1.default.upgrade(req.params.id, packageId, req.user.id);
        res.json({
            success: true,
            data: subscription,
            message: 'Plan changé avec succès',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/super-admin/conta-users
 * Obtenir tous les utilisateurs Conta
 */
router.get('/conta-users', (0, superadmin_middleware_1.requireContaUser)(), async (req, res, next) => {
    try {
        const users = await superadmin_service_1.default.getContaUsers();
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/super-admin/conta-users
 * Créer un utilisateur Conta
 */
router.post('/conta-users', (0, superadmin_middleware_1.requireContaUser)(['superadmin', 'admin']), async (req, res, next) => {
    try {
        const user = await superadmin_service_1.default.createContaUser(req.body);
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/super-admin/conta-users/:id
 * Mettre à jour un utilisateur Conta
 */
router.put('/conta-users/:id', (0, superadmin_middleware_1.requireContaUser)(['superadmin', 'admin']), async (req, res, next) => {
    try {
        const user = await superadmin_service_1.default.updateContaUser(req.params.id, req.body);
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/v1/super-admin/conta-users/:id
 * Supprimer un utilisateur Conta
 */
router.delete('/conta-users/:id', (0, superadmin_middleware_1.requireContaUser)(['superadmin', 'admin']), async (req, res, next) => {
    try {
        await superadmin_service_1.default.deleteContaUser(req.params.id);
        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/super-admin/conta-users/:id/permissions
 * Mettre à jour les permissions d'un utilisateur Conta
 */
router.put('/conta-users/:id/permissions', (0, superadmin_middleware_1.requireContaUser)(['superadmin', 'admin']), async (req, res, next) => {
    try {
        const { permissions } = req.body;
        const user = await superadmin_service_1.default.updateContaUser(req.params.id, { conta_permissions: permissions });
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/super-admin/packages
 * Obtenir tous les packages (y compris désactivés)
 */
router.get('/packages', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const packages = await package_service_1.default.getAll();
        res.json({
            success: true,
            data: packages,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/super-admin/revenue/monthly
 * Obtenir les revenus mensuels
 */
router.get('/revenue/monthly', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const data = await superadmin_service_1.default.getMonthlyRevenueData();
        res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/super-admin/companies/growth
 * Obtenir les données de croissance des entreprises
 */
router.get('/companies/growth', (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const data = await superadmin_service_1.default.getCompanyGrowthData();
        res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=superadmin.routes.js.map