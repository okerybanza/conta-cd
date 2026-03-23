import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscription.service';
import logger from '../utils/logger';

/**
 * Controller pour les tâches cron (appelées par un service externe ou un cron job)
 */
export class CronController {
  /**
   * POST /api/v1/cron/renew-subscriptions
   * Renouveler automatiquement les abonnements expirés
   * À appeler quotidiennement par un cron job
   */
  async renewSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      // Vérifier une clé secrète pour sécuriser l'endpoint
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const results = await subscriptionService.renewExpiredSubscriptions();
      
      logger.info('Cron job: renew subscriptions completed', results);
      
      res.json({
        success: true,
        data: results,
        message: `Renouvellement automatique terminé: ${results.renewed} renouvelés, ${results.failed} échecs`,
      });
    } catch (error: any) {
      logger.error('Error in renew subscriptions cron job', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }
}

export default new CronController();

