import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class AuditController {
    getLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getLog(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    verifyIntegrity(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AuditController;
export default _default;
//# sourceMappingURL=audit.controller.d.ts.map