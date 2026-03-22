import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class QuotationController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    convertToInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    generatePDF(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: QuotationController;
export default _default;
//# sourceMappingURL=quotation.controller.d.ts.map