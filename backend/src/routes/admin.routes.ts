import { Router } from 'express';
import cacheMonitoringService from '../services/cache/cacheMonitoring.service';
import eventReplayService from '../services/eventReplay.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';

const router = Router();

// Toutes les routes admin nécessitent une authentification et un rôle admin/superadmin
router.use(authenticate as any);
router.use(requireRole('admin') as any);

/**
 * GET /api/v1/admin/cache/stats
 * Obtenir les statistiques du cache Redis
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await cacheMonitoringService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/admin/cache/reset
 * Réinitialiser les statistiques du cache
 */
router.post('/reset', (req, res) => {
    cacheMonitoringService.reset();
    res.json({
        success: true,
        message: 'Cache statistics reset'
    });
});

/**
 * POST /api/v1/admin/events/replay
 * Rejouer des événements du log
 */
router.post('/replay', async (req, res, next) => {
    try {
        const { companyId, type, startDate, endDate, entityType, entityId } = req.body;

        const filters = {
            companyId,
            type,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            entityType,
            entityId
        };

        const count = await eventReplayService.replayEvents(filters);

        res.json({
            success: true,
            message: `Successfully replayed ${count} events`,
            data: { count }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * SPRINT 5 - TASK 5.4: Queue Monitoring & Admin
 */
import queueAdminController from '../controllers/admin/queueAdmin.controller';

router.get('/queues/stats', queueAdminController.getStats);
router.get('/queues/:type/failures', queueAdminController.getFailures);
router.post('/queues/:type/retry/:jobId', queueAdminController.retry);

export default router;
