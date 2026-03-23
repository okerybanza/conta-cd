import { emailQueue, whatsappQueue } from '../queue.service';
import logger from '../../utils/logger';

export interface QueueMetrics {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
}

export class QueueMonitoringService {
    /**
     * Récupère les métriques globales des files d'attente
     */
    async getGlobalMetrics() {
        try {
            const metrics = {
                email: await this.getQueueMetrics(emailQueue),
                whatsapp: await this.getQueueMetrics(whatsappQueue),
            };

            return {
                timestamp: new Date().toISOString(),
                queues: metrics,
                healthy: (emailQueue !== null && whatsappQueue !== null),
            };
        } catch (error: any) {
            logger.error('Error fetching queue metrics', error);
            throw error;
        }
    }

    private async getQueueMetrics(queue: any): Promise<QueueMetrics | null> {
        if (!queue) return null;

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
    async getFailedJobs(queueName: 'email' | 'whatsapp', limit = 10) {
        const queue = queueName === 'email' ? emailQueue : whatsappQueue;
        if (!queue) return [];

        const failedJobs = await queue.getFailed(0, limit);
        return failedJobs.map((job: any) => ({
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
    async retryJob(queueName: 'email' | 'whatsapp', jobId: string) {
        const queue = queueName === 'email' ? emailQueue : whatsappQueue;
        if (!queue) return false;

        const job = await queue.getJob(jobId);
        if (job) {
            await job.retry();
            logger.info(`Job ${jobId} manually retried in queue ${queueName}`);
            return true;
        }
        return false;
    }
}

export default new QueueMonitoringService();
