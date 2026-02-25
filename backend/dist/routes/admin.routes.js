"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cacheMonitoring_service_1 = __importDefault(require("../services/cache/cacheMonitoring.service"));
const eventReplay_service_1 = __importDefault(require("../services/eventReplay.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes admin nécessitent une authentification et un rôle admin/superadmin
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.requireRole)('admin'));
/**
 * GET /api/v1/admin/cache/stats
 * Obtenir les statistiques du cache Redis
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await cacheMonitoring_service_1.default.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/admin/cache/reset
 * Réinitialiser les statistiques du cache
 */
router.post('/reset', (req, res) => {
    cacheMonitoring_service_1.default.reset();
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
        const count = await eventReplay_service_1.default.replayEvents(filters);
        res.json({
            success: true,
            message: `Successfully replayed ${count} events`,
            data: { count }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * SPRINT 5 - TASK 5.4: Queue Monitoring & Admin
 */
const queueAdmin_controller_1 = __importDefault(require("../controllers/admin/queueAdmin.controller"));
router.get('/queues/stats', queueAdmin_controller_1.default.getStats);
router.get('/queues/:type/failures', queueAdmin_controller_1.default.getFailures);
router.post('/queues/:type/retry/:jobId', queueAdmin_controller_1.default.retry);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map