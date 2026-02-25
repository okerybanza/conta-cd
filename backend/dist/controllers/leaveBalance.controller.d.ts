import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class LeaveBalanceController {
    getBalance(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getEmployeeBalances(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: LeaveBalanceController;
export default _default;
//# sourceMappingURL=leaveBalance.controller.d.ts.map