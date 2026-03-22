import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class SettingsController {
    getCompanySettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    updateCompanySettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    uploadLogo(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    updateLogo(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getUserSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    updateUserSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: SettingsController;
export default _default;
//# sourceMappingURL=settings.controller.d.ts.map