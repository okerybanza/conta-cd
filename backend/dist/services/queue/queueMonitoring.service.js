"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueMonitoringService = void 0;
const queue_service_1 = require("../queue.service");
const logger_1 = __importDefault(require("../../utils/logger"));
class QueueMonitoringService {
    /**
     * Récupère les métriques globales des files d'attente
     */
    async getGlobalMetrics() {
        try {
            const metrics = {
                email: await this.getQueueMetrics(queue_service_1.emailQueue),
                whatsapp: await this.getQueueMetrics(queue_service_1.whatsappQueue),
            };
            return {
                timestamp: new Date().toISOString(),
                queues: metrics,
                healthy: (queue_service_1.emailQueue !== null && queue_service_1.whatsappQueue !== null),
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching queue metrics', error);
            throw error;
        }
    }
    async getQueueMetrics(queue) {
        if (!queue)
            return null;
        const [active, waiting, completed, failed, delayed] = await Promise.all([
            queue.getActiveCount(),
            queue.getWaitingCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
        ]);
        return { active, waiting, completed, failed, delayed };
    }
    /**
     * Liste les jobs échoués récemment pour diagnostic
     */
    async getFailedJobs(queueName, limit = 10) {
        const queue = queueName === 'email' ? queue_service_1.emailQueue : queue_service_1.whatsappQueue;
        if (!queue)
            return [];
        const failedJobs = await queue.getFailed(0, limit);
        return failedJobs.map((job) => ({
            id: job.id,
            name: job.name,
            data: job.data,
            failedReason: job.failedReason,
            finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
            attempts: job.attemptsMade,
        }));
    }
    /**
     * Relance un job échoué
     */
    async retryJob(queueName, jobId) {
        const queue = queueName === 'email' ? queue_service_1.emailQueue : queue_service_1.whatsappQueue;
        if (!queue)
            return false;
        const job = await queue.getJob(jobId);
        if (job) {
            await job.retry();
            logger_1.default.info(`Job ${jobId} manually retried in queue ${queueName}`);
            return true;
        }
        return false;
    }
}
exports.QueueMonitoringService = QueueMonitoringService;
exports.default = new QueueMonitoringService();
//# sourceMappingURL=queueMonitoring.service.js.map