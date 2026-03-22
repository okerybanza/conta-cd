import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class SearchController {
    /**
     * Recherche globale
     * GET /api/v1/search?q=query&limit=10
     */
    globalSearch(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: SearchController;
export default _default;
//# sourceMappingURL=search.controller.d.ts.map