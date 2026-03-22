import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class EmployeeDocumentController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getExpiring(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getExpired(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: EmployeeDocumentController;
export default _default;
//# sourceMappingURL=employeeDocument.controller.d.ts.map