import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class InvoiceController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    duplicate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    generatePDF(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    previewHTML(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: InvoiceController;
export default _default;
//# sourceMappingURL=invoice.controller.d.ts.map