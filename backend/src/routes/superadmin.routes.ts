import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireSuperAdmin, requireContaUser } from '../middleware/superadmin.middleware';
import superAdminService from '../services/superadmin.service';
import packageService from '../services/package.service';
import subscriptionService from '../services/subscription.service';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

/**
 * GET /api/v1/super-admin/stats
 * Obtenir les statistiques globales de la plateforme
 */
router.get('/stats', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const stats = await superAdminService.getGlobalStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/super-admin/companies
 * Obtenir toutes les entreprises avec filtres
 */
router.get('/companies', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const filters = {
      search: req.query.search as string | undefined,
      plan: req.query.plan as string | undefined,
      country: req.query.country as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    const result = await superAdminService.getAllCompanies(filters);
    res.json({
      success: true,
      data: result.companies,
      pagination: { total: result.total, limit: result.limit, offset: result.offset },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/super-admin/companies/:id
 * Obtenir les détails d'une entreprise
 */
router.get('/companies/:id', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const company = await superAdminService.getCompanyById(req.params.id);
    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/super-admin/companies/:id/usage
 * Obtenir l'utilisation d'une entreprise
 */
router.get('/companies/:id/usage', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const usage = await superAdminService.getCompanyUsage(req.params.id);
    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/super-admin/companies/:id/suspend
 * Suspendre une entreprise
 */
router.put('/companies/:id/suspend', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const { reason, notifyUser } = req.body;
    await superAdminService.updateCompanyStatus(req.params.id, 'suspended', reason, req.user.id);
    res.json({
      success: true,
      message: 'Entreprise suspendue avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/super-admin/companies/:id/unsuspend
 * Réactiver une entreprise
 */
router.put('/companies/:id/unsuspend', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    await superAdminService.updateCompanyStatus(req.params.id, 'active', undefined, req.user.id);
    res.json({
      success: true,
      message: 'Entreprise réactivée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/super-admin/companies/:id/change-plan
 * Changer le plan d'une entreprise
 */
router.put('/companies/:id/change-plan', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'packageId est requis',
      });
    }
    const subscription = await subscriptionService.upgrade(req.params.id, packageId, req.user.id);
    res.json({
      success: true,
      data: subscription,
      message: 'Plan changé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/super-admin/conta-users
 * Obtenir tous les utilisateurs Conta
 */
router.get('/conta-users', requireContaUser(), async (req: AuthRequest, res, next) => {
  try {
    const users = await superAdminService.getContaUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/super-admin/conta-users
 * Créer un utilisateur Conta
 */
router.post('/conta-users', requireContaUser(['superadmin', 'admin']), async (req: AuthRequest, res, next) => {
  try {
    const user = await superAdminService.createContaUser(req.body);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/super-admin/conta-users/:id
 * Mettre à jour un utilisateur Conta
 */
router.put('/conta-users/:id', requireContaUser(['superadmin', 'admin']), async (req: AuthRequest, res, next) => {
  try {
    const user = await superAdminService.updateContaUser(req.params.id, req.body);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/super-admin/conta-users/:id
 * Supprimer un utilisateur Conta
 */
router.delete('/conta-users/:id', requireContaUser(['superadmin', 'admin']), async (req: AuthRequest, res, next) => {
  try {
    await superAdminService.deleteContaUser(req.params.id);
    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/super-admin/conta-users/:id/permissions
 * Mettre à jour les permissions d'un utilisateur Conta
 */
router.put('/conta-users/:id/permissions', requireContaUser(['superadmin', 'admin']), async (req: AuthRequest, res, next) => {
  try {
    const { permissions } = req.body;
    const user = await superAdminService.updateContaUser(req.params.id, { conta_permissions: permissions });
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/super-admin/packages
 * Obtenir tous les packages (y compris désactivés)
 */
router.get('/packages', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const packages = await packageService.getAll();
    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/super-admin/revenue/monthly
 * Obtenir les revenus mensuels
 */
router.get('/revenue/monthly', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const data = await superAdminService.getMonthlyRevenueData();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/super-admin/companies/growth
 * Obtenir les données de croissance des entreprises
 */
router.get('/companies/growth', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const data = await superAdminService.getCompanyGrowthData();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// T32 — Analytics avancés
router.get('/analytics/churn', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const data = await superAdminService.getChurnAnalytics();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/analytics/ltv', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const data = await superAdminService.getLTVAnalytics();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/analytics/cohorts', requireSuperAdmin(), async (req: AuthRequest, res, next) => {
  try {
    const data = await superAdminService.getCohortAnalytics();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});


export default router;
