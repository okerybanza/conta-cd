import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ProductController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    exportCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getStockAlerts(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ProductController;
export default _default;
//# sourceMappingURL=product.controller.d.ts.map