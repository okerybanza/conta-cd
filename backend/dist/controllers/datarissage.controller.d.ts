import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class DatarissageController {
    /**
     * Compléter le datarissage (toutes les étapes)
     */
    complete(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Obtenir l'état du datarissage
     */
    getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Vérifier si un champ est verrouillé
     */
    checkLocked(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: DatarissageController;
export default _default;
//# sourceMappingURL=datarissage.controller.d.ts.map