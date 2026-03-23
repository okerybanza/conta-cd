import { Request, Response, NextFunction } from 'express';
import queueMonitoringService from '../../services/queue/queueMonitoring.service';
import logger from '../../utils/logger';

export class QueueAdminController {
    /**
     * Obtient l'état de santé et les métriques des files d'attente
     */
    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await queueMonitoringService.getGlobalMetrics();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Liste les échecs récents
     */
    async getFailures(req: Request, res: Response, next: NextFunction) {
        try {
            const { type } = req.params;
            if (type !== 'email' && type !== 'whatsapp') {
                return res.status(400).json({ success: false, message: 'Invalid queue type' });
            }

            const failures = await queueMonitoringService.getFailedJobs(type);
            res.json({ success: true, data: failures });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Relance un job spécifique
     */
    async retry(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, jobId } = req.params;
            if (type !== 'email' && type !== 'whatsapp') {
                return res.status(400).json({ success: false, message: 'Invalid queue type' });
            }

            const success = await queueMonitoringService.retryJob(type, jobId);
            res.json({ success, message: success ? 'Job retried' : 'Job not found' });
        } catch (error) {
            next(error);
        }
    }
}

export default new QueueAdminController();
