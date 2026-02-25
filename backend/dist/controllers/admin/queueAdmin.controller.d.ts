import { Request, Response, NextFunction } from 'express';
export declare class QueueAdminController {
    /**
     * Obtient l'état de santé et les métriques des files d'attente
     */
    getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Liste les échecs récents
     */
    getFailures(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Relance un job spécifique
     */
    retry(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: QueueAdminController;
export default _default;
//# sourceMappingURL=queueAdmin.controller.d.ts.map