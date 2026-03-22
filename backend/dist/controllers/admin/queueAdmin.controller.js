"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueAdminController = void 0;
const queueMonitoring_service_1 = __importDefault(require("../../services/queue/queueMonitoring.service"));
class QueueAdminController {
    /**
     * Obtient l'état de santé et les métriques des files d'attente
     */
    async getStats(req, res, next) {
        try {
            const stats = await queueMonitoring_service_1.default.getGlobalMetrics();
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Liste les échecs récents
     */
    async getFailures(req, res, next) {
        try {
            const { type } = req.params;
            if (type !== 'email' && type !== 'whatsapp') {
                return res.status(400).json({ success: false, message: 'Invalid queue type' });
            }
            const failures = await queueMonitoring_service_1.default.getFailedJobs(type);
            res.json({ success: true, data: failures });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Relance un job spécifique
     */
    async retry(req, res, next) {
        try {
            const { type, jobId } = req.params;
            if (type !== 'email' && type !== 'whatsapp') {
                return res.status(400).json({ success: false, message: 'Invalid queue type' });
            }
            const success = await queueMonitoring_service_1.default.retryJob(type, jobId);
            res.json({ success, message: success ? 'Job retried' : 'Job not found' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QueueAdminController = QueueAdminController;
exports.default = new QueueAdminController();
//# sourceMappingURL=queueAdmin.controller.js.map