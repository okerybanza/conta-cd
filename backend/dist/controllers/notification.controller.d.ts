import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class NotificationController {
    sendInvoiceNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    sendPaymentNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    sendPaymentReminder(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    testEmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    testWhatsApp(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    listNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: NotificationController;
export default _default;
//# sourceMappingURL=notification.controller.d.ts.map