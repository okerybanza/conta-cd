import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class LeaveRequestController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    reject(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: LeaveRequestController;
export default _default;
//# sourceMappingURL=leaveRequest.controller.d.ts.map