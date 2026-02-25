import { Request, Response, NextFunction } from 'express';
/**
 * Controller pour les tâches cron (appelées par un service externe ou un cron job)
 */
export declare class CronController {
    /**
     * POST /api/v1/cron/expire-subscriptions
     * Expirer les essais et abonnements dont la date est dépassée.
     * À appeler quotidiennement par un cron job.
     */
    expireSubscriptions(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: CronController;
export default _default;
//# sourceMappingURL=cron.controller.d.ts.map