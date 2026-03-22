import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class PaymentController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getByInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: PaymentController;
export default _default;
//# sourceMappingURL=payment.controller.d.ts.map