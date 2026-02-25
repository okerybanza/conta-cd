import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class PayPalController {
    /**
     * Créer une Order PayPal pour une facture ou un abonnement
     * POST /api/v1/payments/paypal/init
     */
    createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Capturer une Order PayPal après approbation
     * POST /api/v1/payments/paypal/capture
     */
    captureOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Récupérer les détails d'une Order PayPal
     * GET /api/v1/payments/paypal/order/:orderId
     */
    getOrderDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: PayPalController;
export default _default;
//# sourceMappingURL=paypal.controller.d.ts.map