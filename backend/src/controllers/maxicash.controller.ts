import { Request, Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import maxicashService, {
  MaxiCashInitPaymentInput,
} from '../services/maxicash.service';

export class MaxiCashController {
  /**
   * Initier un paiement MaxiCash pour une facture.
   *
   * POST /api/v1/payments/maxicash/init
   */
  async initPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const companyId = getCompanyId(req);

      const body: any = req.body || {};

      const input: MaxiCashInitPaymentInput = {
        companyId,
        invoiceId: body.invoiceId,
        amount: Number(body.amount),
        currency: body.currency || 'CDF',
        customerPhone: body.customerPhone,
        reference: body.reference || body.invoiceNumber,
      };

      const result = await maxicashService.initPayment(input);

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifier le statut d'un paiement MaxiCash.
   *
   * GET /api/v1/payments/maxicash/status/:transactionReference
   */
  async checkStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const companyId = getCompanyId(req);
      const { transactionReference } = req.params;

      const result = await maxicashService.checkPaymentStatus(
        companyId,
        transactionReference
      );

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook de confirmation MaxiCash (non authentifié).
   *
   * POST /api/v1/webhooks/maxicash
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Répondre 200 immédiatement pour éviter les retries agressifs
      res.status(200).json({ success: true });

      await maxicashService.handleWebhook(req.body);
    } catch (error) {
      next(error);
    }
  }
}

export default new MaxiCashController();

