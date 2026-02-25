import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class StockMovementController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    validate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    reverse(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    calculateStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: StockMovementController;
export default _default;
//# sourceMappingURL=stock-movement.controller.d.ts.map