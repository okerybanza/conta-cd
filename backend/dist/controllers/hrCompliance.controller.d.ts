import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class HrComplianceController {
    getRdcReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: HrComplianceController;
export default _default;
//# sourceMappingURL=hrCompliance.controller.d.ts.map